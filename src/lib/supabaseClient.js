import { createClient } from '@supabase/supabase-js'

// Hai giá trị này lấy từ Supabase: Project Settings > API
// Khi chạy trên máy: điền vào file .env (copy từ .env.example)
// Khi deploy trên Vercel: điền vào Vercel > Settings > Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Nếu chưa cấu hình, tạo 1 client "giả" để app không bị crash,
// màn hình Cài đặt sẽ báo cho người dùng biết cần điền thông tin kết nối.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')
