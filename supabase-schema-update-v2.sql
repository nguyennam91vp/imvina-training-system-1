-- ============================================================
-- CẬP NHẬT DATABASE (v2): thêm Công đoạn đào tạo + Thời hạn hiệu lực
-- Chạy 1 lần trong Supabase > SQL Editor > New query
-- An toàn: có thể chạy nhiều lần, không làm mất dữ liệu cũ.
-- ============================================================

-- Khóa đào tạo: thêm "Công đoạn" (SUB1/SUB2/Lens/MAIN...) và
-- "Thời hạn hiệu lực chứng nhận" tính theo NGÀY
alter table courses add column if not exists station text;
alter table courses add column if not exists validity_days integer default 365;

-- Lịch sử đào tạo: thêm ghi chú (Note)
alter table training_records add column if not exists note text;

-- Chứng nhận: thêm ngày hết hạn = ngày cấp + thời hạn hiệu lực
alter table certificates add column if not exists expiry_date date;

-- Với dữ liệu cũ đã có (nếu có), gán tạm station mặc định để không bị trống
update courses set station = 'Khác' where station is null;
update courses set validity_days = 365 where validity_days is null;
