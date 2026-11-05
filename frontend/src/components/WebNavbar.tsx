import { useState, useRef, useEffect } from "react"
import { useUser } from "../context/UserContext"
import { useApp } from "../context/AppContext"
import { getNotifIcon, type Notification } from "../data/notifications"

interface Props {
  current: string
  isGuest?: boolean
  onNavigate: (screen: string) => void
  onLogout: () => void
  onVerify: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  onSelectEvent?: (eventId: string) => void
}

export default function WebNavbar({
  current,
  isGuest = false,
  onNavigate,
  onLogout,
  onVerify,
  onOpenLogin,
  onOpenRegister,
  onSelectEvent,
}: Props) {
  const { user, role } = useUser()
  const {
    notifications,
    markNotificationRead,
    markAllRead,
    getStudentPermissions,
    tickets,
  } = useApp()

  const [notifOpen, setNotifOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const permissions = !isGuest ? getStudentPermissions(user.studentId) : []
  const hasCheckinPermission =
    permissions.length > 0 || !!user.la_nhan_vien_soat_ve

  const studentNotifs = !isGuest
    ? notifications.filter((n) => !n.audience || n.audience === "student")
    : []
  const unreadCount = studentNotifs.filter((n) => !n.read).length

  // Active upcoming tickets count for badge
  const upcomingTicketsCount = !isGuest
    ? tickets.filter(
        (t) => t.studentId === user.studentId && t.status === "pending",
      ).length
    : 0

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleNotifClick(notif: Notification) {
    markNotificationRead(notif.id)
    setNotifOpen(false)
    if (notif.action === "tickets" || notif.action === "ticket-confirm") {
      onNavigate("tickets")
    } else if (notif.action === "event-detail" && notif.eventId) {
      if (onSelectEvent) onSelectEvent(notif.eventId)
      else onNavigate("home")
    } else if (notif.action === "student-achievements") {
      onNavigate("achievements")
    }
  }

  const isExplore =
    current === "home" ||
    current === "event-detail" ||
    current === "ticket-confirm"
  const isTickets = current === "tickets"
  const isAchievements = current === "achievements"
  const isCheckin = current === "checkin"
  const isProfile = current === "profile"

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Portal Badge */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-display font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                CEH
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Campus Event Hub
                  </span>
                  <span
                    onClick={(e) => {
                      if (!isGuest && role !== "student") {
                        e.stopPropagation()
                        if (role === "faculty_manager") onNavigate("/faculty/approvals")
                        else if (role === "organizer") onNavigate("/organizer/events")
                        else if (role === "admin" || role === "student_affairs") onNavigate("/admin/dashboard")
                      }
                    }}
                    className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      isGuest
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 cursor-pointer"
                    }`}
                  >
                    {isGuest
                      ? "Cổng công khai"
                      : role === "admin" || role === "student_affairs"
                        ? "Quản trị viên ↗"
                        : role === "faculty_manager"
                          ? "Ban QL Khoa ↗"
                          : role === "organizer"
                            ? "Ban tổ chức ↗"
                            : "Sinh viên"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  Cổng sự kiện & rèn luyện đại học
                </p>
              </div>
            </button>

            {/* Center Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate("home")}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  isExplore
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Khám phá sự kiện
              </button>

              {!isGuest && role === "student" && (
                <>
                  <button
                    onClick={() => onNavigate("tickets")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isTickets
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span>Vé của tôi</span>
                    {upcomingTicketsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-indigo-600 text-white">
                        {upcomingTicketsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => onNavigate("achievements")}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isAchievements
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Điểm & Chứng nhận
                  </button>

                  {/* Sinh viên thường tự quét mã QR trên màn chiếu Kiosk hội trường (UC-OPS-03) */}
                  <button
                    onClick={() => onNavigate("checkin")}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      isCheckin
                        ? "bg-cyan-50 text-cyan-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span>Tự quét Kiosk</span>
                  </button>

                  {/* Dành riêng cho Cộng tác viên (CTV) điểm danh: Cầm máy quét mã vé của SV thường (UC-OPS-02) */}
                  {hasCheckinPermission && (
                    <button
                      onClick={() => onNavigate("staff-scanner")}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all cursor-pointer"
                      title="Chức năng dành cho CTV: Hướng camera quét mã QR trên vé của sinh viên"
                    >
                      <span>📷</span>
                      <span>Soát vé CTV (Quét vé SV)</span>
                    </button>
                  )}
                </>
              )}

              {!isGuest && role === "faculty_manager" && (
                <>
                  <button
                    onClick={() => onNavigate("/faculty/approvals")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    <span>🏢</span>
                    <span>Bàn làm việc Khoa</span>
                  </button>
                  <button
                    onClick={() => onNavigate("/organizer/events")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <span>📅</span>
                    <span>Sự kiện Khoa</span>
                  </button>
                  <button
                    onClick={() => onNavigate("staff-scanner")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Soát vé Camera</span>
                  </button>
                </>
              )}

              {!isGuest && role === "organizer" && (
                <>
                  <button
                    onClick={() => onNavigate("/organizer/events")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    <span>🎪</span>
                    <span>Quản lý sự kiện</span>
                  </button>
                  <button
                    onClick={() => onNavigate("/organizer/participants")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <span>👥</span>
                    <span>Người tham gia</span>
                  </button>
                  <button
                    onClick={() => onNavigate("staff-scanner")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Soát vé Camera</span>
                  </button>
                </>
              )}

              {!isGuest && (role === "admin" || role === "student_affairs") && (
                <>
                  <button
                    onClick={() => onNavigate("/admin/dashboard")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>Cổng Quản trị viên</span>
                  </button>
                  <button
                    onClick={() => onNavigate(role === "student_affairs" ? "/affairs/approvals" : "/admin/reports")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <span>📋</span>
                    <span>Duyệt hồ sơ sự kiện</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Icons & User Dropdown or Guest Login/Register */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Public verification button (desktop) */}
            <button
              onClick={onVerify}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-6 6.75-3 3v-4.5m12 4.5 3 3v-4.5M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
                />
              </svg>
              <span>Tra cứu chứng chỉ</span>
            </button>

            {isGuest ? (
              /* Guest Actions: Log in / Register buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={onOpenRegister}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Đăng ký tài khoản
                </button>
              </div>
            ) : (
              /* Authenticated User Controls: Notifications & User Avatar Menu */
              <>
                {/* Notifications Popover */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label="Thông báo"
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white bg-rose-600 shadow-xs">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-sm text-slate-900">
                            Thông báo
                          </h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              {unreadCount} mới
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {studentNotifs.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">
                            Không có thông báo nào
                          </div>
                        ) : (
                          studentNotifs.slice(0, 10).map((notif) => {
                            const icon = getNotifIcon(notif.type)
                            return (
                              <button
                                key={notif.id}
                                onClick={() => handleNotifClick(notif)}
                                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 cursor-pointer ${
                                  notif.read ? "bg-white" : "bg-indigo-50/40"
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{ background: icon.bg }}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    style={{ color: icon.color }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d={icon.path}
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={`text-xs ${
                                        notif.read
                                          ? "font-medium text-slate-800"
                                          : "font-bold text-slate-900"
                                      }`}
                                    >
                                      {notif.title}
                                    </p>
                                    {!notif.read && (
                                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                    {notif.description}
                                  </p>
                                  <span className="text-[11px] text-slate-400 mt-1 block">
                                    {notif.time}
                                  </span>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                        <button
                          onClick={() => {
                            setNotifOpen(false)
                            onNavigate("tickets")
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
                        >
                          Quản lý vé & hoạt động →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu Popover */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 sm:pr-3 rounded-full hover:bg-slate-100 transition-colors focus:outline-none border border-slate-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-display font-bold text-xs flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.initials
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                        {user.displayName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {user.studentId}
                      </div>
                    </div>
                    <svg
                      className="hidden sm:block w-3.5 h-3.5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="font-display font-bold text-sm text-slate-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {user.studentId} · {user.faculty}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-1.5 space-y-1">
                        {role === "organizer" && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              onNavigate("/organizer/dashboard")
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-left transition-colors cursor-pointer border border-indigo-200"
                          >
                            <span>📊</span>
                            <span>Bảng điều khiển Ban tổ chức →</span>
                          </button>
                        )}
                        {(role === "admin" || role === "student_affairs") && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              onNavigate("/admin/dashboard")
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-left transition-colors cursor-pointer border border-indigo-200"
                          >
                            <span>🛡️</span>
                            <span>Bảng điều khiển Quản trị viên →</span>
                          </button>
                        )}
                        {role === "faculty_manager" && (
                          <>
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                onNavigate("/faculty/approvals")
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-left transition-colors cursor-pointer border border-indigo-200"
                            >
                              <span>📋</span>
                              <span>Hồ sơ Thẩm định cấp Khoa →</span>
                            </button>
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                onNavigate("/organizer/events")
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                            >
                              <span>🎪</span>
                              <span>Không gian Quản lý sự kiện →</span>
                            </button>
                            <button
                              onClick={() => {
                                setUserMenuOpen(false)
                                onNavigate("staff-scanner")
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 text-left transition-colors cursor-pointer border border-amber-200"
                            >
                              <span>📷</span>
                              <span>Máy quét soát vé Camera →</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            onNavigate("profile")
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                            isProfile
                              ? "bg-indigo-50 text-indigo-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                            />
                          </svg>
                          <span>Hồ sơ cá nhân</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            onNavigate("tickets")
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                            />
                          </svg>
                          <span>Vé của tôi ({upcomingTicketsCount})</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            onNavigate("achievements")
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                            />
                          </svg>
                          <span>Điểm & Chứng nhận</span>
                        </button>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            onVerify()
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75m-6 6.75-3 3v-4.5m12 4.5 3 3v-4.5M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
                            />
                          </svg>
                          <span>Tra cứu chứng chỉ số</span>
                        </button>

                        {hasCheckinPermission && (
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              onNavigate("staff-scanner")
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 text-left transition-colors cursor-pointer border border-amber-200"
                          >
                            <span>📷</span>
                            <span>Bàn soát vé CTV (Quét mã vé SV)</span>
                          </button>
                        )}
                      </div>

                      <div className="p-1.5 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            onLogout()
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                            />
                          </svg>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Mở menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => {
              onNavigate("home")
              setMobileMenuOpen(false)
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer ${
              isExplore ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
            }`}
          >
            <span>Khám phá sự kiện</span>
            <span>→</span>
          </button>

          {!isGuest ? (
            <>
              {role === "student" && (
                <>
                  <button
                    onClick={() => {
                      onNavigate("tickets")
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer ${
                      isTickets ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                    }`}
                  >
                    <span>Vé của tôi</span>
                    {upcomingTicketsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                        {upcomingTicketsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onNavigate("achievements")
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer ${
                      isAchievements
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700"
                    }`}
                  >
                    <span>Điểm & Chứng nhận</span>
                    <span>→</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate("checkin")
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer ${
                      isCheckin ? "bg-cyan-50 text-cyan-800" : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      <span>Tự quét mã Kiosk Hội trường</span>
                    </div>
                    <span className="text-xs text-slate-400">Sinh viên</span>
                  </button>

                  {hasCheckinPermission && (
                    <button
                      onClick={() => {
                        onNavigate("staff-scanner")
                        setMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-left bg-amber-50 text-amber-900 border border-amber-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>📷</span>
                        <span>Bàn Soát Vé CTV (Quét vé SV)</span>
                      </div>
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                        CTV
                      </span>
                    </button>
                  )}
                </>
              )}

              {role === "faculty_manager" && (
                <>
                  <button
                    onClick={() => {
                      onNavigate("/faculty/approvals")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left bg-indigo-50 text-indigo-700 cursor-pointer"
                  >
                    <span>🏢 Bàn làm việc Khoa</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("/organizer/events")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-slate-700 cursor-pointer"
                  >
                    <span>📅 Sự kiện Khoa</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("staff-scanner")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-left bg-amber-50 text-amber-800 cursor-pointer"
                  >
                    <span>📷 Soát vé Camera</span>
                    <span>→</span>
                  </button>
                </>
              )}

              {role === "organizer" && (
                <>
                  <button
                    onClick={() => {
                      onNavigate("/organizer/events")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left bg-indigo-50 text-indigo-700 cursor-pointer"
                  >
                    <span>🎪 Quản lý sự kiện</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("/organizer/participants")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-slate-700 cursor-pointer"
                  >
                    <span>👥 Người tham gia</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate("staff-scanner")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-left bg-amber-50 text-amber-800 cursor-pointer"
                  >
                    <span>📷 Soát vé Camera</span>
                    <span>→</span>
                  </button>
                </>
              )}

              {(role === "admin" || role === "student_affairs") && (
                <>
                  <button
                    onClick={() => {
                      onNavigate("/admin/dashboard")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left bg-indigo-50 text-indigo-700 cursor-pointer"
                  >
                    <span>⚙️ Cổng Quản trị viên</span>
                    <span>→</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate(role === "student_affairs" ? "/affairs/approvals" : "/admin/reports")
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-slate-700 cursor-pointer"
                  >
                    <span>📋 Duyệt hồ sơ sự kiện</span>
                    <span>→</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  onNavigate("profile")
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer ${
                  isProfile ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                }`}
              >
                <span>Hồ sơ cá nhân</span>
                <span>→</span>
              </button>

              <button
                onClick={() => {
                  onVerify()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 text-left border border-slate-200 mt-2 cursor-pointer"
              >
                <span>Tra cứu chứng chỉ số công khai</span>
                <span>🔍</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onVerify()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 text-left border border-slate-200 cursor-pointer"
              >
                <span>Tra cứu chứng chỉ số công khai</span>
                <span>🔍</span>
              </button>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => {
                    if (onOpenLogin) onOpenLogin()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 text-center cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    if (onOpenRegister) onOpenRegister()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold text-center cursor-pointer shadow-xs"
                >
                  Đăng ký tài khoản
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
