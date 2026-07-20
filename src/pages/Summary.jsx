import React, { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { Search, Download } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { addDays, daysUntil, expiryStatus, STATIONS } from '../lib/trainingUtils'
import { Card, PageHeader, Badge } from '../components/ui'

const PAGE_SIZE = 12

export default function Summary() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stationFilter, setStationFilter] = useState('Tất cả')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) return setLoading(false)
      const { data } = await supabase
        .from('training_records')
        .select('*, workers(full_name, employee_code), courses(name, station, validity_days)')
        .order('training_date', { ascending: false })

      const computed = (data || []).map((r) => {
        const issuedDate = r.result === 'Đạt' ? r.training_date : null
        const validityDays = r.courses?.validity_days || 365
        const expiryDate = issuedDate ? addDays(issuedDate, validityDays) : null
        const daysLeft = expiryDate ? daysUntil(expiryDate) : null
        return { ...r, issuedDate, validityDays, expiryDate, daysLeft, status: expiryStatus(daysLeft) }
      })
      setRows(computed)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        (r.workers?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.workers?.employee_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.courses?.name || '').toLowerCase().includes(search.toLowerCase())
      const matchStation = stationFilter === 'Tất cả' || r.courses?.station === stationFilter
      const matchStatus =
        statusFilter === 'Tất cả' ||
        (statusFilter === 'Còn hạn' && r.daysLeft !== null && r.daysLeft > 30) ||
        (statusFilter === 'Sắp hết hạn' && r.daysLeft !== null && r.daysLeft >= 0 && r.daysLeft <= 30) ||
        (statusFilter === 'Đã hết hạn' && r.daysLeft !== null && r.daysLeft < 0) ||
        (statusFilter === 'Chưa có chứng nhận' && r.daysLeft === null)
      return matchSearch && matchStation && matchStatus
    })
  }, [rows, search, stationFilter, statusFilter])

  useEffect(() => { setPage(1) }, [search, stationFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportExcel() {
    const data = filtered.map((r, i) => ({
      'STT': i + 1,
      'ID': r.workers?.employee_code || '',
      'Họ tên': r.workers?.full_name || '',
      'Ngày đào tạo': r.training_date || '',
      'Công đoạn đào tạo': r.courses?.station || '',
      'Hạng mục đào tạo': r.courses?.name || '',
      'Kết quả': r.result || '',
      'Ngày cấp chứng nhận': r.issuedDate || '',
      'Thời hạn giấy chứng nhận': `${r.validityDays} ngày`,
      'Ngày hết hạn': r.expiryDate || '',
      'Trạng thái': r.status.label,
      'Note': r.note || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ma tran dao tao')
    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `ma-tran-dao-tao-chung-nhan-${today}.xlsx`)
  }

  return (
    <div>
      <PageHeader
        title="Bảng tổng hợp"
        subtitle="Ma trận đào tạo & chứng nhận — theo dõi hạn tái đào tạo cho từng công nhân."
        action={
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
          >
            <Download size={16} /> Xuất Excel
          </button>
        }
      />

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase.
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Tìm theo tên, mã NV hoặc khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option>Tất cả</option>
          {STATIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option>Tất cả</option>
          <option>Còn hạn</option>
          <option>Sắp hết hạn</option>
          <option>Đã hết hạn</option>
          <option>Chưa có chứng nhận</option>
        </select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Công đoạn</th>
              <th className="px-4 py-3 font-medium">Hạng mục đào tạo</th>
              <th className="px-4 py-3 font-medium">Ngày đào tạo</th>
              <th className="px-4 py-3 font-medium">Kết quả</th>
              <th className="px-4 py-3 font-medium">Ngày hết hạn</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-500">{r.workers?.employee_code || '—'}</td>
                <td className="px-4 py-3 font-medium text-navy-800">{r.workers?.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{r.courses?.station}</td>
                <td className="px-4 py-3 text-slate-500">{r.courses?.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.training_date}</td>
                <td className="px-4 py-3"><Badge tone={r.result === 'Đạt' ? 'green' : 'red'}>{r.result}</Badge></td>
                <td className="px-4 py-3 text-slate-500">{r.expiryDate || '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.daysLeft === null ? 'slate' : r.daysLeft < 0 ? 'red' : r.daysLeft <= 30 ? 'amber' : 'green'}>
                    {r.status.label}
                  </Badge>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Không có dữ liệu phù hợp.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>Trang {page}/{totalPages} — {filtered.length} bản ghi</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40">← Trước</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40">Sau →</button>
          </div>
        </div>
      )}
    </div>
  )
}
