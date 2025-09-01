---
trigger: always_on
alwaysApply: true
---
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

## Tài Liệu Tham Khảo
# CineBook Frontend - Mô Tả Chi Tiết Admin & User

## Tổng Quan Frontend

Frontend CineBook được xây dựng với ReactJS 18, cung cấp hai giao diện chính:
- **User Interface**: Dành cho khách hàng đặt vé xem phim
- **Admin Dashboard**: Dành cho quản trị viên quản lý hệ thống

## Kiến Trúc Frontend

```
src/
├── components/           # Shared components
│   ├── common/          # UI components (Button, Modal, etc.)
│   ├── layout/          # Layout components (Header, Footer)
│   └── forms/           # Form components
├── pages/
│   ├── user/            # User pages
│   │   ├── Home/
│   │   ├── Movies/
│   │   ├── Booking/
│   │   ├── Profile/
│   │   └── Auth/
│   └── admin/           # Admin pages
│       ├── Dashboard/
│       ├── Movies/
│       ├── Theaters/
│       ├── Showtimes/
│       └── Reports/
├── hooks/               # Custom React hooks
├── services/            # API services
├── store/               # State management (Redux/Context)
├── utils/               # Utilities functions
└── styles/              # CSS/SCSS files
```

## USER INTERFACE

### 1. Trang Chính (Home Page)
**Đường dẫn**: `/`
**Mục đích**: Landing page giới thiệu và truy cập nhanh

#### Thành phần chính:
- **Hero Section**: Banner phim nổi bật với trailer
- **Now Showing**: Danh sách phim đang chiếu
- **Coming Soon**: Phim sắp chiếu
- **Promotions**: Khuyến mãi và ưu đãi
- **Quick Book**: Form đặt vé nhanh
- **Theater Locations**: Vị trí rạp chiếu

#### State Management:
```javascript
const homeState = {
  featuredMovies: [],
  nowShowing: [],
  comingSoon: [],
  promotions: [],
  theaters: [],
  loading: false,
  error: null
}
```

### 2. Danh Sách Phim (Movies Page)
**Đường dẫn**: `/movies`
**Mục đích**: Duyệt và tìm kiếm phim

#### Thành phần chính:
- **Search Bar**: Tìm kiếm theo tên, diễn viên, đạo diễn
- **Filter Panel**: 
  - Thể loại (Action, Drama, Comedy, etc.)
  - Ngôn ngữ (Tiếng Việt, English, Korean, etc.)
  - Thời gian chiếu
  - Độ tuổi phù hợp
- **Movie Grid**: Hiển thị danh sách phim dạng grid
- **Movie Card**: Poster, tên, thể loại, đánh giá, nút đặt vé

#### Features:
- Infinite scrolling/Pagination
- Sort by: Tên, ngày phát hành, đánh giá
- View modes: Grid/List view
- Favorite movies (cho user đã login)

### 3. Chi Tiết Phim (Movie Detail Page)
**Đường dẫn**: `/movies/:id`
**Mục đích**: Thông tin chi tiết và đặt vé

#### Thành phần chính:
- **Movie Header**: Poster lớn, trailer, thông tin cơ bản
- **Synopsis**: Tóm tắt nội dung phim
- **Cast & Crew**: Diễn viên, đạo diễn
- **Reviews & Ratings**: Đánh giá của người dùng
- **Showtimes**: Lịch chiếu theo rạp và thời gian
- **Book Now Button**: Nút đặt vé prominently placed

#### Interactive Elements:
- Trailer player (embedded YouTube/Vimeo)
- Image gallery
- Rating system (1-5 stars)
- Share buttons (social media)
- Add to favorites

### 4. Quy Trình Đặt Vé (Booking Flow)

#### 4.1 Chọn Suất Chiếu (`/booking/showtimes/:movieId`)
- **Theater Selection**: Chọn rạp chiếu
- **Date Picker**: Chọn ngày xem
- **Time Slots**: Các suất chiếu trong ngày
- **Price Display**: Hiển thị giá vé theo loại ghế

#### 4.2 Chọn Ghế (`/booking/seats/:showtimeId`)
- **Seat Map**: Sơ đồ ghế tương tác
- **Seat Categories**: Gold, Platinum, Box (với màu sắc khác nhau)
- **Selected Seats**: Hiển thị ghế đã chọn
- **Price Calculation**: Tính tổng tiền real-time

#### 4.3 Thông Tin Đặt Vé (`/booking/checkout`)
- **Booking Summary**: Tóm tắt thông tin đặt vé
- **User Information**: Thông tin khách hàng
- **Payment Method**: Phương thức thanh toán (dummy)
- **Terms & Conditions**: Điều khoản sử dụng

#### 4.4 Xác Nhận & E-Ticket (`/booking/confirmation`)
- **Booking Success**: Thông báo đặt vé thành công
- **E-Ticket Display**: Hiển thị vé điện tử
- **Download/Print**: Tải xuống hoặc in vé
- **Booking Details**: Chi tiết đặt vé

### 5. Tài Khoản Người Dùng (User Account)

#### 5.1 Đăng Ký/Đăng Nhập (`/auth/login`, `/auth/register`)
- **Login Form**: Email/Phone + Password
- **Registration Form**: Thông tin cá nhân đầy đủ
- **Social Login**: Google/Facebook login (optional)
- **Password Reset**: Quên mật khẩu

#### 5.2 Hồ Sơ Cá Nhân (`/profile`)
- **Personal Info**: Tên, email, số điện thoại, tuổi
- **Preferences**: Thành phố ưa thích, ngôn ngữ
- **Change Password**: Đổi mật khẩu
- **Booking History**: Lịch sử đặt vé

#### 5.3 Lịch Sử Đặt Vé (`/profile/bookings`)
- **Upcoming Bookings**: Vé sắp xem
- **Past Bookings**: Vé đã xem
- **Booking Details**: Chi tiết từng vé
- **Cancel Booking**: Hủy vé (nếu có thể)

## ADMIN DASHBOARD

### 1. Dashboard Tổng Quan (`/admin/dashboard`)
**Mục đích**: Overview các metrics quan trọng

#### Thành phần chính:
- **Revenue Cards**: Doanh thu theo ngày/tuần/tháng
- **Booking Stats**: Số lượng vé đã bán
- **Popular Movies**: Top phim bán chạy
- **Theater Performance**: Hiệu suất từng rạp
- **Recent Activity**: Hoạt động gần đây
- **Charts**: Biểu đồ doanh thu, booking trends

### 2. Quản Lý Phim (`/admin/movies`)

#### 2.1 Danh Sách Phim
- **Data Table**: Hiển thị danh sách phim với pagination
- **Search & Filter**: Tìm kiếm, lọc theo status, thể loại
- **Bulk Actions**: Xóa nhiều, thay đổi status hàng loạt
- **Action Buttons**: Edit, Delete, View details

#### 2.2 Thêm/Sửa Phim (`/admin/movies/create`, `/admin/movies/:id/edit`)
```javascript
const movieForm = {
  title: '',
  synopsis: '',
  duration: '',
  genre: [],
  language: '',
  rating: '',
  releaseDate: '',
  poster: null,
  trailer: '',
  cast: [],
  director: '',
  status: 'active' // active, inactive, coming_soon
}
```

### 3. Quản Lý Rạp Chiếu (`/admin/theaters`)

#### 3.1 Danh Sách Rạp
- **Theater Cards**: Hiển thị thông tin rạp dạng card
- **Location Filter**: Lọc theo thành phố
- **Capacity Display**: Hiển thị sức chứa

