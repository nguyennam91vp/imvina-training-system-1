-- ============================================================
-- SCRIPT TẠO DATABASE CHO APP QUẢN LÝ ĐÀO TẠO
-- Cách dùng: Vào Supabase > SQL Editor > New query > dán toàn bộ
-- nội dung này vào > bấm Run. Chỉ cần chạy 1 LẦN DUY NHẤT.
-- ============================================================

-- Bảng công nhân
create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  employee_code text,
  department text,
  position text,
  phone text,
  created_at timestamptz default now()
);

-- Bảng khóa đào tạo
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_hours integer default 0,
  instructor text,
  start_date date,
  created_at timestamptz default now()
);

-- Bảng lịch sử đào tạo (ai học khóa nào, kết quả ra sao)
create table if not exists training_records (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  training_date date,
  score numeric,
  result text check (result in ('Đạt', 'Không đạt')),
  created_at timestamptz default now()
);

-- Bảng chứng nhận (tự động tạo khi kết quả là "Đạt")
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  training_record_id uuid references training_records(id) on delete cascade,
  worker_id uuid references workers(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  cert_number text unique,
  issued_date date,
  created_at timestamptz default now()
);

-- Bảng phiếu đánh giá
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  worker_name text,
  course_name text,
  evaluation_date date,
  content text,
  score numeric,
  classification text,
  evaluator text,
  created_at timestamptz default now()
);

-- Bật Row Level Security (bắt buộc phải đăng nhập mới xem/sửa được dữ liệu)
alter table workers enable row level security;
alter table courses enable row level security;
alter table training_records enable row level security;
alter table certificates enable row level security;
alter table evaluations enable row level security;

-- Cho phép người dùng ĐÃ ĐĂNG NHẬP được đọc/ghi toàn bộ dữ liệu.
-- (Phù hợp cho quy mô nhỏ: cả xưởng dùng chung 1-2 tài khoản quản trị.
--  Nếu cần phân quyền chi tiết hơn theo từng người dùng, có thể chỉnh lại sau.)
create policy "Cho phép người dùng đã đăng nhập" on workers
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Cho phép người dùng đã đăng nhập" on courses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Cho phép người dùng đã đăng nhập" on training_records
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Cho phép người dùng đã đăng nhập" on certificates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Cho phép người dùng đã đăng nhập" on evaluations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
