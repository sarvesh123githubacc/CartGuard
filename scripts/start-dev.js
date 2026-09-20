const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pythonExe = process.platform === 'win32'
  ? path.join(rootDir, 'backend', '.venv', 'Scripts', 'python.exe')
  : path.join(rootDir, 'backend', '.venv', 'bin', 'python');

const isWin = process.platform === 'win32';

console.log('[CartGuard] Starting local development servers...');

const backendCmd = isWin ? 'powershell' : 'bash';
const backendArgs = isWin
  ? ['-ExecutionPolicy', 'Bypass', '-File', path.join(rootDir, 'scripts', 'start_backend.ps1')]
  : [path.join(rootDir, 'scripts', 'start_backend.sh')];

const backend = spawn(backendCmd, backendArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: rootDir },
});

const npmCmd = isWin ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(rootDir, 'frontend'),
  stdio: 'inherit',
});

function cleanup() {
  console.log('\n[CartGuard] Stopping services...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
