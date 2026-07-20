import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

function StatCard({ label, value, hint }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-navy-500">{label}</p>
      <p className="font-display text-3xl font-bold text-navy-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, courses: 0, certs: 0, records: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }
      const [w, c, cert, r] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('training_records').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        workers: w.count || 0,
        courses: c.count || 0,
        certs: cert.count || 0,
        records: r.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900">Tổng quan</h1>
      <p className="text-slate-500 mt-1 mb-6">
        Tình hình đào tạo và cấp chứng nhận trong xưởng.
      </p>

      {!isSupabaseConfigured && (
        <div className="mb-6 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
          Đang ở chế độ demo (chưa kết nối database). Vào <b>Cài đặt & Kết nối</b> để nối Supabase.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tổng số công nhân" value={loading ? '–' : stats.workers} />
        <StatCard label="Khóa đào tạo" value={loading ? '–' : stats.courses} />
        <StatCard label="Lượt đào tạo đã ghi nhận" value={loading ? '–' : stats.records} />
        <StatCard label="Chứng nhận đã cấp" value={loading ? '–' : stats.certs} hint="Tự động khi đạt kết quả" />
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-display font-semibold text-navy-900 mb-2">Bắt đầu từ đâu?</h2>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
          <li>Vào <b>Công nhân</b> để thêm danh sách nhân viên</li>
          <li>Vào <b>Khóa đào tạo</b> để tạo các khóa học/nội dung đào tạo</li>
          <li>Vào <b>Lịch sử đào tạo</b> để ghi nhận ai đã học khóa nào, kết quả ra sao — đạt sẽ tự tạo chứng nhận</li>
          <li>Vào <b>Phiếu đánh giá</b> để lập và in phiếu đánh giá sau đào tạo</li>
        </ol>
      </div>
    </div>
  )
}
