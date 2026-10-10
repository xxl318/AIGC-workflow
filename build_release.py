"""Package ONLY the audited publication manifest; never collect runtime data."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent
files = json.loads((ROOT / 'release-files.json').read_text(encoding='utf-8'))
output = ROOT / 'dist' / 'liuguang-agent-studio.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(files):
        path = (ROOT / name).resolve()
        if ROOT not in path.parents or not path.is_file() or (ROOT/name).is_symlink():
            raise ValueError('Invalid release entry: ' + name)
        archive.write(path, name)
print(f'PASS: {len(files)} allowlisted files; SHA256={hashlib.sha256(output.read_bytes()).hexdigest()}')
