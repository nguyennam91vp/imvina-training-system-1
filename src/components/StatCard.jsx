import React from 'react'

const TONES = {
  navy: { bg: 'bg-navy-50', text: 'text-navy-700', value: 'text-navy-900' },
  ember: { bg: 'bg-ember-50', text: 'text-ember-600', value: 'text-navy-900' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', value: 'text-navy-900' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', value: 'text-amber-600' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600', value: 'text-rose-600' },
}

export default function StatCard({ icon: Icon, label, value, hint, tone = 'navy' }) {
  const t = TONES[tone] || TONES.navy
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.bg} ${t.text}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className={`font-display text-[28px] font-bold leading-none ${t.value}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-2">{hint}</p>}
    </div>
  )
}
