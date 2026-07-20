import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const SCHEMAS = {
  workers: {
    label: 'Công nhân',
    table: 'workers',
    columns: [
      { key: 'full_name', label: 'Họ tên', required: true },
      { key: 'employee_code', label: 'Mã nhân viên' },
      { key: 'department', label: 'Bộ phận' },
      { key: 'position', label: 'Chức vụ' },
      { key: 'phone', label: 'SĐT' },
    ],
  },
  courses: {
    label: 'Khóa đào tạo',
    table: 'courses',
    columns: [
      { key: 'name', label: 'Tên khóa học', required: true },
      { key: 'description', label: 'Mô tả' },
      { key: 'duration_hours', label: 'Thời lượng (giờ)' },
      { key: 'instructor', label: 'Giảng viên' },
      { key: 'start_date', label: 'Ngày bắt đầu (yyyy-mm-dd)' },
    ],
  },
}

export default function Import() {
  const [type, setType] = useState('workers')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState(null) // { ok, message }
  const [saving, setSaving] = useState(false)

  const schema = SCHEMAS[type]

  function downloadTemplate() {
    const headers = schema.columns.map((c) => c.label)
    const ws = XLSX.utils.aoa_to_sheet([headers])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu')
    XLSX.writeFile(wb, `mau-nhap-${schema.table}.xlsx`)
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setStatus(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      // Ánh xạ tên cột tiếng Việt (trong file Excel) sang tên trường trong database
      const labelToKey = {}
      schema.columns.forEach((c) => { labelToKey[c.label] = c.key })

      const mapped = json.map((row) => {
        const obj = {}
        Object.keys(row).forEach((col) => {
          const key = labelToKey[col] || col
          obj[key] = row[col]
        })
        return obj
      })
      setRows(mapped)
    }
    reader.readAsBinaryString(file)
  }

  async function handleImport() {
    if (!isSupabaseConfigured) {
      setStatus({ ok: false, message: 'Chưa kết nối database — vào Cài đặt & Kết nối trước.' })
      return
    }
    const requiredKey = schema.columns.find((c) => c.required)?.key
    const validRows = rows.filter((r) => r[requiredKey] && String(r[requiredKey]).trim() !== '')

    if (validRows.length === 0) {
      setStatus({ ok: false, message: 'Không có dòng dữ liệu hợp lệ để nhập.' })
      return
    }

    setSaving(true)
    const { error } = await supabase.from(schema.table).insert(validRows)
    setSaving(false)

    if (error) {
      setStatus({ ok: false, message: `Lỗi khi nhập: ${error.message}` })
    } else {
      setStatus({ ok: true, message: `Đã nhập thành công ${validRows.length} dòng vào "${schema.label}".` })
      setRows([])
      setFileName('')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy-900">Nhập dữ liệu từ Excel</h1>
      <p className="text-slate-500 mt-1 mb-6">
        Tải file mẫu, điền dữ liệu, rồi tải lên để nhập hàng loạt — phù hợp khi cần cập nhật nhanh phục vụ audit.
      </p>

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase trước.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl">
        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-700 mb-1">Loại dữ liệu cần nhập</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setRows([]); setFileName(''); setStatus(null) }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(SCHEMAS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            onClick={downloadTemplate}
            className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            ⬇ Tải file mẫu (.xlsx)
          </button>
          <span className="text-xs text-slate-400">
            Điền dữ liệu vào đúng các cột trong file mẫu, giữ nguyên tên cột.
          </span>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-700 mb-1">Chọn file Excel đã điền</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2"
          />
          {fileName && <p className="text-xs text-slate-400 mt-1">Đã chọn: {fileName} — {rows.length} dòng</p>}
        </div>

        {rows.length > 0 && (
          <div className="mb-5 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {schema.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-left font-medium text-navy-500">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>
                    {schema.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-slate-600">{r[c.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-xs text-slate-400 px-3 py-2">... và {rows.length - 5} dòng khác</p>
            )}
          </div>
        )}

        {status && (
          <div className={`mb-4 text-sm rounded-lg px-4 py-3 border ${
            status.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {status.message}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={rows.length === 0 || saving}
          className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Đang nhập...' : `Nhập ${rows.length || ''} dòng vào hệ thống`}
        </button>
      </div>
    </div>
  )
}
