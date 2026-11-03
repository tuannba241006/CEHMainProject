import { useNavigate } from "react-router"
import { useUser } from "../../context/UserContext"
import { OrgLayout } from "./OrgLayout"

/** Real settings entry rather than a non-existent /organizer/settings route. */
export default function OrganizerSettings() {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const nav = (id: string) => {
    const paths: Record<string, string> = {
      "org-dashboard": "/organizer/dashboard",
      "org-events": "/organizer/events",
      "org-participants": "/organizer/participants",
      "org-staff": "/organizer/staff",
      "org-settings": "/organizer/settings",
    }
    navigate(paths[id] || "/organizer/dashboard")
  }
  return (
    <OrgLayout current="org-settings" onNavigate={nav} onLogout={() => void logout().finally(() => navigate("/login"))}>
      <section className="p-4 sm:p-6 lg:p-8 max-w-4xl" aria-label="Cài đặt ban tổ chức">
        <h1 className="font-display text-2xl font-bold text-navy">Cài đặt & tài khoản</h1>
        <p className="mt-1 text-sm text-slate-500">Thông tin người dùng hiện tại và các lối tắt quản lý.</p>
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div><p className="text-xs text-slate-500">Tên tài khoản</p><p className="font-semibold">{user.ho_ten}</p></div>
          <div><p className="text-xs text-slate-500">Email</p><p className="font-medium break-all">{user.email}</p></div>
          <div><p className="text-xs text-slate-500">Đơn vị</p><p className="font-medium">{user.don_vi?.ten_don_vi || user.faculty || "Chưa xác định"}</p></div>
          <div className="flex flex-wrap gap-3 pt-3">
            <button onClick={() => navigate("/organizer/events")} className="rounded-xl bg-indigo text-white font-semibold px-4 py-2">Quản lý sự kiện</button>
            <button onClick={() => navigate("/organizer/staff")} className="rounded-xl border border-slate-200 text-slate-700 font-semibold px-4 py-2">Nhân sự sự kiện</button>
            <button onClick={() => navigate("/change-password")} className="rounded-xl border border-slate-200 text-slate-700 font-semibold px-4 py-2">Đổi mật khẩu</button>
          </div>
        </div>
      </section>
    </OrgLayout>
  )
}