#### 3.2 Thêm/Sửa Rạp (`/admin/theaters/create`, `/admin/theaters/:id/edit`)
```javascript
const theaterForm = {
  name: '',
  address: '',
  city: '',
  totalSeats: '',
  seatConfiguration: {
    gold: 100,
    platinum: 50,
    box: 20
  },
  facilities: [],
  status: 'active'
}
```

### 4. Quản Lý Suất Chiếu (`/admin/showtimes`)

#### 4.1 Calendar View
- **Monthly Calendar**: Hiển thị lịch chiếu theo tháng
- **Daily Schedule**: Chi tiết suất chiếu trong ngày
- **Theater Filter**: Lọc theo rạp chiếu

#### 4.2 Thêm Suất Chiếu (`/admin/showtimes/create`)
```javascript
const showtimeForm = {
  movieId: '',
  theaterId: '',
  date: '',
  time: '',
  prices: {
    gold: 120000,
    platinum: 150000,
    box: 200000
  }
}
```

### 5. Quản Lý Đánh Giá (`/admin/reviews`)
- **Reviews Table**: Danh sách đánh giá cần kiểm duyệt
- **Moderation Actions**: Approve, Reject, Delete
- **Filter Options**: Theo phim, rating, status

### 6. Báo Cáo & Thống Kê (`/admin/reports`)

#### 6.1 Revenue Reports
- **Daily/Weekly/Monthly**: Báo cáo doanh thu theo thời gian
- **Theater Performance**: So sánh hiệu suất các rạp
- **Movie Performance**: Phim bán chạy nhất

#### 6.2 User Analytics
- **Registration Trends**: Xu hướng đăng ký người dùng
- **Booking Patterns**: Mẫu đặt vé của khách hàng
- **Popular Times**: Khung giờ đặt vé nhiều nhất

## Responsive Design

### Breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile-First Approach:
- Touch-friendly buttons và inputs
- Simplified navigation với hamburger menu
- Optimized image sizes
- Swipe gestures cho carousels

## State Management Strategy

### Global State (Redux/Context):
```javascript
const globalState = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  movies: {
    list: [],
    featured: [],
    filters: {}
  },
  booking: {
    selectedMovie: null,
    selectedShowtime: null,
    selectedSeats: [],
    bookingInfo: {}
  },
  ui: {
    loading: false,
    notifications: [],
    modals: {}
  }
}
```

### Component-Level State:
- Form inputs và validation
- UI interactions (dropdowns, tabs)
- Local loading states
- Temporary data

## API Integration

### Services Structure:
```javascript
// services/api.js
const API = {
  auth: {
    login: (credentials) => post('/auth/login', credentials),
    register: (userData) => post('/auth/register', userData),
    logout: () => post('/auth/logout')
  },
  movies: {
    getAll: (filters) => get('/movies', { params: filters }),
    getById: (id) => get(`/movies/${id}`),
    getShowtimes: (id) => get(`/movies/${id}/showtimes`)
  },
  booking: {
    getSeats: (showtimeId) => get(`/showtimes/${showtimeId}/seats`),
    createBooking: (bookingData) => post('/bookings', bookingData)
  }
}
```

## Performance Optimization

### Code Splitting:
```javascript
// Lazy load admin pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const MovieManagement = lazy(() => import('../pages/admin/Movies'));

// Route-based splitting
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/admin/*" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

### Optimization Strategies:
- **Image optimization**: WebP format, lazy loading
- **Bundle optimization**: Code splitting, tree shaking
- **Caching**: API response caching, service worker
- **Virtualization**: Virtual scrolling cho long lists

## Security Considerations

### Authentication:
- JWT token storage trong httpOnly cookies
- Auto-logout sau thời gian nhất định
- Route guards cho protected pages

### Input Validation:
```javascript
// Form validation với Formik + Yup
const movieValidation = Yup.object({
  title: Yup.string().required('Tên phim là bắt buộc'),
  duration: Yup.number().positive().required('Thời lượng không hợp lệ'),
  releaseDate: Yup.date().required('Ngày khởi chiếu là bắt buộc')
});
```

### XSS Protection:
- Sanitize user inputs
- Content Security Policy headers
- Escape HTML trong reviews/comments

# CineBook Backend - Mô Tả Chi Tiết Laravel API

## Tổng Quan Backend

Backend CineBook được xây dựng trên Laravel 10, cung cấp RESTful API để phục vụ cả User interface và Admin dashboard. Hệ thống được thiết kế theo kiến trúc MVC với các best practices của Laravel.

## Kiến Trúc Backend

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── API/
│   │   │   ├── AuthController.php
│   │   │   ├── MovieController.php
│   │   │   ├── BookingController.php
│   │   │   └── Admin/
│   │   │       ├── AdminController.php
│   │   │       ├── MovieManagementController.php
│   │   │       ├── TheaterManagementController.php
│   │   │       └── ReportController.php
│   │   ├── Middleware/
│   │   └── Requests/
│   │       ├── Auth/
│   │       ├── Booking/
│   │       └── Admin/
├── Models/
│   ├── User.php
│   ├── Movie.php
│   ├── Theater.php
│   ├── Showtime.php
│   ├── Booking.php
│   ├── Seat.php
│   └── Review.php
├── Services/
│   ├── AuthService.php
│   ├── BookingService.php
│   ├── PaymentService.php
│   └── NotificationService.php
├── Jobs/
├── Mail/
└── Exceptions/

database/
├── migrations/
├── seeders/
└── factories/

routes/
├── api.php
├── web.php
└── admin.php
```

## Database Design

### 1. Users Table
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    preferred_city VARCHAR(100),
    preferred_language VARCHAR(20) DEFAULT 'vi',
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Movies Table
```sql
CREATE TABLE movies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    synopsis TEXT,
    duration INT NOT NULL, -- minutes
    genre JSON, -- ['Action', 'Drama']
    language VARCHAR(50) NOT NULL,
    age_rating VARCHAR(10), -- G, PG, PG-13, R
    release_date DATE NOT NULL,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    cast JSON, -- [{'name': 'Actor Name', 'role': 'Character'}]
    director VARCHAR(255),
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    status ENUM('active', 'inactive', 'coming_soon') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Theaters Table
```sql
CREATE TABLE theaters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL,
    seat_configuration JSON, -- {'gold': 100, 'platinum': 50, 'box': 20}
    facilities JSON, -- ['3D', 'IMAX', 'Dolby Atmos']
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4. Showtimes Table
```sql
CREATE TABLE showtimes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movie_id BIGINT UNSIGNED NOT NULL,
    theater_id BIGINT UNSIGNED NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    prices JSON, -- {'gold': 120000, 'platinum': 150000, 'box': 200000}
    available_seats JSON, -- Track available seats
    status ENUM('active', 'cancelled', 'full') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (theater_id) REFERENCES theaters(id) ON DELETE CASCADE,
    INDEX idx_showtime_lookup (show_date, theater_id, movie_id)
);
```

### 5. Bookings Table
```sql
CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    showtime_id BIGINT UNSIGNED NOT NULL,
    seats JSON NOT NULL, -- [{'seat': 'A1', 'type': 'gold', 'price': 120000}]
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    booking_status ENUM('confirmed', 'cancelled', 'used') DEFAULT 'confirmed',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE CASCADE
);
```

### 6. Reviews Table
```sql
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    movie_id BIGINT UNSIGNED NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie_review (user_id, movie_id)
);
```

