"""Build a public update from src/ only. Does not publish or read phone settings."""
import hashlib
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
DIST = ROOT / 'dist'
FILES = ['app.js', 'CompanionCore.js', 'Assets/blue-fox/atlas.png']
config = json.loads((ROOT / 'version.json').read_text(encoding='utf-8'))
version = config['version']
if not re.fullmatch(r'4\.\d+\.\d+(?:-[a-z]+\d*)?', version):
    raise SystemExit('Invalid version')
DIST.mkdir(exist_ok=True)
manifest = {'project': 'Jarvis-Core', 'schema': 1, 'version': version, 'entry': 'app.js', 'files': {}}
payloads = {}
for name in FILES:
    data = (SOURCE / name).read_bytes()
    if name.endswith('.js') and re.search(rb'sk-[A-Za-z0-9_-]{12,}', data):
        raise SystemExit('Possible embedded secret in ' + name)
    if not data or len(data) > 20 * 1024 * 1024:
        raise SystemExit('Invalid size: ' + name)
    payloads[name] = data
    manifest['files'][name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
payloads['manifest.json'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode('utf-8')
archive = DIST / f'Jarvis-Core-v{version}.zip'
with zipfile.ZipFile(archive, 'w') as z:
    for name, data in payloads.items():
        entry = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        z.writestr(entry, data)
with zipfile.ZipFile(archive) as z:
    assert sorted(z.namelist()) == sorted(payloads)
    assert z.testzip() is None
    for name in FILES:
        assert hashlib.sha256(z.read(name)).hexdigest() == manifest['files'][name]['sha256']
binary = archive.read_bytes()
update = {'project': 'Jarvis-Core', 'schema': 1, 'channel': 'preview', 'version': version,
          'minLauncher': config.get('minLauncher', 2),
          'url': f'https://github.com/lijun117992/jarvis-core-updates/releases/download/v{version}/{archive.name}',
          'bytes': len(binary), 'sha256': hashlib.sha256(binary).hexdigest(),
          'notes': config.get('notes', '预览版更新，详见 Release 说明。')}
(DIST / 'manifest.json').write_bytes(payloads['manifest.json'])
(DIST / 'update.json').write_text(json.dumps(update, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'archive': str(archive), 'bytes': len(binary), 'sha256': update['sha256'], 'published': False}, ensure_ascii=False))
