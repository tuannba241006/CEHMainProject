import { useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
import { useUser } from "../../context/UserContext"
import { BiAssistantDrawer } from "../../components/BiAssistantDrawer"

const navGroups = [
  {
    category: "Quản trị cấp Trường",
    items: [
      { path: "/admin/dashboard", label: "Tổng quan toàn trường", icon: "📊" },
      { path: "/admin/events", label: "Sự kiện cấp trường & Nháp", icon: "📋" },
      { path: "/affairs/approvals", label: "Duyệt đề xuất sự kiện", icon: "✅" },
      { path: "/affairs/drl", label: "Phê duyệt kết quả ĐRL", icon: "⭐" },
      { path: "/faculty/approvals", label: "Duyệt thay cấp Khoa (Sự cố)", icon: "⚡" },
    ],
  },
  {
    category: "Vận hành sự kiện (P.CTSV)",
    items: [
      { path: "/organizer/participants", label: "Người tham gia sự kiện", icon: "👥" },
      { path: "/organizer/staff", label: "Nhân viên & CTV điểm danh", icon: "🧑‍💼" },
      { path: "/organizer/cohost-invitations", label: "Lời mời đồng tổ chức", icon: "🤝" },
    ],
  },
  {
    category: "Hạ tầng & Hệ thống",
    items: [
      { path: "/admin/rooms", label: "Phòng ốc & Lịch bảo trì", icon: "🏢" },
      { path: "/admin/no-show", label: "Xử lý vi phạm No-show", icon: "⚠️" },
      { path: "/admin/certificates", label: "Cấp & Thu hồi chứng nhận", icon: "📜" },
      { path: "/admin/organizations", label: "Cây phân cấp Đơn vị", icon: "🌳" },
      { path: "/admin/users", label: "Tài khoản & Phân quyền", icon: "👤" },
      { path: "/admin/topics", label: "Danh mục Chuyên đề", icon: "🏷️" },
      { path: "/admin/reports", label: "Báo cáo vĩ mô", icon: "📈" },
    ],
  },
] as const

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const sidebar = (
    <>
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center font-display font-bold text-xs">
            CEH
          </div>
          <div>
            <p className="font-display font-bold text-navy">Admin - P.CTSV</p>
            <p className="text-xs text-slate-400">Quản trị viên cấp trường</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-0.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {group.category}
            </p>
            {group.items.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/admin/dashboard" &&
                  location.pathname.startsWith(item.path))
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                    active
                      ? "bg-indigo-light text-indigo font-bold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                  }`}
                >
                  <span className="text-sm shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <p className="text-sm font-semibold text-navy">{user.ho_ten}</p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
        <button
          onClick={() => void logout().finally(() => navigate("/login"))}
          className="mt-3 text-sm font-semibold text-red-600 cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    </>
  )
  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        {sidebar}
      </aside>
      {open && (
        <button
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100"
          >
            ☰
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-indigo">
              Campus Event Hub
            </p>
            <p className="font-display font-bold text-navy">
              Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            Admin · P.CTSV
          </span>
        </header>
        <main>{children}</main>
        <BiAssistantDrawer role="admin" />
      </div>
    </div>
  )
}
