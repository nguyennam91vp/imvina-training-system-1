import React from 'react'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Settings() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900">Cài đặt & Kết nối</h1>
      <p className="text-slate-500 mt-1 mb-6">
        Kết nối app với Supabase để dữ liệu là một database thật.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        <h2 className="font-display font-semibold text-navy-900 mb-3">1. Trạng thái kết nối</h2>

        {isSupabaseConfigured ? (
          <div className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3">
            ✓ Đã kết nối Supabase — dữ liệu đang được lưu vào database thật.
          </div>
        ) : (
          <div className="text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
            Chưa kết nối — app đang chạy ở chế độ demo, dữ liệu sẽ không được lưu lại.
          </div>
        )}

        <div className="mt-5 text-sm text-slate-600 space-y-2">
          <p>Để kết nối, thêm 2 biến môi trường sau (lấy từ Supabase → Project Settings → API):</p>
          <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-700 space-y-1">
            <p>VITE_SUPABASE_URL=https://xxxxx.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...</p>
          </div>
          <p>
            • Khi chạy trên máy: điền vào file <code className="bg-slate-100 px-1 rounded">.env</code> ở thư mục gốc.<br />
            • Khi chạy trên Vercel: vào <b>Project → Settings → Environment Variables</b> để thêm, sau đó bấm Redeploy.
          </p>
          <p className="text-slate-400">Xem tài liệu hướng dẫn đi kèm để làm từng bước chi tiết.</p>
        </div>
      </div>
    </div>
  )
}