## API Endpoints

### 1. Authentication APIs

#### POST `/api/auth/register`
```php
// RegisterRequest validation
{
    "name": "required|string|max:255",
    "email": "required|email|unique:users",
    "phone": "required|string|unique:users",
    "password": "required|min:8|confirmed",
    "date_of_birth": "nullable|date",
    "preferred_city": "nullable|string"
}

// Response
{
    "success": true,
    "data": {
        "user": {...},
        "token": "bearer_token_here"
    },
    "message": "Đăng ký thành công"
}
```

#### POST `/api/auth/login`
```php
// LoginRequest validation
{
    "email": "required|email",
    "password": "required"
}

// Response
{
    "success": true,
    "data": {
        "user": {...},
        "token": "bearer_token_here"
    },
    "message": "Đăng nhập thành công"
}
```

### 2. Movie APIs

#### GET `/api/movies`
```php
// Query parameters
{
    "search": "optional|string",
    "genre": "optional|array",
    "language": "optional|string",
    "city": "optional|string",
    "status": "optional|in:active,coming_soon",
    "sort_by": "optional|in:title,release_date,rating",
    "sort_order": "optional|in:asc,desc",
    "per_page": "optional|integer|max:50"
}

// Response
{
    "success": true,
    "data": {
        "movies": [...],
        "pagination": {...}
    }
}
```

#### GET `/api/movies/{id}`
```php
// Response includes full movie details + showtimes
{
    "success": true,
    "data": {
        "movie": {...},
        "showtimes": [...],
        "reviews": [...]
    }
}
```

### 3. Booking APIs

#### GET `/api/showtimes/{id}/seats`
```php
// Response
{
    "success": true,
    "data": {
        "showtime": {...},
        "seat_map": {
            "gold": {
                "available": ["A1", "A2", "A3"],
                "occupied": ["A4", "A5"],
                "selected": [],
                "price": 120000
            },
            "platinum": {...},
            "box": {...}
        }
    }
}
```

#### POST `/api/bookings`
```php
// CreateBookingRequest validation
{
    "showtime_id": "required|exists:showtimes,id",
    "seats": "required|array|min:1",
    "seats.*.seat": "required|string",
    "seats.*.type": "required|in:gold,platinum,box",
    "payment_method": "required|string"
}

// Response
{
    "success": true,
    "data": {
        "booking": {...},
        "e_ticket": {...}
    },
    "message": "Đặt vé thành công"
}
```

### 4. Admin APIs

#### GET `/api/admin/dashboard/stats`
```php
// Response
{
    "success": true,
    "data": {
        "revenue": {
            "today": 15000000,
            "this_week": 105000000,
            "this_month": 450000000
        },
        "bookings": {
            "today": 250,
            "this_week": 1750,
            "this_month": 7500
        },
        "popular_movies": [...],
        "theater_performance": [...]
    }
}
```

#### POST `/api/admin/movies`
```php
// CreateMovieRequest validation
{
    "title": "required|string|max:255",
    "synopsis": "required|string",
    "duration": "required|integer|min:1",
    "genre": "required|array",
    "language": "required|string",
    "age_rating": "required|string",
    "release_date": "required|date",
    "poster": "nullable|image|max:2048",
    "trailer_url": "nullable|url",
    "cast": "required|array",
    "director": "required|string"
}
```

## Services Layer

### 1. BookingService
```php
<?php

class BookingService
{
    public function checkSeatAvailability($showtimeId, $seats)
    {
        // Check if selected seats are still available
        // Lock seats temporarily during booking process
    }
    
    public function calculatePrice($seats, $showtime)
    {
        // Calculate total price based on seat types and pricing
        // Apply discounts if any
    }
    
    public function createBooking($userId, $bookingData)
    {
        // Create booking with transaction
        // Update seat availability
        // Generate booking code
        // Send confirmation email
    }
    
    public function generateETicket($booking)
    {
        // Generate QR code
        // Create PDF ticket
        // Return ticket data
    }
}
```

### 2. NotificationService
```php
<?php

class NotificationService
{
    public function sendBookingConfirmation($booking)
    {
        // Send email confirmation
        // Send SMS if phone provided
    }
    
    public function sendShowReminder($booking)
    {
        // Send reminder 2 hours before show
        // Queue background job
    }
    
    public function sendPromotionalOffers($users, $offer)
    {
        // Send promotional notifications
        // Respect user notification preferences
    }
}
```

## Middleware

### 1. Authentication Middleware
```php
<?php

class AuthMiddleware
{
    public function handle($request, Closure $next, ...$guards)
    {
        // Verify JWT token
        // Set authenticated user
        // Check user status (active/inactive)
    }
}
```

### 2. Admin Middleware
```php
<?php

class AdminMiddleware
{
    public function handle($request, Closure $next)
    {
        if (!auth()->user() || auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        return $next($request);
    }
}
```

## Background Jobs

### 1. Seat Lock Job
```php
<?php

class ReleaseSeatLockJob implements ShouldQueue
{
    protected $showtimeId;
    protected $seats;
    
    public function handle()
    {
        // Release locked seats after 15 minutes
        // If booking not completed
    }
}
```

### 2. Show Reminder Job
```php
<?php

class SendShowReminderJob implements ShouldQueue
{
    protected $booking;
    
    public function handle()
    {
        // Send reminder 2 hours before show
        // Mark reminder as sent
    }
}
```

## Validation Rules

### Custom Validation Rules
```php
<?php

class PhoneNumberRule implements Rule
{
    public function passes($attribute, $value)
    {
        // Vietnamese phone number validation
        return preg_match('/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/', $value);
    }
    
    public function message()
    {
        return 'Số điện thoại không đúng định dạng.';
    }
}

class SeatAvailabilityRule implements Rule
{
    protected $showtimeId;
    
    public function __construct($showtimeId)
    {
        $this->showtimeId = $showtimeId;
    }
    
    public function passes($attribute, $value)
    {
        // Check if seats are available for the showtime
        return BookingService::checkSeatAvailability($this->showtimeId, $value);
    }
}
```

## Error Handling

### Custom Exception Handler
```php
<?php

class Handler extends ExceptionHandler
{
    public function render($request, Throwable $exception)
    {
        if ($request->is('api/*')) {
            if ($exception instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $exception->errors()
                ], 422);
            }
            
            if ($exception instanceof ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy dữ liệu'
                ], 404);
            }
        }
        
        return parent::render($request, $exception);
    }
}
```

## Caching Strategy

### 1. Movie List Caching
```php
<?php

public function getMovies($filters = [])
{
    $cacheKey = 'movies:' . md5(serialize($filters));
    
    return Cache::remember($cacheKey, 3600, function () use ($filters) {
        return Movie::with(['reviews'])
            ->when($filters['genre'] ?? null, function ($query, $genre) {
                $query->whereJsonContains('genre', $genre);
            })
            ->get();
    });
}
```

### 2. Seat Availability Caching
```php
<?php

public function getSeatAvailability($showtimeId)
{
    $cacheKey = "seats:showtime:{$showtimeId}";
    
    return Cache::remember($cacheKey, 300, function () use ($showtimeId) {
        // Get seat availability
        // Cache for 5 minutes only due to frequent updates
    });
}
```

## Security Measures

### 1. Rate Limiting
```php
// In RouteServiceProvider
Route::middleware(['throttle:60,1'])->group(function () {
    // API routes with rate limiting
});

// Custom rate limiting for booking
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
});
```

