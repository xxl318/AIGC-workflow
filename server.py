import asyncio
import json
import mimetypes
import os
import re
import secrets
import shutil
import subprocess
import time
import uuid
from fractions import Fraction
from pathlib import Path
from urllib.parse import urlencode

from aiohttp import ClientSession, ClientTimeout, WSMsgType, web

import av
from PIL import Image, ImageOps


APP_ROOT = Path(__file__).resolve().parent
STATIC_ROOT = APP_ROOT / "static"
from studio_config import DATA_ROOT, COMFY_ROOT, EXTRA_COMFY_ROOT, COMFY_PYTHON, COMFY_HTTP, COMFY_WS, AUTO_START_COMFY, COMFY_ARGS
WORKS_ROOT = DATA_ROOT / "作品"
LIBRARY_ROOT = DATA_ROOT / "素材库"
LIBRARY_INDEX = LIBRARY_ROOT / "library.json"
HISTORY_ROOT = DATA_ROOT / "历史记录"
HISTORY_INDEX = HISTORY_ROOT / "history.json"
PROJECTS_ROOT = DATA_ROOT / "项目"
CANVASES_ROOT = DATA_ROOT / "画布"
EXPORT_ROOT = DATA_ROOT / "导出"
TEMP_ROOT = DATA_ROOT / "临时文件"
STUDIO_HOST = "127.0.0.1"
STUDIO_PORT = int(os.environ.get("AGENT_STUDIO_PORT", "8190"))

JOBS = {}
JOB_TASKS = {}
COMFY_PROCESS = None

