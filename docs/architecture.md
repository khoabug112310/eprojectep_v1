# Architecture - CineBook (Placeholder)

Phiên bản: v4
Trạng thái: Draft

## Tổng quan
- Frontend: React 18 (Router, Axios, Redux/Context, UI lib)
- Backend: Laravel 10 (Sanctum, Eloquent, Queue)
- DB: MySQL 8; Cache: Redis (tùy chọn)

## Modules
- User, Movies, Theaters, Showtimes, Booking, Reviews, Admin, Reports

## API chính
- /auth/*, /movies/*, /theaters/*, /showtimes/*, /bookings/*, /admin/*

## Sơ đồ dữ liệu (rút gọn)
- Users, Movies, Theaters, Showtimes, Bookings, Reviews với quan hệ như mô tả trong 03-backend-description.md

## Booking Seat Locking (Quan trọng)
- Mục tiêu: Ngăn đua ghế; đảm bảo tính nhất quán khi nhiều user chọn ghế.
- Storage: Redis
- Key pattern: `seats:{showtimeId}:{seatCode}` → value: `{ userId, lockedAt }`
- TTL lock: 15 phút (900s). Gia hạn khi user tiếp tục thao tác; release khi booking xong hoặc hết TTL.
- Flow:
  1) FE chọn ghế → BE `POST /showtimes/{id}/seats/lock` (list ghế)
  2) BE kiểm tra available (DB/Cache), đặt lock Redis với TTL atomically
  3) Nếu user hủy / timeout → job `ReleaseSeatLockJob` chạy mỗi 5 phút để dọn vệ sinh
  4) Khi confirm booking: transaction cập nhật `available_seats` và xóa lock
- Idempotency: `booking_reference` tạm thời để tránh double-submit

## Chuẩn hóa Error Response
- Định dạng JSON thống nhất cho API:
```
{
  "success": false,
  "message": "<mô tả lỗi ngắn>",
  "errors": { "field": ["msg"] },
  "code": "<optional_machine_code>"
}
```
- Handler: dùng ExceptionHandler cho ValidationException, ModelNotFound, 500.
- FE: Chuẩn hóa adapter Axios để map về `{ message, errors }`.

## FE Routes (Bảng rút gọn)
- Public:
  - `/` (Home)
  - `/movies`, `/movies/:id`
  - `/login`, `/register`, `/forgot-password`
- Booking (guarded):
  - `/booking/showtimes/:movieId`
  - `/booking/seats/:showtimeId`
  - `/booking/checkout`
  - `/booking/confirmation`
- Account (guarded):
  - `/profile`, `/profile/bookings`
- Admin (role=admin):
  - `/admin/login`
  - `/admin/dashboard`
  - `/admin/movies`, `/admin/movies/create`, `/admin/movies/:id/edit`
  - `/admin/theaters`, `/admin/theaters/create`, `/admin/theaters/:id/edit`
  - `/admin/showtimes`, `/admin/showtimes/create`
  - `/admin/reports`, `/admin/reviews`

## Sơ đồ kiến trúc & data flow (Mermaid)
```mermaid
flowchart LR
  FE[React 18 SPA]\n  FE -->|Axios| API[(Laravel API)]
  subgraph Laravel
    API --> CTRL[Controllers]
    CTRL --> SRV[Services]
    SRV --> DB[(MySQL)]
    SRV --> REDIS[(Redis)]
    SRV --> QUEUE[Queue Jobs]
  end
  subgraph Booking Flow
    FE -->|seat lock| API
    SRV -->|lock TTL| REDIS
    QUEUE -->|release expired| SRV
  end
```

## Triển khai
- Dev: .env.local/.env, Docker (tùy chọn), scripts build, seed 