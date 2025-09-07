@echo off
cd /d "C:\Dự án\eprojectep_v1\backend"
echo Current directory: %CD%
echo.
echo Setting up database with sample data...
echo.

echo Step 1: Installing dependencies...
composer install --no-dev --optimize-autoloader

echo.
echo Step 2: Generating app key...
php artisan key:generate

echo.
echo Step 3: Running database migrations...
php artisan migrate:fresh

echo.
echo Step 4: Seeding database with sample data...
php artisan db:seed

echo.
echo Step 5: Optimizing application...
php artisan optimize

echo.
echo Database setup completed!
echo.
echo Default Login Credentials:
echo Admin: admin@cinebook.com / admin123
echo User: user@cinebook.com / user123
echo.
pause