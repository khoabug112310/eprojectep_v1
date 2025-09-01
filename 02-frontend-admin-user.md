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