# Story: Booking Flow (Showtime → Seats → Checkout → Confirmation)

## Mục tiêu
User đặt vé trọn vẹn, xử lý seat availability và e-ticket.

## Acceptance Criteria
- Chọn suất chiếu theo rạp/ngày/giờ, hiển thị giá theo loại ghế
- Chọn ghế với trạng thái realtime (available/occupied/selected)
- Checkout với tóm tắt, điều khoản, payment dummy
- Confirmation tạo booking code + e-ticket

## Tasks
- FE: 4 pages + components (date picker, seat map SVG, summary)
- BE: Seat map endpoint, BookingService, e-ticket data, validations
- QA: *risk, *design, *trace, *review, *gate 