"""Portable configuration. Keep config.local.json out of version control."""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

APP_ROOT = Path(__file__).resolve().parent
config_path = Path(os.environ.get('AGENT_STUDIO_CONFIG', APP_ROOT / 'config.local.json'))
config = json.loads(config_path.read_text(encoding='utf-8')) if config_path.is_file() else {}

def local_path(key, default):
    value = Path(config.get(key) or default).expanduser()
    return (APP_ROOT / value).resolve() if not value.is_absolute() else value.resolve()

DATA_ROOT = local_path('data_root', Path.home() / 'LiuguangStudioData')
COMFY_ROOT = local_path('comfy_root', APP_ROOT.parent / 'ComfyUI')
EXTRA_COMFY_ROOT = local_path('extra_comfy_root', '') if config.get('extra_comfy_root') else None
COMFY_PYTHON = local_path('comfy_python', sys.executable)
COMFY_HTTP = str(config.get('comfy_http', 'http://127.0.0.1:8188')).rstrip('/')
parts = urlsplit(COMFY_HTTP)
if parts.scheme not in ('http', 'https') or not parts.hostname:
    raise ValueError('comfy_http must be an HTTP(S) URL')
COMFY_WS = urlunsplit(('wss' if parts.scheme == 'https' else 'ws', parts.netloc, parts.path + '/ws', '', ''))
AUTO_START_COMFY = config.get('auto_start_comfy', False) is True
COMFY_ARGS = config.get('comfy_args', [])
if not isinstance(COMFY_ARGS, list) or not all(isinstance(x, str) for x in COMFY_ARGS):
    raise ValueError('comfy_args must be an array of strings')
