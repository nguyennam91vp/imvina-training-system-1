import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

export default function Summary() {
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) return setLoading(false)
      const { data } = await supabase
        .from('certificates')
        .select('*, workers(full_name, department), courses(name)')
        .order('issued_date', { ascending: false })
      setCerts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = certs.filter((c) =>
    (c.workers?.full_name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (c.courses?.name || '').toLowerCase().includes(filter.toLowerCase())
  )

  function exportExcel() {
    const data = filtered.map((c) => ({
      'Số hiệu chứng nhận': c.cert_number,
      'Công nhân': c.workers?.full_name || '',
      'Bộ phận': c.workers?.department || '',
      'Khóa học': c.courses?.name || '',
      'Ngày cấp': c.issued_date || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bang tong hop')
    const today = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `bang-tong-hop-chung-nhan-${today}.xlsx`)
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Bảng tổng hợp</h1>
          <p className="text-slate-500 mt-1">Tổng hợp chứng nhận đã cấp theo công nhân và khóa học.</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={filtered.length === 0}
          className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50"
        >
          ⬇ Xuất Excel (phục vụ audit)
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase.
        </div>
      )}

      <input
        placeholder="Tìm theo tên công nhân hoặc khóa học..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Số hiệu chứng nhận</th>
              <th className="px-4 py-3 font-medium">Công nhân</th>
              <th className="px-4 py-3 font-medium">Bộ phận</th>
              <th className="px-4 py-3 font-medium">Khóa học</th>
              <th className="px-4 py-3 font-medium">Ngày cấp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono text-navy-700">{c.cert_number}</td>
                <td className="px-4 py-3 font-medium text-navy-800">{c.workers?.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{c.workers?.department}</td>
                <td className="px-4 py-3 text-slate-500">{c.courses?.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.issued_date}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có chứng nhận nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
