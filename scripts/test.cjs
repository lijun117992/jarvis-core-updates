const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
require('fs').mkdirSync(path.join(root, '.work'), { recursive: true });
for (const name of ['app.cjs', 'updater.cjs', 'voice-batch.cjs', 'panel.cjs', 'outside-cards.cjs', 'recognition-services.cjs', 'file-agent.cjs', 'agent-runtime.cjs', 'asr.cjs', 'daily-memory.cjs', 'ui-tools.cjs', 'interaction-models.cjs', 'quiet-protocol-audio.cjs', 'notifications-cleanup.cjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', name)], { cwd: root, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