RESOLUTIONS = {
    "fast": (768, 448),
    "standard": (1056, 608),
    "hd": (1344, 768),
}
IMAGE_RESOLUTIONS = {
    "fast": (896, 576),
    "standard": (1152, 768),
    "hd": (1344, 896),
    "ultra": (1536, 1024),
}
IMAGE_MODELS = {"flux", "realvis_xl", "juggernaut_xl", "sdxl_local"}
REALVIS_CHECKPOINT = "RealVisXL_V5.0_fp16.safetensors"
IPADAPTER_PLUS_FACE = "ip-adapter-plus-face_sdxl_vit-h.safetensors"
IPADAPTER_CLIP_VISION = "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
MODES = {"text_image", "image_video", "text_video", "flux_video", "h3_reference"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".mkv"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"}
LIBRARY_CATEGORIES = {"character", "background", "reference", "work"}
LIBRARY_FOLDERS = {"character": "人物", "background": "背景", "reference": "参考", "work": "作品"}


def load_library():
    if not LIBRARY_INDEX.exists():
        return []
    try:
        return json.loads(LIBRARY_INDEX.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


def write_library(items):
    LIBRARY_ROOT.mkdir(parents=True, exist_ok=True)
    temporary = LIBRARY_INDEX.with_suffix(".tmp")
    temporary.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(LIBRARY_INDEX)


def load_history():
    if not HISTORY_INDEX.exists():
        return []
    try:
        data = json.loads(HISTORY_INDEX.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def write_history(items):
    HISTORY_ROOT.mkdir(parents=True, exist_ok=True)
    temporary = HISTORY_INDEX.with_suffix(".tmp")
    temporary.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(HISTORY_INDEX)


def history_title(prompt, mode):
    cleaned = re.sub(r"\s+", " ", prompt or "").strip()
    labels = {"text_image": "图片创作", "image_video": "图片转视频", "text_video": "文字转视频", "flux_video": "首帧转视频", "h3_reference": "H3 多素材参考", "txt_batch": "TXT 剧本转视频"}
    return cleaned[:34] or labels.get(mode, "创作记录")


def history_record_from_job(job):
    payload = job.get("payload") or {}
    prompt = str(job.get("source_prompt") or payload.get("prompt") or "").strip()
    existing = next((item for item in load_history() if item.get("id") == job["id"]), None)
    return {
        "id": job["id"],
        "title": (existing or {}).get("title") or history_title(prompt, job.get("mode")),
        "created_at": job.get("created_at", time.time()),
        "updated_at": time.time(),
        "status": job.get("status", "created"),
        "mode": job.get("mode", payload.get("mode", "flux_video")),
        "prompt": prompt,
        "image_prompt": str(payload.get("image_prompt") or prompt).strip(),
        "video_prompt": str(payload.get("video_prompt") or prompt).strip(),
        "professional": bool(payload.get("image_prompt") or payload.get("video_prompt")),
        "settings": job.get("settings", {}),
        "input_image": payload.get("image"),
        "outputs": job.get("outputs", []),
        "error": job.get("error"),
        "prompt_id": job.get("prompt_id"),
        "project_id": job.get("project_id"),
        "shot_id": job.get("shot_id"),
        "asset_bindings": payload.get("asset_bindings", []),
        "asset_controls": payload.get("asset_controls", {}),
        "h3_references": payload.get("h3_references", []),
        "h3_reference_options": payload.get("h3_reference_options", {}),
        "recovered": False,
    }


def persist_job_history(job):
    if job.get("hidden"):
        return
    items = load_history()
    record = history_record_from_job(job)
    index = next((index for index, item in enumerate(items) if item.get("id") == record["id"]), None)
    if index is None:
        items.append(record)
    else:
        items[index] = record
    items.sort(key=lambda item: item.get("created_at", 0), reverse=True)
    write_history(items)


def smart_asset_name(category, prompt, extension, items):
    labels = {"character": "人物", "background": "背景", "reference": "参考", "work": "作品"}
    words = re.sub(r"[\s\\/:*?\"<>|，。！？、；：,.!?'()\[\]{}]+", "", prompt or "")
    subject = words[:14] or labels[category]
    date = time.strftime("%m%d")
    prefix = f"{labels[category]}_{subject}_{date}"
    sequence = 1 + sum(1 for item in items if item.get("name", "").startswith(prefix))
    return f"{prefix}_{sequence:03d}{extension.lower()}"


def ensure_data_directories():
    for folder in [WORKS_ROOT / "图片", WORKS_ROOT / "视频", *[LIBRARY_ROOT / name for name in LIBRARY_FOLDERS.values()], HISTORY_ROOT, PROJECTS_ROOT, CANVASES_ROOT, EXPORT_ROOT, TEMP_ROOT]:
        folder.mkdir(parents=True, exist_ok=True)


def model_roots(folder):
    return [root / "models" / folder for root in (COMFY_ROOT, EXTRA_COMFY_ROOT) if root is not None and (root / "models" / folder).is_dir()]


def model_files(folder):
    allowed = {".safetensors", ".ckpt", ".pt", ".pth", ".bin"}
    found = {}
    for root in model_roots(folder):
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in allowed:
                name = str(path.relative_to(root)).replace("\\", "/")
                found.setdefault(name, {"name": name, "size": path.stat().st_size, "source": "external" if EXTRA_COMFY_ROOT in path.parents else "local"})
    return sorted(found.values(), key=lambda item: item["name"].lower())


def local_model_catalog():
    checkpoints = model_files("checkpoints")
    inpaint = [item for item in checkpoints if "inpaint" in item["name"].lower()]
    return {
        "checkpoints": checkpoints,
        "inpaint": inpaint or checkpoints,
        "controlnet": model_files("controlnet"),
        "ipadapter": model_files("ipadapter"),
        "clip_vision": model_files("clip_vision"),
        "loras": model_files("loras"),
    }


def checked_model_name(folder, value, required=False):
    name = str(value or "").replace("\\", "/").strip("/")
    if not name:
        if required:
            raise ValueError("没有选择本地模型")
        return None
    for root in model_roots(folder):
        root = root.resolve()
        path = (root / Path(name)).resolve()
        if root in path.parents and path.is_file():
            return str(path.relative_to(root)).replace("\\", "/")
    raise ValueError(f"找不到本地模型：{name}")


def canvas_file(canvas_id):
    safe_id = re.sub(r"[^a-zA-Z0-9-]", "", str(canvas_id))
    return CANVASES_ROOT / f"{safe_id}.json"


def load_canvas(canvas_id):
    path = canvas_file(canvas_id)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def save_canvas(canvas):
    canvas["updated_at"] = time.time()
    path = canvas_file(canvas["id"])
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(canvas, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def project_file(project_id):
    safe_id = re.sub(r"[^a-zA-Z0-9-]", "", project_id)
    return PROJECTS_ROOT / f"{safe_id}.json"


def load_project(project_id):
    path = project_file(project_id)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def save_project(project):
    project["updated_at"] = time.time()
    path = project_file(project["id"])
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def list_projects():
    projects = []
    for path in PROJECTS_ROOT.glob("*.json"):
        try:
            projects.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError):
            continue
    projects.sort(key=lambda item: item.get("updated_at", 0), reverse=True)
    return projects


def find_shot(project, shot_id):
    return next((shot for shot in project.get("shots", []) if shot.get("id") == shot_id), None)


def active_shot_outputs(shot):
    versions = shot.get("versions", [])
    active_id = shot.get("active_version")
    version = next((item for item in versions if item.get("id") == active_id), versions[-1] if versions else None)
    return version.get("outputs", []) if version else []


def output_to_path(output):
    return safe_source_path(output.get("filename", ""), output.get("subfolder", ""), output.get("type", "output"))


def extract_last_frame(video_path, prefix="chain"):
    destination = COMFY_ROOT / "input" / f"{prefix}_{int(time.time())}_{secrets.token_hex(3)}.png"
    container = av.open(str(video_path))
    last = None
    for frame in container.decode(video=0):
        last = frame
    container.close()
    if last is None:
        raise ValueError("上一镜头没有可读取的视频画面")
    last.to_image().save(destination)
    return destination.name


def record_project_version(job):
    project_id, shot_id = job.get("project_id"), job.get("shot_id")
    if not project_id or not shot_id:
        return
    project = load_project(project_id)
    if not project:
        return
    shot = find_shot(project, shot_id)
    if not shot:
        return
    version = {
        "id": str(uuid.uuid4()),
        "created_at": time.time(),
        "prompt": job.get("source_prompt", ""),
        "outputs": job.get("outputs", []),
        "settings": job.get("settings", {}),
    }
    shot.setdefault("versions", []).append(version)
    shot["active_version"] = version["id"]
    shot["status"] = "complete"
    shot["last_job_id"] = job["id"]
    save_project(project)


def merge_project_videos(project, destination):
    video_paths = []
    for shot in sorted(project.get("shots", []), key=lambda item: item.get("order", 0)):
        video = next((output for output in active_shot_outputs(shot) if output.get("kind") == "video"), None)
        if video:
            video_paths.append(output_to_path(video))
    if not video_paths:
        raise ValueError("项目中还没有可以合并的视频镜头")

    first = av.open(str(video_paths[0]))
    source_video = first.streams.video[0]
    width, height = source_video.width, source_video.height
    first.close()
    output = av.open(str(destination), "w")
    video_stream = output.add_stream("libx264", rate=24)
    video_stream.width = width
    video_stream.height = height
    video_stream.pix_fmt = "yuv420p"
    video_stream.options = {"crf": "18", "preset": "medium"}
    video_stream.time_base = Fraction(1, 24)
    audio_stream = output.add_stream("aac", rate=32000)
    audio_stream.layout = "stereo"
    audio_stream.time_base = Fraction(1, 32000)
    resampler = av.AudioResampler(format="fltp", layout="stereo", rate=32000)
    video_pts = audio_pts = 0
    for path in video_paths:
        source = av.open(str(path))
        for frame in source.decode(video=0, audio=0):
            if isinstance(frame, av.VideoFrame):
                image = frame.to_image()
                if image.size != (width, height):
                    image = image.resize((width, height), Image.Resampling.LANCZOS)
                    frame = av.VideoFrame.from_image(image)
                frame.pts = video_pts
                frame.time_base = Fraction(1, 24)
                video_pts += 1
                for packet in video_stream.encode(frame):
                    output.mux(packet)
            elif isinstance(frame, av.AudioFrame):
                for audio_frame in resampler.resample(frame):
                    audio_frame.pts = audio_pts
                    audio_frame.time_base = Fraction(1, 32000)
                    audio_pts += audio_frame.samples
                    for packet in audio_stream.encode(audio_frame):
                        output.mux(packet)
        source.close()
    for audio_frame in resampler.resample(None):
        audio_frame.pts = audio_pts
        audio_frame.time_base = Fraction(1, 32000)
        audio_pts += audio_frame.samples
        for packet in audio_stream.encode(audio_frame):
            output.mux(packet)
    for packet in video_stream.encode(None):
        output.mux(packet)
    for packet in audio_stream.encode(None):
        output.mux(packet)
    output.close()
    return destination


def transcode_video(source_path, destination, operation):
    source = av.open(str(source_path))
    src_video = source.streams.video[0]
    source_fps = float(src_video.average_rate or 24)
    scale = 2 if operation == "upscale2x" else 1
    target_fps = source_fps * 2 if operation == "interpolate2x" else source_fps
    if operation == "vertical":
        target_size = (720, 1280)
    elif operation == "square":
        target_size = (1024, 1024)
    else:
        target_size = (src_video.width * scale, src_video.height * scale)
    output = av.open(str(destination), "w")
    video_stream = output.add_stream("libx264", rate=round(target_fps))
    video_stream.width, video_stream.height = target_size
    video_stream.pix_fmt = "yuv420p"
    video_stream.options = {"crf": "17", "preset": "medium"}
    audio_stream = output.add_stream("aac", rate=32000) if source.streams.audio else None
    if audio_stream:
        audio_stream.layout = "stereo"
    resampler = av.AudioResampler(format="fltp", layout="stereo", rate=32000) if audio_stream else None
    video_pts = audio_pts = 0
    previous_image = None
    decoded_frames = source.decode(video=0, audio=0) if source.streams.audio else source.decode(video=0)
    for frame in decoded_frames:
        if isinstance(frame, av.VideoFrame):
            image = frame.to_image()
            if operation in {"vertical", "square"}:
                image = ImageOps.fit(image, target_size, Image.Resampling.LANCZOS, centering=(0.5, 0.5))
            elif scale == 2:
                image = image.resize((video_stream.width, video_stream.height), Image.Resampling.LANCZOS)
            if operation == "deflicker" and previous_image is not None:
                image = Image.blend(previous_image, image, 0.86)
            frames = []
            if operation == "interpolate2x" and previous_image is not None:
                frames.append(Image.blend(previous_image, image, 0.5))
            frames.append(image)
            previous_image = image
            for rendered in frames:
                video_frame = av.VideoFrame.from_image(rendered)
                video_frame.pts = video_pts
                video_frame.time_base = Fraction(1, round(target_fps))
                video_pts += 1
                for packet in video_stream.encode(video_frame):
                    output.mux(packet)
        elif isinstance(frame, av.AudioFrame) and audio_stream:
            for audio_frame in resampler.resample(frame):
                audio_frame.pts = audio_pts
                audio_frame.time_base = Fraction(1, 32000)
                audio_pts += audio_frame.samples
                for packet in audio_stream.encode(audio_frame):
                    output.mux(packet)
    source.close()
    if audio_stream:
        for audio_frame in resampler.resample(None):
            audio_frame.pts = audio_pts
            audio_frame.time_base = Fraction(1, 32000)
            audio_pts += audio_frame.samples
            for packet in audio_stream.encode(audio_frame):
                output.mux(packet)
    for packet in video_stream.encode(None):
        output.mux(packet)
    if audio_stream:
        for packet in audio_stream.encode(None):
            output.mux(packet)
    output.close()
    return destination


def public_job(job):
    elapsed = max(0, time.time() - job["created_at"])
    estimated = job.get("estimated_seconds", 0)
    eta = max(0, round(estimated * (1 - min(100, job["progress"]) / 100))) if estimated else 0
    return {
        "id": job["id"],
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "mode": job["mode"],
        "created_at": job["created_at"],
        "prompt_id": job.get("prompt_id"),
        "outputs": job.get("outputs", []),
        "error": job.get("error"),
        "priority": job.get("priority", "normal"),
        "estimated_seconds": estimated,
        "eta_seconds": eta,
        "elapsed_seconds": round(elapsed),
        "settings": job.get("settings", {}),
        "project_id": job.get("project_id"),
        "shot_id": job.get("shot_id"),
        "prompt": job.get("source_prompt", ""),
        "batch": job.get("batch"),
    }


async def is_comfy_ready(session):
    try:
        async with session.get(f"{COMFY_HTTP}/system_stats", timeout=ClientTimeout(total=2)) as response:
            return response.status == 200
    except Exception:
        return False



def open_engine_log():
    """Rotate between engine runs; inherited file handles survive Studio exit."""
    log_dir = DATA_ROOT / "日志"
    log_dir.mkdir(parents=True, exist_ok=True)
    path = log_dir / "comfy-engine.log"
    if path.exists() and path.stat().st_size >= 5 * 1024 * 1024:
        for index in range(2, 0, -1):
            previous = path.with_name(path.name + f".{index}")
            if previous.exists():
                previous.replace(path.with_name(path.name + f".{index + 1}"))
        path.replace(path.with_name(path.name + ".1"))
    stream = path.open("ab", buffering=0)
    stream.write(("\n--- Engine launch " + time.strftime("%Y-%m-%d %H:%M:%S") + " ---\n").encode("utf-8"))
    return stream


def verify_output_files(job):
    """Check file presence/size/type, not semantic quality or full decoding."""
    outputs = job.get("outputs") or []
    expected = "image" if job.get("mode") == "text_image" else "video"
    for output in outputs:
        if output.get("kind") != expected:
            continue
        try:
            path = safe_source_path(output["filename"], output.get("subfolder", ""), output.get("type", "output"))
            if path.stat().st_size > 0:
                return
        except (OSError, KeyError, web.HTTPException):
            continue
    raise RuntimeError("引擎已结束，但没有已落盘的非空目标输出文件；任务未标记完成。")


async def confirm_engine_stopped(session, prompt_id):
    """Only confirm this specific task is absent from both engine queues."""
    for attempt in range(10):
        async with session.get(f"{COMFY_HTTP}/queue", timeout=ClientTimeout(total=5)) as response:
            response.raise_for_status()
            queues = await response.json()
        if not isinstance(queues, dict) or any(not isinstance(queues.get(k), list) for k in ("queue_running", "queue_pending")):
            raise RuntimeError("引擎队列响应格式异常")
        entries = queues["queue_running"] + queues["queue_pending"]
        if any(not isinstance(item, (list, tuple)) or len(item) < 2 for item in entries):
            raise RuntimeError("引擎队列项目格式异常")
        if not any(item[1] == prompt_id for item in entries):
            return
        if attempt < 9:
            await asyncio.sleep(0.2)
    raise RuntimeError("引擎仍在运行或排队该任务")


async def ensure_comfy(app):
    global COMFY_PROCESS
    session = app["http"]
    if await is_comfy_ready(session):
        return True

    if not AUTO_START_COMFY:
        return False

    if COMFY_PROCESS is None or COMFY_PROCESS.poll() is not None:
        command = [str(COMFY_PYTHON), "-s", str(COMFY_ROOT / "main.py"), *COMFY_ARGS]
        with open_engine_log() as engine_log:
            COMFY_PROCESS = subprocess.Popen(
                command,
                cwd=str(COMFY_ROOT),
                stdout=engine_log,
                stderr=subprocess.STDOUT,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )

    for _ in range(150):
        if await is_comfy_ready(session):
            return True
        if COMFY_PROCESS.poll() is not None:
            break
        await asyncio.sleep(1)
    return False


def duration_to_length(seconds):
    frames = max(5, round(float(seconds) * 24))
    return frames + (5 - (frames % 17)) % 17


def estimate_generation_seconds(mode, quality, duration):
    quality_factor = {"fast": 0.65, "standard": 0.82, "hd": 1.0}.get(quality, 1.0)
    if mode == "text_image":
        return round(50 * quality_factor)
    base = 210 * (float(duration) / 5) * quality_factor
    if mode == "flux_video":
        base += 12 * quality_factor
    return max(30, round(base))


def expand_professional_prompt(brief, mode, style, shot_count, duration):
    style_map = {
        "cinematic": "写实真人电影摄影，克制的高级电影调色，真实皮肤与材质，浅景深，轻微胶片颗粒，具有空间层次的体积光",
        "documentary": "高质量纪录片摄影，自然光，真实环境细节，稳定而克制的观察式镜头，动作符合真实物理",
        "commercial": "高端商业广告质感，干净精确的布光，主体轮廓清晰，精致材质，高对比但不过度饱和",
        "horror": "写实惊悚电影质感，低调冷色照明，潮湿空气与阴影层次，真实特效化妆，持续紧张感但不过度血腥",
        "anime": "高质量电影级动画美术，稳定角色设计，精细背景与光影，流畅自然动作，避免廉价三维游戏渲染",
    }
    style_text = style_map.get(style, style_map["cinematic"])
    cleaned = re.sub(r"\s+", " ", brief).strip()
    artistic_nude = any(term in cleaned.lower() for term in ["裸体", "全裸", "人体艺术", "nude", "nudity"])
    sentences = [part.strip() for part in re.split(r"[。！？；;!?]+", cleaned) if part.strip()]
    if not sentences:
        sentences = [cleaned]

    total_seconds = max(1, float(duration))
    shot_count = max(1, min(8, int(shot_count)))
    segment = total_seconds / shot_count
    camera_moves = [
        "中远景建立环境，镜头缓慢向主体靠近",
        "人物中景跟拍，保持面部、服装与动作连续",
        "侧面低角度运动镜头，突出动作力量和空间关系",
        "面部近景捕捉眼神、呼吸和自然微表情",
        "肩后镜头揭示前方环境变化，焦点自然转移",
        "广角收束镜头，完整呈现人物与背景的结果状态",
        "轻微手持追踪，保持真实步伐震动与运动模糊",
        "稳定特写作为结尾，保留下一段可以衔接的动作状态",
    ]
    shot_lines = []
    phase_beats = [
        "先清楚建立人物、环境与空间位置，给后续动作明确起点",
        "人物开始主要动作，镜头跟随并展示动作原因",
        "冲突或运动强度提升到关键转折，保持方向和因果连续",
        "动作完成并呈现结果，结尾保留稳定姿势供下一镜头衔接",
    ]
    for index in range(shot_count):
        start = round(index * segment, 1)
        end = round((index + 1) * segment, 1)
        beat = sentences[min(index, len(sentences) - 1)]
        phase = phase_beats[min(len(phase_beats) - 1, round(index * (len(phase_beats) - 1) / max(1, shot_count - 1)))]
        shot_lines.append(f"[{start:g}s-{end:g}s] 镜头{index + 1}：{camera_moves[index % len(camera_moves)]}。剧情任务：{phase}。画面内容：{beat}。硬切落在动作节点上，运动自然连贯。")

    appearance_anchor = "人物面部、发型、身体姿态和空间位置明确" if artistic_nude else "人物面部、发型、服装、道具和空间位置明确"
    image_prompt = (
        f"{style_text}。{cleaned}。选择故事最有辨识度、最适合作为视频第一帧的瞬间：主体完整清晰，"
        f"{appearance_anchor}；背景具有前景、中景和远景层次，光源方向统一，"
        "构图为16:9电影画幅，细节清晰，手部和人体结构正确。无文字、字幕、标志、品牌或水印。"
    )
    continuity_anchor = "保持人物身份、脸部、发型、身体状态、道具和环境一致，不新增衣物。" if artistic_nude else "保持人物身份、脸部、发型、服装、道具和环境一致。"
    video_prompt = (
        f"整体视觉：{style_text}。\n"
        f"故事与主体：{cleaned}。{continuity_anchor}\n"
        "背景描述：明确保留首帧中的建筑、天气、时间、光源方向、地面材质与远景层次；背景只能随镜头产生合理视差，不能突然重置或变形。\n\n"
        "分镜时间线：\n" + "\n".join(shot_lines) + "\n\n"
        "动作与镜头：动作必须有清晰的起因、过程和结果，遵循人体重量、惯性与真实物理；镜头稳定流畅，必要时加入轻微真实手持感，不使用无意义推拉或突然跳变。\n"
        "声音：与场景匹配的环境声、人物动作声和克制的电影配乐；关键动作处加入自然声音重击，对白必须由画面中的说话者自然张嘴完成。\n"
        "一致性：保持同一人物和同一场景，避免换脸、额外肢体、穿模、倒放、瞬移、文字、标志或水印。"
    )
    if mode == "text_image":
        video_prompt = ""
    checks = {
        "subject": any(word in cleaned for word in ["人", "女孩", "男", "女", "角色", "动物", "产品", "汽车", "主角"]),
        "environment": any(word in cleaned for word in ["城市", "房间", "森林", "街", "车站", "天台", "海", "背景", "室内", "室外", "雨", "夜", "清晨"]),
        "action": any(word in cleaned for word in ["跑", "走", "冲", "跳", "看", "转", "拿", "追", "躲", "飞", "打开", "关闭", "说"]),
        "continuity": any(word in cleaned for word in ["继续", "延续", "保持", "同一", "随后", "然后", "之后"]),
    }
    warnings = []
    if not checks["subject"]: warnings.append("没有明确主体，建议补充人物或主要物体。")
    if not checks["environment"]: warnings.append("背景信息较少，建议补充地点、时间、天气和光线。")
    if not checks["action"]: warnings.append("缺少可见动作，视频可能只有轻微晃动。")
    if shot_count > 1 and not checks["continuity"]: warnings.append("已自动加入前后镜头连续性约束。")
    return {"brief": cleaned, "image_prompt": image_prompt, "video_prompt": video_prompt, "shot_count": shot_count, "checks": checks, "warnings": warnings}


def decode_txt_script(raw):
    for encoding in ("utf-8-sig", "gb18030", "utf-16"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def split_script_scenes(text):
    """Split common plain-text screenplay formats without needing an online LLM."""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    lines = [line.strip() for line in cleaned.split("\n")]
    header = re.compile(
        r"^(?:#{1,4}\s*)?(?:第\s*[一二三四五六七八九十百0-9]+\s*[场幕章]|场景\s*[一二三四五六七八九十百0-9]*|scene\s*\d+|"
        r"(?:内景|外景|内/外|外/内|int\.?|ext\.?)(?:\s|[：:.-]))",
        re.I,
    )
    explicit = any(header.search(line) for line in lines if line)
    scenes = []
    if explicit:
        title, body = "开场", []
        for line in lines:
            if not line:
                continue
            if header.search(line) and len(line) <= 100:
                if body:
                    scenes.append({"title": title, "text": " ".join(body)})
                title, body = re.sub(r"^#+\s*", "", line), []
            else:
                body.append(line)
        if body:
            scenes.append({"title": title, "text": " ".join(body)})
    else:
        paragraphs = [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n+", cleaned) if part.strip()]
        if len(paragraphs) <= 1:
            paragraphs = [re.sub(r"\s+", " ", cleaned)]
        scenes = [{"title": f"场景 {index + 1}", "text": paragraph} for index, paragraph in enumerate(paragraphs)]
    return [scene for scene in scenes if scene["text"].strip()]


def split_story_beats(text):
    pieces = [part.strip(" ，,。") for part in re.split(r"(?<=[。！？!?；;])|\n+", text) if part.strip(" ，,。")]
    beats = []
    for piece in pieces:
        if len(piece) > 150:
            clauses = [part.strip() for part in re.split(r"(?<=[，,：:])", piece) if part.strip()]
            beats.extend(clauses or [piece])
        else:
            beats.append(piece)
    return beats or [text.strip()]


def allocate_scene_shots(scenes, total_shots):
    total_shots = max(len(scenes), total_shots)
    weights = [max(30, len(scene["text"])) for scene in scenes]
    allocation = [1 for _ in scenes]
    for _ in range(total_shots - len(scenes)):
        index = max(range(len(scenes)), key=lambda i: weights[i] / allocation[i])
        allocation[index] += 1
    return allocation


def shot_camera_for(beat, local_index):
    lowered = beat.lower()
    if any(term in lowered for term in ["说", "问", "喊", "回答", "对白", "dialogue", "says"]):
        return "肩后中近景与说话者反应镜头，只有当前说话者自然张嘴，保持视线方向一致"
    if any(term in lowered for term in ["跑", "追", "冲", "跳", "打", "撞", "逃", "驾驶", "爆炸", "奔", "run", "chase"]):
        return "稳定运动跟拍，明确交代动作方向、起因、过程和结果，遵循真实惯性"
    if any(term in lowered for term in ["害怕", "震惊", "犹豫", "哭", "笑", "紧张", "愤怒", "眼神"]):
        return "人物近景捕捉眼神、呼吸和自然微表情，随后轻微移动揭示环境"
    return "中远景建立空间关系" if local_index == 0 else "人物中景跟拍并用环境反应推进叙事"


def build_txt_project(name, script, total_duration=60, shot_duration=5, quality="hd", style="cinematic", pipeline="direct"):
    scenes = split_script_scenes(script)
    if not scenes:
        raise ValueError("TXT 中没有可识别的剧情内容")
    shot_duration = float(shot_duration)
    if shot_duration not in {3, 5, 8, 10, 15}:
        shot_duration = 5
    total_duration = max(shot_duration * len(scenes), min(300, float(total_duration or 60)))
    total_shots = max(len(scenes), min(48, round(total_duration / shot_duration)))
    allocation = allocate_scene_shots(scenes, total_shots)
    story_anchor = re.sub(r"\s+", " ", script).strip()[:900]
    shots = []
    global_index = 0
    for scene_index, (scene, count) in enumerate(zip(scenes, allocation)):
        beats = split_story_beats(scene["text"])
        for local_index in range(count):
            beat_index = min(len(beats) - 1, int(local_index * len(beats) / count))
            beat = beats[beat_index]
            previous_beat = beats[max(0, beat_index - 1)] if local_index else (shots[-1]["beat"] if shots else "故事开始")
            next_beat = beats[min(len(beats) - 1, beat_index + 1)]
            camera = shot_camera_for(beat, local_index)
            prompt = (
                f"整体故事设定：{story_anchor}。\n"
                f"当前场景：{scene['title']}。场景内容：{scene['text'][:700]}。\n"
                f"本镜头叙事任务：{beat}。上一动作状态：{previous_beat}。本镜头结束时为下一动作保留衔接：{next_beat}。\n"
                f"镜头设计：{camera}。人物身份、脸部、发型、服装、道具、左右位置、动作方向、时间、天气和光源必须与相邻镜头一致；"
                "画面中每个动作必须有原因和结果，不瞬移、不换脸、不突然增加人物或物体。"
                "声音只使用与当前场景匹配的环境声、动作声和克制配乐；有对白时只有当前说话者自然张嘴。写实电影摄影，清晰自然，无文字、字幕、标志或水印。"
            )
            scene_start = local_index == 0
            shots.append({
                "id": str(uuid.uuid4()), "order": global_index,
                "scene_index": scene_index, "scene_title": scene["title"], "beat": beat,
                "title": f"{scene['title']} · 镜头 {local_index + 1}", "prompt": prompt,
                "duration": shot_duration, "quality": quality, "status": "draft",
                "chain_previous": not scene_start,
                "generation_mode": "image_video" if not scene_start else ("flux_video" if pipeline == "first_frame" else "text_video"),
                "versions": [], "active_version": None,
            })
            global_index += 1
    now = time.time()
    return {
        "id": str(uuid.uuid4()), "name": name, "brief": story_anchor, "source_type": "txt",
        "source_text": script, "created_at": now, "updated_at": now, "shots": shots,
        "character_asset_ids": [], "background_asset_ids": [], "exports": [],
        "batch_options": {"quality": quality, "style": style, "pipeline": pipeline, "shot_duration": shot_duration, "auto_merge": True},
        "batch_status": "planned",
    }


def flux_graph(prompt, width, height, seed, save=True, prefix="image/AgentStudio_FLUX"):
    graph = {
        "f1": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux-2-klein-4b-fp8.safetensors", "weight_dtype": "default"}},
        "f2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "flux2", "device": "default"}},
        "f3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "f4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["f2", 0]}},
        "f5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["f4", 0]}},
        "f6": {"class_type": "CFGGuider", "inputs": {"model": ["f1", 0], "positive": ["f4", 0], "negative": ["f5", 0], "cfg": 1.0}},
        "f7": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "f8": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "f9": {"class_type": "Flux2Scheduler", "inputs": {"steps": 4, "width": width, "height": height}},
        "f10": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "f11": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["f7", 0], "guider": ["f6", 0], "sampler": ["f8", 0], "sigmas": ["f9", 0], "latent_image": ["f10", 0]}},
        "f12": {"class_type": "VAEDecode", "inputs": {"samples": ["f11", 0], "vae": ["f3", 0]}},
    }
    if save:
        graph["f13"] = {"class_type": "SaveImage", "inputs": {"images": ["f12", 0], "filename_prefix": prefix}}
    return graph


def split_sdxl_prompt(prompt):
    """Separate user-authored negative text and remove exact duplicate clauses."""
    text = str(prompt or "").strip()
    parts = re.split(r"(?:^|\n|。)\s*(?:反向提示词|负面提示词|否定提示词|negative\s*prompt)\s*[：:]\s*", text, maxsplit=1, flags=re.I)
    positive = parts[0].strip()
    user_negative = parts[1].strip() if len(parts) > 1 else ""
    clauses = [item.strip() for item in re.split(r"(?<=[。！？!?])|\n+", positive) if item.strip()]
    seen = set()
    unique = []
    for clause in clauses:
        key = re.sub(r"[\s，,。.!！?？；;：:]", "", clause).lower()
        if key and key not in seen:
            unique.append(clause)
            seen.add(key)
    return " ".join(unique).strip(), user_negative


def realvis_prompt_features(prompt):
    """Translate high-value Chinese portrait attributes into concise SDXL CLIP anchors."""
    text = str(prompt or "")
    lowered = text.lower()
    anchors = ["photorealistic professional photography", "one clearly adult person", "accurate anatomy"]
    negatives = []

    age = re.search(r"(?:明确)?\s*(\d{2})\s*岁", text)
    if age and int(age.group(1)) >= 18:
        anchors.append(f"clearly adult {age.group(1)}-year-old")
    elif any(term in lowered for term in ["成年", "adult"]):
        anchors.append("clearly adult age 25 or older")

    if any(term in lowered for term in ["亚洲", "亚裔", "asian"]):
        anchors.append("Asian")
    if any(term in lowered for term in ["女性", "女人", "女生", "女士", "woman", "female"]):
        anchors.append("woman with mature adult facial features")
    if any(term in lowered for term in ["男性", "男人", "男士", "man", "male"]):
        anchors.append("man with mature adult facial features")

    if any(term in lowered for term in ["短发", "波波头", "bob haircut", "short hair"]):
        anchors.append("(short bob haircut above the jawline:1.35), clearly visible short hair")
        negatives.extend(["long hair", "shoulder-length hair", "waist-length hair"])
    has_black_stockings = any(term in lowered for term in ["黑丝", "黑色丝袜", "black stockings", "black pantyhose", "black tights"])
    if has_black_stockings:
        anchors.extend([
            "(black sheer thigh-high stockings on both legs:1.35)",
            "stockings completely visible from upper thighs to toes",
            "full-body composition, both legs and feet inside the frame",
        ])
        negatives.extend(["missing stockings", "bare legs", "white stockings", "cropped legs", "close-up portrait"])

    topless = any(term in lowered for term in ["上半身赤裸", "上身赤裸", "半裸", "topless", "bare breasts", "bare chest"])
    full_nude = any(term in lowered for term in ["全裸", "裸体", "一丝不挂", "没有穿衣服", "无衣服", "fully nude", "nude", "nudity"])
    if full_nude:
        if has_black_stockings:
            anchors.extend(["(nude except for black thigh-high stockings:1.5)", "wearing only the two stockings and absolutely no other garments", "bare torso and bare hips", "natural adult human anatomy"])
        else:
            anchors.extend(["(fully nude adult:1.3)", "completely unclothed bare body", "natural adult human anatomy"])
        negatives.extend(["clothes", "underwear", "lingerie", "bra", "shirt", "blouse", "dress", "skirt", "pants", "bodysuit", "corset", "camisole", "garter belt", "suspenders", "gloves", "sleeves", "covered chest", "censor bar", "mosaic censorship"])
    elif topless:
        if has_black_stockings:
            anchors.extend(["(topless adult woman wearing only black thigh-high stockings:1.5)", "only the two stockings are worn, no other garments", "completely bare breasts, bare chest and bare torso"])
        else:
            anchors.extend(["(topless adult woman:1.35)", "bare breasts and bare torso", "wearing no top and no bra"])
        negatives.extend(["shirt", "blouse", "top", "bra", "jacket", "dress", "bodysuit", "corset", "camisole", "garter belt", "suspenders", "gloves", "sleeves", "covered chest", "fabric across chest", "censor bar", "mosaic censorship"])

    if any(term in lowered for term in ["摄影棚", "影棚", "studio"]):
        anchors.append("simple seamless studio background")
    if any(term in lowered for term in ["全身", "full body", "黑丝", "黑色丝袜"]):
        anchors.append("full body visible head to toe")

    return ", ".join(dict.fromkeys(anchors)), ", ".join(dict.fromkeys(negatives)), (topless or full_nude)


def realvis_prefers_portrait(prompt):
    lowered = str(prompt or "").lower()
    portrait_terms = ["全身", "黑丝", "丝袜", "长袜", "双腿", "腿部", "鞋子", "脚", "head to toe", "full body", "stockings", "pantyhose"]
    landscape_terms = ["横图", "横版", "宽银幕", "16:9", "landscape orientation", "widescreen"]
    return any(term in lowered for term in portrait_terms) and not any(term in lowered for term in landscape_terms)


def realvis_needs_layered_inpaint(prompt):
    lowered = str(prompt or "").lower()
    stockings = any(term in lowered for term in ["黑丝", "丝袜", "black stockings", "black pantyhose", "black tights"])
    exposed_torso = any(term in lowered for term in [
        "上半身赤裸", "上身赤裸", "半裸", "全裸", "裸体", "一丝不挂", "没有穿衣服", "无衣服",
        "topless", "bare breasts", "bare chest", "fully nude", "nude", "nudity",
    ])
    return stockings and exposed_torso


def sdxl_negative_prompt(prompt, user_negative=""):
    negative = (
        "low quality, worst quality, low resolution, blurry, deformed anatomy, bad anatomy, "
        "bad hands, malformed hands, extra fingers, missing fingers, extra limbs, fused limbs, "
        "duplicate person, distorted face, plastic skin, over-smoothed skin, text, letters, glyphs, logo, watermark, artist signature, pseudo-signature, "
        "split screen, divided image, diptych, triptych, contact sheet, character turnaround, multiple views, front and back view, back view, "
        "multiple people, two people, two women, twins, clones, duplicate subject, side-by-side people, mirrored duplicate, "
        "beans, seeds, pills, food, scattered objects, floating objects, random props"
    )
    _, feature_negative, _ = realvis_prompt_features(prompt)
    if feature_negative:
        negative += ", " + feature_negative
    if user_negative:
        negative += ", " + user_negative
    return negative


def sdxl_positive_prompt(prompt):
    """Put concise English concept anchors before Chinese text for SDXL's CLIP encoders."""
    cleaned = prompt.strip()
    anchors, _, artistic_nude = realvis_prompt_features(cleaned)
    if artistic_nude:
        anchors += ", fictional consenting adult, professional fine-art figure photography, tasteful studio lighting"
    return anchors + ". User description: " + cleaned


def compact_sdxl_prompt(prompt, max_chars=520):
    """Keep long portrait prompts focused without silently losing whole sections."""
    if len(prompt) <= max_chars:
        return prompt
    fillers = [
        "具有令人惊艳的", "令人惊艳的", "明确", "自然精致的", "极其", "非常", "顶级",
        "高端", "高级定制", "呈现", "具有", "并保留", "清晰可见的", "超高细节",
    ]
    compacted = prompt
    for filler in fillers:
        compacted = compacted.replace(filler, "")
    compacted = re.sub(r"\s+", " ", compacted).strip()
    if len(compacted) <= max_chars:
        return compacted

    clauses = [item.strip() for item in re.split(r"(?<=[。！？!?])|(?<=；)", compacted) if item.strip()]
    priority_words = [
        "成年", "人物", "女性", "男性", "脸", "眼", "鼻", "嘴", "发", "身材", "身体",
        "穿", "服装", "裙", "衬衫", "裸体", "姿势", "站", "坐", "手", "背景", "摄影", "镜头", "光",
    ]
    scored = sorted(enumerate(clauses), key=lambda pair: (-sum(word in pair[1] for word in priority_words), pair[0]))
    selected = []
    used = 0
    for index, clause in scored:
        cost = len(clause) + 1
        if used + cost <= max_chars or not selected:
            selected.append((index, clause))
            used += cost
    selected.sort()
    return " ".join(clause for _, clause in selected)


def face_reference_crop(reference_image):
    """Return a left portrait crop for landscape character sheets."""
    source = COMFY_ROOT / "input" / Path(reference_image).name
    try:
        with Image.open(source) as image:
            image_width, image_height = image.size
        if image_width >= image_height * 1.15:
            return max(256, image_width // 3), image_height
    except (FileNotFoundError, OSError, ValueError):
        pass
    return None


def realvis_graph(
    prompt, width, height, seed, save=True, prefix="AgentStudio/图片/RealVisXL",
    reference_image=None, reference_strength=0.72, checkpoint_name=REALVIS_CHECKPOINT,
    inpaint_checkpoint=None, force_inpaint=False, controlnet_name=None,
    control_image=None, control_strength=0.75, ipadapter_name=None,
):
    positive_source, user_negative = split_sdxl_prompt(prompt)
    positive_source = compact_sdxl_prompt(positive_source)
    positive_prompt = sdxl_positive_prompt(positive_source)
    if reference_image:
        positive_prompt = (
            "(solo, one clearly adult person, one subject only, one view only, single continuous image:1.45), "
            + positive_prompt
        )
    _, _, artistic_nude = realvis_prompt_features(positive_source)
    graph = {
        "j1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": checkpoint_name}},
        "j2": {"class_type": "CLIPTextEncode", "inputs": {"text": positive_prompt, "clip": ["j1", 1]}},
        "j3": {"class_type": "CLIPTextEncode", "inputs": {"text": sdxl_negative_prompt(positive_source, user_negative), "clip": ["j1", 1]}},
        "j4": {"class_type": "EmptyLatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "j5": {"class_type": "KSampler", "inputs": {
            "model": ["j1", 0], "seed": seed, "steps": 36, "cfg": 6.5 if artistic_nude else 6.0,
            "sampler_name": "dpmpp_sde", "scheduler": "karras",
            "positive": ["j2", 0], "negative": ["j3", 0], "latent_image": ["j4", 0], "denoise": 1.0,
        }},
        "j6": {"class_type": "VAEDecode", "inputs": {"samples": ["j5", 0], "vae": ["j1", 2]}},
    }
    if reference_image:
        graph["r1"] = {"class_type": "LoadImage", "inputs": {"image": Path(reference_image).name}}
        face_image = ["r1", 0]
        crop = face_reference_crop(reference_image)
        if crop:
            graph["r1c"] = {"class_type": "ImageCrop", "inputs": {
                "image": ["r1", 0], "width": crop[0], "height": crop[1], "x": 0, "y": 0,
            }}
            face_image = ["r1c", 0]
        if ipadapter_name and "faceid" not in ipadapter_name.lower():
            graph.update({
                "r2": {"class_type": "IPAdapterModelLoader", "inputs": {"ipadapter_file": ipadapter_name}},
                "r2c": {"class_type": "CLIPVisionLoader", "inputs": {"clip_name": IPADAPTER_CLIP_VISION}},
                "r3": {"class_type": "IPAdapterAdvanced", "inputs": {
                    "model": ["j1", 0], "ipadapter": ["r2", 0], "image": face_image,
                    "weight": max(0.55, min(1.15, float(reference_strength))), "weight_type": "ease in",
                    "combine_embeds": "average", "start_at": 0.0, "end_at": 0.85,
                    "embeds_scaling": "K+V w/ C penalty", "clip_vision": ["r2c", 0],
                }},
            })
        else:
            graph.update({
                "r2": {"class_type": "IPAdapterUnifiedLoaderFaceID", "inputs": {
                    "model": ["j1", 0], "preset": "FACEID PLUS V2", "lora_strength": 0.65, "provider": "CPU",
                }},
                "r3": {"class_type": "IPAdapterFaceID", "inputs": {
                    "model": ["r2", 0], "ipadapter": ["r2", 1], "image": face_image,
                    "weight": max(0.75, min(1.2, float(reference_strength) + 0.2)), "weight_faceidv2": 1.8,
                    "weight_type": "linear", "combine_embeds": "concat", "start_at": 0.0, "end_at": 0.88,
                    "embeds_scaling": "K+V w/ C penalty",
                }},
            })
        graph["j5"]["inputs"]["model"] = ["r3", 0]

    if controlnet_name and (control_image or reference_image):
        control_filename = Path(control_image or reference_image).name
        if not (reference_image and control_filename == Path(reference_image).name):
            graph["c0"] = {"class_type": "LoadImage", "inputs": {"image": control_filename}}
            control_source = ["c0", 0]
        else:
            control_source = ["r1", 0]
        graph.update({
            "c1": {"class_type": "Canny", "inputs": {"image": control_source, "low_threshold": 0.35, "high_threshold": 0.75}},
            "c2": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": controlnet_name}},
        })
        control_net = ["c2", 0]
        if "union" in controlnet_name.lower():
            graph["c2u"] = {"class_type": "SetUnionControlNetType", "inputs": {"control_net": ["c2", 0], "type": "canny/lineart/anime_lineart/mlsd"}}
            control_net = ["c2u", 0]
        graph.update({
            "c3": {"class_type": "ControlNetApplyAdvanced", "inputs": {
                "positive": ["j2", 0], "negative": ["j3", 0], "control_net": control_net, "image": ["c1", 0],
                "strength": max(0.0, min(2.0, float(control_strength))), "start_percent": 0.0, "end_percent": 0.82,
                "vae": ["j1", 2],
            }},
        })
        graph["j5"]["inputs"]["positive"] = ["c3", 0]
        graph["j5"]["inputs"]["negative"] = ["c3", 1]

    if realvis_needs_layered_inpaint(positive_source) or force_inpaint:
        mask_x = round(width * 0.18)
        mask_y = round(height * 0.17)
        mask_width = round(width * 0.64)
        mask_height = round(height * 0.45)
        inpaint_positive = (
            positive_prompt + ". MASKED REGION EDIT ONLY: preserve the face, hair, pose, hands, body proportions, "
            "lower body, legs and black thigh-high stockings exactly. Replace every garment in the masked upper-torso region "
            "with continuous natural bare skin. (completely bare breasts, bare chest, bare shoulders, bare abdomen:1.6), "
            "wearing absolutely no top, no bra and no torso garment. Photorealistic adult anatomy and seamless skin texture."
        )
        inpaint_negative = sdxl_negative_prompt(positive_source, user_negative) + (
            ", dress, black dress, tube dress, minidress, bodysuit, leotard, corset, camisole, bra, shirt, blouse, top, jacket, "
            "sleeves, gloves, fabric on torso, covered chest, straps, garter belt"
        )
        inpaint_model = ["r3", 0] if reference_image else ["j1", 0]
        inpaint_clip = ["j1", 1]
        inpaint_vae = ["j1", 2]
        if inpaint_checkpoint:
            graph["ji1"] = {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": inpaint_checkpoint}}
            inpaint_model, inpaint_clip, inpaint_vae = ["ji1", 0], ["ji1", 1], ["ji1", 2]
        graph.update({
            "j8": {"class_type": "SolidMask", "inputs": {"value": 0.0, "width": width, "height": height}},
            "j9": {"class_type": "SolidMask", "inputs": {"value": 1.0, "width": mask_width, "height": mask_height}},
            "j10": {"class_type": "MaskComposite", "inputs": {"destination": ["j8", 0], "source": ["j9", 0], "x": mask_x, "y": mask_y, "operation": "add"}},
            "j11": {"class_type": "FeatherMask", "inputs": {"mask": ["j10", 0], "left": 32, "top": 48, "right": 32, "bottom": 48}},
            "j12": {"class_type": "CLIPTextEncode", "inputs": {"text": inpaint_positive, "clip": inpaint_clip}},
            "j13": {"class_type": "CLIPTextEncode", "inputs": {"text": inpaint_negative, "clip": inpaint_clip}},
            "j14": {"class_type": "InpaintModelConditioning", "inputs": {"positive": ["j12", 0], "negative": ["j13", 0], "vae": inpaint_vae, "pixels": ["j6", 0], "mask": ["j11", 0], "noise_mask": True}},
            "j15": {"class_type": "KSampler", "inputs": {
                "model": inpaint_model, "seed": seed + 1, "steps": 32, "cfg": 7.0,
                "sampler_name": "dpmpp_sde", "scheduler": "karras", "positive": ["j14", 0],
                "negative": ["j14", 1], "latent_image": ["j14", 2], "denoise": 0.92,
            }},
            "j16": {"class_type": "VAEDecode", "inputs": {"samples": ["j15", 0], "vae": inpaint_vae}},
        })
        if save:
            graph["j17"] = {"class_type": "SaveImage", "inputs": {"images": ["j16", 0], "filename_prefix": prefix}}
    elif save:
        graph["j7"] = {"class_type": "SaveImage", "inputs": {"images": ["j6", 0], "filename_prefix": prefix}}
    return graph


def turnaround_subject_description(prompt):
    raw_prompt = str(prompt or "").strip()
    sections = re.findall(
        r"(?ims)^(SUBJECT|HAIR|BODY|WARDROBE(?: AND SKIN-COVERAGE LOCK)?):\s*(.*?)(?=^[A-Z][A-Z -]+:\s*|\Z)",
        raw_prompt,
    )
    if sections:
        limits = {"SUBJECT": 380, "HAIR": 300, "BODY": 240, "WARDROBE": 520, "WARDROBE AND SKIN-COVERAGE LOCK": 300}
        selected = []
        for label, text in sections:
            text = text.strip()
            limit = limits.get(label, 320)
            if len(text) > limit:
                text = text[:limit].rsplit(" ", 1)[0].rstrip(" ,;:") + "."
            if text:
                selected.append(text)
        positive = " ".join(selected)
    else:
        positive, _ = split_sdxl_prompt(raw_prompt)
        sentences = re.split(r"(?<=[.!?。！？])\s+|\n+", positive)
        layout_terms = (
            "composition", "layout", "left portrait", "right turnaround", "left one-third",
            "right two-thirds", "canvas", "orthographic views", "panel border", "character sheet",
        )
        filtered = [sentence.strip() for sentence in sentences if sentence.strip() and not any(term in sentence.lower() for term in layout_terms)]
        positive = " ".join(filtered) or positive
    return positive[:1700].strip()


def realvis_turnaround_graph(prompt, seed, prefix="AgentStudio/图片/角色三视图", reference_image=None, reference_strength=0.82):
    subject = turnaround_subject_description(prompt)
    base = (
        "premium photorealistic adult fashion casting reference, one single clearly adult woman only, "
        "accurate anatomy, realistic natural skin texture, soft even studio lighting, warm pale-gray seamless background. "
    )
    portrait_prompt = (
        base + "OVERSIZED EDGE-TO-EDGE frontal head-and-shoulders beauty close-up, face and dynamic hairstyle fill the frame, "
        "hair touches the top edge, shoulders extend beyond both side edges, clothing continues beyond the bottom edge. "
        "Preserve the exact character identity, facial geometry, hairstyle, outfit neckline and visible-skin coverage. " + subject
    )
    full_body_prefix = (
        base + "The exact same woman, face, hairstyle, body proportions, wardrobe, materials, colors and visible-skin coverage as the identity reference. "
        "One single complete full-body figure only, neutral turnaround stance, arms slightly away from the waist, whole body visible from hair to footwear, "
        "both shoes completely visible with clear floor margin, no cropping. "
    )
    front_prompt = full_body_prefix + "STRICT STRAIGHT FRONT VIEW facing the camera, symmetrical frontal stance. " + subject
    side_prompt = full_body_prefix + "STRICT LEFT-SIDE PROFILE VIEW at exactly 90 degrees, face and body in true profile, looking straight left. " + subject
    back_prompt = full_body_prefix + "STRICT STRAIGHT BACK VIEW at exactly 180 degrees, back of head and outfit visible, face completely hidden, no looking over shoulder. " + subject

    common_negative = (
        "low quality, blurry, deformed anatomy, bad hands, extra fingers, missing fingers, extra limbs, fused limbs, "
        "multiple people, two women, twins, clones, duplicate subject, contact sheet, split screen, collage, triptych, "
        "floating head, ghost image, text, letters, labels, logo, watermark, cropped head, cropped legs, cropped feet, cropped shoes"
    )
    portrait_negative = common_negative + ", full body, distant person, tiny face, empty margin, portrait card, frame around portrait"
    front_negative = common_negative + ", side view, profile view, back view, turned body, looking away"
    side_negative = common_negative + ", front view, three-quarter view, back view, looking at camera, turned torso"
    back_negative = common_negative + ", front view, side view, three-quarter view, visible face, looking over shoulder, turned head"
    full_seed = seed + 1

    graph = {
        "t1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": REALVIS_CHECKPOINT}},
        "tp2": {"class_type": "CLIPTextEncode", "inputs": {"text": portrait_prompt, "clip": ["t1", 1]}},
        "tp3": {"class_type": "CLIPTextEncode", "inputs": {"text": portrait_negative, "clip": ["t1", 1]}},
        "tp4": {"class_type": "EmptyLatentImage", "inputs": {"width": 640, "height": 1024, "batch_size": 1}},
        "tp5": {"class_type": "KSampler", "inputs": {
            "model": ["t1", 0], "seed": seed, "steps": 32, "cfg": 6.0, "sampler_name": "dpmpp_sde", "scheduler": "karras",
            "positive": ["tp2", 0], "negative": ["tp3", 0], "latent_image": ["tp4", 0], "denoise": 1.0,
        }},
        "tp6": {"class_type": "VAEDecode", "inputs": {"samples": ["tp5", 0], "vae": ["t1", 2]}},
        "ti1": {"class_type": "IPAdapterModelLoader", "inputs": {"ipadapter_file": IPADAPTER_PLUS_FACE}},
        "tic": {"class_type": "CLIPVisionLoader", "inputs": {"clip_name": IPADAPTER_CLIP_VISION}},
        "ti2": {"class_type": "IPAdapterAdvanced", "inputs": {
            "model": ["t1", 0], "ipadapter": ["ti1", 0], "image": ["tp6", 0], "weight": 0.82,
            "weight_type": "ease in", "combine_embeds": "average", "start_at": 0.0, "end_at": 0.82,
            "embeds_scaling": "K+V w/ C penalty", "clip_vision": ["tic", 0],
        }},
        "ti3": {"class_type": "IPAdapterAdvanced", "inputs": {
            "model": ["t1", 0], "ipadapter": ["ti1", 0], "image": ["tp6", 0], "weight": 0.48,
            "weight_type": "ease in", "combine_embeds": "average", "start_at": 0.0, "end_at": 0.65,
            "embeds_scaling": "K+V w/ C penalty", "clip_vision": ["tic", 0],
        }},
    }

    if reference_image:
        graph["tr1"] = {"class_type": "LoadImage", "inputs": {"image": Path(reference_image).name}}
        face_image = ["tr1", 0]
        crop = face_reference_crop(reference_image)
        if crop:
            graph["tr1c"] = {"class_type": "ImageCrop", "inputs": {
                "image": ["tr1", 0], "width": crop[0], "height": crop[1], "x": 0, "y": 0,
            }}
            face_image = ["tr1c", 0]
        graph.update({
            "tr2": {"class_type": "IPAdapterUnifiedLoaderFaceID", "inputs": {
                "model": ["t1", 0], "preset": "FACEID PLUS V2", "lora_strength": 0.65, "provider": "CPU",
            }},
            "tr3": {"class_type": "IPAdapterFaceID", "inputs": {
                "model": ["tr2", 0], "ipadapter": ["tr2", 1], "image": face_image,
                "weight": max(0.78, min(1.15, float(reference_strength) + 0.12)), "weight_faceidv2": 1.8,
                "weight_type": "linear", "combine_embeds": "concat", "start_at": 0.0, "end_at": 0.88,
                "embeds_scaling": "K+V w/ C penalty",
            }},
        })
        graph["tp5"]["inputs"]["model"] = ["tr3", 0]
        graph["ti2"]["inputs"]["model"] = ["tr3", 0]
        graph["ti3"]["inputs"]["model"] = ["tr3", 0]

    for key, view_prompt, view_negative, model in (
        ("tf", front_prompt, front_negative, ["ti2", 0]),
        ("ts", side_prompt, side_negative, ["ti2", 0]),
        ("tb", back_prompt, back_negative, ["ti3", 0]),
    ):
        graph.update({
            f"{key}2": {"class_type": "CLIPTextEncode", "inputs": {"text": view_prompt, "clip": ["t1", 1]}},
            f"{key}3": {"class_type": "CLIPTextEncode", "inputs": {"text": view_negative, "clip": ["t1", 1]}},
            f"{key}4": {"class_type": "EmptyLatentImage", "inputs": {"width": 384, "height": 1024, "batch_size": 1}},
            f"{key}5": {"class_type": "KSampler", "inputs": {
                "model": model, "seed": full_seed, "steps": 30, "cfg": 6.0, "sampler_name": "dpmpp_sde", "scheduler": "karras",
                "positive": [f"{key}2", 0], "negative": [f"{key}3", 0], "latent_image": [f"{key}4", 0], "denoise": 1.0,
            }},
            f"{key}6": {"class_type": "VAEDecode", "inputs": {"samples": [f"{key}5", 0], "vae": ["t1", 2]}},
        })

    graph.update({
        "tc0": {"class_type": "EmptyImage", "inputs": {"width": 1792, "height": 1024, "batch_size": 1, "color": 0xF0EEEA}},
        "tc1": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["tc0", 0], "source": ["tp6", 0], "x": 0, "y": 0, "resize_source": False}},
        "tc2": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["tc1", 0], "source": ["tf6", 0], "x": 640, "y": 0, "resize_source": False}},
        "tc3": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["tc2", 0], "source": ["ts6", 0], "x": 1024, "y": 0, "resize_source": False}},
        "tc4": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["tc3", 0], "source": ["tb6", 0], "x": 1408, "y": 0, "resize_source": False}},
        "tc5": {"class_type": "SaveImage", "inputs": {"images": ["tc4", 0], "filename_prefix": prefix}},
    })
    return graph


