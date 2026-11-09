import { useState } from "react"
import { BarChart3 } from "lucide-react"
import type { Role } from "../../App"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import AdminLayout from "../admin/AdminLayout"
import { BiAssistantDrawer } from "../../components/BiAssistantDrawer"

interface Props {
  children: React.ReactNode
  role: Extract<Role, "faculty_manager" | "student_affairs">
  current: string
  onNavigate: (screen: string) => void
  onLogout: () => void
}

const icons = {
  inbox: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v6.643a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-6.643c0-.97.616-1.813 1.5-2.097m16.5 0V6.75A2.25 2.25 0 0 0 18 4.5H6a2.25 2.25 0 0 0-2.25 2.25v1.761m16.5 0-7.189 4.63a2.25 2.25 0 0 1-2.122 0L3.75 8.51"
    />
  ),
  result: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m6-3.75a48.394 48.394 0 0 1-9 5.25A48.394 48.394 0 0 1 3 6m18 6c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 11 2s10 4.477 10 10Z"
    />
  ),
  certificate: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-6 6.75-3 3v-4.5m12 4.5 3 3v-4.5M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
    />
  ),
  event: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
    />
  ),
  rooms: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
    />
  ),
  admin: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
    />
  ),
  camera: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
    />
  ),
}

export function ManagementLayout({
  children,
  role,
  current,
  onNavigate,
  onLogout,
}: Props) {
  const { role: activeRole } = useUser()
  const isAdministrator =
    role === "student_affairs" ||
    activeRole === "admin" ||
    activeRole === "student_affairs"

  if (isAdministrator) {
    return <AdminLayout>{children}</AdminLayout>
  }

  const { notifications } = useApp()
  const [open, setOpen] = useState(false)
  const isFaculty = role === "faculty_manager"
  const nav = isFaculty
    ? [
        {
          id: "faculty-inbox",
          label: "Hồ sơ chờ khoa duyệt (Bước 1)",
          icon: icons.inbox,
        },
        {
          id: "org-events",
          label: "Tổ chức sự kiện Khoa (Host A)",
          icon: icons.event,
        },
      ]
    : [
        {
          id: "affairs-inbox",
          label: "Duyệt đề xuất cấp Trường",
          icon: icons.inbox,
        },
        {
          id: "affairs-results",
          label: "Phê duyệt kết quả & ĐRL",
          icon: icons.result,
        },
        {
          id: "affairs-certificates",
          label: "Cấp phát & Chứng nhận",
          icon: icons.certificate,
        },
        {
          id: "admin-rooms",
          label: "Phòng ốc & Lịch bảo trì",
          icon: icons.rooms,
        },
        {
          id: "admin-dashboard",
          label: "Cổng Quản trị viên (Admin)",
          icon: icons.admin,
        },
      ]
  const title = isFaculty
    ? "Ban Quản lý Khoa"
    : "Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)"
  const subtitle = isFaculty
    ? "Ban tổ chức cấp Khoa & Thẩm định bước 1"
    : "Quản trị viên cao nhất cấp Trường"
  const initials = isFaculty ? "KQ" : "AD"
  const unread = notifications.filter(
    (item) => !item.read && item.audience === role,
  ).length

  const sidebar = (
    <>
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo text-white flex items-center justify-center font-display font-bold text-xs">
            CEH
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-navy truncate">
              Campus Event Hub
            </p>
            <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="text-xs font-semibold text-amber-700">Tài khoản demo</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Dữ liệu và thao tác chỉ dùng để mô phỏng.
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() =>
              onNavigate(isFaculty ? "faculty-inbox" : "affairs-inbox")
            }
            className="mt-2 w-full rounded-xl bg-indigo-light text-indigo px-3 py-2 text-left text-xs font-semibold"
          >
            {unread} thông báo mới cần xử lý →
          </button>
        )}
        {!isFaculty && (
          <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Phân tích Thống kê BI
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Truy vấn số liệu vĩ mô, tỷ lệ No-show & ĐRL toàn trường qua bảng điều khiển nhanh.
            </p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active =
            current === item.id ||
            (current.endsWith("detail") && item.id.endsWith("inbox"))
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left ${
                active
                  ? "bg-indigo-light text-indigo"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.5}
              >
                {item.icon}
              </svg>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-cyan text-white flex items-center justify-center font-bold text-xs">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy truncate">{title}</p>
            <p className="text-xs text-slate-400 truncate">
              {isFaculty ? "khoa.httt@uit.edu.vn" : "ctsv@uit.edu.vn"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
        >
          Đăng xuất
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        {sidebar}
      </aside>
      {open && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
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
        <header className="safe-area-top lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 pb-3 flex items-center justify-between">
          <button
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-center">
            <p className="font-display font-semibold text-sm text-navy">
              {title}
            </p>
            <p className="text-xs text-amber-600">Chế độ demo</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-cyan text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        </header>
        {/* Desktop top header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {isFaculty
                ? "Ban Quản lý Khoa (Host A & Reviewer)"
                : "Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800">
              {current === "faculty-inbox"
                ? "Thẩm định hồ sơ CLB cấp Khoa (Bước 1)"
                : current === "affairs-inbox"
                  ? "Phê duyệt hồ sơ cấp Trường & Phòng ốc (Bước 2)"
                  : current === "affairs-results"
                    ? "Phê duyệt kết quả & Điểm ĐRL"
                    : current === "affairs-certificates"
                      ? "Cấp phát & Quản lý chứng nhận"
                      : "Chi tiết hồ sơ sự kiện"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isFaculty
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isFaculty ? "Ban tổ chức · Khoa" : "Admin · P.CTSV"}
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">
                  {title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isFaculty ? "khoa.httt@uit.edu.vn" : "ctsv@uit.edu.vn"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>
        {!isFaculty && <BiAssistantDrawer role="student_affairs" />}
      </div>
    </div>
  )
}
