import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
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

const PIE_COLORS = ['#22c55e', '#ef4444']

export default function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, courses: 0, certs: 0, records: 0 })
  const [monthly, setMonthly] = useState([])
  const [resultSplit, setResultSplit] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false)
        return
      }
      const [w, c, cert, r, allRecords] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('training_records').select('*', { count: 'exact', head: true }),
        supabase.from('training_records').select('training_date, result'),
      ])
      setStats({
        workers: w.count || 0,
        courses: c.count || 0,
        certs: cert.count || 0,
        records: r.count || 0,
      })

      const monthNames = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
      const counts = monthNames.map((m) => ({ month: m, 'Lượt đào tạo': 0 }))
      let dat = 0, khongDat = 0
      ;(allRecords.data || []).forEach((rec) => {
        if (rec.training_date) {
          const idx = new Date(rec.training_date).getMonth()
          if (idx >= 0 && idx < 12) counts[idx]['Lượt đào tạo'] += 1
        }
        if (rec.result === 'Đạt') dat += 1
        else if (rec.result === 'Không đạt') khongDat += 1
      })
      setMonthly(counts)
      setResultSplit([
        { name: 'Đạt', value: dat },
        { name: 'Không đạt', value: khongDat },
      ])
      setLoading(false)
    }
    load()
  }, [])

  const hasResultData = resultSplit.some((d) => d.value > 0)

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng số công nhân" value={loading ? '–' : stats.workers} />
        <StatCard label="Khóa đào tạo" value={loading ? '–' : stats.courses} />
        <StatCard label="Lượt đào tạo đã ghi nhận" value={loading ? '–' : stats.records} />
        <StatCard label="Chứng nhận đã cấp" value={loading ? '–' : stats.certs} hint="Tự động khi đạt kết quả" />
      </div>

      {!loading && isSupabaseConfigured && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-display font-semibold text-navy-900 mb-3">Lượt đào tạo theo tháng (năm nay)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Lượt đào tạo" fill="#f9760f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-display font-semibold text-navy-900 mb-3">Tỷ lệ Đạt / Không đạt</h2>
            {hasResultData ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={resultSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {resultSplit.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 py-16 text-center">Chưa có dữ liệu kết quả đào tạo.</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-display font-semibold text-navy-900 mb-2">Bắt đầu từ đâu?</h2>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
          <li>Vào <b>Công nhân</b> để thêm danh sách nhân viên (thêm tay hoặc nhập từ Excel)</li>
          <li>Vào <b>Khóa đào tạo</b> để tạo các khóa học/nội dung đào tạo</li>
          <li>Vào <b>Lịch sử đào tạo</b> để ghi nhận ai đã học khóa nào, kết quả ra sao — đạt sẽ tự tạo chứng nhận</li>
          <li>Vào <b>Nhập dữ liệu Excel</b> để cập nhật hàng loạt, phục vụ audit nhanh</li>
          <li>Vào <b>Phiếu đánh giá</b> để lập và in phiếu đánh giá sau đào tạo</li>
        </ol>
      </div>
    </div>
  )
}