### 2. Input Sanitization
```php
<?php

class SanitizeInput
{
    public function handle($request, Closure $next)
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$value) {
            $value = strip_tags($value);
            $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        });
        
        $request->merge($input);
        return $next($request);
    }
}
```

## Performance Optimization

### 1. Database Optimization
- Index on frequently queried columns
- Eager loading relationships
- Query optimization with explain
- Database connection pooling

### 2. API Response Optimization
```php
<?php

// Use API Resources for consistent responses
class MovieResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'poster_url' => $this->poster_url,
            'average_rating' => (float) $this->average_rating,
            'showtimes' => ShowtimeResource::collection($this->whenLoaded('showtimes')),
        ];
    }
}
```

### 3. Monitoring & Logging
```php
<?php

// Log important events
Log::info('Booking created', [
    'booking_id' => $booking->id,
    'user_id' => $booking->user_id,
    'total_amount' => $booking->total_amount
]);

// Performance monitoring
DB::listen(function ($query) {
    if ($query->time > 1000) {
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'time' => $query->time
        ]);
    }
});
```
# CineBook UI/UX Design - Thiết Kế Giao Diện Người Dùng

## Tổng Quan UI/UX Design

Thiết kế UI/UX của CineBook lấy cảm hứng từ các cinema booking website hàng đầu như Galaxy Cinema, với focus vào trải nghiệm người dùng mượt mà, hiện đại và phù hợp với thị trường Việt Nam.

## Nguyên Tắc Thiết Kế

### 1. Design Principles
- **User-Centric**: Đặt người dùng làm trung tâm trong mọi quyết định thiết kế
- **Simplicity**: Giao diện đơn giản, dễ hiểu và dễ sử dụng
- **Consistency**: Nhất quán trong toàn bộ hệ thống
- **Accessibility**: Đảm bảo accessibility cho tất cả người dùng
- **Mobile-First**: Thiết kế tối ưu cho mobile trước

### 2. Visual Hierarchy
- Sử dụng typography, màu sắc và spacing để tạo hierarchy rõ ràng
- CTA buttons nổi bật và dễ nhận diện
- Thông tin quan trọng được highlight appropriately

## Color Palette

### Primary Colors
```css
:root {
  --primary-red: #E50914;        /* Netflix-inspired red for CTA */
  --primary-dark: #141414;       /* Dark background */
  --primary-gold: #FFD700;       /* Premium accent */
  
  --secondary-gray: #2F2F2F;     /* Secondary backgrounds */
  --text-white: #FFFFFF;         /* Primary text on dark */
  --text-gray: #CCCCCC;          /* Secondary text */
  --text-muted: #8C8C8C;         /* Muted text */
  
  --success-green: #46D369;      /* Success states */
  --warning-orange: #FF9500;     /* Warning states */
  --error-red: #FF3B30;          /* Error states */
}
```

### Usage Guidelines
- **Primary Red**: CTA buttons, active states, important highlights
- **Dark Backgrounds**: Main backgrounds để tạo cinema atmosphere
- **Gold Accents**: Premium features, ratings, special offers
- **Gray Variations**: Cards, modals, secondary elements

## Typography

### Font Family
```css
font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Typography Scale
```css
/* Headings */
.heading-xl { font-size: 48px; font-weight: 700; line-height: 1.2; }
.heading-lg { font-size: 36px; font-weight: 600; line-height: 1.3; }
.heading-md { font-size: 24px; font-weight: 600; line-height: 1.4; }
.heading-sm { font-size: 20px; font-weight: 500; line-height: 1.4; }

/* Body Text */
.body-lg { font-size: 18px; font-weight: 400; line-height: 1.6; }
.body-md { font-size: 16px; font-weight: 400; line-height: 1.6; }
.body-sm { font-size: 14px; font-weight: 400; line-height: 1.5; }
.body-xs { font-size: 12px; font-weight: 400; line-height: 1.4; }

/* Special */
.caption { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
```

## Layout System

### Grid System
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .container { padding: 0 16px; }
}

.grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

### Spacing System
```css
/* Spacing scale (8px base) */
.spacing-xs { margin/padding: 8px; }
.spacing-sm { margin/padding: 16px; }
.spacing-md { margin/padding: 24px; }
.spacing-lg { margin/padding: 32px; }
.spacing-xl { margin/padding: 48px; }
.spacing-xxl { margin/padding: 64px; }
```

## Component Design

### 1. Navigation Header

#### Desktop Header
```
┌─────────────────────────────────────────────────────────────────────┐
│ [LOGO] [Phim] [Rạp] [Khuyến Mãi]     [Search] [Login] [Language] │
└─────────────────────────────────────────────────────────────────────┘
```

#### Mobile Header
```
┌─────────────────────────────────────┐
│ [☰] [LOGO]           [🔍] [👤]    │
└─────────────────────────────────────┘
```

**Design Specs:**
- Height: 80px (desktop), 60px (mobile)
- Background: Dark with slight transparency on scroll
- Logo: 120px width
- Sticky positioning

### 2. Hero Section

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FEATURED MOVIE BANNER                             │
│                                                                     │
│  ┌──────────────┐   MOVIE TITLE                                   │
│  │              │   Genre | Duration | Rating                      │
│  │   POSTER     │                                                  │
│  │   IMAGE      │   Brief synopsis text...                        │
│  │              │                                                  │
│  └──────────────┘   [▶ Trailer] [🎫 Đặt Vé Ngay]               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Height: 60vh (desktop), 40vh (mobile)
- Background: Movie poster với overlay gradient
- CTA button: Primary red, prominent positioning

### 3. Movie Cards

#### Grid Layout
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│              │ │              │ │              │
│    POSTER    │ │    POSTER    │ │    POSTER    │
│    IMAGE     │ │    IMAGE     │ │    IMAGE     │
│              │ │              │ │              │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Movie Title  │ │ Movie Title  │ │ Movie Title  │
│ ⭐ 4.5 | 120min │ │ ⭐ 4.2 | 95min  │ │ ⭐ 4.8 | 150min │
│ Action, Drama│ │ Comedy       │ │ Sci-Fi       │
│              │ │              │ │              │
│   [Đặt Vé]   │ │   [Đặt Vé]   │ │   [Đặt Vé]   │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Design Specs:**
- Aspect ratio: 2:3 cho poster
- Card padding: 16px
- Hover effect: Scale 1.05, shadow elevation
- Rating: Gold stars với số rating

### 4. Seat Map Interface

```
                     SCREEN
        ┌─────────────────────────────────┐
        │                                 │
        └─────────────────────────────────┘

BOX     [🟫] [🟫]     [🟫] [🟫]      VIP
        [🟫] [🟫]     [🟫] [🟫]

PLATINUM
  [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦]
  [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦] [🟦]

GOLD
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]
  [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨] [🟨]

