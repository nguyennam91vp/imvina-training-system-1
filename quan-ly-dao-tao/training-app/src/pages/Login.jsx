import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Sai email hoặc mật khẩu. Vui lòng kiểm tra lại.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <p className="text-ember-500 text-xs font-semibold tracking-widest uppercase">
          Xưởng sản xuất
        </p>
        <h1 className="font-display text-2xl font-bold text-navy-900 mt-1 mb-6">
          Đăng nhập
        </h1>

        {!isSupabaseConfigured && (
          <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2">
            Chưa kết nối Supabase — vào mục <b>Cài đặt & Kết nối</b> để cấu hình,
            hoặc xem hướng dẫn đi kèm.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember-400"
              placeholder="ban@congty.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ember-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ember-500 hover:bg-ember-600 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-xs text-navy-400 mt-5 leading-relaxed">
          Tài khoản quản trị đầu tiên được tạo trong Supabase (Authentication → Add user).
          Xem chi tiết trong tài liệu hướng dẫn.
        </p>
      </div>
    </div>
  )
}
