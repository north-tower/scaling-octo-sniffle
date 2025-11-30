const path = require('path');

module.exports = {
  apps: [{
    name: 'fee-management-frontend',
    script: 'npm',
    args: 'run dev',
    cwd: path.resolve(__dirname),
    instances: 1, // Must be 1 for dev mode
    exec_mode: 'fork', // Must be fork for dev mode
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    autorestart: true,
    watch: false, // Don't use watch with PM2
    max_memory_restart: '1G'
  }]
}