def h3_graph(prompt, width, height, seconds, seed, prefix, first_frame=None):
    h3_inputs = {
        "clip": ["h2", 0],
        "vae": ["h3", 0],
        "prompt": prompt,
        "width": width,
        "height": height,
        "length": duration_to_length(seconds),
    }
    if first_frame is not None:
        h3_inputs["first_frame"] = first_frame

    return {
        "h1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_h3_fl2va_pruned_int8_convrot.safetensors", "weight_dtype": "default"}},
        "h2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "type": "minimax", "device": "default"}},
        "h3": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_video_vae_fp16.safetensors"}},
        "h4": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_audio_vae_fp32.safetensors"}},
        "h5": {"class_type": "MiniMaxH3ImageToVideo", "inputs": h3_inputs},
        "h6": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "h7": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}},
        "h8": {"class_type": "BasicScheduler", "inputs": {"model": ["h1", 0], "scheduler": "simple", "steps": 20, "denoise": 1.0}},
        "h9": {"class_type": "BasicGuider", "inputs": {"model": ["h1", 0], "conditioning": ["h5", 0]}},
        "h10": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["h6", 0], "guider": ["h9", 0], "sampler": ["h7", 0], "sigmas": ["h8", 0], "latent_image": ["h5", 1]}},
        "h11": {"class_type": "VAEDecode", "inputs": {"samples": ["h10", 0], "vae": ["h3", 0]}},
        "h12": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["h10", 0], "vae": ["h4", 0]}},
        "h13": {"class_type": "CreateVideo", "inputs": {"images": ["h11", 0], "audio": ["h12", 0], "fps": 24.0, "bit_depth": 8}},
        "h14": {"class_type": "SaveVideo", "inputs": {"video": ["h13", 0], "filename_prefix": prefix, "format": "mp4", "codec": "auto"}},
    }