Legend: [🟩] Available [🟥] Occupied [🟪] Selected
```

**Design Specs:**
- Seat colors: Gold (#FFD700), Platinum (#E5E4E2), Box (#8B4513)
- Interactive hover states
- Clear legend với pricing
- Mobile: Scrollable horizontal + pinch zoom

### 5. Booking Progress Indicator

```
┌──────────────────────────────────────────────────────────────┐
│ ① Chọn Phim → ② Chọn Suất → ③ Chọn Ghế → ④ Thanh Toán      │
│ ● ────────── ● ────────── ◯ ────────── ◯                   │
└──────────────────────────────────────────────────────────────┘
```

**States:**
- Completed: Green circle với checkmark
- Current: Primary red circle
- Upcoming: Gray circle outline

## Page-Specific Designs

### 1. Homepage

#### Structure
```
┌─────────────────────────────────────────────────┐
│                 HEADER                          │
├─────────────────────────────────────────────────┤
│                HERO SECTION                     │
│              Featured Movie                     │
├─────────────────────────────────────────────────┤
│               QUICK BOOKING                     │
│    [City] [Movie] [Date] [Theater] [Search]     │
├─────────────────────────────────────────────────┤
│              NOW SHOWING                        │
│          Movie Grid (2x4 desktop)              │
├─────────────────────────────────────────────────┤
│              COMING SOON                        │
│            Horizontal Scroll                    │
├─────────────────────────────────────────────────┤
│               PROMOTIONS                        │
│          Banner Carousel                        │
├─────────────────────────────────────────────────┤
│                FOOTER                           │
└─────────────────────────────────────────────────┘
```

### 2. Movie Listing Page

#### Desktop Layout
```
┌─────────────────┬───────────────────────────────────┐
│                 │                                   │
│    FILTERS      │          MOVIE GRID               │
│                 │                                   │
│   • Genre       │  [Movie] [Movie] [Movie] [Movie]  │
│   • Language    │  [Movie] [Movie] [Movie] [Movie]  │
│   • Rating      │  [Movie] [Movie] [Movie] [Movie]  │
│   • City        │                                   │
│   • Date        │          [Load More]             │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

#### Mobile Layout
```
┌─────────────────────────────────────┐
│           [🔍] [Filter]             │
├─────────────────────────────────────┤
│  [Movie]              [Movie]       │
│  [Movie]              [Movie]       │
│  [Movie]              [Movie]       │
│                                     │
│            [Load More]              │
└─────────────────────────────────────┘
```

### 3. Movie Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────┐  MOVIE TITLE               [▶ Trailer]    │
│  │ POSTER  │  Genre | Duration | Rating                │
│  │ IMAGE   │                                           │
│  │         │  Synopsis text here...                   │
│  └─────────┘                                           │
├─────────────────────────────────────────────────────────┤
│                 CAST & CREW                            │
│  [Actor] [Actor] [Actor] [Director]                    │
├─────────────────────────────────────────────────────────┤
│                 SHOWTIMES                              │
│  Theater 1: [10:00] [13:00] [16:00] [19:00]           │
│  Theater 2: [11:00] [14:00] [17:00] [20:00]           │
├─────────────────────────────────────────────────────────┤
│                REVIEWS (4.5 ⭐)                       │
│  [Review 1] [Review 2] [Review 3] [All Reviews]       │
└─────────────────────────────────────────────────────────┘
```

### 4. Admin Dashboard

#### Layout Structure
```
┌──────┬─────────────────────────────────────────────────┐
│      │                 HEADER                          │
│ SIDE ├─────────────────────────────────────────────────┤
│ BAR  │                METRICS CARDS                    │
│      │  [Revenue] [Bookings] [Movies] [Users]          │
│      ├─────────────────────────────────────────────────┤
│      │              CHARTS SECTION                     │
│      │  ┌───────────────┐  ┌────────────────────┐      │
│      │  │ Revenue Chart │  │ Popular Movies     │      │
│      │  └───────────────┘  └────────────────────┘      │
│      ├─────────────────────────────────────────────────┤
│      │             RECENT ACTIVITY                     │
│      │        Recent Bookings Table                    │
└──────┴─────────────────────────────────────────────────┘
```

## Interactive Elements

### 1. Buttons

#### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #E50914, #B81319);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(229, 9, 20, 0.4);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #CCCCCC;
  border: 2px solid #2F2F2F;
  padding: 12px 24px;
  border-radius: 8px;
}

.btn-secondary:hover {
  border-color: #E50914;
  color: #E50914;
}
```

### 2. Form Inputs

```css
.form-input {
  background: #2F2F2F;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: 16px;
}

.form-input:focus {
  border-color: #E50914;
  outline: none;
  box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
}
```

### 3. Modal Design

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.modal-content {
  background: #1F1F1F;
  border-radius: 12px;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}
```

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
.mobile-up    { min-width: 0px; }      /* 0px+ */
.tablet-up    { min-width: 768px; }    /* 768px+ */
.desktop-up   { min-width: 1024px; }   /* 1024px+ */
.large-up     { min-width: 1200px; }   /* 1200px+ */
```

### Mobile Optimizations
- **Navigation**: Hamburger menu với slide-out sidebar
- **Cards**: Stack vertically với full width
- **Booking Flow**: Step-by-step với clear progress
- **Touch Targets**: Minimum 44px height cho tap targets
- **Typography**: Larger font sizes cho readability

## Animation & Transitions

### 1. Page Transitions
```css
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.3s ease;
}
```

