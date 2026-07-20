# Quản lý Đào tạo — Xưởng sản xuất

Ứng dụng quản lý đào tạo nhân lực, cấp chứng nhận và nội dung đào tạo.

**Công nghệ:** React + Vite + Tailwind CSS + Supabase (database & đăng nhập)

## Chạy thử trên máy

```bash
npm install
cp .env.example .env   # rồi điền thông tin Supabase vào file .env
npm run dev
```

## Đưa lên GitHub + Vercel (không cần deploy tay)

Xem chi tiết từng bước trong tài liệu hướng dẫn đi kèm (file .docx).
Tóm tắt:

1. Tạo project trên **Supabase**, chạy file `supabase-schema.sql` trong SQL Editor để tạo database.
2. Đưa toàn bộ thư mục này lên **GitHub** (repository mới).
3. Vào **Vercel** → New Project → chọn repo GitHub vừa tạo → thêm 2 biến môi trường
   `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` → Deploy.
4. Từ giờ, mỗi lần sửa code và đẩy (push) lên GitHub, Vercel sẽ **tự động build lại**
   và cập nhật link `.vercel.app` — không cần làm gì thêm.

## Cấu trúc thư mục

```
src/
  pages/        Các màn hình: Tổng quan, Công nhân, Khóa đào tạo,
                Lịch sử đào tạo, Bảng tổng hợp, Phiếu đánh giá, Cài đặt
  components/   Sidebar, Layout dùng chung
  context/      Xử lý đăng nhập (Supabase Auth)
  lib/          Kết nối Supabase
supabase-schema.sql   Chạy 1 lần để tạo database
```