def normalize_h3_references(references):
    normalized = []
    counts = {"image": 0, "video": 0, "audio": 0}
    for raw in references or []:
        if not isinstance(raw, dict):
            continue
        filename = Path(str(raw.get("filename") or "")).name
        suffix = Path(filename).suffix.lower()
        if suffix in IMAGE_EXTENSIONS:
            media_type = "image"
        elif suffix in VIDEO_EXTENSIONS:
            media_type = "video"
        elif suffix in AUDIO_EXTENSIONS:
            media_type = "audio"
        else:
            raise ValueError(f"不支持的 H3 参考素材格式：{suffix or filename}")
        source = (COMFY_ROOT / "input" / filename).resolve()
        if COMFY_ROOT.joinpath("input").resolve() not in source.parents or not source.is_file():
            raise ValueError(f"找不到 H3 参考素材：{filename}")
        counts[media_type] += 1
        limits = {"image": 9, "video": 3, "audio": 3}
        if counts[media_type] > limits[media_type]:
            labels = {"image": "图片", "video": "视频", "audio": "音频"}
            raise ValueError(f"H3 最多支持 {limits[media_type]} 个参考{labels[media_type]}")
        normalized.append({
            "filename": filename,
            "type": media_type,
            "name": str(raw.get("name") or Path(filename).stem).strip()[:80],
            "role": str(raw.get("role") or ({"image": "character", "video": "motion", "audio": "music"}[media_type])).strip(),
            "description": str(raw.get("description") or "").strip()[:1200],
            "usage": str(raw.get("usage") or "all").strip(),
            "include_audio": bool(raw.get("include_audio", False)) if media_type == "video" else False,
            "asset_id": str(raw.get("asset_id") or "").strip() or None,
        })
    if not normalized:
        raise ValueError("请至少添加一个图片、视频或音频参考素材")
    return normalized


def h3_reference_prompt(brief, references, seconds):
    prompt = str(brief or "").strip()
    if re.search(r"(?im)^subject_definitions\s*:", prompt):
        return prompt

    role_names = {
        "character": "character identity and appearance",
        "scene": "environment and scene design",
        "wardrobe": "wardrobe and accessories",
        "prop": "prop or reusable object",
        "motion": "motion, performance and camera rhythm",
        "style": "visual style, lighting and color treatment",
        "storyboard": "composition and storyboard planning",
        "voice": "voice timbre and delivery",
        "music": "music, beat and audio atmosphere",
    }
    usage_names = {
        "all": "throughout the target video",
        "opening": "in the opening shot",
        "middle": "in the middle section",
        "ending": "in the ending shot",
    }
    definitions = []
    retention = []
    subject_labels = []
    picture_index = video_index = audio_index = subject_index = 0

    for ref in [item for item in references if item["type"] == "image"]:
        picture_index += 1
        subject_index += 1
        subject = f"<Subject {subject_index}>"
        picture = f"<Picture {picture_index}>"
        role = role_names.get(ref["role"], "visual reference")
        detail = ref["description"] or ref["name"]
        usage = usage_names.get(ref["usage"], ref["usage"] or usage_names["all"])
        definitions.append(f"{subject} is the {role} from {picture}, named {ref['name']}: {detail}")
        retention.append(f"{subject} (used {usage}): fully_preserved - retain the defining identity, layout, materials and visual attributes requested from {picture}.")
        subject_labels.append(subject)

    for ref in [item for item in references if item["type"] == "video"]:
        video_index += 1
        subject_index += 1
        subject = f"<Subject {subject_index}>"
        video = f"<Video {video_index}>"
        role = role_names.get(ref["role"], "motion and temporal reference")
        detail = ref["description"] or ref["name"]
        usage = usage_names.get(ref["usage"], ref["usage"] or usage_names["all"])
        definitions.append(f"{subject} is the {role} from {video}, named {ref['name']}: {detail}")
        definitions.append(f"{video} provides the referenced motion, timing, cuts and camera behavior for {usage}.")
        retention.append(f"{subject} (used {usage}): fully_preserved - transfer the requested visible motion and temporal behavior from {video} without copying unrelated identities.")
        retention.append(f"{video} (motion and pacing structure): weak_reference - follow its useful timing and camera relationships while creating the requested target scene.")
        subject_labels.append(subject)
        if ref["include_audio"]:
            audio_index += 1
            audio = f"<Audio {audio_index}>"
            definitions.append(f"{audio} is the synchronized soundtrack of {video} and is used as an audio reference.")
            retention.append(f"{audio}: reference - follow its beat, timing and sound character without requiring a bit-for-bit copy.")

    for ref in [item for item in references if item["type"] == "audio"]:
        audio_index += 1
        audio = f"<Audio {audio_index}>"
        role = role_names.get(ref["role"], "audio reference")
        detail = ref["description"] or ref["name"]
        definitions.append(f"{audio} is the {role}, named {ref['name']}: {detail}")
        retention.append(f"{audio}: reference - follow its requested timbre, rhythm, delivery or sound texture without copying unrelated content.")

    task_types = ["reference generation"]
    if audio_index:
        task_types.append("audio reference")
    subjects = ", ".join(subject_labels) or "the referenced material"
    duration_text = f"{float(seconds):g} seconds"
    return (
        "subject_definitions:\n" + "\n".join(definitions) + "\n\n"
        "summary:\n"
        f"[{' + '.join(task_types)}] The target video uses {subjects} to create a coherent {duration_text} audiovisual sequence following this request: {prompt}\n\n"
        "retention_analysis:\n" + "\n".join(retention) + "\n\n"
        "detailed_description:\n"
        "The target video uses coherent cinematic staging, stable subject identity, physically plausible motion, consistent lighting and synchronized sound.\n"
        f"[Shot 1] {prompt} Use each referenced subject only for its assigned role and usage range. Keep separately defined people visually distinct, "
        "place them in the assigned environments, and preserve spatial continuity across cuts. Do not merge faces, clothing, scenes or props between subjects. "
        f"Complete the visible action and audiovisual arc within {duration_text}.\n\n"
        "overall_soundscape:\n"
        "Generate scene-appropriate ambience and physical action sounds. Follow referenced audio timing and texture where an <Audio N> source is defined.\n\n"
        "non_diegetic_music:\n"
        "Use the referenced music or beat when supplied; otherwise generate restrained background music that supports the requested pacing."
    )


def h3_reference_graph(prompt, width, height, seconds, seed, prefix, references, options=None):
    references = normalize_h3_references(references)
    options = options or {}
    ref_image_size = str(options.get("ref_image_size") or "match")
    if ref_image_size not in {"match", "max"}:
        ref_image_size = "match"
    steps = max(12, min(32, int(options.get("steps") or 20)))
    shift_video = max(0.01, min(100.0, float(options.get("shift_video") or 12.0)))
    shift_audio = max(0.01, min(100.0, float(options.get("shift_audio") or 3.0)))
    conditioned_prompt = h3_reference_prompt(prompt, references, seconds)

    graph = {
        "h1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_h3_fl2va_pruned_int8_convrot.safetensors", "weight_dtype": "default"}},
        "h2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "type": "minimax", "device": "default"}},
        "h3": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_video_vae_fp16.safetensors"}},
        "h4": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_audio_vae_fp32.safetensors"}},
        "h1s": {"class_type": "MiniMaxH3SigmaShift", "inputs": {"model": ["h1", 0], "shift_video": shift_video, "shift_audio": shift_audio}},
    }
    h5_inputs = {
        "clip": ["h2", 0], "vae": ["h3", 0], "audio_vae": ["h4", 0],
        "prompt": conditioned_prompt, "width": width, "height": height,
        "length": duration_to_length(seconds), "ref_image_size": ref_image_size,
    }
    image_index = video_index = audio_index = 0
    for index, ref in enumerate(references):
        node = f"ref{index}"
        if ref["type"] == "image":
            graph[node] = {"class_type": "LoadImage", "inputs": {"image": ref["filename"]}}
            h5_inputs[f"ref_images.ref_image_{image_index}"] = [node, 0]
            image_index += 1
        elif ref["type"] == "video":
            graph[node] = {"class_type": "LoadVideo", "inputs": {"file": ref["filename"]}}
            graph[f"{node}c"] = {"class_type": "GetVideoComponents", "inputs": {"video": [node, 0]}}
            h5_inputs[f"ref_videos.ref_video_{video_index}"] = [f"{node}c", 0]
            if ref["include_audio"]:
                h5_inputs[f"ref_video_audios.ref_video_audio_{video_index}"] = [f"{node}c", 1]
            video_index += 1
        else:
            graph[node] = {"class_type": "LoadAudio", "inputs": {"audio": ref["filename"]}}
            h5_inputs[f"ref_audios.ref_audio_{audio_index}"] = [node, 0]
            audio_index += 1

    graph.update({
        "h5": {"class_type": "MiniMaxH3ReferenceToVideo", "inputs": h5_inputs},
        "h6": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "h7": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}},
        "h8": {"class_type": "BasicScheduler", "inputs": {"model": ["h1s", 0], "scheduler": "simple", "steps": steps, "denoise": 1.0}},
        "h9": {"class_type": "BasicGuider", "inputs": {"model": ["h1s", 0], "conditioning": ["h5", 0]}},
        "h10": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["h6", 0], "guider": ["h9", 0], "sampler": ["h7", 0], "sigmas": ["h8", 0], "latent_image": ["h5", 1]}},
        "h11": {"class_type": "VAEDecode", "inputs": {"samples": ["h10", 0], "vae": ["h3", 0]}},
        "h12": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["h10", 0], "vae": ["h4", 0]}},
        "h13": {"class_type": "CreateVideo", "inputs": {"images": ["h11", 0], "audio": ["h12", 0], "fps": 24.0, "bit_depth": 8}},
        "h14": {"class_type": "SaveVideo", "inputs": {"video": ["h13", 0], "filename_prefix": prefix, "format": "mp4", "codec": "auto"}},
    })
    return graph


def h3_state_lock_prompt(prompt):
    """Ask H3 to treat the supplied first frame as authoritative visual state."""
    return (
        f"{prompt.strip()}\n\n"
        "首帧状态锁定：输入首帧是人物外观与造型状态的唯一权威依据。严格延续首帧中已经存在的面部、发型、身体外观、"
        "皮肤可见范围、服饰状态、配饰、姿态和遮挡状态。不得凭空新增、移除、替换或改变衣服、内衣、布料、毛巾、毯子、"
        "马赛克或其他遮挡物；不得用新出现的头发、手臂、家具、阴影或镜头裁切改变首帧原有的可见状态。"
        "只执行用户要求的轻微自然动作和镜头运动，第一帧到后续帧保持连续，不跳变、不变装。\n"
        "FIRST-FRAME STATE LOCK: The input first frame is the authoritative visual reference. Preserve exactly the existing appearance, "
        "visible-skin coverage, styling, accessories and occlusion state. Do not add, remove, replace or change clothing, underwear, fabric, "
        "towels, blankets, censoring or coverings. Do not introduce new hair, arms, objects, shadows or crops to alter the initial visible state. "
        "Perform only the requested subtle motion with continuous identity and appearance."
    )


