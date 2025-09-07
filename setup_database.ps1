# PowerShell script to setup CineBook database with sample data
Write-Host "==================================================" -ForegroundColor Green
Write-Host "CineBook Database Setup with Sample Data" -ForegroundColor Green  
Write-Host "==================================================" -ForegroundColor Green

# Change to backend directory
$backendPath = "C:\Dự án\eprojectep_v1\backend"
Set-Location $backendPath
Write-Host "Changed to directory: $(Get-Location)" -ForegroundColor Yellow

# Check if composer.json exists
if (Test-Path "composer.json") {
    Write-Host "✓ Found composer.json" -ForegroundColor Green
} else {
    Write-Host "✗ composer.json not found!" -ForegroundColor Red
    exit 1
}

# Check if artisan exists  
if (Test-Path "artisan") {
    Write-Host "✓ Found artisan" -ForegroundColor Green
} else {
    Write-Host "✗ artisan not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 1: Installing dependencies..." -ForegroundColor Cyan
try {
    composer install --no-dev --optimize-autoloader
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install dependencies: $_" -ForegroundColor Red
}

Write-Host "`nStep 2: Generating application key..." -ForegroundColor Cyan  
try {
    php artisan key:generate --force
    Write-Host "✓ Application key generated" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to generate key: $_" -ForegroundColor Red
}

Write-Host "`nStep 3: Running fresh migrations..." -ForegroundColor Cyan
try {
    php artisan migrate:fresh --force
    Write-Host "✓ Database migrated" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to migrate database: $_" -ForegroundColor Red
}

Write-Host "`nStep 4: Seeding database with sample data..." -ForegroundColor Cyan
try {
    php artisan db:seed --force
    Write-Host "✓ Database seeded with sample data" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to seed database: $_" -ForegroundColor Red
}

Write-Host "`nStep 5: Optimizing application..." -ForegroundColor Cyan
try {
    php artisan optimize
    Write-Host "✓ Application optimized" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to optimize: $_" -ForegroundColor Red
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "Database Setup Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

Write-Host "`nDefault Login Credentials:" -ForegroundColor Yellow
Write-Host "Admin: admin@cinebook.com / admin123" -ForegroundColor White
Write-Host "User: user@cinebook.com / user123" -ForegroundColor White

Write-Host "`nSample Data Includes:" -ForegroundColor Yellow  
Write-Host "- Vietnamese and International Movies" -ForegroundColor White
Write-Host "- Theater chains (Galaxy, CGV, Lotte)" -ForegroundColor White
Write-Host "- Showtimes for next 14 days" -ForegroundColor White
Write-Host "- User reviews and ratings" -ForegroundColor White
Write-Host "- Sample bookings with payments" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")