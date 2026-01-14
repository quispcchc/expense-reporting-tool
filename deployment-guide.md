# Deployment Guide

Complete deployment guide for the Volunteering Expense & Revenue Reporting Tool.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Docker Deployment (Recommended)](#docker-deployment-recommended)
- [Native Linux Deployment](#native-linux-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Method | Complexity | Use Case |
|--------|------------|----------|
| **Docker (Recommended)** | Low | Quick deployment, easy maintenance |
| **Native Linux** | Medium | Full control, no Docker dependency |

---

## Docker Deployment (Recommended)

### Prerequisites

- Docker & Docker Compose installed
- Git installed

### Quick Deploy

```bash
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

### Manual Deploy

```bash
# Clone repository
git clone <repository-url>
cd Volunteering_expense-and-revenue-reporting-tool

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop services
docker compose -f docker-compose.prod.yml down
```

### Architecture

```
User Browser → Nginx (:80) → {
    /     → Frontend (React static files)
    /api  → Backend (Laravel API)
}
```

---

## Native Linux Deployment

Deploy directly on a Linux server without Docker.

### 1. System Requirements

**Tested on:** Ubuntu 22.04 LTS, Debian 12

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    php8.2-fpm \
    php8.2-sqlite3 \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-gd \
    php8.2-zip \
    php8.2-bcmath \
    php8.2-curl \
    nginx \
    supervisor \
    git \
    curl \
    unzip

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone and Setup Application

```bash
# Create web directory
sudo mkdir -p /var/www/expense-app
sudo chown $USER:$USER /var/www/expense-app

# Clone repository
cd /var/www/expense-app
git clone <repository-url> .
```

### 3. Backend Setup (Laravel)

```bash
cd /var/www/expense-app/backend

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Environment configuration
cp .env.example .env
php artisan key:generate

# Edit .env for production
# APP_ENV=production
# APP_DEBUG=false
# APP_URL=https://your-domain.com

# Database setup
touch database/database.sqlite
php artisan migrate --force
php artisan db:seed --force  # Optional: seed initial data

# Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache database
sudo chmod -R 775 storage bootstrap/cache database

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlink
php artisan storage:link
```

### 4. Frontend Setup (React)

```bash
cd /var/www/expense-app/frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output is in dist/ directory
```

### 5. Nginx Configuration

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/expense-app
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React static files)
    root /var/www/expense-app/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Sanctum CSRF endpoint
    location /sanctum {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Storage files (uploaded files)
    location /storage {
        alias /var/www/expense-app/backend/storage/app/public;
        try_files $uri =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/expense-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Process Management (Supervisor)

Supervisor keeps the Laravel backend and queue worker running.

```bash
sudo nano /etc/supervisor/conf.d/expense-app.conf
```

Paste the following:

```ini
[program:expense-backend]
process_name=%(program_name)s
command=php /var/www/expense-app/backend/artisan serve --host=127.0.0.1 --port=8000
directory=/var/www/expense-app/backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/expense-backend.log
stopwaitsecs=3600

[program:expense-queue]
process_name=%(program_name)s
command=php /var/www/expense-app/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
directory=/var/www/expense-app/backend
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/log/expense-queue.log
stopwaitsecs=3600
```

Start services:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all

# Check status
sudo supervisorctl status
```

### 7. Automated Deployment Script

Use the provided deployment script:

```bash
# First deployment
./scripts/deploy-linux.sh --init

# Update deployment
./scripts/deploy-linux.sh --update
```

---

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Common Issues

**1. 502 Bad Gateway**
```bash
# Check if backend is running
sudo supervisorctl status expense-backend

# View logs
sudo tail -f /var/log/expense-backend.log
```

**2. Permission Denied**
```bash
sudo chown -R www-data:www-data /var/www/expense-app/backend/storage
sudo chmod -R 775 /var/www/expense-app/backend/storage
```

**3. Database Locked**
```bash
# Stop queue worker before migrations
sudo supervisorctl stop expense-queue
php artisan migrate
sudo supervisorctl start expense-queue
```

**4. Frontend Not Loading**
```bash
# Rebuild frontend
cd /var/www/expense-app/frontend
npm run build

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Useful Commands

```bash
# Restart all services
sudo supervisorctl restart all
sudo systemctl reload nginx

# Clear Laravel caches
cd /var/www/expense-app/backend
php artisan optimize:clear

# View real-time logs
sudo tail -f /var/log/expense-backend.log
sudo tail -f /var/log/expense-queue.log
sudo tail -f /var/log/nginx/access.log
```

---

## Comparison: Docker vs Native

| Aspect | Docker | Native |
|--------|--------|--------|
| **Setup Time** | ~5 minutes | ~30 minutes |
| **Dependencies** | Docker only | PHP, Node, Nginx, Supervisor |
| **Updates** | Rebuild image | Git pull + restart |
| **Resource Usage** | Higher (containers) | Lower (direct) |
| **Portability** | High | Server-specific |
| **Debugging** | Container logs | Direct access |

**Recommendation:** Use Docker for simplicity. Use Native deployment when you need more control or have resource constraints.

---

## Server Maintenance

Proper maintenance prevents disk space issues and ensures system stability.

### Maintenance Scripts

The following scripts are available in the `scripts/` directory:

| Script | Purpose | Schedule |
|--------|---------|----------|
| `maintenance.sh` | DB cleanup, log archive, cache clear | Daily |
| `docker-cleanup.sh` | Remove unused Docker resources | Weekly |

### Setting Up Scheduled Maintenance

**1. Add to crontab (Linux):**

```bash
sudo crontab -e
```

```cron
# Daily maintenance at 3:00 AM
0 3 * * * /var/www/expense-app/scripts/maintenance.sh >> /var/log/expense-maintenance.log 2>&1

# Weekly Docker cleanup at 4:00 AM on Sundays
0 4 * * 0 /var/www/expense-app/scripts/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
```

**2. Install logrotate configuration:**

```bash
sudo cp scripts/logrotate-expense-app.conf /etc/logrotate.d/expense-app
```

### Log Management Strategy

| Log Type | Retention | Location |
|----------|-----------|----------|
| Laravel App | 90 days (compressed) | `backend/storage/logs/` |
| Docker | 30MB max per service | Docker logs |
| Nginx | 30 days (compressed) | `/var/log/nginx/` |
| Supervisor | 30 days (compressed) | `/var/log/expense-*.log` |

### Manual Maintenance Commands

```bash
# Database maintenance
./scripts/maintenance.sh db

# Archive old logs
./scripts/maintenance.sh logs

# Clear caches
./scripts/maintenance.sh cache

# Disk usage report
./scripts/maintenance.sh report

# Docker cleanup (careful!)
./scripts/docker-cleanup.sh
```

### SQLite Database Tips

```bash
# Check database size
ls -lh backend/database/database.sqlite

# Manual VACUUM (reclaim disk space)
sqlite3 backend/database/database.sqlite "VACUUM;"

# Check WAL file size
ls -lh backend/database/database.sqlite-wal
```

### Disk Space Monitoring

Monitor disk usage to prevent service disruptions:

```bash
# Check overall disk usage
df -h /

# Check application directories
du -sh /var/www/expense-app/
du -sh /var/www/expense-app/backend/storage/

# Docker disk usage
docker system df
```

> [!WARNING]
> If disk usage exceeds 90%, services may fail. Set up alerts or monitoring.

### Emergency Cleanup

If disk is nearly full:

```bash
# 1. Clear Laravel caches
php artisan optimize:clear

# 2. Remove old logs
find /var/www/expense-app/backend/storage/logs -name "*.log" -mtime +7 -delete

# 3. Docker emergency cleanup
docker system prune -a -f

# 4. Clear journal logs (if applicable)
sudo journalctl --vacuum-time=3d
```