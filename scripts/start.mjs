import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const cozeWorkspacePath = process.env.COZE_WORKSPACE_PATH;
const workspacePath =
  cozeWorkspacePath && existsSync(cozeWorkspacePath)
    ? cozeWorkspacePath
    : process.cwd();
const port = process.env.DEPLOY_RUN_PORT || process.env.PORT || '5000';

const child = spawn(`"${process.execPath}" dist/server.js`, {
  cwd: workspacePath,
  env: {
    ...process.env,
    COZE_PROJECT_ENV: process.env.COZE_PROJECT_ENV || 'PROD',
    PORT: port,
  },
  stdio: 'inherit',
  shell: true,
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', err => {
  console.error('Failed to start production server:', err);
  process.exit(1);
});
