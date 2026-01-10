# Use PHP 8.2 FPM Alpine for smaller image size
FROM php:8.2-fpm-alpine

# Copy custom php.ini configuration
COPY php.ini /usr/local/etc/php/conf.d/custom.ini

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite \
    sqlite-dev \
    nodejs \
    npm \
    ttf-dejavu \
    fontconfig

# Clear cache
RUN rm -rf /var/cache/apk/*

# Download Noto Sans CJK font for PDF CJK character support
RUN mkdir -p /usr/share/fonts/noto-cjk && \
    curl -L -o /usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc \
    "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTC/NotoSansCJK-Regular.ttc" && \
    fc-cache -fv

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite mbstring exif pcntl bcmath gd

# Install zip extension
RUN apk add --no-cache libzip-dev && docker-php-ext-install zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy entire application directory, excluding public/storage which will be created as symlink
COPY --chown=www-data:www-data . .

# Clean Laravel cache files that may contain old package references
RUN rm -f /var/www/html/bootstrap/cache/packages.php /var/www/html/bootstrap/cache/services.php

# Ensure public directory exists (public/storage might not be in context since it's gitignored)
RUN mkdir -p /var/www/html/public

# Install PHP dependencies (using update to sync lock file with new packages)
RUN composer update --no-interaction --optimize-autoloader

# Install Node dependencies (for Vite)
RUN npm install --legacy-peer-deps

# Create necessary directories with proper permissions
RUN mkdir -p /var/www/html/database && \
    mkdir -p /var/www/html/public && \
    mkdir -p /var/www/html/storage/logs && \
    mkdir -p /var/www/html/storage/framework/{cache,sessions,views} && \
    mkdir -p /var/www/html/bootstrap/cache && \
    touch /var/www/html/database/database.sqlite


# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Generate application key if not already present
RUN php artisan key:generate --force

# Create storage symlink for public/storage
# First ensure the public directory exists
RUN mkdir -p /var/www/html/public/storage && \
    if [ ! -L /var/www/html/public/storage ]; then \
    rm -rf /var/www/html/public/storage && \
    ln -s /var/www/html/storage/app/public /var/www/html/public/storage; \
    fi || true


# Expose port 8000
EXPOSE 8000

# Start Laravel server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]