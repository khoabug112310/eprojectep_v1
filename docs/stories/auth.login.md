# Story: User Login

## Mục tiêu
Người dùng đăng nhập với email/phone + password.

## Acceptance Criteria
- Form validation (email/phone định dạng, password bắt buộc)
- Submit gọi API /auth/login, lưu token/session
- Xử lý lỗi: sai mật khẩu, tài khoản không tồn tại

## Tasks
- FE: Trang /login (Formik+Yup), gọi API, toast lỗi/thành công
- BE: LoginRequest, AuthController@login, route, tests cơ bản
- QA: *design, *trace trên story này 