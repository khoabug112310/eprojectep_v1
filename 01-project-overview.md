# CineBook - Tổng Quan Dự Án

## Giới Thiệu Dự Án
CineBook là một hệ thống đặt vé xem phim trực tuyến được thiết kế để cung cấp trải nghiệm đặt vé thuận tiện và hiện đại cho người dùng. Dự án được xây dựng với kiến trúc frontend-backend tách biệt, đảm bảo tính mở rộng và bảo trì cao.

## Mục Tiêu Dự Án
- Tạo ra một nền tảng đặt vé xem phim trực tuyến hoàn chỉnh
- Cung cấp giao diện người dùng thân thiện và dễ sử dụng
- Hỗ trợ quản lý toàn diện cho admin (rạp, phim, suất chiếu)
- Đảm bảo bảo mật và hiệu suất cao
- Phù hợp làm đồ án cuối kỳ với khả năng mở rộng

## Công Nghệ Sử Dụng

### Frontend
- **ReactJS 18**: Framework chính cho giao diện người dùng
- **React Router**: Điều hướng SPA
- **Axios**: HTTP client cho API calls
- **Material-UI/Ant Design**: Component library
- **Redux/Context API**: State management

### Backend
- **Laravel 10**: PHP framework cho API backend
- **Laravel Sanctum**: Authentication system
- **Eloquent ORM**: Database ORM
- **Laravel Queue**: Background job processing

### Database
- **MySQL 8.0**: Primary database
- **Redis**: Caching và session storage

### DevOps & Tools
- **Composer**: PHP dependency management
- **npm/yarn**: Node.js package management
- **Git**: Version control
- **Postman**: API testing

## Kiến Trúc Hệ Thống

```
┌─────────────────┐    ┌─────────────────┐
│   User Frontend │    │  Admin Frontend │
│    (React 18)   │    │    (React 18)   │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
            ┌─────────────────┐
            │   Laravel API   │
            │   Backend       │
            └─────────────────┘
                     │
            ┌─────────────────┐
            │   MySQL DB      │
            │   + Redis       │
            └─────────────────┘
```

## Tính Năng Chính

### Người Dùng (User)
1. **Quản lý tài khoản**: Đăng ký, đăng nhập, cập nhật hồ sơ
2. **Duyệt phim**: Tìm kiếm, lọc phim theo nhiều tiêu chí
3. **Đặt vé**: Chọn rạp, suất chiếu, ghế ngồi
4. **Thanh toán**: Mô phỏng thanh toán trực tuyến
5. **E-ticket**: Xem và quản lý vé đã đặt
6. **Đánh giá**: Đánh giá và nhận xét phim

### Quản trị viên (Admin)
1. **Quản lý rạp**: CRUD operations cho rạp chiếu
2. **Quản lý phim**: Thêm, sửa, xóa thông tin phim
3. **Quản lý suất chiếu**: Lập lịch chiếu phim
4. **Quản lý giá vé**: Thiết lập giá theo loại ghế, thời gian
5. **Báo cáo**: Thống kê doanh thu, phim phổ biến
6. **Kiểm duyệt**: Quản lý đánh giá của người dùng

## Phân Tích Yêu Cầu

### Yêu Cầu Chức Năng
- Hệ thống xác thực và phân quyền
- Quản lý nội dung phim và rạp chiếu
- Quy trình đặt vé từ A-Z
- Hệ thống thông báo và nhắc nhở
- Báo cáo và thống kê cho admin

### Yêu Cầu Phi Chức Năng
- **Bảo mật**: Authentication, input validation
- **Hiệu suất**: Tối ưu truy vấn database, caching
- **Khả dụng**: 99% uptime, error handling
- **Khả năng mở rộng**: Modular architecture
- **Trải nghiệm người dùng**: Responsive, intuitive UI

## Quy Trình Phát Triển

### Phase 1: Thiết kế & Setup (Tuần 1-2)
- Thiết kế UI/UX mockups
- Setup development environment
- Database design và migration
- API structure planning

### Phase 2: Backend Development (Tuần 3-5)
- Authentication system
- CRUD APIs cho tất cả entities
- Business logic implementation
- Testing và documentation

### Phase 3: Frontend Development (Tuần 6-8)
- Component development
- API integration
- State management
- Responsive design

### Phase 4: Integration & Testing (Tuần 9-10)
- End-to-end testing
- Performance optimization
- Bug fixes và improvements
- Deployment preparation

## Deliverables

### Mã nguồn
- Frontend React application
- Backend Laravel API
- Database schema và seeders
- Configuration files

### Tài liệu
- API documentation
- User manual
- Admin manual
- Technical documentation
- Testing reports

### Demo
- Live demo website
- Presentation materials
- Video demo các tính năng

## Tiêu Chí Đánh Giá
- **Functionality (40%)**: Đầy đủ tính năng theo yêu cầu
- **Code Quality (25%)**: Clean code, best practices
- **UI/UX (20%)**: User-friendly interface
- **Documentation (10%)**: Comprehensive docs
- **Presentation (5%)**: Clear demo và explanation

## Khả Năng Mở Rộng
- **Loyalty Program**: Tích điểm và ưu đãi thành viên
- **Social Features**: Chia sẻ và mời bạn bè
- **Multi-language**: Hỗ trợ đa ngôn ngữ
- **Mobile App**: React Native mobile app
- **Analytics**: Advanced reporting và insights
- **Integration**: Third-party payment gateways