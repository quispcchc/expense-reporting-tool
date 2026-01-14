// start-dev.cjs - Windows dev server launcher
// Auto-detects package manager based on lock file
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function detectPackageManager() {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(cwd, 'package-lock.json'))) return 'npm';
    return 'npm'; // Default to npm if no lock file found
}

const pm = detectPackageManager();
const cmd = process.platform === 'win32' ? `${pm}.cmd` : pm;

console.log(`[PM2] Starting dev server with ${pm}...`);

spawn(cmd, ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    windowsHide: true
}).on('close', (code) => process.exit(code));
