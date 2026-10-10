"""Offline smoke tests with isolated temporary data and disabled startup hooks."""
import asyncio
import ast
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
for path in ROOT.rglob('*.py'):
    ast.parse(path.read_text(encoding='utf-8'), filename=str(path))

async def check():
    from aiohttp.test_utils import TestClient, TestServer
    import server
    with tempfile.TemporaryDirectory() as temp:
        data = Path(temp)
        server.LIBRARY_ROOT = data / 'library'
        server.LIBRARY_INDEX = server.LIBRARY_ROOT / 'library.json'
        server.TEMP_ROOT = data / 'temp'
        assert server.load_library() == []
        app = server.make_app()
        app.on_startup.clear()
        app.on_cleanup.clear()
        async with TestClient(TestServer(app)) as client:
            for route in ['/', '/static/app.js', '/static/scene-model.js', '/api/jobs', '/api/library']:
                response = await client.get(route)
                assert response.status == 200, (route, response.status)
                await response.read()
        if hasattr(server, 'AUTO_START_COMFY'):
            assert server.AUTO_START_COMFY is False
            async def offline(_): return False
            server.is_comfy_ready = offline
            assert await server.ensure_comfy({'http': None}) is False
            assert server.COMFY_PROCESS is None
    print('PASS: Python syntax; 5 HTTP routes; empty isolated library; no engine launched')

asyncio.run(check())
