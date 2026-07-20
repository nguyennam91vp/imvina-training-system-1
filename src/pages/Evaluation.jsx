import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const emptyForm = {
  worker_name: '',
  course_name: '',
  evaluation_date: new Date().toISOString().slice(0, 10),
  content: '',
  score: '',
  classification: 'Đạt',
  evaluator: '',
}

export default function Evaluation() {
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (isSupabaseConfigured) {
      await supabase.from('evaluations').insert(form)
    }
    setSaved(true)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Phiếu đánh giá</h1>
          <p className="text-slate-500 mt-1">Lập phiếu đánh giá sau đào tạo và in ra giấy.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
            Lưu phiếu
          </button>
          <button onClick={handlePrint} className="bg-ember-500 hover:bg-ember-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
            In phiếu
          </button>
        </div>
      </div>

      {saved && (
        <div className="no-print mb-4 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3">
          Đã lưu phiếu đánh giá.
        </div>
      )}

      <div className="no-print bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Tên công nhân</label>
          <input value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Khóa học</label>
          <input value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Ngày đánh giá</label>
          <input type="date" value={form.evaluation_date} onChange={(e) => setForm({ ...form, evaluation_date: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Người đánh giá</label>
          <input value={form.evaluator} onChange={(e) => setForm({ ...form, evaluator: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-navy-700 mb-1">Nội dung đánh giá</label>
          <textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Điểm</label>
          <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-1">Xếp loại</label>
          <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option>Đạt</option>
            <option>Khá</option>
            <option>Giỏi</option>
            <option>Không đạt</option>
          </select>
        </div>
      </div>

      {/* Khu vực sẽ được in ra giấy */}
      <div className="print-area bg-white border border-slate-200 rounded-xl p-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-500">Xưởng sản xuất</p>
          <h2 className="font-display text-2xl font-bold text-navy-900 mt-1">PHIẾU ĐÁNH GIÁ ĐÀO TẠO</h2>
        </div>
        <table className="w-full text-sm">
          <tbody>
            <tr><td className="py-1.5 text-slate-500 w-40">Họ tên công nhân</td><td className="py-1.5 font-medium">{form.worker_name || '..........................'}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Khóa đào tạo</td><td className="py-1.5 font-medium">{form.course_name || '..........................'}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Ngày đánh giá</td><td className="py-1.5 font-medium">{form.evaluation_date}</td></tr>
            <tr><td className="py-1.5 text-slate-500 align-top">Nội dung đánh giá</td><td className="py-1.5">{form.content || '..........................'}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Điểm</td><td className="py-1.5 font-medium">{form.score || '—'}</td></tr>
            <tr><td className="py-1.5 text-slate-500">Xếp loại</td><td className="py-1.5 font-medium">{form.classification}</td></tr>
          </tbody>
        </table>
        <div className="mt-10 flex justify-end text-sm">
          <div className="text-center">
            <p className="text-slate-500">Người đánh giá</p>
            <p className="mt-14 font-medium">{form.evaluator || '..........................'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
