import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import Courses from './pages/Courses'
import History from './pages/History'
import Import from './pages/Import'
import Summary from './pages/Summary'
import Evaluation from './pages/Evaluation'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/dang-nhap" element={<Login />} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/cong-nhan" element={<Layout><Workers /></Layout>} />
        <Route path="/khoa-dao-tao" element={<Layout><Courses /></Layout>} />
        <Route path="/lich-su" element={<Layout><History /></Layout>} />
        <Route path="/nhap-du-lieu" element={<Layout><Import /></Layout>} />
        <Route path="/bang-tong-hop" element={<Layout><Summary /></Layout>} />
        <Route path="/phieu-danh-gia" element={<Layout><Evaluation /></Layout>} />
        <Route path="/cai-dat" element={<Layout><Settings /></Layout>} />
      </Routes>
    </AuthProvider>
  )
}
