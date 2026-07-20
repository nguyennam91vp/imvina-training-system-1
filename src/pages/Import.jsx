import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { Download, Upload as UploadIcon } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { STATIONS, addDays } from '../lib/trainingUtils'
import { Card, PageHeader } from '../components/ui'

const DECLARE_COLUMNS = [
  { key: 'stt', label: 'STT' },
  { key: 'employee_code', label: 'ID' },
  { key: 'full_name', label: 'Họ tên', required: true },
  { key: 'training_date', label: 'Ngày đào tạo' },
  { key: 'station', label: 'Công đoạn đào tạo', required: true },
  { key: 'course_name', label: 'Hạng mục đào tạo', required: true },
  { key: 'result', label: 'Kết quả' },
  { key: 'issued_date', label: 'Ngày cấp chứng nhận' },
  { key: 'validity_text', label: 'Thời hạn giấy chứng nhận' },
  { key: 'note', label: 'Note' },
]

const WORKERS_COLUMNS = [
  { key: 'full_name', label: 'Họ tên', required: true },
  { key: 'employee_code', label: 'Mã nhân viên' },
  { key: 'department', label: 'Bộ phận' },
  { key: 'position', label: 'Chức vụ' },
  { key: 'phone', label: 'SĐT' },
]

const SCHEMAS = {
  declare: { label: 'Khai báo đào tạo (theo mẫu Excel công ty)', columns: DECLARE_COLUMNS },
  workers: { label: 'Chỉ thêm danh sách Công nhân', columns: WORKERS_COLUMNS },
}

function genCertNumber() {
  const y = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `CN-${y}-${rand}`
}
function normalize(str) { return String(str || '').trim().toLowerCase() }
function parseValidityDays(text) {
  if (!text) return 365
  const match = String(text).match(/\d+/)
  return match ? Number(match[0]) : 365
}

