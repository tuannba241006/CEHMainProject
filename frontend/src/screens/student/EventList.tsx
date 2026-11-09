import { useState } from "react"
import { TOPIC_LABELS, type Topic } from "../../data/mock"
import type { WaitlistEntry } from "../../data/contract"
import { useUser } from "../../context/UserContext"
import {
  useApp,
  EVENT_STATUS_LABELS,
  type LiveEvent,
  type EventStatus,
} from "../../context/AppContext"

import {
  Search,
  Calendar,
  MapPin,
  User as UserIcon,
  Clock,
  Sparkles,
  Ticket,
  CheckCircle2,
  Check,
  Filter,
  X,
  GraduationCap,
} from "lucide-react"

export { TOPIC_LABELS }

interface Props {
  onSelectEvent: (eventId: string) => void
  onNavigate: (screen: string) => void
  isGuest?: boolean
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

const STATUS_COLORS: Record<EventStatus, { bg: string; text: string }> = {
  open: { bg: "#dcfce7", text: "#15803d" },
  nearly_full: { bg: "#fef9c3", text: "#a16207" },
  full: { bg: "#fee2e2", text: "#b91c1c" },
  draft: { bg: "#f1f5f9", text: "#64748b" },
  closed: { bg: "#e0e7ff", text: "#4338ca" },
  ended: { bg: "#f1f5f9", text: "#94a3b8" },
}

const TOPIC_COLORS: Record<Topic, string> = {
  academic: "#4f46e5",
  skill: "#0891b2",
  culture: "#7c3aed",
  sport: "#059669",
  community: "#d97706",
}

export default function EventList({
  onSelectEvent,
  onNavigate,
  isGuest = false,
  onOpenLogin,
  onOpenRegister,
}: Props) {
  const { user } = useUser()
  const {
    events,
    getUserActiveTicket,
    computeStatus,
    getStudentWaitlistEntries,
    loading,
    error,
    refetch,
  } = useApp()
  const [search, setSearch] = useState("")
  const [topic, setTopic] = useState<Topic | "all">("all")
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all")
  const [dateFilter, setDateFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")

  const filtered = events.filter((e) => {
    const status = computeStatus(e)
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.speaker.toLowerCase().includes(search.toLowerCase())
    const matchTopic = topic === "all" || e.topic === topic
    const matchStatus = statusFilter === "all" || status === statusFilter
    const matchDate = !dateFilter || e.date === dateFilter
    const matchLocation =
      !locationFilter ||
      e.location.toLowerCase().includes(locationFilter.toLowerCase())
    return (
      matchSearch && matchTopic && matchStatus && matchDate && matchLocation
    )
  })

  const activeFiltersCount =
    (topic !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateFilter ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (search ? 1 : 0)

  function resetFilters() {
    setSearch("")
    setTopic("all")
    setStatusFilter("all")
    setDateFilter("")
    setLocationFilter("")
  }

  return (
    <div className="min-h-full pb-16">
      {/* Web Hero Banner */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              {isGuest ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                  <span>Cổng thông tin sự kiện sinh viên công khai</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xin chào, {user.displayName}</span>
                  <span>·</span>
                  <span>{user.faculty}</span>
                </div>
              )}
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Khám phá sự kiện học đường
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Tham gia các hội thảo học thuật, workshop kỹ năng, ngày hội nghề
                nghiệp và hoạt động tình nguyện để tích lũy điểm rèn luyện và
                nhận chứng nhận số.
              </p>

              {isGuest && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenLogin}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Đăng nhập để đăng ký sự kiện
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Đăng ký tài khoản mới
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs text-center min-w-[120px]">
                <div className="text-2xl font-display font-bold text-indigo-600">
                  {
                    events.filter(
                      (e) =>
                        computeStatus(e) === "open" ||
                        computeStatus(e) === "nearly_full",
                    ).length
                  }
                </div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                  Đang mở đăng ký
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs text-center min-w-[120px]">
                <div className="text-2xl font-display font-bold text-emerald-600">
                  {events.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                  Tổng sự kiện
                </div>
              </div>
            </div>
          </div>

          {/* Web Search & Filtering Toolbar */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search input */}
              <div className="relative sm:col-span-2 lg:col-span-5">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên sự kiện, diễn giả..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* Topic dropdown */}
              <div className="lg:col-span-3">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as Topic | "all")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Tất cả chủ đề</option>
                  {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => (
                    <option key={t} value={t}>
                      {TOPIC_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status dropdown */}
              <div className="lg:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as EventStatus | "all")
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="open">Đang mở</option>
                  <option value="nearly_full">Sắp hết chỗ</option>
                  <option value="full">Đã hết chỗ</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                />
              </div>
            </div>

            {/* Secondary filter chips row */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  Chủ đề:
                </span>
                <Chip
                  label="Tất cả"
                  active={topic === "all"}
                  onClick={() => setTopic("all")}
                  color="#4f46e5"
                />
                {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => (
                  <Chip
                    key={t}
                    label={TOPIC_LABELS[t]}
                    active={topic === t}
                    onClick={() => setTopic(topic === t ? "all" : t)}
                    color={TOPIC_COLORS[t]}
                  />
                ))}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Xóa bộ lọc ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Danh sách sự kiện
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị {filtered.length} sự kiện phù hợp
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
              >
                <div className="h-44 bg-slate-100 rounded-2xl w-full" />
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
            <p className="text-sm font-semibold text-rose-800">
              Không thể tải dữ liệu sự kiện từ máy chủ
            </p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              onClick={() => void refetch?.()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
              Không tìm thấy sự kiện
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Không có sự kiện nào khớp với tiêu chí tìm kiếm của bạn.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              Xem tất cả sự kiện
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => {
              const activeWaitlist =
                !isGuest && user?.studentId
                  ? getStudentWaitlistEntries(user.studentId).find(
                      (w) =>
                        w.ma_su_kien === event.ma_su_kien &&
                        ["WAITING", "OFFERED"].includes(w.trang_thai),
                    )
                  : undefined
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={
                    !isGuest && !!getUserActiveTicket(event.id, user.studentId)
                  }
                  waitlistEntry={activeWaitlist}
                  isGuest={isGuest}
                  onSelect={() => onSelectEvent(event.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({
  event,
  isRegistered,
  waitlistEntry,
  isGuest,
  onSelect,
}: {
  event: LiveEvent
  isRegistered: boolean
  waitlistEntry?: WaitlistEntry
  isGuest: boolean
  onSelect: () => void
  key?: React.Key
}) {
  const { computeStatus } = useApp()
  const status = computeStatus(event)
  const sc = STATUS_COLORS[status]
  const pct = Math.round((event.registered / event.capacity) * 100)
  const dateObj = new Date(event.date)
  const dateStr = dateObj.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col border border-slate-200/80 group cursor-pointer focus:outline-none"
    >
      {/* Banner Image with 16:9 Aspect Ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span
            className="px-2.5 py-0.8 rounded-full text-xs font-semibold text-white shadow-xs backdrop-blur-xs"
            style={{ background: TOPIC_COLORS[event.topic] || "#4f46e5" }}
          >
            {TOPIC_LABELS[event.topic]}
          </span>
          <span
            className={`px-2.5 py-0.8 rounded-full text-xs font-semibold shadow-xs ${
              status === "full" && !isRegistered
                ? waitlistEntry?.trang_thai === "OFFERED"
                  ? "bg-amber-500 text-white animate-pulse"
                  : waitlistEntry
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-amber-500 text-white"
                : ""
            }`}
            style={
              status === "full" && !isRegistered
                ? undefined
                : { background: sc.bg, color: sc.text }
            }
          >
            {status === "full" && !isRegistered
              ? waitlistEntry?.trang_thai === "OFFERED"
                ? "Có suất nhận vé (Hạn 15p)"
                : waitlistEntry
                  ? `Hàng chờ FIFO #${waitlistEntry.so_thu_tu}`
                  : "Hết vé · Hàng chờ FIFO mở"
              : EVENT_STATUS_LABELS[status]}
          </span>
        </div>

        {/* Bottom Banner Tag */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5">
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
              />
            </svg>
            <span className="font-medium">
              {dateStr} · {event.time}
            </span>
          </div>
          {isRegistered && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
              Đã có vé
            </span>
          )}
          {!isRegistered && waitlistEntry?.trang_thai === "OFFERED" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
              Suất vé chờ xác nhận
            </span>
          )}
          {!isRegistered && waitlistEntry?.trang_thai === "WAITING" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow-xs">
              Hàng chờ #{waitlistEntry.so_thu_tu}
            </span>
          )}
          {!isRegistered && !waitlistEntry && status === "full" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/90 text-white shadow-xs">
              Hàng chờ FIFO mở
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className="truncate">{event.speaker}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span className="truncate">
              {event.room ? event.room + ", " : ""}
              {event.location}
            </span>
          </div>
        </div>

        {/* Capacity Meter */}
        <div className="pt-3 border-t border-slate-100">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {event.registered}/{event.capacity} chỗ ({pct}%)
              </span>
              <span
                className={`font-semibold text-xs ${
                  pct >= 100
                    ? "text-amber-700"
                    : pct >= 90
                      ? "text-rose-600"
                      : pct >= 70
                        ? "text-amber-600"
                        : "text-emerald-600"
                }`}
              >
                {event.capacity - event.registered > 0
                  ? "Còn " + (event.capacity - event.registered) + " chỗ"
                  : "Hết vé · Có hàng chờ FIFO"}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100
                    ? "bg-amber-500"
                    : pct >= 90
                      ? "bg-rose-500"
                      : pct >= 70
                        ? "bg-amber-500"
                        : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>

          {/* Button CTA preview */}
          <div
            className="mt-3.5 w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-colors shadow-xs"
            style={{
              background:
                !isGuest && isRegistered
                  ? "#dcfce7"
                  : waitlistEntry?.trang_thai === "OFFERED"
                    ? "#fef3c7"
                    : waitlistEntry
                      ? "#fef9c3"
                      : status === "full"
                        ? "#fffbeb"
                        : "#eef2ff",
              color:
                !isGuest && isRegistered
                  ? "#15803d"
                  : waitlistEntry?.trang_thai === "OFFERED"
                    ? "#b45309"
                    : waitlistEntry
                      ? "#854d0e"
                      : status === "full"
                        ? "#b45309"
                        : "#4f46e5",
              border:
                status === "full" && !isRegistered
                  ? "1px solid #fde68a"
                  : "none",
            }}
          >
            {!isGuest && isRegistered
              ? "Xem vé của bạn →"
              : waitlistEntry?.trang_thai === "OFFERED"
                ? "Có suất nhận vé — Mở Ví vé →"
                : waitlistEntry
                  ? `Trong hàng chờ FIFO #${waitlistEntry.so_thu_tu} →`
                  : status === "full"
                    ? "Hết vé · Đăng ký hàng chờ FIFO →"
                    : isGuest
                      ? "Xem chi tiết sự kiện →"
                      : "Xem chi tiết & Đăng ký →"}
          </div>
        </div>
      </div>
    </button>
  )
}

function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color: string
  key?: React.Key
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
      style={{
        background: active ? color : "#f1f5f9",
        color: active ? "white" : "#64748b",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  )
}

export function BottomNav({
  current,
  onNavigate,
}: {
  current: string
  onNavigate: (s: string) => void
}) {
  return null
}
