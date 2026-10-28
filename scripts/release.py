"""Default is a read-only publication plan. --publish --confirm-public requires explicit authorization."""
import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'lijun117992/jarvis-core-updates'

def run(*args, payload=None, allow_404=False):
    p = subprocess.run(args, cwd=ROOT, input=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
                       capture_output=True, encoding='utf-8')
    if p.returncode:
        if allow_404 and '404' in p.stderr:
            return None
        raise SystemExit(p.stderr.strip() or 'Command failed: ' + args[0])
    return p.stdout.strip()

def version_key(value):
    m = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)(\d*))?', value)
    if not m:
        raise SystemExit('Invalid version: ' + value)
    return tuple(map(int, m.group(1, 2, 3))) + (not bool(m[4]), m[4] or '', int(m[5] or 0))

def verify_public(url, expected_size, expected_hash):
    digest, size = hashlib.sha256(), 0
    request = urllib.request.Request(url, headers={'User-Agent': 'Jarvis-Release-Verification'})
    with urllib.request.urlopen(request, timeout=60) as response:
        while True:
            block = response.read(65536)
            if not block:
                break
            size += len(block)
            if size > expected_size:
                raise SystemExit('Anonymous download exceeds expected size')
            digest.update(block)
    if size != expected_size or digest.hexdigest() != expected_hash:
        raise SystemExit('Anonymous download hash/size differs. Inspect remote release/pointer state; do not overwrite assets.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--confirm-public', action='store_true')
    parser.add_argument('--offline-adapter', type=Path, help='Optional separately built offline dictation APK; verified before updating the phone pointer')
    args = parser.parse_args()
    if args.publish and not args.confirm_public:
        raise SystemExit('Explicit approval required: --publish --confirm-public')
    config = json.loads((ROOT / 'version.json').read_text(encoding='utf-8'))
    version = config['version']
    resource = json.loads(run('gh', 'api', f'repos/{REPO}/contents/update.json?ref=main'))
    online = json.loads(base64.b64decode(resource['content']))
    head = run('git', 'rev-parse', 'HEAD')
    remote = run('gh', 'api', f'repos/{REPO}/commits/main', '--jq', '.sha')
    existing = run('gh', 'api', f'repos/{REPO}/releases/tags/v{version}', allow_404=True)
    blockers = []
    if run('git', 'status', '--porcelain'):
        blockers.append('Working tree is not clean; commit/push intended changes first')
    if remote != head:
        blockers.append('Source HEAD does not equal GitHub main; reconcile/push first')
    if version_key(version) <= version_key(online['version']):
        blockers.append('Bump to a version newer than the phone update channel')
    if existing is not None:
        blockers.append('Release/tag already exists; never overwrite it')
    extra_assets = []
    if args.offline_adapter:
        if not args.offline_adapter.is_file() or args.offline_adapter.name != 'Jarvis-Offline-Input-v0.2-preview.apk':
            blockers.append('Expected the separately verified offline adapter APK')
        else:
            extra_assets = [args.offline_adapter.resolve(), ROOT / 'docs/OFFLINE_INPUT_LICENSE.txt', ROOT / 'docs/OFFLINE_INPUT_NOTICES.md']
    plan = {'repository': REPO, 'version': version, 'current_phone_version': online['version'],
            'source_commit': head, 'assets': [f'Jarvis-Core-v{version}.zip', 'Jarvis_Launcher-v2.js'] + [p.name for p in extra_assets],
            'update_pointer_last': True, 'blockers': blockers, 'publishing': args.publish}
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    if not args.publish:
        return
    if blockers:
        raise SystemExit('Publication blocked; no remote write performed')
    run(shutil.which('node') or 'node', 'scripts/test.cjs')
    run(sys.executable, 'scripts/package.py')
    info = json.loads((ROOT / 'dist/update.json').read_text(encoding='utf-8'))
    assert info['version'] == version
    archive = ROOT / 'dist' / f'Jarvis-Core-v{version}.zip'
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == info['sha256']
    launcher = ROOT / 'launcher/Jarvis_Launcher-v2.js'
    launcher_hash = hashlib.sha256(launcher.read_bytes()).hexdigest()
    (ROOT / '.work').mkdir(exist_ok=True)
    notes = ROOT / '.work/release-notes.md'
    notes.write_text(config.get('notes', 'Preview update; Android validation still required.') + '\n\nSource: ' + head + '\n', encoding='utf-8')
    # Deliberately no --clobber and no force operation.
    run('gh', 'release', 'create', 'v' + version, '--repo', REPO, '--target', head, '--prerelease',
        '--title', 'Jarvis Core ' + version, '--notes-file', str(notes), str(archive), str(launcher), *map(str, extra_assets))
    verify_public(info['url'], info['bytes'], info['sha256'])
    verify_public(f'https://github.com/{REPO}/releases/download/v{version}/{launcher.name}', launcher.stat().st_size, launcher_hash)
    for asset in extra_assets:
        verify_public(f'https://github.com/{REPO}/releases/download/v{version}/{asset.name}', asset.stat().st_size,
                      hashlib.sha256(asset.read_bytes()).hexdigest())
    if run('gh', 'api', f'repos/{REPO}/commits/main', '--jq', '.sha') != head:
        raise SystemExit('GitHub main advanced during upload. Assets exist; pointer unchanged. Reconcile first.')
    payload = {'message': 'Publish phone update pointer for ' + version, 'branch': 'main', 'sha': resource['sha'],
               'content': base64.b64encode((ROOT / 'dist/update.json').read_bytes()).decode('ascii')}
    run('gh', 'api', '--method', 'PUT', f'repos/{REPO}/contents/update.json', '--input', '-', payload=payload)
    run('git', 'pull', '--ff-only', 'origin', 'main')
    verify_public(f'https://raw.githubusercontent.com/{REPO}/main/update.json?version={version}',
                  (ROOT / 'dist/update.json').stat().st_size,
                  hashlib.sha256((ROOT / 'dist/update.json').read_bytes()).hexdigest())
    print('Published and verified; local pointer fast-forwarded. Native Android acceptance remains separate.')

if __name__ == '__main__':
    main()
