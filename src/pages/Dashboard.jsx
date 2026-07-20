import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Users, Award, AlertTriangle, XCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { addDays, daysUntil, STATIONS } from '../lib/trainingUtils'
import StatCard from '../components/StatCard'
import { Card, PageHeader, Badge } from '../components/ui'

const STATION_COLORS = ['#f9760f', '#212f4a', '#3d5280', '#8497c4', '#c9d2e8']

export default function Dashboard() {
  const [stats, setStats] = useState({ workers: 0, certs: 0, expiring: 0, expired: 0 })
  const [monthly, setMonthly] = useState([])
  const [passRate, setPassRate] = useState(0)
  const [byStation, setByStation] = useState([])
  const [urgent, setUrgent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) return setLoading(false)

      const [w, cert, allRecords] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('training_records').select('training_date, result, workers(full_name), courses(name, station, validity_days)'),
      ])

      const monthNames = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']
      const counts = monthNames.map((m) => ({ month: m, luot: 0 }))
      const stationCounts = {}
      let dat = 0, khongDat = 0, expiring = 0, expired = 0
      const urgentList = []

      ;(allRecords.data || []).forEach((rec) => {
        if (rec.training_date) {
          const idx = new Date(rec.training_date).getMonth()
          if (idx >= 0 && idx < 12) counts[idx].luot += 1
        }
        const station = rec.courses?.station || 'Khác'
        stationCounts[station] = (stationCounts[station] || 0) + 1

        if (rec.result === 'Đạt') {
          dat += 1
          const validityDays = rec.courses?.validity_days || 365
          const expiry = addDays(rec.training_date, validityDays)
          const daysLeft = daysUntil(expiry)
          if (daysLeft < 0) expired += 1
          else if (daysLeft <= 30) {
            expiring += 1
            urgentList.push({ name: rec.workers?.full_name, course: rec.courses?.name, daysLeft })
          }
        } else if (rec.result === 'Không đạt') {
          khongDat += 1
        }
      })

      urgentList.sort((a, b) => a.daysLeft - b.daysLeft)

      setStats({ workers: w.count || 0, certs: cert.count || 0, expiring, expired })
      setMonthly(counts)
      setPassRate(dat + khongDat > 0 ? Math.round((dat / (dat + khongDat)) * 100) : 0)
      setByStation(STATIONS.filter((s) => s !== 'Khác').map((s, i) => ({
        station: s, count: stationCounts[s] || 0, fill: STATION_COLORS[i % STATION_COLORS.length],
      })))
      setUrgent(urgentList.slice(0, 6))
      setLoading(false)
    }
    load()
  }, [])

  const donutData = [{ name: 'Đạt', value: passRate }, { name: 'Còn lại', value: 100 - passRate }]

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle="Tình hình đào tạo và cấp chứng nhận trong xưởng." />

      {!isSupabaseConfigured && (
        <div className="mb-6 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3">
          Đang ở chế độ demo (chưa kết nối database). Vào <b>Cài đặt & Kết nối</b> để nối Supabase.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={Users} tone="navy" label="Tổng số công nhân" value={loading ? '–' : stats.workers} />
        <StatCard icon={Award} tone="ember" label="Chứng nhận đã cấp" value={loading ? '–' : stats.certs} />
        <StatCard icon={AlertTriangle} tone="amber" label="Sắp hết hạn (≤30 ngày)" value={loading ? '–' : stats.expiring} hint="Cần lên kế hoạch tái đào tạo" />
        <StatCard icon={XCircle} tone="red" label="Đã hết hạn" value={loading ? '–' : stats.expired} hint="Cần đào tạo lại ngay" />
      </div>

      {!loading && isSupabaseConfigured && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <Card className="lg:col-span-2 p-5">
            <h2 className="font-display font-semibold text-navy-900 mb-1">Xu hướng đào tạo theo tháng</h2>
            <p className="text-xs text-slate-400 mb-3">Số lượt đào tạo ghi nhận trong năm nay</p>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fillLuot" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f9760f" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f9760f" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="luot" name="Lượt đào tạo" stroke="#f9760f" strokeWidth={2.5} fill="url(#fillLuot)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 flex flex-col">
            <h2 className="font-display font-semibold text-navy-900 mb-1">Tỷ lệ đạt</h2>
            <p className="text-xs text-slate-400 mb-2">Trên tổng số lượt đào tạo đã có kết quả</p>
            <div className="relative flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={65} outerRadius={88} startAngle={90} endAngle={-270} paddingAngle={0}>
                    <Cell fill="#10b981" />
                    <Cell fill="#eef1f8" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-bold text-navy-900">{passRate}%</span>
                <span className="text-xs text-slate-400">Đạt</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && isSupabaseConfigured && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <Card className="lg:col-span-2 p-5">
            <h2 className="font-display font-semibold text-navy-900 mb-1">Lượt đào tạo theo công đoạn</h2>
            <p className="text-xs text-slate-400 mb-3">SUB1 / SUB2 / Lens / MAIN</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStation} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f8" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="station" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip />
                <Bar dataKey="count" name="Lượt đào tạo" radius={[0, 6, 6, 0]}>
                  {byStation.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h2 className="font-display font-semibold text-navy-900 mb-3">Cần tái đào tạo sớm</h2>
            {urgent.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">Không có trường hợp nào sắp/đã hết hạn 🎉</p>
            ) : (
              <div className="space-y-3">
                {urgent.map((u, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-navy-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.course}</p>
                    </div>
                    <Badge tone={u.daysLeft < 0 ? 'red' : 'amber'}>
                      {u.daysLeft < 0 ? `Quá hạn ${Math.abs(u.daysLeft)}n` : `Còn ${u.daysLeft}n`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-display font-semibold text-navy-900 mb-2">Bắt đầu từ đâu?</h2>
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1.5">
          <li>Vào <b>Khóa đào tạo</b> để khai báo hạng mục theo từng công đoạn và hạn hiệu lực chứng nhận</li>
          <li>Vào <b>Nhập dữ liệu Excel</b> để khai báo hàng loạt theo đúng biểu mẫu công ty</li>
          <li>Theo dõi hạn tái đào tạo tại <b>Bảng tổng hợp</b> hoặc mục cảnh báo phía trên</li>
        </ol>
      </Card>
    </div>
  )
}
