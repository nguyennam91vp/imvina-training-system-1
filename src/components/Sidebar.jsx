import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, Users, BookOpen, History as HistoryIcon, Upload, Table2,
  ClipboardCheck, Settings as SettingsIcon, LogOut, Factory,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/cong-nhan', label: 'Công nhân', icon: Users },
  { to: '/khoa-dao-tao', label: 'Khóa đào tạo', icon: BookOpen },
  { to: '/lich-su', label: 'Lịch sử đào tạo', icon: HistoryIcon },
  { to: '/nhap-du-lieu', label: 'Nhập dữ liệu Excel', icon: Upload },
  { to: '/bang-tong-hop', label: 'Bảng tổng hợp', icon: Table2 },
  { to: '/phieu-danh-gia', label: 'Phiếu đánh giá', icon: ClipboardCheck },
  { to: '/cai-dat', label: 'Cài đặt & Kết nối', icon: SettingsIcon },
]

export default function Sidebar() {
  const { signOut, session } = useAuth()
  const email = session?.user?.email || ''
  const initial = email ? email[0].toUpperCase() : 'X'

  return (
    <aside className="no-print w-64 shrink-0 bg-navy-950 text-navy-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6 border-b border-white/5 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-ember-500 flex items-center justify-center text-white shrink-0">
          <Factory size={18} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-ember-400 text-[11px] font-semibold tracking-widest uppercase leading-none">
            Xưởng sản xuất
          </p>
          <h1 className="font-display text-[15px] font-bold text-white mt-1 leading-tight">
            Quản lý Đào tạo
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? 'bg-ember-500 text-white shadow-sm shadow-ember-900/30'
                    : 'text-navy-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-navy-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-navy-300 truncate">{email || 'Chế độ demo'}</p>
        </div>
        <button onClick={signOut} title="Đăng xuất" className="text-navy-400 hover:text-white transition-colors">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
