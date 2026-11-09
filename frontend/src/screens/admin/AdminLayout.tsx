import { useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router"
import { useUser } from "../../context/UserContext"
import { BiAssistantDrawer } from "../../components/BiAssistantDrawer"
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Award,
  Zap,
  Users,
  UserCheck,
  Handshake,
  Building2,
  AlertTriangle,
  FileText,
  Network,
  UserCog,
  Tag,
  TrendingUp,
  LogOut,
  Menu,
  Shield,
} from "lucide-react"

interface NavItemDef {
  path: string
  label: string
  icon: typeof LayoutDashboard
}

interface NavGroupDef {
  category: string
  items: NavItemDef[]
}

const navGroups: NavGroupDef[] = [
  {
    category: "Quản trị cấp Trường",
    items: [
      { path: "/admin/dashboard", label: "Tổng quan toàn trường", icon: LayoutDashboard },
      { path: "/admin/events", label: "Sự kiện cấp trường & Nháp", icon: ClipboardList },
      { path: "/affairs/approvals", label: "Duyệt đề xuất sự kiện", icon: CheckCircle2 },
      { path: "/affairs/drl", label: "Phê duyệt kết quả ĐRL", icon: Award },
      { path: "/faculty/approvals", label: "Duyệt thay cấp Khoa (Sự cố)", icon: Zap },
    ],
  },
  {
    category: "Vận hành sự kiện (Toàn trường & P.CTSV)",
    items: [
      { path: "/admin/participants", label: "Người tham gia sự kiện", icon: Users },
      { path: "/admin/staff", label: "Nhân viên & CTV điểm danh", icon: UserCheck },
      { path: "/admin/cohost-invitations", label: "Lời mời đồng tổ chức", icon: Handshake },
    ],
  },
  {
    category: "Hạ tầng & Hệ thống",
    items: [
      { path: "/admin/rooms", label: "Phòng ốc & Lịch bảo trì", icon: Building2 },
      { path: "/admin/no-show", label: "Xử lý vi phạm No-show", icon: AlertTriangle },
      { path: "/admin/certificates", label: "Cấp & Thu hồi chứng nhận", icon: FileText },
      { path: "/admin/organizations", label: "Cây phân cấp Đơn vị", icon: Network },
      { path: "/admin/users", label: "Tài khoản & Phân quyền", icon: UserCog },
      { path: "/admin/topics", label: "Danh mục Chuyên đề", icon: Tag },
      { path: "/admin/reports", label: "Báo cáo vĩ mô", icon: TrendingUp },
    ],
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()

  const sidebar = (
    <>
      <div className="p-5 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
            CEH
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
              <span>Admin · CTSV</span>
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
            </p>
            <p className="text-[11px] text-slate-500 truncate">Hệ thống Quản trị Học cụ</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {group.category}
            </p>
            {group.items.map((item) => {
              const active =
                location.pathname === item.path ||
                (item.path !== "/admin/dashboard" &&
                  location.pathname.startsWith(item.path))
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setOpen(false)
                  }}
                  className={`group w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user.ho_ten ? user.ho_ten.charAt(0) : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user.ho_ten}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => void logout().finally(() => navigate("/login"))}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50/60 flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen shadow-2xs">
        {sidebar}
      </aside>
      {open && (
        <button
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transition-transform lg:hidden shadow-xl ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <button
            onClick={() => setOpen(true)}
            aria-label="Mở menu quản trị"
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">
              Campus Event Hub
            </p>
            <p className="font-display font-bold text-slate-900 text-sm sm:text-base">
              Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Admin · P.CTSV</span>
          </span>
        </header>
        <main>{children}</main>
        <BiAssistantDrawer role="admin" />
      </div>
    </div>
  )
}
