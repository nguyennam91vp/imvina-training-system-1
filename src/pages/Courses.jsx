import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { STATIONS } from '../lib/trainingUtils'
import { Card, PageHeader, Badge } from '../components/ui'

const emptyForm = { name: '', station: 'SUB1', description: '', duration_hours: '', instructor: '', start_date: '', validity_days: 365 }

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    if (!isSupabaseConfigured) return setLoading(false)
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    setCourses(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  function openEdit(c) { setForm({ ...emptyForm, ...c }); setEditingId(c.id); setShowForm(true) }

  async function handleSave(e) {
    e.preventDefault()
    const payload = { ...form, duration_hours: Number(form.duration_hours) || 0, validity_days: Number(form.validity_days) || 365 }
    if (editingId) await supabase.from('courses').update(payload).eq('id', editingId)
    else await supabase.from('courses').insert(payload)
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Xóa khóa đào tạo này?')) return
    await supabase.from('courses').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <PageHeader
        title="Khóa đào tạo"
        subtitle="Nội dung đào tạo theo từng công đoạn, có hạn hiệu lực chứng nhận."
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            <Plus size={16} /> Thêm khóa học
          </button>
        }
      />

      {!isSupabaseConfigured && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-3">
          Chưa kết nối database — hãy vào Cài đặt & Kết nối để nối Supabase trước khi thêm dữ liệu.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-navy-900">{c.name}</h3>
              <Badge tone="navy">{c.station}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>
            <div className="text-xs text-slate-400 mt-3 flex justify-between flex-wrap gap-1">
              <span>GV: {c.instructor || '—'}</span>
              <span>Hiệu lực: {c.validity_days || 365} ngày</span>
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              <button onClick={() => openEdit(c)} className="text-navy-600 hover:underline">Sửa</button>
              <button onClick={() => handleDelete(c.id)} className="text-rose-600 hover:underline">Xóa</button>
            </div>
          </Card>
        ))}
        {!loading && courses.length === 0 && (
          <p className="text-slate-400 text-sm col-span-2 text-center py-8">Chưa có khóa đào tạo nào.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display font-semibold text-lg text-navy-900">
              {editingId ? 'Sửa khóa đào tạo' : 'Thêm khóa đào tạo'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Công đoạn</label>
                <select value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Hiệu lực (ngày)</label>
                <input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Tên khóa học (hạng mục đào tạo)</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Mô tả</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Thời lượng (giờ)</label>
                <input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Ngày bắt đầu</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Giảng viên</label>
              <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })}
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
