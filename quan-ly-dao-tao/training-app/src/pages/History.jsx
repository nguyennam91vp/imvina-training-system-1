import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const emptyForm = { worker_id: '', course_id: '', training_date: '', score: '', result: 'Đạt' }

function genCertNumber() {
  const y = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `CN-${y}-${rand}`
}

export default function History() {
  const [records, setRecords] = useState([])
  const [workers, setWorkers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    if (!isSupabaseConfigured) return setLoading(false)
    setLoading(true)
    const [r, w, c] = await Promise.all([
      supabase.from('training_records').select('*, workers(full_name), courses(name)').order('training_date', { ascending: false }),
      supabase.from('workers').select('id, full_name'),
      supabase.from('courses').select('id, name'),
    ])
    setRecords(r.data || [])
    setWorkers(w.data || [])
    setCourses(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(emptyForm)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = { ...form, score: form.score ? Number(form.score) : null }
    const { data: inserted } = await supabase.from('training_records').insert(payload).select().single()

    // Nếu kết quả là "Đạt" thì tự động sinh chứng nhận
    if (inserted && form.result === 'Đạt') {
      await supabase.from('certificates').insert({
        training_record_id: inserted.id,
        worker_id: form.worker_id,
        course_id: form.course_id,
        cert_number: genCertNumber(),
        issued_date: form.training_date || new Date().toISOString().slice(0, 10),
      })
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Xóa bản ghi này? Chứng nhận liên quan (nếu có) cũng sẽ bị xóa.')) return
    await supabase.from('certificates').delete().eq('training_record_id', id)
    await supabase.from('training_records').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Lịch sử đào tạo</h1>
          <p className="text-slate-500 mt-1">Ghi nhận công nhân nào đã học khóa nào, kết quả ra sao.</p>
        </div>
        <button onClick={openNew} className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
          + Ghi nhận đào tạo
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase trước khi thêm dữ liệu.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Công nhân</th>
              <th className="px-4 py-3 font-medium">Khóa học</th>
              <th className="px-4 py-3 font-medium">Ngày học</th>
              <th className="px-4 py-3 font-medium">Điểm</th>
              <th className="px-4 py-3 font-medium">Kết quả</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-navy-800">{r.workers?.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{r.courses?.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.training_date}</td>
                <td className="px-4 py-3 text-slate-500">{r.score ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.result === 'Đạt' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {r.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có bản ghi nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display font-semibold text-lg text-navy-900">Ghi nhận đào tạo</h2>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Công nhân</label>
              <select required value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">-- Chọn công nhân --</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Khóa học</label>
              <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">-- Chọn khóa học --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Ngày học</label>
                <input type="date" required value={form.training_date} onChange={(e) => setForm({ ...form, training_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Điểm số</label>
                <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Kết quả</label>
              <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Đạt">Đạt</option>
                <option value="Không đạt">Không đạt</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Nếu chọn "Đạt", hệ thống tự tạo chứng nhận.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Hủy</button>
              <button type="submit" className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
