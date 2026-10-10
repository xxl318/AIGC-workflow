"""Local-only cached foreground extraction for the composition canvas.

U2NetP preprocessing/model reference:
https://github.com/danielgatis/rembg/blob/main/rembg/sessions/u2netp.py
Model MD5 is verified against the upstream download manifest. No runtime downloads.
"""
import asyncio
import hashlib
import re
import threading
from pathlib import Path

import numpy as np
from aiohttp import web
from PIL import Image, ImageChops, ImageOps

_session = None
_lock = threading.Lock()


def cutout(source, destination, model_path):
    """Preserve existing alpha; otherwise extract the foreground on CPU."""
    global _session
    with _lock:
        if destination.is_file():
            return destination
        with Image.open(source) as image:
            if image.width * image.height > 25_000_000:
                raise ValueError('请使用不超过 2500 万像素的角色图片')
            image = ImageOps.exif_transpose(image).convert('RGBA')
        # Keep the preview lightweight without resampling small source images.
        image.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
        alpha = image.getchannel('A')
        if alpha.getextrema()[0] >= 250:
            if _session is None:
                import onnxruntime as ort
                if hashlib.md5(model_path.read_bytes()).hexdigest() != '8e83ca70e441ab06c318d82300c84806':
                    raise ValueError('本地抠图模型校验失败')
                options = ort.SessionOptions()
                options.intra_op_num_threads = 2
                options.inter_op_num_threads = 1
                _session = ort.InferenceSession(str(model_path), sess_options=options, providers=['CPUExecutionProvider'])
            rgb = np.asarray(image.convert('RGB').resize((320, 320), Image.Resampling.LANCZOS), dtype=np.float32)
            rgb /= max(float(rgb.max()), 1e-6)
            tensor = ((rgb - np.array([.485, .456, .406], dtype=np.float32)) / np.array([.229, .224, .225], dtype=np.float32)).transpose(2, 0, 1)[None]
            output = _session.run(None, {_session.get_inputs()[0].name: tensor})[0][0, 0]
            delta = float(output.max() - output.min())
            if delta < 1e-6:
                raise ValueError('这张图片未检测到清晰主体，请使用透明 PNG 或恢复原图')
            mask = Image.fromarray(np.uint8(np.clip((output - output.min()) / delta, 0, 1) * 255))
            mask = mask.resize(image.size, Image.Resampling.LANCZOS)
            alpha = ImageChops.multiply(alpha, mask)
        bounds = alpha.point(lambda v: 255 if v >= 32 else 0).getbbox()
        if not bounds:
            raise ValueError('未检测到可用主体，请更换人物图片')
        image.putalpha(alpha)
        x1, y1, x2, y2 = bounds
        image = image.crop((max(0, x1-4), max(0, y1-4), min(image.width, x2+4), min(image.height, y2+4)))
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix('.tmp')
        image.save(temporary, format='PNG')
        temporary.replace(destination)
        return destination


def register(app, load_library, library_root, model_path, cache_root):
    library_root = Path(library_root).resolve()
    model_path = Path(model_path)
    cache_root = Path(cache_root)
    semaphore = asyncio.Semaphore(1)

    async def prepare(request):
        asset_id = request.match_info['asset_id']
        asset = next((item for item in load_library() if item.get('id') == asset_id), None)
        if not asset or asset.get('kind') != 'image':
            raise web.HTTPNotFound(text='找不到人物图片')
        source = (library_root / asset['relative_path']).resolve()
        if library_root not in source.parents or not source.is_file():
            raise web.HTTPNotFound(text='素材文件已移动或删除')
        if not model_path.is_file():
            raise web.HTTPServiceUnavailable(text='本地抠图模型尚未准备，可使用透明 PNG')
        try:
            async with semaphore:
                content_hash = await asyncio.to_thread(lambda: hashlib.sha256(source.read_bytes()).hexdigest())
                cache_key = hashlib.sha256(('u2netp-v1:' + content_hash).encode()).hexdigest()
                destination = cache_root / (cache_key + '.png')
                cached = destination.is_file()
                await asyncio.to_thread(cutout, source, destination, model_path)
            return web.json_response({'url': '/api/scene/cutout/' + cache_key, 'source_id': asset_id, 'cached': cached, 'local': True})
        except (ValueError, OSError) as exc:
            raise web.HTTPBadRequest(text=str(exc))

    async def media(request):
        cache_key = request.match_info['cache_key']
        if not re.fullmatch(r'[0-9a-f]{64}', cache_key):
            raise web.HTTPNotFound()
        destination = cache_root / (cache_key + '.png')
        if not destination.is_file():
            raise web.HTTPNotFound(text='抠图缓存已移除，请重新去除背景')
        return web.FileResponse(destination, headers={'Content-Type':'image/png','Cache-Control':'private, max-age=31536000, immutable'})

    app.router.add_post('/api/scene/cutout/{asset_id}', prepare)
    app.router.add_get('/api/scene/cutout/{cache_key}', media)
