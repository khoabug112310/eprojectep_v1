# Coding Standards (Dev Load Always)

## Frontend
- React 18 + TypeScript (ưu tiên), chức năng tách nhỏ, hooks rõ ràng
- Tên biến/hàm có nghĩa; tránh viết tắt; state co-located
- HTTP qua service Axios; không gọi API trực tiếp trong UI
- Routing rõ ràng; code-splitting cho routes lớn

## Backend
- Laravel controllers mỏng; business trong Services
- Requests validation riêng; Resources cho response
- Eloquent: tránh N+1; dùng eager loading; index phù hợp
- RESTful naming; mã lỗi/HTTP status chuẩn 