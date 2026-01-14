#!/bin/bash
# deploy-linux.sh - Linux Native Deployment Script
# Usage: ./scripts/deploy-linux.sh [--init|--update]

set -e

# Configuration
APP_DIR="/var/www/expense-app"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as appropriate user
check_permissions() {
    if [ "$EUID" -eq 0 ]; then
        log_warn "Running as root. Some commands will use www-data user."
    fi
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    sudo apt update
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

    # Install Composer if not present
    if ! command -v composer &> /dev/null; then
        log_info "Installing Composer..."
        curl -sS https://getcomposer.org/installer | php
        sudo mv composer.phar /usr/local/bin/composer
    fi

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
}

# Setup backend
setup_backend() {
    log_info "Setting up backend..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    composer install --optimize-autoloader --no-dev
    
    # Environment setup
    if [ ! -f .env ]; then
        cp .env.example .env
        php artisan key:generate
        log_warn "Please edit .env file with production settings!"
    fi
    
    # Database setup
    if [ ! -f database/database.sqlite ]; then
        touch database/database.sqlite
    fi
    
    # Run migrations
    php artisan migrate --force
    
    # Set permissions
    sudo chown -R www-data:www-data storage bootstrap/cache database
    sudo chmod -R 775 storage bootstrap/cache database
    
    # Optimize
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan storage:link 2>/dev/null || true
    
    log_info "Backend setup complete!"
}

# Setup frontend
setup_frontend() {
    log_info "Setting up frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    if command -v pnpm &> /dev/null && [ -f pnpm-lock.yaml ]; then
        pnpm install
        pnpm build
    else
        npm install
        npm run build
    fi
    
    log_info "Frontend build complete!"
}

# Setup Nginx
setup_nginx() {
    log_info "Setting up Nginx..."
    
    # Copy configuration
    sudo cp "$APP_DIR/scripts/nginx-expense-app.conf" /etc/nginx/sites-available/expense-app
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/expense-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload
    sudo nginx -t
    sudo systemctl reload nginx
    
    log_info "Nginx configured!"
}

# Setup Supervisor
setup_supervisor() {
    log_info "Setting up Supervisor..."
    
    sudo cp "$APP_DIR/scripts/supervisor-expense-app.conf" /etc/supervisor/conf.d/expense-app.conf
    
    sudo supervisorctl reread
    sudo supervisorctl update
    sudo supervisorctl restart all
    
    log_info "Supervisor configured!"
}

# Update deployment
update_deployment() {
    log_info "Updating deployment..."
    
    cd "$APP_DIR"
    
    # Pull latest changes
    git pull origin main
    
    # Stop queue worker during update
    sudo supervisorctl stop expense-queue || true
    
    # Update backend
    cd "$BACKEND_DIR"
    composer install --optimize-autoloader --no-dev
    php artisan migrate --force
    php artisan optimize:clear
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    
    # Update frontend
    cd "$FRONTEND_DIR"
    if command -v pnpm &> /dev/null && [ -f pnpm-lock.yaml ]; then
        pnpm install
        pnpm build
    else
        npm install
        npm run build
    fi
    
    # Restart services
    sudo supervisorctl restart all
    
    log_info "Update complete!"
}

# Initial setup
init_deployment() {
    log_info "Starting initial deployment..."
    
    check_permissions
    install_dependencies
    setup_backend
    setup_frontend
    setup_nginx
    setup_supervisor
    
    echo ""
    log_info "=========================================="
    log_info "Deployment complete!"
    log_info "=========================================="
    echo ""
    log_warn "Next steps:"
    echo "  1. Edit $BACKEND_DIR/.env with production settings"
    echo "  2. Update server_name in /etc/nginx/sites-available/expense-app"
    echo "  3. Setup SSL: sudo certbot --nginx -d your-domain.com"
    echo ""
}

# Main
case "$1" in
    --init)
        init_deployment
        ;;
    --update)
        update_deployment
        ;;
    *)
        echo "Usage: $0 [--init|--update]"
        echo ""
        echo "Options:"
        echo "  --init    First-time deployment setup"
        echo "  --update  Update existing deployment"
        exit 1
        ;;
esac