### 2. Loading States
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.skeleton {
  background: linear-gradient(90deg, #2F2F2F 25%, #3F3F3F 50%, #2F2F2F 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. Microinteractions
- **Hover Effects**: Subtle scale và shadow changes
- **Button Press**: Scale down 0.98 on active
- **Form Focus**: Smooth border color transitions
- **Toast Notifications**: Slide in from top-right

## Accessibility (A11y)

### 1. Color Contrast
- Text on dark background: Minimum 4.5:1 ratio
- CTA buttons: High contrast với background
- Focus states: Visible focus indicators

### 2. Keyboard Navigation
- Tab order logical và intuitive
- Skip links for main content
- Arrow key navigation cho seat selection

### 3. Screen Reader Support
```html
<!-- Example -->
<button aria-label="Đặt vé cho phim Avengers">
  Đặt Vé
</button>

<div role="tabpanel" aria-labelledby="showtimes-tab">
  <!-- Showtimes content -->
</div>
```

### 4. ARIA Labels
- Form inputs có proper labels
- Dynamic content updates announced
- Status messages cho booking process

## Performance Considerations

### 1. Image Optimization
- WebP format với fallback
- Responsive images với srcset
- Lazy loading cho images below fold
- Placeholder blur effect while loading

### 2. Critical Path
- Above-fold content loads first
- Critical CSS inlined
- Non-critical resources deferred

### 3. Loading States
- Skeleton screens cho content loading
- Progressive loading cho image galleries
- Optimistic updates cho user actions

# CineBook Testing - Checklist Tính Năng Từng Page

## Tổng Quan Testing Strategy

Testing checklist này bao gồm tất cả các test cases cho từng page và tính năng của CineBook, đảm bảo chất lượng và độ tin cậy của hệ thống trước khi triển khai.

## Phase 1: Authentication Testing

### 1.1 Login Page (`/login`)

#### Functional Testing
- [ ] **Valid Login Scenarios**
  - [ ] Login với email và password đúng
  - [ ] Login với phone number và password đúng
  - [ ] "Remember me" checkbox hoạt động correctly
  - [ ] Redirect to intended page after login
  - [ ] Login state persistent across browser sessions

- [ ] **Invalid Login Scenarios**
  - [ ] Login với email không tồn tại
  - [ ] Login với password sai
  - [ ] Login với email format sai
  - [ ] Empty email field validation
  - [ ] Empty password field validation
  - [ ] Account disabled/inactive handling

- [ ] **UI/UX Testing**
  - [ ] Error messages hiển thị chính xác
  - [ ] Loading state during login request
  - [ ] Password show/hide toggle functionality
  - [ ] Forgot password link navigation
  - [ ] Register link navigation
  - [ ] Social login buttons (UI only)

#### Security Testing
- [ ] Password không hiển thị trong plain text
- [ ] No sensitive data trong network requests
- [ ] Protection against brute force attacks
- [ ] XSS protection trong form inputs
- [ ] CSRF token validation

#### Performance Testing
- [ ] Login response time < 2 seconds
- [ ] Form submission không bị double-click
- [ ] Proper error handling for network failures

#### Mobile Testing
- [ ] Touch-friendly form inputs
- [ ] Virtual keyboard behavior
- [ ] Portrait/landscape orientation
- [ ] Small screen layout optimization

### 1.2 Register Page (`/register`)

#### Functional Testing
- [ ] **Valid Registration Scenarios**
  - [ ] Successful registration với all required fields
  - [ ] Email verification process (if implemented)
  - [ ] Auto-login after successful registration
  - [ ] Welcome email sent (if implemented)

- [ ] **Form Validation Testing**
  - [ ] Name field validation (required, length)
  - [ ] Email format validation
  - [ ] Email uniqueness check
  - [ ] Phone number format validation (Vietnamese)
  - [ ] Phone number uniqueness check
  - [ ] Password strength validation
  - [ ] Password confirmation matching
  - [ ] Date of birth validation
  - [ ] Terms & conditions checkbox required

- [ ] **Error Handling**
  - [ ] Duplicate email error message
  - [ ] Duplicate phone error message
  - [ ] Network error handling
  - [ ] Server error handling
  - [ ] Field-specific error messages

#### UI/UX Testing
- [ ] Progressive form validation
- [ ] Password strength indicator
- [ ] Clear error message display
- [ ] Success confirmation message
- [ ] Loading state during registration
- [ ] Terms & conditions modal/link

### 1.3 Profile Management (`/profile`)

#### Functional Testing
- [ ] **View Profile**
  - [ ] Display current user information
  - [ ] Profile picture display (if implemented)
  - [ ] Booking history access

- [ ] **Update Profile**
  - [ ] Edit name functionality
  - [ ] Edit phone number functionality
  - [ ] Edit preferences (city, language)
  - [ ] Profile picture upload (if implemented)
  - [ ] Changes saved successfully
  - [ ] Real-time UI updates

- [ ] **Change Password**
  - [ ] Current password validation
  - [ ] New password strength validation
  - [ ] Password confirmation matching
  - [ ] Success notification
  - [ ] Auto-logout after password change (optional)

## Phase 2: Movie Browsing Testing

### 2.1 Homepage (`/`)

#### Functional Testing
- [ ] **Hero Section**
  - [ ] Featured movie display
  - [ ] Movie information accuracy
  - [ ] Trailer play button functionality
  - [ ] "Book Now" button navigation
  - [ ] Auto-rotation of featured movies

- [ ] **Now Showing Section**
  - [ ] Display current movies correctly
  - [ ] Movie card information accuracy
  - [ ] "Book Ticket" button functionality
  - [ ] Grid layout responsive behavior
  - [ ] "View All" navigation

- [ ] **Coming Soon Section**
  - [ ] Display upcoming movies
  - [ ] Release date accuracy
  - [ ] Horizontal scroll functionality
  - [ ] Navigation arrows
  - [ ] "Notify Me" functionality (if implemented)

- [ ] **Quick Booking Form**
  - [ ] City selection dropdown
  - [ ] Movie search/selection
  - [ ] Date picker functionality
  - [ ] Theater selection
  - [ ] Search button navigation

#### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Image loading optimization
- [ ] Smooth scrolling animations
- [ ] No layout shift during loading

#### SEO Testing
- [ ] Proper meta tags
- [ ] Structured data markup
- [ ] Image alt tags
- [ ] Semantic HTML structure

### 2.2 Movie Listing Page (`/movies`)

#### Functional Testing
- [ ] **Movie Display**
  - [ ] All movies displayed correctly
  - [ ] Movie information accuracy
  - [ ] Poster image loading
  - [ ] Ratings display
  - [ ] Genre tags display

- [ ] **Search Functionality**
  - [ ] Search by movie title
  - [ ] Search by actor name
  - [ ] Search by director name
  - [ ] Search debouncing functionality
  - [ ] Search results accuracy
  - [ ] Empty search results handling

- [ ] **Filter Functionality**
  - [ ] Genre filter works correctly
  - [ ] Language filter functionality
  - [ ] Rating filter accuracy
  - [ ] City/location filter
  - [ ] Date range filter
  - [ ] Multiple filters combination
  - [ ] Clear all filters functionality

- [ ] **Sort Functionality**
  - [ ] Sort by title (A-Z, Z-A)
  - [ ] Sort by release date (newest, oldest)
  - [ ] Sort by rating (highest, lowest)
  - [ ] Sort by popularity (if implemented)

- [ ] **Pagination/Loading**
  - [ ] Pagination controls work
  - [ ] Infinite scroll functionality (if implemented)
  - [ ] Load more button functionality
  - [ ] Loading states display correctly

#### UI/UX Testing
- [ ] Filter panel responsive behavior
- [ ] Mobile filter overlay
- [ ] Grid/List view toggle (if implemented)
- [ ] Movie card hover effects
- [ ] Loading skeleton screens
- [ ] Empty state display

### 2.3 Movie Detail Page (`/movies/:id`)

#### Functional Testing
- [ ] **Movie Information Display**
  - [ ] Movie title, poster, trailer
  - [ ] Synopsis, cast, director information
  - [ ] Genre, duration, rating display
  - [ ] Release date accuracy
  - [ ] Age rating display

- [ ] **Trailer Functionality**
  - [ ] Trailer modal opens correctly
  - [ ] Video player controls work
  - [ ] Modal close functionality
  - [ ] Responsive video player

- [ ] **Showtimes Display**
  - [ ] Available showtimes accuracy
  - [ ] Theater grouping correct
  - [ ] Date selection functionality
  - [ ] Price information display
  - [ ] "Book Now" button navigation

- [ ] **Reviews Section**
  - [ ] Display existing reviews
  - [ ] Average rating calculation
  - [ ] Review pagination
  - [ ] Add review form (authenticated users)
  - [ ] Review submission functionality
  - [ ] Review moderation (pending status)

#### Data Validation Testing
- [ ] Movie ID validation
- [ ] 404 handling for non-existent movies
- [ ] Proper error messages
- [ ] Related movies suggestions (if implemented)

## Phase 3: Booking System Testing

### 3.1 Showtime Selection (`/booking/showtimes/:movieId`)

#### Functional Testing
- [ ] **Showtime Display**
  - [ ] Correct movie information
  - [ ] Available showtimes accuracy
  - [ ] Theater information display
  - [ ] Date selection functionality
  - [ ] Price information correctness

- [ ] **Selection Process**
  - [ ] Showtime selection functionality
  - [ ] Date picker behavior
  - [ ] Time slot availability
  - [ ] Continue to seat selection
  - [ ] Back navigation functionality

#### Validation Testing
- [ ] Movie ID validation
- [ ] Date validation (no past dates)
- [ ] Showtime availability validation
- [ ] Sold out showtimes handling

### 3.2 Seat Selection (`/booking/seats/:showtimeId`)

#### Functional Testing
- [ ] **Seat Map Display**
  - [ ] Correct theater layout
  - [ ] Seat availability accuracy
  - [ ] Seat category colors (Gold, Platinum, Box)
  - [ ] Screen position indication
  - [ ] Legend/guide display

- [ ] **Seat Selection Process**
  - [ ] Single seat selection
  - [ ] Multiple seat selection
  - [ ] Maximum seat limit (if implemented)
  - [ ] Adjacent seat recommendation
  - [ ] Seat deselection functionality

- [ ] **Price Calculation**
  - [ ] Real-time price updates
  - [ ] Correct pricing per seat type
  - [ ] Total calculation accuracy
  - [ ] Tax calculation (if applicable)

- [ ] **Booking Information**
  - [ ] Selected seats summary
  - [ ] Movie và showtime information
  - [ ] Continue to checkout functionality
  - [ ] Back navigation

#### UI/UX Testing
- [ ] Seat map responsive design
- [ ] Touch-friendly seat selection (mobile)
- [ ] Visual feedback for selection
- [ ] Occupied seat indication
- [ ] Loading states for seat data

#### Real-time Testing
- [ ] Seat availability updates
- [ ] Concurrent user conflict handling
- [ ] Seat locking mechanism (if implemented)
- [ ] Session timeout handling

### 3.3 Checkout Page (`/booking/checkout`)

#### Functional Testing
- [ ] **Booking Summary**
  - [ ] Correct booking information display
  - [ ] Selected seats accuracy
  - [ ] Total price calculation
  - [ ] Movie và theater information

- [ ] **User Information**
  - [ ] Pre-filled user data (logged in users)
  - [ ] Contact information form
  - [ ] Information validation
  - [ ] Guest booking (if implemented)

- [ ] **Payment Process (Dummy)**
  - [ ] Payment method selection
  - [ ] Credit card form validation
  - [ ] Payment simulation
  - [ ] Success/failure scenarios
  - [ ] Payment processing loading

- [ ] **Terms & Conditions**
  - [ ] Terms display/modal
  - [ ] Acceptance checkbox required
  - [ ] Legal information accuracy

#### Security Testing
- [ ] Input validation on all fields
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Sensitive data handling

#### Error Handling Testing
- [ ] Network error scenarios
- [ ] Payment failure handling
- [ ] Seat no longer available
- [ ] Session timeout scenarios

### 3.4 Confirmation Page (`/booking/confirmation`)

#### Functional Testing
- [ ] **Booking Confirmation**
  - [ ] Success message display
  - [ ] Booking ID generation
  - [ ] E-ticket display
  - [ ] Booking details accuracy

- [ ] **E-ticket Features**
  - [ ] QR code generation (if implemented)
  - [ ] Download functionality
  - [ ] Print functionality
  - [ ] Email confirmation (if implemented)

- [ ] **Post-booking Actions**
  - [ ] "Book Another Movie" functionality
  - [ ] Navigate to booking history
  - [ ] Share functionality (if implemented)

### 3.5 Booking History (`/profile/bookings`)

#### Functional Testing
- [ ] **Booking List Display**
  - [ ] All user bookings displayed
  - [ ] Correct booking information
  - [ ] Chronological ordering
  - [ ] Booking status indication

- [ ] **Filtering Options**
  - [ ] Upcoming bookings filter
  - [ ] Past bookings filter
  - [ ] Search functionality
  - [ ] Date range filtering

- [ ] **Booking Actions**
  - [ ] View e-ticket functionality
  - [ ] Cancel booking (if applicable)
  - [ ] Booking details modal
  - [ ] Download ticket options

## Phase 4: Admin Dashboard Testing

### 4.1 Admin Login & Authentication

#### Functional Testing
- [ ] **Admin Login**
  - [ ] Admin role authentication
  - [ ] Admin dashboard access
  - [ ] Regular user access restriction
  - [ ] Admin session management

- [ ] **Security Testing**
  - [ ] Role-based access control
  - [ ] Unauthorized access prevention
  - [ ] Admin privilege validation

### 4.2 Dashboard Overview (`/admin/dashboard`)

#### Functional Testing
- [ ] **Metrics Display**
  - [ ] Revenue statistics accuracy
  - [ ] Booking count correctness
  - [ ] Popular movies data
  - [ ] Theater performance metrics

- [ ] **Charts & Graphs**
  - [ ] Chart data accuracy
  - [ ] Interactive chart functionality
  - [ ] Date range selection
  - [ ] Export functionality (if implemented)

- [ ] **Recent Activity**
  - [ ] Recent bookings display
  - [ ] Real-time updates
  - [ ] Activity detail accuracy

### 4.3 Movie Management (`/admin/movies`)

#### Functional Testing
- [ ] **Movie List**
  - [ ] All movies displayed correctly
  - [ ] Search functionality
  - [ ] Filter options
  - [ ] Pagination functionality
  - [ ] Bulk actions (if implemented)

- [ ] **Add New Movie**
  - [ ] Form validation
  - [ ] Image upload functionality
  - [ ] Movie creation success
  - [ ] Database update verification

- [ ] **Edit Movie**
  - [ ] Pre-populated form data
  - [ ] Update functionality
  - [ ] Image replacement
  - [ ] Changes saved correctly

- [ ] **Delete Movie**
  - [ ] Confirmation dialog
  - [ ] Cascading delete handling
  - [ ] Associated data cleanup
  - [ ] Error handling

#### Data Validation Testing
- [ ] Required fields validation
- [ ] Image file validation
- [ ] Duration validation
- [ ] Release date validation
- [ ] Genre selection validation

### 4.4 Theater Management (`/admin/theaters`)

#### Functional Testing
- [ ] **Theater CRUD Operations**
  - [ ] Create new theater
  - [ ] View theater details
  - [ ] Update theater information
  - [ ] Delete theater (with constraints)

- [ ] **Seat Configuration**
  - [ ] Seat map setup
  - [ ] Seat category configuration
  - [ ] Total seat calculation
  - [ ] Configuration validation

### 4.5 Showtime Management (`/admin/showtimes`)

#### Functional Testing
- [ ] **Showtime Scheduling**
  - [ ] Create new showtimes
  - [ ] Movie selection
  - [ ] Theater selection
  - [ ] Date and time selection
  - [ ] Pricing configuration

- [ ] **Calendar View**
  - [ ] Calendar display accuracy
  - [ ] Showtime visualization
  - [ ] Date navigation
  - [ ] Quick edit functionality

- [ ] **Conflict Detection**
  - [ ] Theater availability checking
  - [ ] Time slot conflicts
  - [ ] Warning notifications
  - [ ] Resolution suggestions

### 4.6 Booking Management (`/admin/bookings`)

#### Functional Testing
- [ ] **Booking List**
  - [ ] All bookings displayed
  - [ ] Booking search functionality
  - [ ] Status filtering
  - [ ] Date range filtering

- [ ] **Booking Details**
  - [ ] Complete booking information
  - [ ] Customer details
  - [ ] Payment status
  - [ ] Ticket status

- [ ] **Booking Actions**
  - [ ] Cancel booking functionality
  - [ ] Refund processing (if implemented)
  - [ ] Status updates
  - [ ] Customer notifications

### 4.7 Reports & Analytics (`/admin/reports`)

#### Functional Testing
- [ ] **Revenue Reports**
  - [ ] Daily/weekly/monthly reports
  - [ ] Accurate calculations
  - [ ] Chart visualizations
  - [ ] Export functionality

- [ ] **Movie Performance**
  - [ ] Popular movies ranking
  - [ ] Box office statistics
  - [ ] Rating analytics
  - [ ] Trend analysis

- [ ] **Theater Performance**
  - [ ] Occupancy rates
  - [ ] Revenue per theater
  - [ ] Seat utilization
  - [ ] Performance comparisons

## Phase 5: Cross-cutting Concerns Testing

### 5.1 Responsive Design Testing

#### Device Testing
- [ ] **Mobile Devices**
  - [ ] iPhone (various sizes)
  - [ ] Android phones
  - [ ] Touch interactions
  - [ ] Gesture support

- [ ] **Tablet Testing**
  - [ ] iPad (various sizes)
  - [ ] Android tablets
  - [ ] Portrait/landscape modes
  - [ ] Touch optimization

- [ ] **Desktop Testing**
  - [ ] Various screen resolutions
  - [ ] Multiple browsers
  - [ ] Keyboard navigation
  - [ ] Mouse interactions

#### Breakpoint Testing
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] Large screens (> 1400px)

### 5.2 Browser Compatibility Testing

#### Modern Browsers
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

#### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

#### Feature Support
- [ ] JavaScript ES6+ features
- [ ] CSS Grid và Flexbox
- [ ] WebP image support
- [ ] Local Storage support

### 5.3 Performance Testing

#### Load Time Testing
- [ ] **Homepage**
  - [ ] First Contentful Paint < 2s
  - [ ] Largest Contentful Paint < 3s
  - [ ] Time to Interactive < 4s

- [ ] **Movie Listing**
  - [ ] Initial load < 2s
  - [ ] Pagination load < 1s
  - [ ] Image loading optimization

- [ ] **Booking Flow**
  - [ ] Seat map load < 2s
  - [ ] Payment processing < 3s
  - [ ] Confirmation load < 1s

#### Core Web Vitals
- [ ] Largest Contentful Paint (LCP)
- [ ] First Input Delay (FID)
- [ ] Cumulative Layout Shift (CLS)

#### Network Testing
- [ ] 3G connection simulation
- [ ] Offline functionality (if PWA)
- [ ] Network error handling
- [ ] Retry mechanisms

### 5.4 Accessibility Testing

#### Screen Reader Testing
- [ ] NVDA compatibility
- [ ] JAWS compatibility
- [ ] VoiceOver compatibility
- [ ] Navigation announcement

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] All interactive elements accessible
- [ ] Skip links functionality
- [ ] Focus indicators visible

