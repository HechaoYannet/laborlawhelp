import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const cozeWorkspacePath = process.env.COZE_WORKSPACE_PATH;
const workspacePath =
  cozeWorkspacePath && existsSync(cozeWorkspacePath)
    ? cozeWorkspacePath
    : process.cwd();

function resolveLocalBin(binName) {
  const suffix = process.platform === 'win32' ? '.cmd' : '';
  return join(workspacePath, 'node_modules', '.bin', `${binName}${suffix}`);
}

function runCommand(command, args) {
  const isWindows = process.platform === 'win32';
  const spawnCommand = isWindows ? 'cmd.exe' : command;
  const spawnArgs = isWindows
    ? ['/d', '/s', '/c', `${command} ${args.join(' ')}`]
    : args;

  return new Promise((resolve, reject) => {
    const child = spawn(spawnCommand, spawnArgs, {
      cwd: workspacePath,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });

    child.on('error', reject);
  });
}

try {
  await runCommand(resolveLocalBin('next'), ['build']);
  await runCommand(
    resolveLocalBin('tsup'),
    ['src/server.ts', '--format', 'cjs', '--platform', 'node', '--target', 'node20', '--outDir', 'dist', '--no-splitting', '--no-minify'],
  );
  console.log('Build completed successfully!');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
