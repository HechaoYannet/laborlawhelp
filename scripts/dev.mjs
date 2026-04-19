import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const port = process.env.PORT || '5000';
const cozeWorkspacePath = process.env.COZE_WORKSPACE_PATH;
const workspacePath =
  cozeWorkspacePath && existsSync(cozeWorkspacePath)
    ? cozeWorkspacePath
    : process.cwd();

const tsxBin = join(
  workspacePath,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

const child = spawn(tsxBin, ['watch', 'src/server.ts'], {
  cwd: workspacePath,
  env: {
    ...process.env,
    PORT: port,
  },
  stdio: 'inherit',
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', err => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
