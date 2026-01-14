// ecosystem.config.cjs - PM2 configuration for frontend dev server
// Cross-platform support: Windows, Mac, Linux
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
        // Log files stored in pm2-logs directory for all platforms
        error_file: './pm2-logs/frontend-error.log',
        out_file: './pm2-logs/frontend-out.log',
        // Merge logs from all instances
        merge_logs: true,
        // Auto-restart on crash
        autorestart: true,
        // Environment variables
        env: {
            NODE_ENV: 'development'
        }
    }]
};