#### Color & Contrast
- [ ] WCAG AA compliance (4.5:1)
- [ ] Color blindness simulation
- [ ] High contrast mode
- [ ] Focus indicator contrast

### 5.5 Security Testing

#### Input Validation
- [ ] XSS prevention testing
- [ ] SQL injection testing (backend)
- [ ] CSRF protection
- [ ] File upload security

#### Authentication Security
- [ ] Session management
- [ ] Password security
- [ ] Token expiration
- [ ] Brute force protection

#### Data Protection
- [ ] Sensitive data handling
- [ ] Data encryption in transit
- [ ] Privacy compliance
- [ ] Secure cookies

## Phase 6: Integration Testing

### 6.1 Frontend-Backend Integration

#### API Integration Testing
- [ ] **Authentication APIs**
  - [ ] Login/logout flow
  - [ ] Token refresh
  - [ ] User registration
  - [ ] Profile updates

- [ ] **Movie APIs**
  - [ ] Movie listing
  - [ ] Movie details
  - [ ] Search functionality
  - [ ] Filter operations

- [ ] **Booking APIs**
  - [ ] Seat availability
  - [ ] Booking creation
  - [ ] Payment processing
  - [ ] Booking confirmation

#### Error Handling
- [ ] Network timeouts
- [ ] Server errors (500)
- [ ] Authentication errors (401)
- [ ] Authorization errors (403)
- [ ] Not found errors (404)