def h3_character_reference_prompt(prompt, controls=None):
    """Use a library character image as H3's direct visual reference without a FLUX step."""
    controls = controls or {}
    lock_face = bool(controls.get("lock_face", True))
    lock_outfit = bool(controls.get("lock_outfit", True))
    consistency = max(45, min(100, int(controls.get("consistency", 85))))
    face_rule = "严格保持参考图中的脸型、五官、发型与表观年龄一致" if lock_face else "保持角色总体身份特征，允许轻微自然变化"
    outfit_rule = "严格保持参考图或资产描述中的服装、配饰与颜色一致" if lock_outfit else "服装可以按用户描述和场景自然变化"
    return (
        f"{prompt.strip()}\n\n"
        f"角色资产直接参考（强度 {consistency}%）：输入图片是主角的视觉身份参考，不经过 FLUX。{face_rule}；{outfit_rule}。"
        "允许按提示词建立新的景别、动作、姿势、镜头和环境，但主角在所有画面中必须是同一个人。动作连续自然，不换脸、不新增同脸角色。\n"
        f"DIRECT CHARACTER REFERENCE ({consistency}%): use the input image as the protagonist identity reference without a FLUX pass. "
        "Preserve one consistent adult character across the video while following the requested action, camera and scene."
    )


def build_graph(job, payload):
    mode = job["mode"]
    prompt = payload["prompt"].strip()
    image_prompt = str(payload.get("image_prompt") or prompt).strip()
    video_prompt = str(payload.get("video_prompt") or prompt).strip()
    state_lock = bool(payload.get("preserve_first_frame_state", True))
    image_model = payload.get("image_model", "realvis_xl")
    if image_model == "juggernaut_xl":
        image_model = "realvis_xl"
    if mode == "text_image":
        width, height = IMAGE_RESOLUTIONS[payload["quality"]]
        if image_model == "realvis_xl" and realvis_prefers_portrait(image_prompt):
            width, height = height, width
    else:
        width, height = RESOLUTIONS[payload["quality"]]
    seconds = float(payload.get("duration", 5))
    raw_seed = payload.get("seed")
    seed = int(raw_seed) if raw_seed not in {None, "", "null"} else secrets.randbelow(9_007_199_254_740_990) + 1
    payload["seed"] = seed
    stamp = time.strftime("%Y%m%d_%H%M%S")
    short_id = job["id"][:8]
    reference_value = payload.get("reference_image")
    reference_image = Path(str(reference_value)).name if reference_value not in {None, "", "None", "null"} else None
    reference_strength = float(payload.get("reference_strength") or 0.72)
    uses_sdxl = image_model in {"realvis_xl", "sdxl_local"}
    checkpoint_name = checked_model_name("checkpoints", payload.get("checkpoint_name") or (REALVIS_CHECKPOINT if uses_sdxl else None), required=uses_sdxl)
    inpaint_checkpoint = checked_model_name("checkpoints", payload.get("inpaint_checkpoint"))
    controlnet_name = checked_model_name("controlnet", payload.get("controlnet_name"))
    ipadapter_name = checked_model_name("ipadapter", payload.get("ipadapter_name"))
    control_value = payload.get("control_image")
    control_image = Path(str(control_value)).name if control_value not in {None, "", "None", "null"} else None
    if reference_image:
        controls = payload.get("asset_controls") or {}
        if bool(controls.get("lock_face", True)):
            image_prompt += (
                "\nREFERENCE IDENTITY AND HAIR LOCK: preserve the exact same adult person's facial geometry, "
                "eyes, nose, lips, jawline, apparent age, hairstyle, hair length, hairline, hair color and makeup "
                "from the reference portrait. Do not redesign the face or hair."
            )
        if bool(controls.get("lock_outfit", False)):
            image_prompt += " Preserve the reference wardrobe, accessories, materials and colors exactly."
        else:
            image_prompt += " Replace only the wardrobe according to the requested outfit; do not copy the reference clothing."

    if mode == "text_image":
        if payload.get("turnaround_sheet"):
            return realvis_turnaround_graph(
                image_prompt, seed, f"AgentStudio/图片/角色三视图_{stamp}_{short_id}",
                reference_image, reference_strength,
            )
        if image_model in {"realvis_xl", "sdxl_local"}:
            return realvis_graph(
                image_prompt, width, height, seed, True, f"AgentStudio/图片/SDXL_{stamp}_{short_id}", reference_image, reference_strength,
                checkpoint_name=checkpoint_name, inpaint_checkpoint=inpaint_checkpoint,
                force_inpaint=bool(payload.get("force_inpaint")), controlnet_name=controlnet_name,
                control_image=control_image, control_strength=float(payload.get("control_strength") or 0.75),
                ipadapter_name=ipadapter_name,
            )
        return flux_graph(image_prompt, width, height, seed, True, f"AgentStudio/图片/FLUX_{stamp}_{short_id}")

    if mode == "h3_reference":
        normalized_references = normalize_h3_references(payload.get("h3_references") or [])
        video_prompt = h3_reference_prompt(video_prompt, normalized_references, seconds)
        payload["video_prompt"] = video_prompt
        return h3_reference_graph(
            video_prompt, width, height, seconds, seed,
            f"AgentStudio/视频/H3多素材_{stamp}_{short_id}",
            normalized_references, payload.get("h3_reference_options") or {},
        )

    if mode == "image_video":
        filename = Path(payload.get("image", "")).name
        if not filename:
            raise ValueError("请先插入一张图片。")
        if state_lock:
            video_prompt = h3_state_lock_prompt(video_prompt)
        graph = {"input": {"class_type": "LoadImage", "inputs": {"image": filename}}}
        graph.update(h3_graph(video_prompt, width, height, seconds, seed, f"AgentStudio/视频/视频_{stamp}_{short_id}", ["input", 0]))
        return graph

    if mode == "text_video":
        if reference_image:
            video_prompt = h3_character_reference_prompt(video_prompt, payload.get("asset_controls"))
            graph = {"character_ref": {"class_type": "LoadImage", "inputs": {"image": reference_image}}}
            graph.update(h3_graph(video_prompt, width, height, seconds, seed, f"AgentStudio/视频/视频_{stamp}_{short_id}", ["character_ref", 0]))
            return graph
        return h3_graph(video_prompt, width, height, seconds, seed, f"AgentStudio/视频/视频_{stamp}_{short_id}")

    if image_model in {"realvis_xl", "sdxl_local"}:
        use_inpaint = realvis_needs_layered_inpaint(image_prompt) or bool(payload.get("force_inpaint"))
        graph = realvis_graph(
            image_prompt, width, height, seed, True, f"AgentStudio/图片/首帧_SDXL_{stamp}_{short_id}", reference_image, reference_strength,
            checkpoint_name=checkpoint_name, inpaint_checkpoint=inpaint_checkpoint,
            force_inpaint=bool(payload.get("force_inpaint")), controlnet_name=controlnet_name,
            control_image=control_image, control_strength=float(payload.get("control_strength") or 0.75),
            ipadapter_name=ipadapter_name,
        )
        first_frame = ["j16", 0] if use_inpaint else ["j6", 0]
    else:
        graph = flux_graph(image_prompt, width, height, seed, True, f"AgentStudio/图片/首帧_FLUX_{stamp}_{short_id}")
        first_frame = ["f12", 0]
    if state_lock:
        video_prompt = h3_state_lock_prompt(video_prompt)
    graph.update(h3_graph(video_prompt, width, height, seconds, seed, f"AgentStudio/视频/视频_{stamp}_{short_id}", first_frame))
    return graph


def progress_for_event(mode, node, value, maximum, turnaround_sheet=False):
    ratio = 0 if not maximum else max(0, min(1, value / maximum))
    if turnaround_sheet:
        stages = {"tp": (7, 24), "tf": (27, 45), "ts": (49, 67), "tb": (71, 91)}
        start, end = stages.get(str(node)[:2], (5, 92))
        return start + round(ratio * (end - start))
    if mode == "flux_video":
        if str(node).startswith("f"):
            return 8 + round(ratio * 24)
        return 35 + round(ratio * 57)
    if mode == "text_image":
        return 12 + round(ratio * 78)
    return 10 + round(ratio * 82)


def collect_files(value, found):
    if isinstance(value, dict):
        if "filename" in value:
            key = (value.get("filename"), value.get("subfolder", ""), value.get("type", "output"))
            if key not in found:
                found.append(key)
        for item in value.values():
            collect_files(item, found)
    elif isinstance(value, list):
        for item in value:
            collect_files(item, found)


async def history_outputs(session, prompt_id):
    async with session.get(f"{COMFY_HTTP}/history/{prompt_id}", timeout=ClientTimeout(total=30)) as response:
        data = await response.json()
    entry = data.get(prompt_id, {})
    found = []
    collect_files(entry.get("outputs", {}), found)
    results = []
    for filename, subfolder, output_type in found:
        suffix = Path(filename).suffix.lower()
        kind = "video" if suffix in {".mp4", ".webm", ".mov", ".mkv"} else "image"
        query = urlencode({"filename": filename, "subfolder": subfolder, "type": output_type})
        results.append({
            "filename": filename,
            "subfolder": subfolder,
            "type": output_type,
            "kind": kind,
            "url": f"/api/media?{query}",
        })
    return results


def outputs_from_comfy_entry(entry):
    found = []
    collect_files(entry.get("outputs", {}), found)
    results = []
    for filename, subfolder, output_type in found:
        suffix = Path(filename).suffix.lower()
        kind = "video" if suffix in {".mp4", ".webm", ".mov", ".mkv"} else "image"
        query = urlencode({"filename": filename, "subfolder": subfolder, "type": output_type})
        results.append({"filename": filename, "subfolder": subfolder, "type": output_type, "kind": kind, "url": f"/api/media?{query}"})
    return results


def recovered_source_prompt(image_prompt, video_prompt):
    if video_prompt:
        match = re.search(r"故事与主体：(.*?)(?:人物身份、脸部|\n背景描述：)", video_prompt, re.S)
        if match:
            return match.group(1).strip().rstrip("。")
        return video_prompt.strip()
    if image_prompt:
        cleaned = re.sub(r"^写实真人电影摄影，.*?体积光。", "", image_prompt, flags=re.S)
        cleaned = re.sub(r"选择故事最有辨识度、.*$", "", cleaned, flags=re.S)
        return cleaned.strip().rstrip("。") or image_prompt.strip()
    return "已恢复的本地生成记录"


def recovered_history_record(prompt_id, entry):
    prompt_bundle = entry.get("prompt") or []
    graph = prompt_bundle[2] if len(prompt_bundle) > 2 and isinstance(prompt_bundle[2], dict) else {}
    extra = prompt_bundle[3] if len(prompt_bundle) > 3 and isinstance(prompt_bundle[3], dict) else {}
    nodes = list(graph.values())
    has_flux = any(node.get("class_type") == "EmptyFlux2LatentImage" for node in nodes)
    has_sdxl = any(node.get("class_type") == "CheckpointLoaderSimple" for node in nodes)
    has_h3 = any(node.get("class_type") in {"MiniMaxH3ImageToVideo", "MiniMaxH3ReferenceToVideo"} for node in nodes)
    has_h3_reference = any(node.get("class_type") == "MiniMaxH3ReferenceToVideo" for node in nodes)
    has_input = any(node.get("class_type") == "LoadImage" for node in nodes)
    mode = "h3_reference" if has_h3_reference else "flux_video" if (has_flux or has_sdxl) and has_h3 else "image_video" if has_input and has_h3 else "text_video" if has_h3 else "text_image"
    image_prompt = next((str(node.get("inputs", {}).get("text", "")) for node in nodes if node.get("class_type") == "CLIPTextEncode"), "")
    h3_node = next((node for node in nodes if node.get("class_type") in {"MiniMaxH3ImageToVideo", "MiniMaxH3ReferenceToVideo"}), {})
    video_prompt = str(h3_node.get("inputs", {}).get("prompt", ""))
    prompt = recovered_source_prompt(image_prompt, video_prompt)
    width = int((h3_node.get("inputs") or {}).get("width") or next(((node.get("inputs") or {}).get("width") for node in nodes if node.get("class_type") == "EmptyFlux2LatentImage"), 1344))
    height = int((h3_node.get("inputs") or {}).get("height") or next(((node.get("inputs") or {}).get("height") for node in nodes if node.get("class_type") == "EmptyFlux2LatentImage"), 768))
    quality = next((name for name, size in RESOLUTIONS.items() if size == (width, height)), "hd")
    length = int((h3_node.get("inputs") or {}).get("length") or 0)
    duration = min((3, 5, 8, 10, 15), key=lambda value: abs(value - (length / 24))) if length else 5
    seed = next(((node.get("inputs") or {}).get("noise_seed") for node in nodes if node.get("class_type") == "RandomNoise"), None)
    input_image = next(((node.get("inputs") or {}).get("image") for node in nodes if node.get("class_type") == "LoadImage"), None)
    status_data = entry.get("status") or {}
    completed = bool(status_data.get("completed"))
    status = "complete" if completed else "error" if status_data.get("status_str") == "error" else "cancelled"
    created_at = float(extra.get("create_time") or time.time())
    if created_at > 10_000_000_000:
        created_at /= 1000
    return {
        "id": f"recovered-{prompt_id}", "title": history_title(prompt, mode), "created_at": created_at,
        "updated_at": time.time(), "status": status, "mode": mode, "prompt": prompt,
        "image_prompt": image_prompt, "video_prompt": video_prompt,
        "professional": bool("分镜时间线" in video_prompt or (image_prompt and video_prompt)),
        "settings": {"quality": quality, "duration": duration, "seed": seed, "mode": mode},
        "input_image": input_image, "outputs": outputs_from_comfy_entry(entry), "error": None,
        "prompt_id": prompt_id, "project_id": None, "shot_id": None, "recovered": True,
    }


async def recover_history_from_comfy(app):
    if not await ensure_comfy(app):
        return 0
    try:
        async with app["http"].get(f"{COMFY_HTTP}/history?max_items=500", timeout=ClientTimeout(total=30)) as response:
            data = await response.json()
    except Exception:
        return 0
    items = load_history()
    known_prompt_ids = {item.get("prompt_id") for item in items if item.get("prompt_id")}
    recovered = []
    for prompt_id, entry in data.items():
        if prompt_id in known_prompt_ids:
            continue
        record = recovered_history_record(prompt_id, entry)
        if record["image_prompt"] or record["video_prompt"]:
            recovered.append(record)
    if recovered:
        items.extend(recovered)
        items.sort(key=lambda item: item.get("created_at", 0), reverse=True)
        write_history(items)
    return len(recovered)


async def poll_until_done(session, prompt_id, timeout_seconds=24 * 60 * 60):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        async with session.get(f"{COMFY_HTTP}/history/{prompt_id}", timeout=ClientTimeout(total=30)) as response:
            data = await response.json()
        if prompt_id in data:
            return True
        await asyncio.sleep(2)
    return False


async def run_job(app, job, graph, front=False):
    session = app["http"]
    try:
        job.update(status="starting", progress=2, message="正在启动本地生成引擎…")
        persist_job_history(job)
        if not await ensure_comfy(app):
            raise RuntimeError("ComfyUI 启动失败，请检查 SageAttention 启动环境。")

        client_id = f"agent-studio-{job['id']}"
        job.update(status="queued", progress=4, message="模型已连接，正在提交任务…")
        ws = await session.ws_connect(f"{COMFY_WS}?clientId={client_id}", heartbeat=30, timeout=ClientTimeout(total=30))
        try:
            job["submission_pending"] = True
            try:
                async with session.post(
                    f"{COMFY_HTTP}/prompt",
                    json={"prompt": graph, "client_id": client_id, "front": bool(front)},
                    timeout=ClientTimeout(total=60),
                ) as response:
                    result = await response.json()
                    if response.status >= 400 or result.get("node_errors"):
                        raise RuntimeError(json.dumps(result.get("node_errors") or result, ensure_ascii=False))
                prompt_id = result["prompt_id"]
                job["prompt_id"] = prompt_id
            finally:
                job["submission_pending"] = False
            job.update(status="running", progress=5, message="任务已进入队列…")
            persist_job_history(job)

            while True:
                try:
                    message = await ws.receive(timeout=15)
                except asyncio.TimeoutError:
                    if await poll_until_done(session, prompt_id, timeout_seconds=1):
                        break
                    continue

                if message.type == WSMsgType.TEXT:
                    event = json.loads(message.data)
                    event_type = event.get("type")
                    data = event.get("data", {})
                    event_prompt = data.get("prompt_id")
                    if event_prompt and event_prompt != prompt_id:
                        continue
                    if event_type == "progress":
                        job["progress"] = progress_for_event(
                            job["mode"], data.get("node", ""), data.get("value", 0), data.get("max", 1),
                            bool((job.get("payload") or {}).get("turnaround_sheet")),
                        )
                        job["message"] = f"正在生成 · {data.get('value', 0)}/{data.get('max', 0)} 步"
                    elif event_type == "executing":
                        node = data.get("node")
                        if (job.get("payload") or {}).get("turnaround_sheet"):
                            if str(node).startswith("tp"):
                                job["message"] = "正在生成左侧面部特写…"
                            elif str(node).startswith("tf"):
                                job["message"] = "正在生成正面全身视图…"
                            elif str(node).startswith("ts"):
                                job["message"] = "正在生成侧面全身视图…"
                            elif str(node).startswith("tb"):
                                job["message"] = "正在生成背面全身视图…"
                            elif node == "tc5":
                                job.update(progress=max(job["progress"], 96), message="正在自动拼合三视图…")
                        elif node in {"f11", "f12"}:
                            job["message"] = "正在绘制 FLUX 高清首帧…"
                        elif node in {"h10", "h11", "h12"}:
                            job["message"] = "正在生成 MiniMax-H3 视频…"
                        elif node in {"f13", "h14"}:
                            job.update(progress=max(job["progress"], 96), message="正在保存结果…")
                        elif node is None and data.get("prompt_id") == prompt_id:
                            break
                    elif event_type == "execution_interrupted":
                        job.update(status="cancelled", message="引擎已中断任务", error=None)
                        return
                    elif event_type == "execution_error":
                        raise RuntimeError(data.get("exception_message") or "生成过程中发生错误。")
                    elif event_type in {"execution_success", "executed"}:
                        if event_type == "execution_success":
                            break
                elif message.type in {WSMsgType.CLOSED, WSMsgType.ERROR}:
                    await poll_until_done(session, prompt_id)
                    break
        finally:
            await ws.close()

        job["outputs"] = await history_outputs(session, job["prompt_id"])
        if not job["outputs"]:
            await asyncio.sleep(1)
            job["outputs"] = await history_outputs(session, job["prompt_id"])
        verify_output_files(job)
        job.update(status="complete", progress=100, message="生成完成")
        record_project_version(job)
    except asyncio.CancelledError:
        if job.get("status") not in {"paused", "cancelled"}:
            job.update(status="cancelled", message="任务已取消")
        raise
    except Exception as exc:
        if job.get("status") not in {"paused", "cancelled"}:
            job.update(status="error", message="生成失败", error=str(exc))
    finally:
        persist_job_history(job)
        current = asyncio.current_task()
        if JOB_TASKS.get(job["id"]) is current:
            JOB_TASKS.pop(job["id"], None)


