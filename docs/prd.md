# PRD - CineBook (Placeholder)

Phiên bản: v4
Trạng thái: Draft (seeded from eproject.md)

## Functional Requirements (Tóm tắt)
- Đăng ký/Đăng nhập, quên mật khẩu, cập nhật hồ sơ
- Duyệt phim: now showing, coming soon; tìm kiếm & lọc theo thành phố, thể loại, ngôn ngữ, rating, ngày
- Đặt vé: chọn rạp, ngày/giờ, loại ghế; sơ đồ ghế; nhiều ghế/booking; thanh toán giả lập
- E-ticket: tạo sau thanh toán; gồm phim/rạp/giờ/ghế/Booking ID; xem lịch sử
- Đánh giá & xếp hạng (1–5), kiểm duyệt bởi admin
- Admin: CRUD Rạp/Phim/Suất; định giá theo thời gian/loại ghế; báo cáo doanh thu/đặt vé/phim/user; thông báo

## Non-Functional Requirements
- Bảo mật, hiệu năng (<500ms API chính), tính sẵn sàng, UX thân thiện, truy cập 24/7

## Phạm vi (Scope v1)
- MVP theo 01/02/03/04/05/06/07/08 checklist trong thư mục dự án

## Tiêu chí chấp nhận (Acceptance)
- Hoàn thành luồng đặt vé end-to-end; Admin quản trị đầy đủ CRUD; báo cáo tổng quan; test cơ bản pass 