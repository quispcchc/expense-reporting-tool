# Use PHP 8.2 FPM Alpine for smaller image size
FROM php:8.2-fpm-alpine

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
    npm

# Clear cache
RUN rm -rf /var/cache/apk/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite mbstring exif pcntl bcmath gd

# Install zip extension
RUN apk add --no-cache libzip-dev && docker-php-ext-install zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy entire application directory (now includes .env from .dockerignore removal)
COPY . .

# Install PHP dependencies with retry logic (include dev deps for seeding/factories)
RUN composer install --no-interaction --optimize-autoloader || composer install --no-interaction --optimize-autoloader

# Install Node dependencies (for Vite)
RUN npm install --legacy-peer-deps

# Create necessary directories with proper permissions
RUN mkdir -p /var/www/html/database && \
    mkdir -p /var/www/html/storage/logs && \
    mkdir -p /var/www/html/storage/framework/{cache,sessions,views} && \
    mkdir -p /var/www/html/bootstrap/cache && \
    touch /var/www/html/database/database.sqlite

# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Generate application key if not already present
RUN php artisan key:generate --force

# Expose port 8000
EXPOSE 8000

# Start Laravel server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
