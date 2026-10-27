"""Mandatory work-start inspection. Reads GitHub and fetches refs; never overwrites working files."""
import base64
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'lijun117992/jarvis-core-updates'

def run(*args):
    p = subprocess.run(args, cwd=ROOT, capture_output=True, encoding='utf-8')
    if p.returncode:
        raise SystemExit(p.stderr.strip() or 'Command failed: ' + args[0])
    return p.stdout.strip()

run('git', 'fetch', 'origin')
head = run('git', 'rev-parse', 'HEAD')
remote_head = run('git', 'rev-parse', 'origin/main')
ahead, behind = map(int, run('git', 'rev-list', '--left-right', '--count', 'HEAD...origin/main').split())
commits = json.loads(run('gh', 'api', f'repos/{REPO}/commits?per_page=5'))
releases = json.loads(run('gh', 'api', f'repos/{REPO}/releases?per_page=5'))
resource = json.loads(run('gh', 'api', f'repos/{REPO}/contents/update.json?ref=main'))
update = json.loads(base64.b64decode(resource['content']))
report = {
    'repository': REPO, 'local_head': head, 'remote_head': remote_head,
    'ahead': ahead, 'behind': behind,
    'local_changes': run('git', 'status', '--short'),
    'commits': [{'sha': c['sha'], 'message': c['commit']['message'], 'utc': c['commit']['committer']['date']} for c in commits],
    'releases': [{'tag': r['tag_name'], 'published_at': r['published_at'], 'prerelease': r['prerelease']} for r in releases if not r['draft']],
    'phone_update_version': update['version'], 'phone_update_sha256': update['sha256'],
}
(ROOT / '.work').mkdir(exist_ok=True)
(ROOT / '.work/remote-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
if behind:
    raise SystemExit('Remote is ahead/diverged. Review changes before editing; pull --ff-only only with a clean worktree. No files were overwritten.')
