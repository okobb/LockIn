#!/bin/bash
set -e 

echo "🚀 Starting Deployment..."

php artisan down || true

git pull origin main

composer install --no-dev --optimize-autoloader --no-interaction

chmod -R 775 storage bootstrap/cache

php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

php artisan queue:restart

php artisan up

echo "✅ Deployment Finalized!"
