import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { addDays } from '../lib/trainingUtils'
import { Card, PageHeader, Badge } from '../components/ui'

const emptyForm = { worker_id: '', course_id: '', training_date: '', score: '', result: 'Đạt', note: '' }

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
      supabase.from('training_records').select('*, workers(full_name), courses(name, station)').order('training_date', { ascending: false }),
      supabase.from('workers').select('id, full_name'),
      supabase.from('courses').select('id, name, station, validity_days'),
    ])
    setRecords(r.data || [])
    setWorkers(w.data || [])
    setCourses(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(emptyForm); setShowForm(true) }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      worker_id: form.worker_id, course_id: form.course_id, training_date: form.training_date,
      score: form.score ? Number(form.score) : null, result: form.result, note: form.note || null,
    }
    const { data: inserted } = await supabase.from('training_records').insert(payload).select().single()

    if (inserted && form.result === 'Đạt') {
      const course = courses.find((c) => c.id === form.course_id)
      const validityDays = course?.validity_days || 365
      await supabase.from('certificates').insert({
        training_record_id: inserted.id, worker_id: form.worker_id, course_id: form.course_id,
        cert_number: genCertNumber(),
        issued_date: form.training_date || new Date().toISOString().slice(0, 10),
        expiry_date: addDays(form.training_date, validityDays),
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

  const selectedCourse = courses.find((c) => c.id === form.course_id)

  return (
    <div>
      <PageHeader
        title="Lịch sử đào tạo"
        subtitle="Ghi nhận công nhân nào đã học khóa nào, kết quả ra sao."
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Ghi nhận đào tạo
          </button>
        }
      />

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase trước khi thêm dữ liệu.
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-navy-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Công nhân</th>
              <th className="px-4 py-3 font-medium">Công đoạn</th>
              <th className="px-4 py-3 font-medium">Khóa học</th>
              <th className="px-4 py-3 font-medium">Ngày học</th>
              <th className="px-4 py-3 font-medium">Điểm</th>
              <th className="px-4 py-3 font-medium">Kết quả</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-navy-800">{r.workers?.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{r.courses?.station}</td>
                <td className="px-4 py-3 text-slate-500">{r.courses?.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.training_date}</td>
                <td className="px-4 py-3 text-slate-500">{r.score ?? '—'}</td>
                <td className="px-4 py-3"><Badge tone={r.result === 'Đạt' ? 'green' : 'red'}>{r.result}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(r.id)} className="text-rose-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Chưa có bản ghi nào.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-semibold text-lg text-navy-900">Ghi nhận đào tạo</h2>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Công nhân</label>
              <select required value={form.worker_id} onChange={(e) => setForm({ ...form, worker_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                <option value="">-- Chọn công nhân --</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Khóa học (công đoạn)</label>
              <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                <option value="">-- Chọn khóa học --</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.station ? `[${c.station}] ` : ''}{c.name}</option>)}
              </select>
              {selectedCourse && (
                <p className="text-xs text-slate-400 mt-1">Hiệu lực chứng nhận: {selectedCourse.validity_days || 365} ngày kể từ ngày đạt.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Ngày học</label>
                <input type="date" required value={form.training_date} onChange={(e) => setForm({ ...form, training_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Điểm số</label>
                <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Kết quả</label>
              <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                <option value="Đạt">Đạt</option>
                <option value="Không đạt">Không đạt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Ghi chú (Note)</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Hủy</button>
              <button type="submit" className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
