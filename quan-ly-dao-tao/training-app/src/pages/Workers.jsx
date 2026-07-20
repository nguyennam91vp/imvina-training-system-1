import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const emptyForm = { full_name: '', employee_code: '', department: '', position: '', phone: '' }

export default function Workers() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    if (!isSupabaseConfigured) return setLoading(false)
    setLoading(true)
    const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false })
    setWorkers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(w) {
    setForm(w)
    setEditingId(w.id)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (editingId) {
      await supabase.from('workers').update(form).eq('id', editingId)
    } else {
      await supabase.from('workers').insert(form)
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Xóa công nhân này?')) return
    await supabase.from('workers').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Công nhân</h1>
          <p className="text-slate-500 mt-1">Danh sách nhân viên trong xưởng.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          + Thêm công nhân
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
              <th className="px-4 py-3 font-medium">Họ tên</th>
              <th className="px-4 py-3 font-medium">Mã NV</th>
              <th className="px-4 py-3 font-medium">Bộ phận</th>
              <th className="px-4 py-3 font-medium">Chức vụ</th>
              <th className="px-4 py-3 font-medium">SĐT</th>
              <th className="px-4 py-3 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workers.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium text-navy-800">{w.full_name}</td>
                <td className="px-4 py-3 text-slate-500">{w.employee_code}</td>
                <td className="px-4 py-3 text-slate-500">{w.department}</td>
                <td className="px-4 py-3 text-slate-500">{w.position}</td>
                <td className="px-4 py-3 text-slate-500">{w.phone}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => openEdit(w)} className="text-navy-600 hover:underline">Sửa</button>
                  <button onClick={() => handleDelete(w.id)} className="text-red-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
            {!loading && workers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có công nhân nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-navy-950/50 flex items-center justify-center z-50 px-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-display font-semibold text-lg text-navy-900">
              {editingId ? 'Sửa thông tin công nhân' : 'Thêm công nhân'}
            </h2>
            {[
              ['full_name', 'Họ tên'],
              ['employee_code', 'Mã nhân viên'],
              ['department', 'Bộ phận'],
              ['position', 'Chức vụ'],
              ['phone', 'Số điện thoại'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-navy-700 mb-1">{label}</label>
                <input
                  required={key === 'full_name'}
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">
                Hủy
              </button>
              <button type="submit" className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                Lưu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
