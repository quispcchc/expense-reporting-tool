// ecosystem.config.cjs
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';

module.exports = {
    apps: [{
        name: 'frontend',
        script: isWindows ? './start-dev.cjs' : './start-dev.sh',
        cwd: '.',
        instances: 1,
        exec_mode: 'fork',
        ...(isWindows && {
            error_file: './pm2-logs/frontend-error.log',
            out_file: './pm2-logs/frontend-out.log'
        })
    }]
};
