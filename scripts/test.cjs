const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
for (const name of ['app.cjs', 'updater.cjs', 'voice-batch.cjs', 'panel.cjs', 'outside-cards.cjs', 'recognition-services.cjs']) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', name)], { cwd: root, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
