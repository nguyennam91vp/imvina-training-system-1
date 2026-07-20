// Danh sách công đoạn đào tạo mặc định — có thể thêm "Khác" khi cần công đoạn mới
export const STATIONS = ['SUB1', 'SUB2', 'Lens', 'MAIN', 'Khác']

// Tính ngày hết hạn = ngày cấp + số ngày hiệu lực
export function addDays(dateStr, days) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setDate(d.getDate() + Number(days || 0))
  return d.toISOString().slice(0, 10)
}

// Số ngày còn lại tính từ hôm nay đến ngày hết hạn (âm nghĩa là đã quá hạn)
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

// Trạng thái hiển thị dựa theo số ngày còn lại
export function expiryStatus(daysLeft) {
  if (daysLeft === null) return { label: 'Chưa có chứng nhận', color: 'bg-slate-100 text-slate-500' }
  if (daysLeft < 0) return { label: `Đã hết hạn ${Math.abs(daysLeft)} ngày`, color: 'bg-red-50 text-red-700' }
  if (daysLeft <= 30) return { label: `Sắp hết hạn (còn ${daysLeft} ngày)`, color: 'bg-amber-50 text-amber-700' }
  return { label: `Còn hiệu lực (${daysLeft} ngày)`, color: 'bg-green-50 text-green-700' }
}