### 6.2 Third-party Integration Testing

#### Payment Gateway (Dummy)
- [ ] Payment form integration
- [ ] Success/failure scenarios
- [ ] Error message handling
- [ ] Redirect flows

#### Email Service (If implemented)
- [ ] Confirmation emails
- [ ] Password reset emails
- [ ] Promotional emails
- [ ] Email template rendering

## Phase 7: User Acceptance Testing

### 7.1 User Journey Testing

#### New User Journey
- [ ] **Discovery to Booking**
  1. [ ] Homepage visit
  2. [ ] Movie browsing
  3. [ ] Account registration
  4. [ ] Movie selection
  5. [ ] Showtime selection
  6. [ ] Seat selection
  7. [ ] Payment process
  8. [ ] Booking confirmation

#### Returning User Journey
- [ ] **Login to Booking**
  1. [ ] Quick login
  2. [ ] Movie search
  3. [ ] Direct booking
  4. [ ] Profile management
  5. [ ] Booking history review

#### Admin User Journey
- [ ] **Admin Dashboard Usage**
  1. [ ] Admin login
  2. [ ] Dashboard overview
  3. [ ] Movie management
  4. [ ] Showtime scheduling
  5. [ ] Report generation

### 7.2 Scenario-based Testing

#### Peak Load Scenarios
- [ ] Multiple concurrent bookings
- [ ] High traffic movie releases
- [ ] System behavior under load
- [ ] Graceful degradation

#### Error Recovery Scenarios
- [ ] Network interruption during booking
- [ ] Payment failure recovery
- [ ] Session timeout handling
- [ ] Data consistency maintenance

### 7.3 Business Logic Validation

#### Booking Business Rules
- [ ] Seat availability constraints
- [ ] Booking time limits
- [ ] Maximum seats per booking
- [ ] Age rating restrictions
- [ ] Pricing calculations

#### Admin Business Rules
- [ ] Movie scheduling constraints
- [ ] Theater capacity limits
- [ ] Revenue calculations
- [ ] User role permissions

## Phase 8: Final QA & Launch Preparation

### 8.1 Pre-launch Checklist

#### Content Verification
- [ ] All text content accurate
- [ ] Images và media optimized
- [ ] Legal pages complete
- [ ] Contact information correct

#### Configuration Verification
- [ ] Environment variables set
- [ ] Database connections working
- [ ] Email configuration tested
- [ ] SSL certificates installed

#### Monitoring Setup
- [ ] Error tracking configured
- [ ] Analytics implementation
- [ ] Performance monitoring
- [ ] Uptime monitoring

### 8.2 Launch Day Testing

#### Smoke Testing
- [ ] Core user flows working
- [ ] Admin functionalities working
- [ ] Payment system operational
- [ ] Email notifications working

#### Post-launch Monitoring
- [ ] Real user behavior tracking
- [ ] Error rate monitoring
- [ ] Performance metrics
- [ ] User feedback collection

## Testing Documentation

### Test Reports
- [ ] Test execution reports
- [ ] Bug reports và resolutions
- [ ] Performance test results
- [ ] Accessibility audit report
- [ ] Security testing report

### Maintenance Documentation
- [ ] Known issues và workarounds
- [ ] Browser-specific behaviors
- [ ] Performance optimization notes
- [ ] Monitoring dashboard setup

## Success Criteria

### Functional Criteria
- [ ] All core user flows complete successfully
- [ ] Admin functionalities working correctly
- [ ] Data accuracy maintained
- [ ] Business rules enforced

### Performance Criteria
- [ ] Page load times meet targets
- [ ] API response times < 500ms
- [ ] Core Web Vitals passing
- [ ] Mobile performance optimized

### Quality Criteria
- [ ] Cross-browser compatibility confirmed
- [ ] Accessibility standards met
- [ ] Security vulnerabilities addressed
- [ ] User experience validated

### Launch Readiness
- [ ] All critical bugs resolved
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] User acceptance criteria satisfied