async def api_health(request):
    session = request.app["http"]
    ready = await is_comfy_ready(session)
    payload = {
        "ready": ready,
        "starting": bool(request.app.get("comfy_task") and not request.app["comfy_task"].done()),
        "image_models": {
            "flux": True,
            "realvis_xl": (COMFY_ROOT / "models" / "checkpoints" / REALVIS_CHECKPOINT).is_file(),
            "sdxl_local": bool(local_model_catalog()["checkpoints"]),
        },
    }
    if ready:
        try:
            async with session.get(f"{COMFY_HTTP}/system_stats", timeout=ClientTimeout(total=5)) as response:
                stats = await response.json()
            devices = stats.get("devices", [])
            if devices:
                payload["device"] = devices[0].get("name", "NVIDIA GPU")
                payload["vram_total"] = devices[0].get("vram_total")
                payload["vram_free"] = devices[0].get("vram_free")
        except Exception:
            pass
    return web.json_response(payload)


async def api_models(request):
    return web.json_response(local_model_catalog())


async def api_canvases(request):
    canvases = []
    for path in CANVASES_ROOT.glob("*.json"):
        try:
            canvas = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        canvases.append({
            "id": canvas.get("id"), "name": canvas.get("name", "未命名画布"),
            "updated_at": canvas.get("updated_at", 0), "node_count": len(canvas.get("nodes", [])),
        })
    canvases.sort(key=lambda item: item["updated_at"], reverse=True)
    return web.json_response({"canvases": canvases})


async def api_canvas_create(request):
    payload = dict(await request.json())
    now = time.time()
    canvas = {
        "id": str(uuid.uuid4()), "name": str(payload.get("name") or "新建视频画布")[:80],
        "created_at": now, "updated_at": now,
        "nodes": payload.get("nodes") if isinstance(payload.get("nodes"), list) else [],
        "links": payload.get("links") if isinstance(payload.get("links"), list) else [],
        "viewport": payload.get("viewport") if isinstance(payload.get("viewport"), dict) else {"x": 0, "y": 0, "zoom": 1},
    }
    save_canvas(canvas)
    return web.json_response(canvas)


async def api_canvas_get(request):
    canvas = load_canvas(request.match_info["canvas_id"])
    if not canvas:
        raise web.HTTPNotFound(text="找不到这个画布")
    return web.json_response(canvas)


async def api_canvas_update(request):
    canvas = load_canvas(request.match_info["canvas_id"])
    if not canvas:
        raise web.HTTPNotFound(text="找不到这个画布")
    payload = dict(await request.json())
    if "name" in payload:
        canvas["name"] = str(payload["name"] or "未命名画布")[:80]
    if isinstance(payload.get("nodes"), list):
        canvas["nodes"] = payload["nodes"]
    if isinstance(payload.get("links"), list):
        canvas["links"] = payload["links"]
    if isinstance(payload.get("viewport"), dict):
        canvas["viewport"] = payload["viewport"]
    save_canvas(canvas)
    return web.json_response(canvas)


async def api_canvas_delete(request):
    path = canvas_file(request.match_info["canvas_id"])
    if not path.is_file():
        raise web.HTTPNotFound(text="找不到这个画布")
    path.unlink()
    return web.json_response({"deleted": True})


