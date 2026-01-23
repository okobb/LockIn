# ============================================
# Laravel Production Dockerfile (Optimized)
# ============================================

FROM php:8.2-cli-alpine

# Install system dependencies (Alpine uses apk, not apt)
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    unzip \
    postgresql-dev \
    libzip-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    icu-dev \
    linux-headers \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        intl \
        soap \
        zip \
        opcache

# Cleanup build dependencies to reduce image size
RUN apk del $PHPIZE_DEPS linux-headers \
    && rm -rf /var/cache/apk/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install dependencies without dev packages
RUN composer install --no-interaction --no-dev --optimize-autoloader --no-scripts

# Copy application code
COPY . .

# Run composer scripts after copying all files
RUN composer dump-autoload --optimize

# Create storage directories if they don't exist and set permissions
RUN mkdir -p storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Expose port 80 for the built-in PHP server
EXPOSE 80

# Start Laravel's built-in server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=80"]
