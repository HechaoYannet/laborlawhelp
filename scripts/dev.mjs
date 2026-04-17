import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const port = process.env.PORT || '5000';
const cozeWorkspacePath = process.env.COZE_WORKSPACE_PATH;
const workspacePath =
  cozeWorkspacePath && existsSync(cozeWorkspacePath)
    ? cozeWorkspacePath
    : process.cwd();

const child = spawn('pnpm tsx watch src/server.ts', {
  cwd: workspacePath,
  env: {
    ...process.env,
    PORT: port,
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', err => {
  console.error('Failed to start dev server:', err);
  process.exit(1);
});
