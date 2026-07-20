import React from 'react'
import { Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const { session, loading } = useAuth()

  // Nếu chưa cấu hình Supabase, vẫn cho xem giao diện ở chế độ demo
  // để bạn hình dung app trước khi kết nối database thật.
  if (isSupabaseConfigured) {
    if (loading) {
      return (
        <div className="h-screen flex items-center justify-center text-navy-500">
          Đang tải...
        </div>
      )
    }
    if (!session) {
      return <Navigate to="/dang-nhap" replace />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