async def api_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    if field is None or field.name != "image":
        raise web.HTTPBadRequest(text="缺少图片文件")
    original = Path(field.filename or "image.png")
    suffix = original.suffix.lower() if original.suffix else ".png"
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
        raise web.HTTPBadRequest(text="仅支持 PNG、JPG、WEBP 或 BMP 图片")
    filename = f"agent_studio_{int(time.time())}_{secrets.token_hex(4)}{suffix}"
    destination = COMFY_ROOT / "input" / filename
    size = 0
    with destination.open("wb") as output:
        while True:
            chunk = await field.read_chunk(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > 50 * 1024 * 1024:
                output.close()
                destination.unlink(missing_ok=True)
                raise web.HTTPRequestEntityTooLarge(max_size=50 * 1024 * 1024, actual_size=size)
            output.write(chunk)
    return web.json_response({"filename": filename, "size": size})


async def api_h3_reference_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    if field is None or field.name != "file":
        raise web.HTTPBadRequest(text="缺少 H3 参考素材文件")
    original = Path(field.filename or "reference").name
    suffix = Path(original).suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        media_type, max_size = "image", 50 * 1024 * 1024
    elif suffix in VIDEO_EXTENSIONS:
        media_type, max_size = "video", 2 * 1024 * 1024 * 1024
    elif suffix in AUDIO_EXTENSIONS:
        media_type, max_size = "audio", 512 * 1024 * 1024
    else:
        raise web.HTTPBadRequest(text="支持 PNG/JPG/WEBP/BMP、MP4/WEBM/MOV/MKV、MP3/WAV/FLAC/M4A/AAC/OGG")
    filename = f"h3_reference_{int(time.time())}_{secrets.token_hex(4)}{suffix}"
    destination = COMFY_ROOT / "input" / filename
    size = 0
    try:
        with destination.open("wb") as output:
            while True:
                chunk = await field.read_chunk(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_size:
                    raise web.HTTPRequestEntityTooLarge(max_size=max_size, actual_size=size)
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    return web.json_response({"filename": filename, "size": size, "type": media_type, "original_name": original})


async def api_reference_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    if field is None or field.name != "image":
        raise web.HTTPBadRequest(text="缺少角色参考图")
    original = Path(field.filename or "虚构成年角色参考.png")
    suffix = original.suffix.lower() if original.suffix else ".png"
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
        raise web.HTTPBadRequest(text="仅支持 PNG、JPG、WEBP 或 BMP 图片")
    filename = f"character_reference_{int(time.time())}_{secrets.token_hex(4)}{suffix}"
    destination = COMFY_ROOT / "input" / filename
    size = 0
    with destination.open("wb") as output:
        while True:
            chunk = await field.read_chunk(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > 50 * 1024 * 1024:
                output.close()
                destination.unlink(missing_ok=True)
                raise web.HTTPRequestEntityTooLarge(max_size=50 * 1024 * 1024, actual_size=size)
            output.write(chunk)

    items = load_library()
    asset_id = str(uuid.uuid4())
    category_dir = LIBRARY_ROOT / LIBRARY_FOLDERS["character"]
    category_dir.mkdir(parents=True, exist_ok=True)
    asset_name = smart_asset_name("character", "虚构成年女性角色参考脸 短波波头 侧分刘海", suffix, items)
    library_destination = category_dir / f"{asset_id[:8]}_{asset_name}"
    shutil.copy2(destination, library_destination)
    asset = {
        "id": asset_id, "name": asset_name, "category": "character", "kind": "image",
        "prompt": "AI生成的虚构成年女性角色参考脸；短波波头，侧分刘海遮住一只眼睛。仅用于保持虚构角色外观。",
        "tags": ["虚构成年人", "角色参考脸", "短发", "波波头", "IP-Adapter"],
        "favorite": False, "created_at": time.time(), "source_name": original.name, "size": size,
        "relative_path": library_destination.relative_to(LIBRARY_ROOT).as_posix(),
        "url": f"/api/library/media/{asset_id}",
    }
    items.append(asset)
    write_library(items)
    return web.json_response({"filename": filename, "size": size, "asset": asset})


async def api_expand_prompt(request):
    payload = await request.json()
    brief = str(payload.get("brief", "")).strip()
    if not brief:
        raise web.HTTPBadRequest(text="请先写下你的故事或画面想法")
    mode = payload.get("mode", "flux_video")
    style = payload.get("style", "cinematic")
    duration = float(payload.get("duration", 5))
    shot_count = int(payload.get("shot_count", 4))
    return web.json_response(expand_professional_prompt(brief, mode, style, shot_count, duration))


def safe_source_path(filename, subfolder, source_type):
    base = COMFY_ROOT / ("input" if source_type == "input" else "output")
    target = (base / Path(subfolder or "") / Path(filename).name).resolve()
    allowed = base.resolve() in target.parents or target == base.resolve() or DATA_ROOT.resolve() in target.parents
    if not allowed:
        raise web.HTTPForbidden()
    if not target.is_file():
        raise web.HTTPNotFound(text="找不到要保存的素材文件")
    return target


async def api_library_list(request):
    category = request.query.get("category", "all")
    query = request.query.get("q", "").strip().lower()
    items = load_library()
    if category in LIBRARY_CATEGORIES:
        items = [item for item in items if item.get("category") == category]
    if query:
        items = [item for item in items if query in (item.get("name", "") + " " + item.get("prompt", "") + " " + " ".join(item.get("tags", []))).lower()]
    items.sort(key=lambda item: item.get("created_at", 0), reverse=True)
    return web.json_response({"items": items, "count": len(items)})


async def api_library_update(request):
    asset_id = request.match_info["asset_id"]
    payload = await request.json()
    items = load_library()
    asset = next((item for item in items if item.get("id") == asset_id), None)
    if not asset:
        raise web.HTTPNotFound(text="找不到素材")
    if "name" in payload:
        clean_name = re.sub(r"[\\/:*?\"<>|]", "", str(payload["name"]).strip())
        if clean_name:
            asset["name"] = clean_name
    if "tags" in payload:
        asset["tags"] = [str(tag).strip() for tag in payload["tags"] if str(tag).strip()][:20]
    if "prompt" in payload:
        asset["prompt"] = str(payload["prompt"]).strip()
    if "favorite" in payload:
        asset["favorite"] = bool(payload["favorite"])
    write_library(items)
    return web.json_response(asset)


async def api_library_save(request):
    payload = await request.json()
    category = payload.get("category", "work")
    if category not in LIBRARY_CATEGORIES:
        raise web.HTTPBadRequest(text="未知素材分类")
    source = safe_source_path(payload.get("filename", ""), payload.get("subfolder", ""), payload.get("type", "output"))
    items = load_library()
    extension = source.suffix or ".png"
    name = smart_asset_name(category, str(payload.get("prompt", "")), extension, items)
    asset_id = str(uuid.uuid4())
    category_dir = LIBRARY_ROOT / LIBRARY_FOLDERS[category]
    category_dir.mkdir(parents=True, exist_ok=True)
    destination = category_dir / f"{asset_id[:8]}_{name}"
    shutil.copy2(source, destination)
    kind = "video" if extension.lower() in VIDEO_EXTENSIONS else "audio" if extension.lower() in AUDIO_EXTENSIONS else "image"
    asset = {
        "id": asset_id,
        "name": name,
        "category": category,
        "kind": kind,
        "prompt": str(payload.get("prompt", "")),
        "tags": [str(tag).strip() for tag in payload.get("tags", []) if str(tag).strip()][:20],
        "favorite": False,
        "created_at": time.time(),
        "relative_path": destination.relative_to(LIBRARY_ROOT).as_posix(),
        "url": f"/api/library/media/{asset_id}",
    }
    items.append(asset)
    write_library(items)
    return web.json_response(asset)


async def api_library_upload(request):
    reader = await request.multipart()
    fields = {}
    uploaded = None
    uploaded_name = ""
    uploaded_size = 0
    temporary = None
    try:
        while True:
            field = await reader.next()
            if field is None:
                break
            if field.name == "file":
                uploaded_name = Path(field.filename or "素材").name
                suffix = Path(uploaded_name).suffix.lower()
                allowed = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | AUDIO_EXTENSIONS
                if suffix not in allowed:
                    raise web.HTTPBadRequest(text="支持图片、视频以及 MP3/WAV/FLAC/M4A/AAC/OGG 音频")
                TEMP_ROOT.mkdir(parents=True, exist_ok=True)
                temporary = TEMP_ROOT / f"upload_{uuid.uuid4().hex}{suffix}"
                with temporary.open("wb") as output:
                    while True:
                        chunk = await field.read_chunk(1024 * 1024)
                        if not chunk:
                            break
                        uploaded_size += len(chunk)
                        if uploaded_size > 2048 * 1024 * 1024:
                            raise web.HTTPRequestEntityTooLarge(max_size=2048 * 1024 * 1024, actual_size=uploaded_size)
                        output.write(chunk)
                uploaded = temporary
            else:
                fields[field.name] = (await field.text()).strip()

        if not uploaded:
            raise web.HTTPBadRequest(text="请选择要上传的图片或视频")
        category = fields.get("category", "reference")
        if category not in LIBRARY_CATEGORIES:
            raise web.HTTPBadRequest(text="未知素材分类")
        items = load_library()
        extension = uploaded.suffix.lower()
        requested_name = re.sub(r"[\\/:*?\"<>|]", "", fields.get("name", "").strip())
        if requested_name:
            if not requested_name.lower().endswith(extension):
                requested_name += extension
            asset_name = requested_name
        else:
            hint = fields.get("description") or Path(uploaded_name).stem
            asset_name = smart_asset_name(category, hint, extension, items)
        asset_id = str(uuid.uuid4())
        category_dir = LIBRARY_ROOT / LIBRARY_FOLDERS[category]
        category_dir.mkdir(parents=True, exist_ok=True)
        destination = category_dir / f"{asset_id[:8]}_{asset_name}"
        shutil.move(str(uploaded), destination)
        uploaded = None
        kind = "video" if extension in VIDEO_EXTENSIONS else "audio" if extension in AUDIO_EXTENSIONS else "image"
        tags = [tag.strip() for tag in re.split(r"[,，]", fields.get("tags", "")) if tag.strip()][:20]
        asset = {
            "id": asset_id, "name": asset_name, "category": category, "kind": kind,
            "prompt": fields.get("description", ""), "tags": tags, "favorite": False,
            "created_at": time.time(), "source_name": uploaded_name, "size": uploaded_size,
            "relative_path": destination.relative_to(LIBRARY_ROOT).as_posix(),
            "url": f"/api/library/media/{asset_id}",
        }
        items.append(asset)
        write_library(items)
        return web.json_response(asset)
    finally:
        if temporary and temporary.exists():
            temporary.unlink(missing_ok=True)


async def api_library_delete(request):
    asset_id = request.match_info["asset_id"]
    items = load_library()
    asset = next((item for item in items if item.get("id") == asset_id), None)
    if not asset:
        raise web.HTTPNotFound(text="找不到素材")
    target = (LIBRARY_ROOT / asset["relative_path"]).resolve()
    if LIBRARY_ROOT.resolve() in target.parents and target.is_file():
        target.unlink()
    write_library([item for item in items if item.get("id") != asset_id])
    return web.json_response({"deleted": True})


async def api_library_media(request):
    asset_id = request.match_info["asset_id"]
    asset = next((item for item in load_library() if item.get("id") == asset_id), None)
    if not asset:
        raise web.HTTPNotFound()
    target = (LIBRARY_ROOT / asset["relative_path"]).resolve()
    if LIBRARY_ROOT.resolve() not in target.parents or not target.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(target, headers={"Content-Type": mimetypes.guess_type(target.name)[0] or "application/octet-stream"})


async def api_library_prepare(request):
    """Copy a selected library asset into ComfyUI input without duplicating its record."""
    asset_id = request.match_info["asset_id"]
    asset = next((item for item in load_library() if item.get("id") == asset_id), None)
    if not asset:
        raise web.HTTPNotFound(text="找不到素材")
    if asset.get("kind") not in {"image", "video", "audio"}:
        raise web.HTTPBadRequest(text="这个素材不能作为 H3 参考")
    source = (LIBRARY_ROOT / asset["relative_path"]).resolve()
    if LIBRARY_ROOT.resolve() not in source.parents or not source.is_file():
        raise web.HTTPNotFound(text="找不到素材文件")
    suffix = source.suffix.lower() if source.suffix else ".png"
    filename = f"library_asset_{asset_id[:8]}{suffix}"
    destination = COMFY_ROOT / "input" / filename
    if not destination.exists() or source.stat().st_mtime_ns != destination.stat().st_mtime_ns or source.stat().st_size != destination.stat().st_size:
        shutil.copy2(source, destination)
    return web.json_response({"filename": filename, "asset_id": asset_id, "size": source.stat().st_size, "type": asset.get("kind", "image")})


async def api_projects(request):
    projects = list_projects()
    summaries = [{**project, "shot_count": len(project.get("shots", []))} for project in projects]
    return web.json_response({"projects": summaries})


async def api_project_create(request):
    payload = await request.json()
    name = str(payload.get("name", "")).strip() or f"未命名项目_{time.strftime('%m%d_%H%M')}"
    brief = str(payload.get("brief", "")).strip()
    shot_count = max(1, min(12, int(payload.get("shot_count", 4))))
    total_duration = max(3, min(180, float(payload.get("duration", shot_count * 5))))
    shot_duration = min(15, max(3, round(total_duration / shot_count)))
    phases = ["建立人物、环境和空间关系", "动作开始并逐渐形成冲突", "冲突升级到关键转折", "完成动作并保留衔接状态"]
    shots = []
    for index in range(shot_count):
        phase = phases[min(len(phases) - 1, round(index * (len(phases) - 1) / max(1, shot_count - 1)))]
        shots.append({
            "id": str(uuid.uuid4()), "order": index, "title": f"镜头 {index + 1}",
            "prompt": f"{brief}。本镜头负责：{phase}。保持人物、服装、道具、背景、天气和光线与前后镜头一致。",
            "duration": shot_duration, "quality": payload.get("quality", "hd"), "status": "draft",
            "chain_previous": index > 0, "versions": [], "active_version": None,
        })
    now = time.time()
    project = {
        "id": str(uuid.uuid4()), "name": name, "brief": brief, "created_at": now, "updated_at": now,
        "shots": shots, "character_asset_ids": payload.get("character_asset_ids", []),
        "background_asset_ids": payload.get("background_asset_ids", []), "exports": [],
    }
    save_project(project)
    return web.json_response(project)


async def api_txt_project_create(request):
    reader = await request.multipart()
    raw = None
    filename = "TXT剧本"
    fields = {}
    while True:
        field = await reader.next()
        if field is None:
            break
        if field.name == "file":
            filename = Path(field.filename or "TXT剧本.txt").name
            if Path(filename).suffix.lower() != ".txt":
                raise web.HTTPBadRequest(text="请选择 TXT 文本文件")
            chunks, size = [], 0
            while True:
                chunk = await field.read_chunk(256 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > 5 * 1024 * 1024:
                    raise web.HTTPRequestEntityTooLarge(max_size=5 * 1024 * 1024, actual_size=size)
                chunks.append(chunk)
            raw = b"".join(chunks)
        else:
            fields[field.name] = (await field.text()).strip()
    if raw is None:
        raise web.HTTPBadRequest(text="请先选择一份 TXT 剧本")
    script = decode_txt_script(raw).strip()
    if len(script) < 10:
        raise web.HTTPBadRequest(text="TXT 内容太短，无法拆分剧情")
    name = fields.get("name") or Path(filename).stem or f"TXT项目_{time.strftime('%m%d_%H%M')}"
    try:
        project = build_txt_project(
            name=name,
            script=script,
            total_duration=float(fields.get("duration") or 60),
            shot_duration=float(fields.get("shot_duration") or 5),
            quality=fields.get("quality") if fields.get("quality") in RESOLUTIONS else "hd",
            style=fields.get("style") or "cinematic",
            pipeline=fields.get("pipeline") if fields.get("pipeline") in {"direct", "first_frame"} else "direct",
        )
    except ValueError as exc:
        raise web.HTTPBadRequest(text=str(exc))
    source_dir = PROJECTS_ROOT / project["id"]
    source_dir.mkdir(parents=True, exist_ok=True)
    source_path = source_dir / "原始剧本.txt"
    source_path.write_text(script, encoding="utf-8")
    project["source_path"] = source_path.relative_to(DATA_ROOT).as_posix()
    save_project(project)
    return web.json_response(project)


async def api_project_get(request):
    project = load_project(request.match_info["project_id"])
    if not project:
        raise web.HTTPNotFound(text="找不到项目")
    return web.json_response(project)


async def api_project_update(request):
    project = load_project(request.match_info["project_id"])
    if not project:
        raise web.HTTPNotFound(text="找不到项目")
    payload = await request.json()
    for field in ["name", "brief", "character_asset_ids", "background_asset_ids"]:
        if field in payload:
            project[field] = payload[field]
    save_project(project)
    return web.json_response(project)


async def api_project_delete(request):
    path = project_file(request.match_info["project_id"])
    if not path.is_file():
        raise web.HTTPNotFound(text="找不到项目")
    path.unlink()
    return web.json_response({"deleted": True})


async def api_project_add_shot(request):
    project = load_project(request.match_info["project_id"])
    if not project:
        raise web.HTTPNotFound(text="找不到项目")
    payload = await request.json()
    shot = {
        "id": str(uuid.uuid4()), "order": len(project.get("shots", [])),
        "title": str(payload.get("title", f"镜头 {len(project.get('shots', [])) + 1}")),
        "prompt": str(payload.get("prompt", project.get("brief", ""))), "duration": float(payload.get("duration", 5)),
        "quality": payload.get("quality", "hd"), "status": "draft", "chain_previous": bool(project.get("shots")),
        "versions": [], "active_version": None,
    }
    project.setdefault("shots", []).append(shot)
    save_project(project)
    return web.json_response(shot)


async def api_project_update_shot(request):
    project = load_project(request.match_info["project_id"])
    shot = find_shot(project, request.match_info["shot_id"]) if project else None
    if not shot:
        raise web.HTTPNotFound(text="找不到镜头")
    payload = await request.json()
    for field in ["title", "prompt", "duration", "quality", "chain_previous", "active_version"]:
        if field in payload:
            shot[field] = payload[field]
    save_project(project)
    return web.json_response(shot)


async def api_project_delete_shot(request):
    project = load_project(request.match_info["project_id"])
    if not project:
        raise web.HTTPNotFound(text="找不到项目")
    shot_id = request.match_info["shot_id"]
    project["shots"] = [shot for shot in project.get("shots", []) if shot.get("id") != shot_id]
    for index, shot in enumerate(project["shots"]):
        shot["order"] = index
    save_project(project)
    return web.json_response({"deleted": True})


async def run_txt_batch_job(app, batch_job, project_id, auto_merge=True):
    try:
        project = load_project(project_id)
        if not project:
            raise ValueError("找不到 TXT 项目")
        ordered = sorted(project.get("shots", []), key=lambda item: item.get("order", 0))
        pending = [shot for shot in ordered if not active_shot_outputs(shot)]
        if not pending:
            batch_job.update(progress=94, message="全部镜头已经生成，正在准备合成…")
        batch_job["batch"] = {"project_id": project_id, "total": len(ordered), "completed": len(ordered) - len(pending), "current": None}
        project["batch_status"] = "running"
        save_project(project)

        for shot in pending:
            project = load_project(project_id)
            ordered = sorted(project.get("shots", []), key=lambda item: item.get("order", 0))
            index = next(i for i, item in enumerate(ordered) if item["id"] == shot["id"])
            shot = ordered[index]
            duration = float(shot.get("duration", 5))
            quality = shot.get("quality", "hd")
            mode = shot.get("generation_mode", "text_video")
            payload = {
                "mode": mode, "quality": quality, "duration": duration,
                "prompt": shot["prompt"], "image_model": "realvis_xl", "prompt_mode": "director",
                "preserve_first_frame_state": True, "project_id": project_id, "shot_id": shot["id"],
            }
            if shot.get("chain_previous") and index > 0:
                previous_video = next((item for item in active_shot_outputs(ordered[index - 1]) if item.get("kind") == "video"), None)
                if not previous_video:
                    raise ValueError(f"{shot['title']} 无法承接：上一镜头尚未生成")
                payload["image"] = extract_last_frame(output_to_path(previous_video), f"txt_{project_id[:8]}_{index}")
                payload["mode"] = "image_video"
            payload["image_prompt"] = shot["prompt"]
            payload["video_prompt"] = shot["prompt"]
            child_id = str(uuid.uuid4())
            child = {
                "id": child_id, "status": "created", "progress": 0, "message": "正在准备镜头…",
                "mode": payload["mode"], "created_at": time.time(), "outputs": [], "error": None,
                "priority": "normal", "estimated_seconds": estimate_generation_seconds(payload["mode"], quality, duration),
                "settings": {"quality": quality, "duration": duration, "mode": payload["mode"], "image_model": "realvis_xl", "prompt_mode": "director", "preserve_first_frame_state": True},
                "source_prompt": shot["prompt"], "project_id": project_id, "shot_id": shot["id"], "payload": payload,
                "hidden": True,
            }
            child["graph"] = build_graph(child, payload)
            child["settings"]["seed"] = payload["seed"]
            JOBS[child_id] = child
            persist_job_history(child)
            child_task = asyncio.create_task(run_job(app, child, child["graph"]))
            JOB_TASKS[child_id] = child_task
            batch_job["active_child_id"] = child_id
            batch_job["batch"]["current"] = {"index": index + 1, "shot_id": shot["id"], "title": shot["title"]}
            while not child_task.done():
                completed = len([item for item in ordered[:index] if active_shot_outputs(item)])
                overall = 2 + round(((completed + child.get("progress", 0) / 100) / max(1, len(ordered))) * 90)
                batch_job.update(progress=min(92, overall), message=f"正在生成第 {index + 1}/{len(ordered)} 镜 · {shot['title']} · {child.get('progress', 0)}%")
                batch_job["batch"]["completed"] = completed
                await asyncio.sleep(1)
            await child_task
            if child.get("status") != "complete":
                raise RuntimeError(f"{shot['title']} 生成失败：{child.get('error') or child.get('message')}")
            batch_job["batch"]["completed"] = index + 1

        project = load_project(project_id)
        batch_job.pop("active_child_id", None)
        if auto_merge:
            batch_job.update(progress=95, message="全部镜头完成，正在自动合成成片…")
            safe_name = re.sub(r"[\\/:*?\"<>|]", "", project.get("name", "TXT项目"))[:30] or "TXT项目"
            destination = EXPORT_ROOT / f"{safe_name}_{time.strftime('%Y%m%d_%H%M%S')}.mp4"
            await asyncio.to_thread(merge_project_videos, project, destination)
            relative = destination.relative_to(DATA_ROOT).as_posix()
            output = {"filename": destination.name, "subfolder": "导出", "type": "data", "kind": "video", "relative_path": relative, "url": f"/api/data?{urlencode({'path': relative})}"}
            batch_job["outputs"] = [output]
            project.setdefault("exports", []).append({"created_at": time.time(), **output})
        project["batch_status"] = "complete"
        save_project(project)
        batch_job.update(status="complete", progress=100, message="TXT 剧本全部生成并合成完成")
    except asyncio.CancelledError:
        project = load_project(project_id)
        if project:
            project["batch_status"] = "paused"
            save_project(project)
        if batch_job.get("status") not in {"cancelled", "paused"}:
            batch_job.update(status="cancelled", message="TXT 批量任务已取消")
        raise
    except Exception as exc:
        project = load_project(project_id)
        if project:
            project["batch_status"] = "error"
            save_project(project)
        batch_job.update(status="error", message="TXT 批量生成中断，可修复后继续未完成镜头", error=str(exc))
    finally:
        batch_job.pop("active_child_id", None)
        persist_job_history(batch_job)
        current = asyncio.current_task()
        if JOB_TASKS.get(batch_job["id"]) is current:
            JOB_TASKS.pop(batch_job["id"], None)


async def api_txt_project_start(request):
    project = load_project(request.match_info["project_id"])
    if not project or project.get("source_type") != "txt":
        raise web.HTTPNotFound(text="找不到 TXT 项目")
    existing = next((job for job in JOBS.values() if job.get("project_id") == project["id"] and job.get("mode") == "txt_batch" and job.get("status") not in {"complete", "error", "cancelled"}), None)
    if existing:
        return web.json_response(public_job(existing))
    payload = await request.json() if request.can_read_body else {}
    total = len(project.get("shots", []))
    duration = sum(float(shot.get("duration", 5)) for shot in project.get("shots", []))
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id, "status": "created", "progress": 0, "message": "正在准备 TXT 分批生成…",
        "mode": "txt_batch", "created_at": time.time(), "outputs": [], "error": None, "priority": "normal",
        "estimated_seconds": max(120, round(duration / 5 * 240)),
        "settings": {"project": project["name"], "shot_count": total, "auto_merge": bool(payload.get("auto_merge", True))},
        "source_prompt": project.get("brief", ""), "project_id": project["id"], "shot_id": None,
        "batch": {"project_id": project["id"], "total": total, "completed": 0, "current": None},
    }
    JOBS[job_id] = job
    persist_job_history(job)
    task = asyncio.create_task(run_txt_batch_job(request.app, job, project["id"], bool(payload.get("auto_merge", True))))
    JOB_TASKS[job_id] = task
    return web.json_response(public_job(job))


async def run_export_job(job, project):
    try:
        job.update(status="running", progress=10, message="正在合并项目镜头…")
        safe_name = re.sub(r"[\\/:*?\"<>|]", "", project.get("name", "项目"))[:30] or "项目"
        destination = EXPORT_ROOT / f"{safe_name}_{time.strftime('%Y%m%d_%H%M%S')}.mp4"
        await asyncio.to_thread(merge_project_videos, project, destination)
        relative = destination.relative_to(DATA_ROOT).as_posix()
        output = {"filename": destination.name, "subfolder": "导出", "type": "data", "kind": "video", "relative_path": relative, "url": f"/api/data?{urlencode({'path': relative})}"}
        job["outputs"] = [output]
        job.update(status="complete", progress=100, message="项目合并完成")
        fresh = load_project(project["id"])
        if fresh:
            fresh.setdefault("exports", []).append({"created_at": time.time(), **output})
            save_project(fresh)
    except Exception as exc:
        job.update(status="error", message="项目合并失败", error=str(exc))


async def api_project_export(request):
    project = load_project(request.match_info["project_id"])
    if not project:
        raise web.HTTPNotFound(text="找不到项目")
    job_id = str(uuid.uuid4())
    job = {"id": job_id, "status": "created", "progress": 0, "message": "正在准备合并…", "mode": "merge", "created_at": time.time(), "outputs": [], "error": None, "estimated_seconds": 120, "settings": {"project": project["name"]}, "source_prompt": project.get("brief", "")}
    JOBS[job_id] = job
    task = asyncio.create_task(run_export_job(job, project))
    JOB_TASKS[job_id] = task
    return web.json_response(public_job(job))


async def run_postprocess_job(job, source, operation):
    try:
        labels = {"upscale2x": "2倍清晰化", "interpolate2x": "2倍补帧", "deflicker": "轻度去闪烁", "vertical": "竖屏9比16", "square": "方形1比1"}
        job.update(status="running", progress=8, message=f"正在进行{labels[operation]}…")
        destination = EXPORT_ROOT / f"{labels[operation]}_{time.strftime('%Y%m%d_%H%M%S')}_{source.stem}.mp4"
        await asyncio.to_thread(transcode_video, source, destination, operation)
        relative = destination.relative_to(DATA_ROOT).as_posix()
        output = {"filename": destination.name, "subfolder": "导出", "type": "data", "kind": "video", "relative_path": relative, "url": f"/api/data?{urlencode({'path': relative})}"}
        job["outputs"] = [output]
        job.update(status="complete", progress=100, message=f"{labels[operation]}完成")
    except Exception as exc:
        job.update(status="error", message="后期处理失败", error=str(exc))


async def api_postprocess(request):
    payload = await request.json()
    operation = payload.get("operation")
    if operation not in {"upscale2x", "interpolate2x", "deflicker", "vertical", "square"}:
        raise web.HTTPBadRequest(text="不支持的后期处理方式")
    if payload.get("relative_path"):
        source = (DATA_ROOT / payload["relative_path"]).resolve()
        if DATA_ROOT.resolve() not in source.parents or not source.is_file():
            raise web.HTTPBadRequest(text="找不到视频文件")
    else:
        source = safe_source_path(payload.get("filename", ""), payload.get("subfolder", ""), payload.get("type", "output"))
    job_id = str(uuid.uuid4())
    job = {"id": job_id, "status": "created", "progress": 0, "message": "正在准备后期处理…", "mode": "postprocess", "created_at": time.time(), "outputs": [], "error": None, "estimated_seconds": 180, "settings": {"operation": operation}, "source_prompt": source.name}
    JOBS[job_id] = job
    task = asyncio.create_task(run_postprocess_job(job, source, operation))
    JOB_TASKS[job_id] = task
    return web.json_response(public_job(job))


async def api_data_file(request):
    relative = request.query.get("path", "")
    target = (DATA_ROOT / relative).resolve()
    if DATA_ROOT.resolve() not in target.parents or not target.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(target, headers={"Content-Type": mimetypes.guess_type(target.name)[0] or "application/octet-stream"})


async def api_open_folder(request):
    payload = await request.json()
    target = DATA_ROOT
    if payload.get("asset_id"):
        asset = next((item for item in load_library() if item.get("id") == payload["asset_id"]), None)
        if asset:
            target = (LIBRARY_ROOT / asset["relative_path"]).resolve()
    elif payload.get("relative_path"):
        candidate = (DATA_ROOT / payload["relative_path"]).resolve()
        if candidate == DATA_ROOT.resolve() or DATA_ROOT.resolve() in candidate.parents:
            target = candidate
    elif payload.get("filename"):
        target = safe_source_path(payload["filename"], payload.get("subfolder", ""), payload.get("type", "output"))
    if target.is_file():
        subprocess.Popen(["explorer.exe", f"/select,{target}"], creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    else:
        subprocess.Popen(["explorer.exe", str(target)], creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return web.json_response({"opened": True, "path": str(target)})


async def api_generate(request):
    payload = dict(await request.json())
    project_id = payload.get("project_id")
    shot_id = payload.get("shot_id")
    if project_id and shot_id:
        project = load_project(project_id)
        shot = find_shot(project, shot_id) if project else None
        if not shot:
            raise web.HTTPBadRequest(text="找不到项目镜头")
        if payload.get("chain_previous"):
            ordered = sorted(project.get("shots", []), key=lambda item: item.get("order", 0))
            shot_index = next((index for index, item in enumerate(ordered) if item.get("id") == shot_id), -1)
            if shot_index > 0:
                previous_video = next((item for item in active_shot_outputs(ordered[shot_index - 1]) if item.get("kind") == "video"), None)
                if previous_video:
                    payload["image"] = extract_last_frame(output_to_path(previous_video), f"project_{project_id[:8]}_{shot_index}")
                    payload["mode"] = "image_video"
                else:
                    raise web.HTTPBadRequest(text="请先生成上一镜头，才能自动承接它的尾帧")
        shot["status"] = "queued"
        save_project(project)
    mode = payload.get("mode", "flux_video")
    quality = payload.get("quality", "hd")
    prompt = str(payload.get("prompt", "")).strip()
    if mode not in MODES:
        raise web.HTTPBadRequest(text="未知生成模式")
    turnaround_sheet = mode == "text_image" and bool(payload.get("turnaround_sheet"))
    if turnaround_sheet:
        quality = "ultra"
        payload["quality"] = quality
        payload["image_model"] = "realvis_xl"
    valid_qualities = IMAGE_RESOLUTIONS if mode == "text_image" else RESOLUTIONS
    if quality not in valid_qualities:
        raise web.HTTPBadRequest(text="未知清晰度")
    image_model = payload.get("image_model", "realvis_xl")
    if image_model == "juggernaut_xl":
        image_model = "realvis_xl"
    if image_model not in IMAGE_MODELS:
        raise web.HTTPBadRequest(text="未知图片模型")
    if mode in {"text_image", "flux_video"} and image_model == "realvis_xl" and not (COMFY_ROOT / "models" / "checkpoints" / REALVIS_CHECKPOINT).is_file():
        raise web.HTTPServiceUnavailable(text="RealVisXL V5.0 模型还没有下载完成，请稍后再试或暂时切换到 FLUX。")
    if mode in {"text_image", "flux_video"} and image_model == "sdxl_local":
        try:
            payload["checkpoint_name"] = checked_model_name("checkpoints", payload.get("checkpoint_name"), required=True)
            payload["inpaint_checkpoint"] = checked_model_name("checkpoints", payload.get("inpaint_checkpoint"))
            payload["controlnet_name"] = checked_model_name("controlnet", payload.get("controlnet_name"))
            payload["ipadapter_name"] = checked_model_name("ipadapter", payload.get("ipadapter_name"))
        except ValueError as exc:
            raise web.HTTPBadRequest(text=str(exc))
    if not prompt:
        raise web.HTTPBadRequest(text="请输入画面或动作描述")
    duration = float(payload.get("duration", 5))
    if duration not in {3, 5, 8, 10, 15}:
        raise web.HTTPBadRequest(text="不支持的时长")
    raw_seed = payload.get("seed")
    if raw_seed in {None, "", "null"}:
        seed = secrets.randbelow(9_007_199_254_740_990) + 1
    else:
        try:
            seed = int(raw_seed)
        except (TypeError, ValueError):
            raise web.HTTPBadRequest(text="种子必须是整数")
        if seed < 1 or seed > 9_007_199_254_740_991:
            raise web.HTTPBadRequest(text="种子需要在 1 到 9007199254740991 之间")
    payload["seed"] = seed

    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "status": "created",
        "progress": 0,
        "message": "正在准备任务…",
        "mode": mode,
        "created_at": time.time(),
        "outputs": [],
        "error": None,
        "priority": payload.get("priority", "normal"),
        "estimated_seconds": estimate_generation_seconds(mode, quality, duration) * (4 if turnaround_sheet else 1),
        "settings": {"quality": quality, "duration": duration, "seed": seed, "mode": mode, "image_model": image_model, "checkpoint_name": payload.get("checkpoint_name"), "inpaint_checkpoint": payload.get("inpaint_checkpoint"), "controlnet_name": payload.get("controlnet_name"), "ipadapter_name": payload.get("ipadapter_name"), "prompt_mode": payload.get("prompt_mode", "director"), "turnaround_sheet": turnaround_sheet, "preserve_first_frame_state": bool(payload.get("preserve_first_frame_state", True)), "reference_image": (Path(str(payload.get("reference_image"))).name if payload.get("reference_image") not in {None, "", "None", "null"} else None), "reference_strength": float(payload.get("reference_strength") or 0.72), "h3_reference_options": payload.get("h3_reference_options") or {}, "h3_reference_count": len(payload.get("h3_references") or [])},
        "source_prompt": prompt,
        "project_id": project_id,
        "shot_id": shot_id,
        "payload": payload,
    }
    JOBS[job_id] = job
    try:
        graph = build_graph(job, payload)
        job["graph"] = graph
    except ValueError as exc:
        JOBS.pop(job_id, None)
        raise web.HTTPBadRequest(text=str(exc))
    except Exception:
        JOBS.pop(job_id, None)
        raise
    persist_job_history(job)
    task = asyncio.create_task(run_job(request.app, job, graph, front=job["priority"] == "high"))
    JOB_TASKS[job_id] = task
    return web.json_response(public_job(job))


async def api_job(request):
    job = JOBS.get(request.match_info["job_id"])
    if not job:
        raise web.HTTPNotFound(text="找不到这个任务")
    return web.json_response(public_job(job))


async def api_jobs(request):
    jobs = sorted((job for job in JOBS.values() if not job.get("hidden")), key=lambda item: item["created_at"], reverse=True)
    return web.json_response({"jobs": [public_job(job) for job in jobs]})


async def api_history_list(request):
    query = request.query.get("q", "").strip().lower()
    mode = request.query.get("mode", "all")
    items = load_history()
    if mode != "all":
        items = [item for item in items if item.get("mode") == mode]
    if query:
        items = [item for item in items if query in " ".join(str(item.get(key, "")) for key in ("title", "prompt", "image_prompt", "video_prompt")).lower()]
    items.sort(key=lambda item: item.get("created_at", 0), reverse=True)
    return web.json_response({"items": items, "count": len(items)})


async def api_history_recover(request):
    count = await recover_history_from_comfy(request.app)
    return web.json_response({"recovered": count, "count": len(load_history())})


async def api_history_delete(request):
    history_id = request.match_info["history_id"]
    items = load_history()
    kept = [item for item in items if item.get("id") != history_id]
    if len(kept) == len(items):
        raise web.HTTPNotFound(text="找不到这条创作记录")
    write_history(kept)
    return web.json_response({"deleted": True, "id": history_id})


async def stop_comfy_job(app, job):
    # Avoid orphaning a request accepted by the engine but not yet assigned locally.
    if job.get("submission_pending") and not job.get("prompt_id"):
        raise web.HTTPConflict(text="任务正在提交，请稍后重试停止操作")
    active_child_id = job.get("active_child_id")
    if active_child_id and active_child_id in JOBS:
        child = JOBS[active_child_id]
        if child.get("status") not in {"complete", "error", "cancelled"}:
            await stop_comfy_job(app, child)
            if child.get("status") != "complete":
                child.update(status="cancelled", message="随批量任务一起停止", error=None)
            persist_job_history(child)
    prompt_id = job.get("prompt_id")
    if prompt_id:
        try:
            async with app["http"].post(f"{COMFY_HTTP}/api/jobs/{prompt_id}/cancel", timeout=ClientTimeout(total=10)) as response:
                response.raise_for_status()
            await confirm_engine_stopped(app["http"], prompt_id)
        except Exception as exc:
            job.update(message="引擎尚未确认停止，请重试", error=str(exc))
            persist_job_history(job)
            raise web.HTTPBadGateway(text="引擎尚未确认停止；已保留任务监控") from exc
    worker = JOB_TASKS.get(job["id"])
    if worker and not worker.done():
        worker.cancel()
        try:
            await worker
        except asyncio.CancelledError:
            pass


async def api_job_cancel(request):
    job = JOBS.get(request.match_info["job_id"])
    if not job:
        raise web.HTTPNotFound(text="找不到任务")
    if job["status"] in {"complete", "error", "cancelled"}:
        return web.json_response(public_job(job))
    await stop_comfy_job(request.app, job)
    if job.get("status") != "complete":
        job.update(status="cancelled", message="任务已取消", error=None)
    persist_job_history(job)
    return web.json_response(public_job(job))


async def api_job_pause(request):
    job = JOBS.get(request.match_info["job_id"])
    if not job:
        raise web.HTTPNotFound(text="找不到任务")
    if job["status"] in {"complete", "error", "cancelled", "paused"}:
        return web.json_response(public_job(job))
    await stop_comfy_job(request.app, job)
    if job.get("status") != "complete":
        job.update(status="paused", message="已暂停；继续时会从头重新生成", error=None)
    persist_job_history(job)
    return web.json_response(public_job(job))


async def api_job_resume(request):
    job = JOBS.get(request.match_info["job_id"])
    if not job:
        raise web.HTTPNotFound(text="找不到任务")
    if job["status"] != "paused":
        raise web.HTTPBadRequest(text="只有暂停的任务可以继续")
    job.update(status="created", progress=0, message="正在重新进入队列…", prompt_id=None, error=None)
    if job.get("mode") == "txt_batch":
        task = asyncio.create_task(run_txt_batch_job(request.app, job, job["project_id"], bool(job.get("settings", {}).get("auto_merge", True))))
    else:
        task = asyncio.create_task(run_job(request.app, job, job["graph"], front=job.get("priority") == "high"))
    JOB_TASKS[job["id"]] = task
    persist_job_history(job)
    return web.json_response(public_job(job))


async def api_job_priority(request):
    job = JOBS.get(request.match_info["job_id"])
    if not job:
        raise web.HTTPNotFound(text="找不到任务")
    if job["status"] in {"complete", "error", "cancelled"}:
        raise web.HTTPBadRequest(text="已结束的任务不能调整优先级")
    job["priority"] = "high"
    if job.get("mode") == "txt_batch":
        job["message"] = "TXT 批量任务已设为优先；当前镜头完成后继续按顺序生成"
        return web.json_response(public_job(job))
    if job["status"] != "paused":
        await stop_comfy_job(request.app, job)
        job.update(status="created", progress=0, message="已移到队列最前方", prompt_id=None, error=None)
        task = asyncio.create_task(run_job(request.app, job, job["graph"], front=True))
        JOB_TASKS[job["id"]] = task
    return web.json_response(public_job(job))


async def api_job_retry(request):
    original = JOBS.get(request.match_info["job_id"])
    if not original:
        raise web.HTTPNotFound(text="找不到任务")
    payload = dict(original.get("payload") or {})
    if original.get("mode") == "txt_batch":
        project = load_project(original.get("project_id"))
        if not project:
            raise web.HTTPNotFound(text="找不到原 TXT 项目")
        job_id = str(uuid.uuid4())
        total = len(project.get("shots", []))
        job = {
            "id": job_id, "status": "created", "progress": 0, "message": "正在继续未完成的 TXT 镜头…",
            "mode": "txt_batch", "created_at": time.time(), "outputs": [], "error": None, "priority": "normal",
            "estimated_seconds": original.get("estimated_seconds", 120), "settings": dict(original.get("settings", {})),
            "source_prompt": project.get("brief", ""), "project_id": project["id"], "shot_id": None,
            "batch": {"project_id": project["id"], "total": total, "completed": sum(1 for shot in project.get("shots", []) if active_shot_outputs(shot)), "current": None},
        }
        JOBS[job_id] = job
        persist_job_history(job)
        task = asyncio.create_task(run_txt_batch_job(request.app, job, project["id"], bool(job["settings"].get("auto_merge", True))))
        JOB_TASKS[job_id] = task
        return web.json_response(public_job(job))
    job_id = str(uuid.uuid4())
    mode = payload.get("mode", original.get("mode", "flux_video"))
    quality = payload.get("quality", "hd")
    duration = float(payload.get("duration", 5))
    turnaround_sheet = mode == "text_image" and bool(payload.get("turnaround_sheet"))
    job = {
        "id": job_id, "status": "created", "progress": 0, "message": "正在重试任务…",
        "mode": mode, "created_at": time.time(), "outputs": [], "error": None,
        "priority": payload.get("priority", "normal"),
        "estimated_seconds": estimate_generation_seconds(mode, quality, duration) * (4 if turnaround_sheet else 1),
        "settings": {"quality": quality, "duration": duration, "seed": payload.get("seed"), "mode": mode, "image_model": payload.get("image_model", "realvis_xl"), "prompt_mode": payload.get("prompt_mode", "director"), "turnaround_sheet": turnaround_sheet, "preserve_first_frame_state": bool(payload.get("preserve_first_frame_state", True))},
        "source_prompt": str(payload.get("prompt", "")), "project_id": payload.get("project_id"), "shot_id": payload.get("shot_id"),
        "payload": payload,
    }
    graph = build_graph(job, payload)
    job["graph"] = graph
    job["settings"]["seed"] = payload["seed"]
    JOBS[job_id] = job
    persist_job_history(job)
    task = asyncio.create_task(run_job(request.app, job, graph, front=job["priority"] == "high"))
    JOB_TASKS[job_id] = task
    return web.json_response(public_job(job))


async def api_job_delete(request):
    job_id = request.match_info["job_id"]
    job = JOBS.get(job_id)
    if not job:
        raise web.HTTPNotFound(text="找不到任务")
    if job["status"] not in {"complete", "error", "cancelled", "paused"}:
        raise web.HTTPConflict(text="进行中的任务请先取消，再从列表删除")
    worker = JOB_TASKS.pop(job_id, None)
    if worker and not worker.done():
        worker.cancel()
    JOBS.pop(job_id, None)
    return web.json_response({"deleted": True, "job_id": job_id})


async def api_jobs_clear(request):
    removed = []
    for job_id, job in list(JOBS.items()):
        if job["status"] in {"complete", "error", "cancelled"}:
            JOBS.pop(job_id, None)
            JOB_TASKS.pop(job_id, None)
            removed.append(job_id)
    return web.json_response({"deleted": len(removed), "job_ids": removed})


async def api_media(request):
    params = request.query
    filename = Path(params.get("filename", "")).name
    subfolder = Path(params.get("subfolder", ""))
    output_type = params.get("type", "output")
    base = COMFY_ROOT / ("input" if output_type == "input" else "output")
    target = (base / subfolder / filename).resolve()
    allowed = base.resolve() in target.parents or target == base.resolve() or DATA_ROOT.resolve() in target.parents
    if not allowed:
        raise web.HTTPForbidden()
    if not target.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(target, headers={"Content-Type": mimetypes.guess_type(target.name)[0] or "application/octet-stream"})


async def index(request):
    return web.FileResponse(STATIC_ROOT / "index.html")


async def on_startup(app):
    ensure_data_directories()
    app["http"] = ClientSession(timeout=ClientTimeout(total=None))
    app["comfy_task"] = asyncio.create_task(ensure_comfy(app))
    app["history_recovery_task"] = asyncio.create_task(recover_history_from_comfy(app))


async def on_cleanup(app):
    task = app.get("comfy_task")
    if task and not task.done():
        task.cancel()
    recovery_task = app.get("history_recovery_task")
    if recovery_task and not recovery_task.done():
        recovery_task.cancel()
    await app["http"].close()


def make_app():
    app = web.Application(client_max_size=2050 * 1024 * 1024)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    from scene_cutout import register as register_scene_cutout
    register_scene_cutout(app, load_library, LIBRARY_ROOT, APP_ROOT / "models" / "u2netp.onnx", TEMP_ROOT / "scene-cutouts")
    app.router.add_get("/", index)
    app.router.add_get("/api/health", api_health)
    app.router.add_get("/api/models", api_models)
    app.router.add_get("/api/canvases", api_canvases)
    app.router.add_post("/api/canvases", api_canvas_create)
    app.router.add_get("/api/canvases/{canvas_id}", api_canvas_get)
    app.router.add_patch("/api/canvases/{canvas_id}", api_canvas_update)
    app.router.add_delete("/api/canvases/{canvas_id}", api_canvas_delete)
    app.router.add_post("/api/upload", api_upload)
    app.router.add_post("/api/h3-reference/upload", api_h3_reference_upload)
    app.router.add_post("/api/reference/upload", api_reference_upload)
    app.router.add_post("/api/prompt/expand", api_expand_prompt)
    app.router.add_post("/api/generate", api_generate)
    app.router.add_get("/api/jobs", api_jobs)
    app.router.add_get("/api/history", api_history_list)
    app.router.add_post("/api/history/recover", api_history_recover)
    app.router.add_delete("/api/history/{history_id}", api_history_delete)
    app.router.add_get("/api/jobs/{job_id}", api_job)
    app.router.add_post("/api/jobs/{job_id}/cancel", api_job_cancel)
    app.router.add_post("/api/jobs/{job_id}/pause", api_job_pause)
    app.router.add_post("/api/jobs/{job_id}/resume", api_job_resume)
    app.router.add_post("/api/jobs/{job_id}/priority", api_job_priority)
    app.router.add_post("/api/jobs/{job_id}/retry", api_job_retry)
    app.router.add_delete("/api/jobs/{job_id}", api_job_delete)
    app.router.add_post("/api/jobs/clear-finished", api_jobs_clear)
    app.router.add_get("/api/library", api_library_list)
    app.router.add_post("/api/library/save", api_library_save)
    app.router.add_post("/api/library/upload", api_library_upload)
    app.router.add_post("/api/library/{asset_id}/prepare", api_library_prepare)
    app.router.add_patch("/api/library/{asset_id}", api_library_update)
    app.router.add_delete("/api/library/{asset_id}", api_library_delete)
    app.router.add_get("/api/library/media/{asset_id}", api_library_media)
    app.router.add_get("/api/projects", api_projects)
    app.router.add_post("/api/projects", api_project_create)
    app.router.add_post("/api/txt-projects", api_txt_project_create)
    app.router.add_get("/api/projects/{project_id}", api_project_get)
    app.router.add_patch("/api/projects/{project_id}", api_project_update)
    app.router.add_delete("/api/projects/{project_id}", api_project_delete)
    app.router.add_post("/api/projects/{project_id}/shots", api_project_add_shot)
    app.router.add_patch("/api/projects/{project_id}/shots/{shot_id}", api_project_update_shot)
    app.router.add_delete("/api/projects/{project_id}/shots/{shot_id}", api_project_delete_shot)
    app.router.add_post("/api/projects/{project_id}/txt-start", api_txt_project_start)
    app.router.add_post("/api/projects/{project_id}/export", api_project_export)
    app.router.add_post("/api/postprocess", api_postprocess)
    app.router.add_get("/api/data", api_data_file)
    app.router.add_post("/api/open-folder", api_open_folder)
    app.router.add_get("/api/media", api_media)
    app.router.add_static("/static", STATIC_ROOT)
    return app


if __name__ == "__main__":
    web.run_app(make_app(), host=STUDIO_HOST, port=STUDIO_PORT, print=None)
