# CineBook Admin Account Setup Guide

## 🔑 Demo Admin Account

Tôi đã thiết lập một tài khoản admin demo để bạn có thể truy cập admin dashboard mà không cần thao tác trên database.

### Thông tin đăng nhập:
- **Email:** `admin@cinebook.com`
- **Password:** `admin123`

### Cách truy cập Admin Dashboard:

1. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Truy cập Admin Login:**
   - Mở trình duyệt và vào: `http://localhost:3001/admin/login`
   - Hoặc từ trang chủ, thêm `/admin/login` vào URL

3. **Đăng nhập:**
   - Nhập email: `admin@cinebook.com`
   - Nhập password: `admin123`
   - Hoặc click nút "📝 Tự động điền" để tự động điền thông tin
   - Click "Đăng nhập"

4. **Truy cập Dashboard:**
   - Sau khi đăng nhập thành công, bạn sẽ được chuyển hướng đến `/admin`
   - Admin dashboard sẽ hiển thị với đầy đủ menu quản trị

## 🌟 Tính năng Demo Mode

### Demo Mode hoạt động như thế nào:
- **Không cần Database:** Tài khoản demo hoạt động hoàn toàn không cần kết nối database
- **Authentication Local:** Thông tin admin được lưu trong localStorage
- **Fallback API:** Nếu API backend không khả dụng, demo mode vẫn hoạt động bình thường
- **Full Dashboard Access:** Truy cập được tất cả các trang admin

### Các trang Admin có thể truy cập:
- **Dashboard:** `/admin` - Tổng quan thống kê
- **Movies:** `/admin/movies` - Quản lý phim
- **Theaters:** `/admin/theaters` - Quản lý rạp chiếu  
- **Showtimes:** `/admin/showtimes` - Quản lý suất chiếu
- **Bookings:** `/admin/bookings` - Quản lý đặt vé
- **Users:** `/admin/users` - Quản lý người dùng
- **Reviews:** `/admin/reviews` - Quản lý đánh giá
- **Reports:** `/admin/reports` - Báo cáo thống kê

## 🔧 Technical Details

### Implementation:
```typescript
// Demo admin login logic
if (formData.email === 'admin@cinebook.com' && formData.password === 'admin123') {
  const demoAdmin = {
    id: 1,
    name: 'CineBook Admin',
    email: 'admin@cinebook.com', 
    role: 'admin',
    status: 'active'
  }
  
  localStorage.setItem('adminToken', 'demo-admin-token-' + Date.now())
  localStorage.setItem('adminUser', JSON.stringify(demoAdmin))
  
  navigate('/admin')
}
```

### Storage:
- **adminToken:** Stored in localStorage with timestamp
- **adminUser:** Complete admin user object in localStorage
- **Session Persistence:** Persists across browser sessions until manually logged out

## 🚀 Quick Start

1. **Start Frontend:**
   ```bash
   cd "c:\Dự án\eprojectep_v1\frontend"
   npm run dev
   ```

2. **Access Admin:**
   - Go to: `http://localhost:3001/admin/login`
   - Use credentials: `admin@cinebook.com` / `admin123`
   - Click "📝 Tự động điền" for quick fill
   - Login and explore!

## ⚡ Alternative Access Methods

### Direct URL Access:
- Admin Login: `http://localhost:3001/admin/login`
- From Homepage: Click vào menu hoặc thêm `/admin/login` vào URL
- From Sitemap: Trang sitemap có link đến admin login

### Navigation:
- **From User Dashboard:** Có thể thêm link admin trong user menu (nếu user có role admin)
- **Direct Access:** Bookmark `http://localhost:3001/admin/login` để truy cập nhanh

## 🔒 Security Features

- **Role-based Access:** Chỉ user có role 'admin' mới truy cập được
- **Session Management:** Admin session được quản lý riêng biệt
- **Auto Logout:** Có thể logout từ bất kỳ trang admin nào
- **Route Protection:** Tất cả admin routes được bảo vệ bởi authentication

## 💡 Tips

1. **Demo Mode không cần Backend:** Hoạt động hoàn toàn độc lập
2. **Data sẽ là Mock Data:** Vì không có database, data sẽ là demo/mock data
3. **Persistent Login:** Đăng nhập sẽ được lưu cho đến khi logout
4. **Mobile Friendly:** Admin interface responsive, hoạt động tốt trên mobile
5. **Quick Fill:** Sử dụng nút "Tự động điền" để nhập credentials nhanh

---

**🎉 Bây giờ bạn có thể truy cập admin dashboard mà không cần setup database!**