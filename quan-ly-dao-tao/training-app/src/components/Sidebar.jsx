import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { to: '/', label: 'Tổng quan', icon: '▦' },
  { to: '/cong-nhan', label: 'Công nhân', icon: '◎' },
  { to: '/khoa-dao-tao', label: 'Khóa đào tạo', icon: '▤' },
  { to: '/lich-su', label: 'Lịch sử đào tạo', icon: '◷' },
  { to: '/bang-tong-hop', label: 'Bảng tổng hợp', icon: '▥' },
  { to: '/phieu-danh-gia', label: 'Phiếu đánh giá', icon: '✎' },
  { to: '/cai-dat', label: 'Cài đặt & Kết nối', icon: '⚙' },
]

export default function Sidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="no-print w-64 shrink-0 bg-navy-900 text-navy-100 flex flex-col h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6 border-b border-navy-700/60">
        <p className="text-ember-400 text-xs font-semibold tracking-widest uppercase">
          Xưởng sản xuất
        </p>
        <h1 className="font-display text-xl font-bold text-white mt-1 leading-snug">
          Quản lý<br />Đào tạo
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ember-500 text-white shadow-sm'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <span className="w-5 text-center opacity-90">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-800 hover:text-white transition-colors"
        >
          <span className="w-5 text-center">⏻</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
