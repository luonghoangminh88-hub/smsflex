# Hướng Dẫn Thiết Lập Tài Khoản Admin

## Hiện Trạng

Hệ thống phân quyền dựa trên trường `role` trong bảng `profiles`:
- `user` (mặc định): Người dùng thông thường
- `admin`: Quản trị viên

**Lưu ý:** Hệ thống chưa có tài khoản admin mặc định ban đầu.

---

## Cách 1: Sử Dụng Setup Page (Khuyến Nghị)

### Bước 1: Thêm biến môi trường
Thêm vào file `.env.local`:
```env
ADMIN_SETUP_SECRET=your-strong-secret-key-here
```

### Bước 2: Đăng ký tài khoản
1. Truy cập: `http://localhost:3000/auth/signup`
2. Đăng ký với email bạn muốn làm admin (ví dụ: `admin@otprentalsystem.com`)

### Bước 3: Nâng quyền admin
1. Truy cập: `http://localhost:3000/setup-admin`
2. Nhập email vừa đăng ký
3. Nhập secret key từ biến môi trường
4. Click "Tạo Admin"

### Bước 4: Bảo mật
Sau khi tạo admin xong, **BẮT BUỘC** xóa hoặc bảo vệ các file sau:
- `app/setup-admin/page.tsx`
- `app/api/admin/create-admin/route.ts`

---

## Cách 2: Sử Dụng SQL Script

### Bước 1: Đăng ký tài khoản
Đăng ký tài khoản thông thường tại `/auth/signup`

### Bước 2: Chạy SQL Script
```sql
-- Nâng quyền admin cho email cụ thể
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@otprentalsystem.com';

-- Kiểm tra
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE role = 'admin';
```

---

## Cách 3: Trực Tiếp Qua Supabase Dashboard

1. Vào Supabase Dashboard
2. Chọn project của bạn
3. Vào **Table Editor** > **profiles**
4. Tìm user bạn muốn làm admin
5. Edit trường `role` từ `user` thành `admin`
6. Save

---

## Xác Minh

Sau khi tạo admin, kiểm tra bằng cách:

1. **Login**: Đăng nhập bằng tài khoản admin
2. **Truy cập admin panel**: `http://localhost:3000/admin`
3. **Kiểm tra profile**: Vào `/dashboard/profile` xem badge có hiển thị "Quản trị viên" không

---

## Bảo Mật Khuyến Nghị

### Production Checklist:
- [ ] Xóa file `app/setup-admin/page.tsx`
- [ ] Xóa file `app/api/admin/create-admin/route.ts`
- [ ] Xóa biến `ADMIN_SETUP_SECRET` khỏi environment variables
- [ ] Chỉ tạo admin qua Supabase Dashboard hoặc SQL direct
- [ ] Enable 2FA cho tất cả tài khoản admin
- [ ] Regularly audit admin accounts

### Tạo Admin Mới Trong Production:
```sql
-- Chỉ chạy trực tiếp trên database production với quyền cao nhất
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'new-admin@example.com';
```

---

## FAQ

**Q: Tại sao không có admin mặc định?**
A: Vì lý do bảo mật, không nên có tài khoản mặc định. Admin cần được tạo thủ công.

**Q: Có thể có nhiều admin không?**
A: Có, bạn có thể tạo bao nhiêu admin tùy thích bằng các cách trên.

**Q: Làm sao thu hồi quyền admin?**
A: Đổi trường `role` từ `admin` về `user` trong database.

**Q: Admin có thể xóa tài khoản admin khác không?**
A: Hiện tại chưa có tính năng này trong UI. Cần thực hiện qua database trực tiếp.