export default function Import() {
  const [type, setType] = useState('declare')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(null)

  const schema = SCHEMAS[type]

  async function downloadTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Mẫu')
    const headers = schema.columns.map((c) => c.label)
    ws.addRow(headers)
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } }
    ws.columns.forEach((col) => { col.width = 22 })

    if (type === 'declare') {
      const stationCol = schema.columns.findIndex((c) => c.key === 'station') + 1
      const resultCol = schema.columns.findIndex((c) => c.key === 'result') + 1
      const ROWS = 500
      for (let r = 2; r <= ROWS; r++) {
        ws.getCell(r, stationCol).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`"${STATIONS.join(',')}"`],
          showErrorMessage: true, errorTitle: 'Công đoạn không hợp lệ', error: `Chỉ chọn 1 trong: ${STATIONS.join(', ')}`,
        }
        ws.getCell(r, resultCol).dataValidation = {
          type: 'list', allowBlank: true, formulae: ['"Đạt,Không đạt"'],
          showErrorMessage: true, errorTitle: 'Kết quả không hợp lệ', error: 'Chỉ chọn "Đạt" hoặc "Không đạt"',
        }
      }
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mau-nhap-${type}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
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
      const labelToKey = {}
      schema.columns.forEach((c) => { labelToKey[c.label] = c.key })
      const mapped = json.map((row) => {
        const obj = {}
        Object.keys(row).forEach((col) => { obj[labelToKey[col] || col] = row[col] })
        return obj
      })
      const cleaned = mapped.filter((r) => Object.values(r).some((v) => String(v).trim() !== ''))
      setRows(cleaned)
    }
    reader.readAsBinaryString(file)
  }

  async function importWorkers() {
    const requiredKey = schema.columns.find((c) => c.required)?.key
    const validRows = rows.filter((r) => r[requiredKey] && String(r[requiredKey]).trim() !== '')
    if (validRows.length === 0) { setStatus({ ok: false, message: 'Không có dòng dữ liệu hợp lệ để nhập.' }); return }
    const { error } = await supabase.from('workers').insert(validRows)
    if (error) setStatus({ ok: false, message: `Lỗi khi nhập: ${error.message}` })
    else { setStatus({ ok: true, message: `Đã nhập thành công ${validRows.length} công nhân.` }); setRows([]); setFileName('') }
  }

  async function importDeclare() {
    const validRows = rows.filter((r) => normalize(r.full_name) && normalize(r.course_name))
    if (validRows.length === 0) { setStatus({ ok: false, message: 'Không có dòng hợp lệ (cần có Họ tên và Hạng mục đào tạo).' }); return }

    setProgress({ done: 0, total: validRows.length })
    const [{ data: existingWorkers }, { data: existingCourses }] = await Promise.all([
      supabase.from('workers').select('id, full_name, employee_code'),
      supabase.from('courses').select('id, name, station, validity_days'),
    ])
    const workerByCode = new Map(), workerByName = new Map()
    ;(existingWorkers || []).forEach((w) => {
      if (w.employee_code) workerByCode.set(normalize(w.employee_code), w.id)
      workerByName.set(normalize(w.full_name), w.id)
    })
    const courseByKey = new Map()
    ;(existingCourses || []).forEach((c) => courseByKey.set(`${normalize(c.station)}|${normalize(c.name)}`, c))

    let successCount = 0, certCount = 0
    const errors = []

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        let workerId = row.employee_code ? workerByCode.get(normalize(row.employee_code)) : undefined
        if (!workerId) workerId = workerByName.get(normalize(row.full_name))
        if (!workerId) {
          const { data: newWorker, error: wErr } = await supabase.from('workers')
            .insert({ full_name: row.full_name, employee_code: row.employee_code || null }).select().single()
          if (wErr) throw wErr
          workerId = newWorker.id
          workerByName.set(normalize(row.full_name), workerId)
          if (row.employee_code) workerByCode.set(normalize(row.employee_code), workerId)
        }

        const station = row.station && STATIONS.includes(row.station.trim()) ? row.station.trim() : (row.station || 'Khác')
        const courseKey = `${normalize(station)}|${normalize(row.course_name)}`
        let course = courseByKey.get(courseKey)
        const validityDays = parseValidityDays(row.validity_text)
        if (!course) {
          const { data: newCourse, error: cErr } = await supabase.from('courses')
            .insert({ name: row.course_name, station, validity_days: validityDays }).select().single()
          if (cErr) throw cErr
          course = newCourse
          courseByKey.set(courseKey, course)
        }

        const result = normalize(row.result) === 'không đạt' ? 'Không đạt' : 'Đạt'
        const trainingDate = row.training_date || new Date().toISOString().slice(0, 10)
        const { data: record, error: rErr } = await supabase.from('training_records')
          .insert({ worker_id: workerId, course_id: course.id, training_date: trainingDate, result, note: row.note || null })
          .select().single()
        if (rErr) throw rErr

        if (result === 'Đạt') {
          const issuedDate = row.issued_date && String(row.issued_date).trim() !== '' ? row.issued_date : trainingDate
          const expiryDate = addDays(issuedDate, course.validity_days || validityDays)
          const { error: certErr } = await supabase.from('certificates').insert({
            training_record_id: record.id, worker_id: workerId, course_id: course.id,
            cert_number: genCertNumber(), issued_date: issuedDate, expiry_date: expiryDate,
          })
          if (!certErr) certCount += 1
        }
        successCount += 1
      } catch (err) {
        errors.push(`Dòng ${i + 1} (${row.full_name}): ${err.message}`)
      }
      setProgress({ done: i + 1, total: validRows.length })
    }
    setProgress(null)

    if (errors.length === 0) {
      setStatus({ ok: true, message: `Đã khai báo đào tạo cho ${successCount} người, tự động cấp ${certCount} chứng nhận.` })
      setRows([]); setFileName('')
    } else {
      setStatus({ ok: false, message: `Xong ${successCount}/${validRows.length} dòng, có ${errors.length} lỗi: ${errors.slice(0, 3).join(' | ')}${errors.length > 3 ? '...' : ''}` })
    }
  }

  async function handleImport() {
    if (!isSupabaseConfigured) { setStatus({ ok: false, message: 'Chưa kết nối database — vào Cài đặt & Kết nối trước.' }); return }
    setSaving(true)
    if (type === 'declare') await importDeclare()
    else await importWorkers()
    setSaving(false)
  }

  return (
    <div>
      <PageHeader title="Nhập dữ liệu từ Excel" subtitle="Dùng đúng biểu mẫu công ty đang có — không cần đổi cấu trúc file." />

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase trước.
        </div>
      )}

      <Card className="p-6 max-w-3xl">
        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-700 mb-1">Loại nhập liệu</label>
          <select value={type} onChange={(e) => { setType(e.target.value); setRows([]); setFileName(''); setStatus(null) }}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
            {Object.entries(SCHEMAS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
          </select>
          {type === 'declare' && (
            <p className="text-xs text-slate-400 mt-1">
              Cột "Công đoạn đào tạo" và "Kết quả" trong file mẫu đã có sẵn ô chọn (dropdown) — chỉ cần bấm vào ô rồi chọn giá trị.
              Nếu công nhân/khóa học chưa có, hệ thống tự tạo mới. "Ngày cấp chứng nhận" để trống sẽ tự lấy bằng Ngày đào tạo nếu Đạt.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button onClick={downloadTemplate} className="flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Download size={16} /> Tải file mẫu (.xlsx)
          </button>
          <span className="text-xs text-slate-400">Giữ nguyên tên cột như file mẫu.</span>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-navy-700 mb-1">Chọn file Excel đã điền</label>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile}
            className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2" />
          {fileName && <p className="text-xs text-slate-400 mt-1">Đã chọn: {fileName} — {rows.length} dòng</p>}
        </div>

        {rows.length > 0 && (
          <div className="mb-5 overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>{schema.columns.map((c) => <th key={c.key} className="px-3 py-2 text-left font-medium text-navy-500 whitespace-nowrap">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{schema.columns.map((c) => <td key={c.key} className="px-3 py-2 text-slate-600 whitespace-nowrap">{r[c.key]}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="text-xs text-slate-400 px-3 py-2">... và {rows.length - 5} dòng khác</p>}
          </div>
        )}

        {progress && (
          <div className="mb-4">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-ember-500 h-2 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">Đang xử lý {progress.done}/{progress.total} dòng...</p>
          </div>
        )}

        {status && (
          <div className={`mb-4 text-sm rounded-xl px-4 py-3 border ${status.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {status.message}
          </div>
        )}

        <button onClick={handleImport} disabled={rows.length === 0 || saving}
          className="flex items-center gap-2 bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
          <UploadIcon size={16} /> {saving ? 'Đang xử lý...' : `Nhập ${rows.length || ''} dòng vào hệ thống`}
        </button>
      </Card>
    </div>
  )
}
