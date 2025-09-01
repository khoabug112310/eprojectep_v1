# CineBook Backend (Laravel 10)

## Yêu cầu
- PHP 8.1+
- Composer
- MySQL 8.0 (hoặc SQLite cho dev nhanh)

## Cài đặt
```bash
cd backend
cp .env.example .env
# Sửa DB_* trong .env để dùng MySQL, hoặc để mặc định SQLite (database/database.sqlite)
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

## Migrations tạo sẵn
- users (mặc định của Laravel)
- movies, theaters, showtimes, bookings, reviews

## Ghi chú
- Booking seat lock: Redis TTL 15 phút (xem `docs/architecture.md`)
- API responses: định dạng error chuẩn hóa theo Handler
