import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const cozeWorkspacePath = process.env.COZE_WORKSPACE_PATH;
const workspacePath =
  cozeWorkspacePath && existsSync(cozeWorkspacePath)
    ? cozeWorkspacePath
    : process.cwd();

function runPnpm(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd: workspacePath,
      env: process.env,
      stdio: 'inherit',
      shell: true,
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed with exit code ${code}`));
    });

    child.on('error', reject);
  });
}

try {
  await runPnpm('pnpm next build');
  await runPnpm(
    'pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify',
  );
  console.log('Build completed successfully!');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
