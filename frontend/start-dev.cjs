// start-dev.cjs (CommonJS 강제)
const { spawn } = require('child_process');

spawn('pnpm.cmd', ['dev'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    windowsHide: true
}).on('close', (code) => process.exit(code));
