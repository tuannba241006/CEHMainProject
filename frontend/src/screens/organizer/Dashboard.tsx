import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import type { OrganizerDashboard } from "../../data/contract"
import { OrgLayout } from "./OrgLayout"
import { computeEventStatus } from "../../context/AppContext"
import {
  mapContractEventToLiveEvent,
  type LiveEvent,
} from "../../context/EventDataContext"
import { useUser } from "../../context/UserContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { reportsService } from "../../api/services/reports.service"
import { getApiErrorMessage } from "../../api/errors"
import { parseCalendarDate } from "../../utils/date"
import {
  RefreshCw,
  PieChart as PieChartIcon,
  Clock,
  Lock,
  MessageSquareText,
  BarChart3,
  CalendarX2,
} from "lucide-react"

const PIE_COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#059669", "#d97706"]

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

type Preset = "all" | "today" | "7d" | "30d" | "this_month" | "this_year" | "custom"

function getPresetRange(p: Preset): { from: Date; to: Date } | null {
  if (p === "all") return null
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  if (p === "today") return { from: todayStart, to: todayEnd }
  if (p === "7d")
    return { from: new Date(todayStart.getTime() - 6 * 86400000), to: todayEnd }
  if (p === "30d")
    return { from: new Date(todayStart.getTime() - 29 * 86400000), to: todayEnd }
  if (p === "this_month")
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    }
  if (p === "this_year")
    return {
      from: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
    }
  return null
}

function formatFeedbackDate(value?: string | null): string {
  if (!value) return "Vừa gửi"
  const d = parseCalendarDate(value)
  if (!d) return "Vừa gửi"
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN")}`
}

function pickPreferredEvent(list: LiveEvent[]): LiveEvent | undefined {
  return (
    list.find((e) => e.trang_thai === "COMPLETED" && (e.registered || 0) > 0) ||
    list.find((e) => e.trang_thai === "COMPLETED") ||
    list.find((e) => e.trang_thai === "PUBLISHED" && (e.registered || 0) > 0) ||
    list.find((e) => e.trang_thai === "PUBLISHED") ||
    list[0]
  )
}

export default function Dashboard({ onNavigate, onLogout }: Props) {
  const [preset, setPreset] = useState<Preset>("all")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [showAllFeedback, setShowAllFeedback] = useState(false)
  const { user } = useUser()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramEventId = searchParams.get("eventId")

  // Strictly load ONLY events belonging to the logged-in organizer (Host or Co-host)
  const [scopedEvents, setScopedEvents] = useState<LiveEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    let active = true
    setEventsLoading(true)
    eventsService
      .organizerList({ limit: 100 })
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          setScopedEvents(res.data.map(mapContractEventToLiveEvent))
        }
      })
      .catch((err) => {
        if (active) showToast(getApiErrorMessage(err), "error")
      })
      .finally(() => {
        if (active) setEventsLoading(false)
      })
    return () => {
      active = false
    }
  }, [user.email, showToast])

  const range = useMemo(() => {
    if (preset === "custom") {
      if (!customFrom && !customTo) return null
      const from = customFrom
        ? new Date(customFrom + "T00:00:00")
        : new Date(2000, 0, 1)
      const to = customTo
        ? new Date(customTo + "T23:59:59.999")
        : new Date(2100, 11, 31, 23, 59, 59, 999)
      return { from, to }
    }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  // Apply date filter directly to the organizer's scoped events
  const filteredEvents = useMemo(() => {
    if (!range) return scopedEvents
    return scopedEvents.filter((evt) => {
      const start = parseCalendarDate(evt.thoi_gian_bat_dau || evt.date)
      if (!start) return false
      return start.getTime() >= range.from.getTime() && start.getTime() <= range.to.getTime()
    })
  }, [scopedEvents, range])

  const [selectedEventId, setSelectedEventId] = useState<number | string | null>(
    () => (paramEventId ? Number(paramEventId) || paramEventId : null),
  )
  const [organizerAnalytics, setOrganizerAnalytics] = useState<OrganizerDashboard | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [forbiddenError, setForbiddenError] = useState<string | null>(null)

  // Synchronize selectedEventId with query param or filtered events
  useEffect(() => {
    if (paramEventId) {
      const num = Number(paramEventId) || paramEventId
      if (num !== selectedEventId) {
        setSelectedEventId(num)
      }
      return
    }
    if (filteredEvents.length > 0) {
      const stillValid = filteredEvents.some((e) => e.ma_su_kien === selectedEventId)
      if (!selectedEventId || !stillValid) {
        const preferred = pickPreferredEvent(filteredEvents)
        if (preferred) setSelectedEventId(preferred.ma_su_kien)
      }
    } else if (!eventsLoading && selectedEventId !== null) {
      setSelectedEventId(null)
    }
  }, [filteredEvents, eventsLoading, paramEventId, selectedEventId])

  // Load analytics for the active event without flashing stale numbers from the previous event
  useEffect(() => {
    setShowAllFeedback(false)
    if (!selectedEventId) {
      setOrganizerAnalytics(null)
      setAnalyticsLoading(false)
      setForbiddenError(null)
      return
    }
    let active = true
    setOrganizerAnalytics(null)
    setAnalyticsLoading(true)
    setForbiddenError(null)
    reportsService
      .organizerAnalytics(selectedEventId)
      .then((res) => {
        if (active && res.data) {
          setOrganizerAnalytics(res.data)
          setForbiddenError(null)
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        setOrganizerAnalytics(null)
        const e = err as { status?: number; response?: { status?: number } }
        const status = e?.status || e?.response?.status
        const msg = getApiErrorMessage(err)
        if (status === 403 || msg.includes("403") || msg.toLowerCase().includes("quyền")) {
          setForbiddenError(
            `Bạn không có quyền truy cập dữ liệu báo cáo của sự kiện #${selectedEventId}. Sự kiện này thuộc quyền quản lý của đơn vị khác.`,
          )
        } else {
          showToast(msg, "error")
        }
      })
      .finally(() => {
        if (active) setAnalyticsLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedEventId, showToast])

  // BarChart reflects filteredEvents, prioritizing events with actual registrations & the active event
  const dynamicBarData = useMemo(() => {
    if (filteredEvents.length === 0) return []
    const ranked = [...filteredEvents].sort((a, b) => {
      if (a.ma_su_kien === selectedEventId) return -1
      if (b.ma_su_kien === selectedEventId) return 1
      const aReg = a.registered || 0
      const bReg = b.registered || 0
      if (aReg !== bReg) return bReg - aReg
      return b.ma_su_kien - a.ma_su_kien
    })
    const rows = ranked.slice(0, 6).map((evt) => {
      const isCurrent = evt.ma_su_kien === selectedEventId
      const reg =
        isCurrent && organizerAnalytics?.tong_ve_dang_ky !== undefined
          ? organizerAnalytics.tong_ve_dang_ky
          : evt.registered || 0
      const chk =
        isCurrent && organizerAnalytics?.so_luong_check_in !== undefined
          ? organizerAnalytics.so_luong_check_in
          : evt.trang_thai === "COMPLETED" && isCurrent
            ? organizerAnalytics?.so_luong_check_in ?? 0
            : 0
      return {
        event: evt.title.length > 18 ? evt.title.slice(0, 15) + "..." : evt.title,
        registered: reg,
        checkin: chk,
      }
    })
    const hasNonZero = rows.some((r) => r.registered > 0 || r.checkin > 0)
    return hasNonZero ? rows : []
  }, [organizerAnalytics, filteredEvents, selectedEventId])

  // Map phan_bo_theo_khoa into PieChart — no mock fallback
  const dynamicPieData = useMemo(() => {
    const rawData = organizerAnalytics?.phan_bo_theo_khoa
    if (!rawData || rawData.length === 0) return []

    const total = rawData.reduce((s, c) => s + c.so_luong_dang_ky, 0)
    return rawData.map((item) => ({
      name: item.ten_khoa,
      value: total > 0 ? Math.round((item.so_luong_dang_ky / total) * 100) : 0,
      so_luong: item.so_luong_dang_ky,
    }))
  }, [organizerAnalytics])

  // Map luu_luong_theo_khung_gio into LineChart — no mock fallback
  const dynamicLineData = useMemo(() => {
    const rawData = organizerAnalytics?.luu_luong_theo_khung_gio
    if (!rawData || rawData.length === 0) return []

    return rawData.map((item) => ({
      time: item.khung_gio,
      checkin: item.so_luot_check_in,
      checkout: item.so_luot_check_out,
    }))
  }, [organizerAnalytics])

  const openEvents = filteredEvents.filter(
    (e) =>
      e.trang_thai === "PUBLISHED" ||
      e.trang_thai === "HAPPENING" ||
      computeEventStatus(e) === "open" ||
      computeEventStatus(e) === "nearly_full",
  ).length

  const hasSurvey = Boolean(
    organizerAnalytics &&
      (organizerAnalytics.diem_noi_dung_tb != null ||
        organizerAnalytics.diem_dien_gia_tb != null ||
        organizerAnalytics.diem_to_chuc_tb != null),
  )

  const feedbackItems = organizerAnalytics?.phan_hoi_an_danh ?? []
  const visibleFeedback = showAllFeedback ? feedbackItems : feedbackItems.slice(0, 5)
  const totalFeedbackCount =
    organizerAnalytics?.tong_so_phan_hoi ?? feedbackItems.length

  const PRESETS: { v: Preset; l: string }[] = [
    { v: "all", l: "Tất cả" },
    { v: "today", l: "Hôm nay" },
    { v: "7d", l: "7 ngày" },
    { v: "30d", l: "30 ngày" },
    { v: "this_month", l: "Tháng này" },
    { v: "this_year", l: "Năm nay" },
    { v: "custom", l: "Tùy chỉnh" },
  ]

  function handlePresetChange(nextPreset: Preset) {
    setPreset(nextPreset)
    if (paramEventId) {
      setSearchParams({})
    }
  }

  return (
    <OrgLayout
      current="org-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl">
        {/* Header with Event Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 lg:mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl lg:text-3xl"
              style={{ color: "#1a1a2e" }}
            >
              Tổng quan & Báo cáo
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Theo dõi tình hình tổ chức và tham gia sự kiện
            </p>
          </div>
          {!forbiddenError && filteredEvents.length > 0 && (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto max-w-full">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0">
                Xem sự kiện:
              </span>
              <select
                value={selectedEventId || ""}
                onChange={(e) => {
                  const val = Number(e.target.value) || e.target.value
                  setSelectedEventId(val)
                  setSearchParams({ eventId: String(val) })
                }}
                className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer w-full min-w-0 sm:max-w-[280px] truncate"
              >
                {filteredEvents.map((evt) => (
                  <option key={evt.ma_su_kien} value={evt.ma_su_kien}>
                    #{evt.ma_su_kien} — {evt.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 403 Access Denied Screen (isolates all KPIs/charts/feedback to prevent leakage & confusion) */}
        {forbiddenError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display font-bold text-base text-rose-900">
                Không có quyền truy cập báo cáo
              </h2>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                {forbiddenError}
              </p>
            </div>
            {scopedEvents.length > 0 ? (
              <button
                onClick={() => {
                  const first = scopedEvents[0].ma_su_kien
                  setSelectedEventId(first)
                  setSearchParams({ eventId: String(first) })
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                Xem sự kiện đơn vị bạn (#{scopedEvents[0].ma_su_kien})
              </button>
            ) : (
              <button
                onClick={() => onNavigate("/organizer/events")}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                Quay lại quản lý sự kiện
              </button>
            )}
          </div>
        ) : !eventsLoading && scopedEvents.length === 0 ? (
          /* Clean Empty State when the organizer account owns 0 events */
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              Đơn vị chưa có sự kiện nào để thống kê
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Các chỉ số đăng ký, tỷ lệ tham dự và khảo sát phản hồi sẽ tự động hiển thị tại đây ngay khi đơn vị tạo và tổ chức sự kiện.
            </p>
            <button
              onClick={() => onNavigate("/organizer/events/create")}
              className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              Tạo sự kiện mới
            </button>
          </div>
        ) : (
          <>
            {/* Date range filter */}
            <div
              className="bg-white rounded-2xl p-4 shadow-sm border mb-6 lg:mb-8"
              style={{ borderColor: "#f1f5f9" }}
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESETS.map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => handlePresetChange(v)}
                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer"
                    style={{
                      background: preset === v ? "#4f46e5" : "#f1f5f9",
                      color: preset === v ? "white" : "#64748b",
                      border: preset === v ? "none" : "1px solid #e2e8f0",
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {preset === "custom" ? (
                <div
                  className="flex flex-wrap items-center gap-3 pt-3 border-t"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div className="flex items-center gap-2">
                    <label
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: "#64748b" }}
                    >
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      className="text-xs font-medium whitespace-nowrap"
                      style={{ color: "#64748b" }}
                    >
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  {customFrom && customTo && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "#eef2ff", color: "#4f46e5" }}
                    >
                      {new Date(customFrom).toLocaleDateString("vi-VN")} –{" "}
                      {new Date(customTo).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {range
                    ? `${range.from.toLocaleDateString("vi-VN")} – ${range.to.toLocaleDateString("vi-VN")} (${filteredEvents.length} sự kiện trong khoảng)`
                    : `Toàn bộ thời gian (${filteredEvents.length} sự kiện)`}
                </p>
              )}
            </div>

            {!eventsLoading && filteredEvents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xs mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CalendarX2 className="w-6 h-6" />
                </div>
                <h2 className="font-display font-bold text-base text-slate-800">
                  Không có sự kiện trong khoảng thời gian đã chọn
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Thử chọn khoảng thời gian rộng hơn hoặc bấm "Tất cả" để xem toàn bộ báo cáo của đơn vị.
                </p>
              </div>
            ) : (
              <>
                {/* KPI grid — 4 on desktop, 2×2 on laptop/tablet, 1 col on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 lg:mb-8">
                  <KpiCard
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
                      />
                    }
                    label="Sự kiện đang mở"
                    value={openEvents.toString()}
                    change={
                      range
                        ? `${filteredEvents.length} sự kiện trong khoảng lọc`
                        : `Tổng ${filteredEvents.length} sự kiện của đơn vị`
                    }
                    changePositive
                    color="#4f46e5"
                    bg="#eef2ff"
                  />
                  <KpiCard
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    }
                    label="Tổng lượt đăng ký"
                    value={
                      analyticsLoading
                        ? "—"
                        : organizerAnalytics?.tong_ve_dang_ky !== undefined
                          ? organizerAnalytics.tong_ve_dang_ky.toLocaleString("vi-VN")
                          : "0"
                    }
                    change={
                      analyticsLoading
                        ? "Đang tải dữ liệu..."
                        : organizerAnalytics?.khong_gioi_han_slot
                          ? "Mở tự do"
                          : organizerAnalytics?.ty_le_lap_day_pct !== null &&
                              organizerAnalytics?.ty_le_lap_day_pct !== undefined
                            ? `Lấp đầy ${organizerAnalytics.ty_le_lap_day_pct}%`
                            : "Chưa có dữ liệu"
                    }
                    changePositive
                    color="#0891b2"
                    bg="#ecfeff"
                  />
                  <KpiCard
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    }
                    label="Tỷ lệ điểm danh (Show-up)"
                    value={
                      analyticsLoading
                        ? "—"
                        : organizerAnalytics?.ty_le_show_up_pct !== undefined
                          ? `${organizerAnalytics.ty_le_show_up_pct}%`
                          : "0%"
                    }
                    change={
                      analyticsLoading
                        ? "Đang tải dữ liệu..."
                        : organizerAnalytics
                          ? `${organizerAnalytics.so_luong_check_in} lượt check-in`
                          : "Chưa có dữ liệu"
                    }
                    changePositive
                    color="#059669"
                    bg="#ecfdf5"
                  />
                  <KpiCard
                    icon={
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    }
                    label="Đã hoàn thành (Check-out)"
                    value={
                      analyticsLoading
                        ? "—"
                        : organizerAnalytics?.so_luong_check_out !== undefined
                          ? organizerAnalytics.so_luong_check_out.toLocaleString("vi-VN")
                          : "0"
                    }
                    change={
                      analyticsLoading
                        ? "Đang tải dữ liệu..."
                        : organizerAnalytics?.khong_gioi_han_slot
                          ? "Không áp dụng vắng mặt"
                          : organizerAnalytics?.so_luong_no_show !== null &&
                              organizerAnalytics?.so_luong_no_show !== undefined
                            ? `Vắng mặt: ${organizerAnalytics.so_luong_no_show} (${organizerAnalytics.ty_le_no_show_pct ?? 0}%)`
                            : "Chưa có dữ liệu"
                    }
                    changePositive={false}
                    color="#7c3aed"
                    bg="#f5f3ff"
                  />
                </div>

                {/* Charts — 2 col on large, 1 col on small */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
                  {/* Bar chart — spans 2 cols */}
                  <div
                    className="lg:col-span-2 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
                    style={{ borderColor: "#f1f5f9" }}
                  >
                    <h2
                      className="font-display font-semibold text-base mb-1"
                      style={{ color: "#1a1a2e" }}
                    >
                      Đăng ký và điểm danh theo sự kiện
                    </h2>
                    <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
                      Số lượng sinh viên thực tế
                    </p>
                    {dynamicBarData.length === 0 ? (
                      <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <BarChart3 className="w-8 h-8 stroke-1 text-slate-300" />
                        <span>Chưa có sự kiện nào phát sinh lượt đăng ký trong khoảng lọc</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={dynamicBarData}
                          barCategoryGap="35%"
                          margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="event"
                            tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Inter" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: 10,
                              border: "none",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                              fontSize: 12,
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            formatter={(v) =>
                              v === "registered" ? "Đăng ký" : "Đã điểm danh"
                            }
                          />
                          <Bar
                            dataKey="registered"
                            name="registered"
                            fill="#4f46e5"
                            radius={[3, 3, 0, 0]}
                          />
                          <Bar
                            dataKey="checkin"
                            name="checkin"
                            fill="#0891b2"
                            radius={[3, 3, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Donut chart */}
                  <div
                    className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
                    style={{ borderColor: "#f1f5f9" }}
                  >
                    <h2
                      className="font-display font-semibold text-base mb-1"
                      style={{ color: "#1a1a2e" }}
                    >
                      Phân bổ sinh viên theo khoa
                    </h2>
                    <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>
                      % tham gia sự kiện
                    </p>
                    {analyticsLoading ? (
                      <div className="h-[200px] flex items-center justify-center text-slate-400 text-xs">
                        Đang tải phân bổ theo khoa...
                      </div>
                    ) : dynamicPieData.length === 0 ? (
                      <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <PieChartIcon className="w-8 h-8 stroke-1 text-slate-300" />
                        <span>Chưa có dữ liệu phân bổ theo khoa</span>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie
                              data={dynamicPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={42}
                              outerRadius={64}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {dynamicPieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                borderRadius: 8,
                                border: "none",
                                fontSize: 12,
                              }}
                              formatter={(v) => [`${v}%`]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-1">
                          {dynamicPieData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                                <span
                                  className="text-xs truncate"
                                  style={{ color: "#475569" }}
                                  title={d.name}
                                >
                                  {d.name}
                                </span>
                              </div>
                              <span
                                className="text-xs font-medium shrink-0"
                                style={{ fontFamily: "var(--font-mono)", color: "#1a1a2e" }}
                              >
                                {d.value}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Line chart — full width */}
                <div
                  className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <h2
                    className="font-display font-semibold text-base mb-1"
                    style={{ color: "#1a1a2e" }}
                  >
                    Xu hướng lưu lượng theo khung giờ
                  </h2>
                  <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
                    Số lượt check-in và check-out theo từng khung giờ sự kiện
                  </p>
                  {analyticsLoading ? (
                    <div className="h-[200px] flex items-center justify-center text-slate-400 text-xs">
                      Đang tải lưu lượng khung giờ...
                    </div>
                  ) : dynamicLineData.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-sm gap-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Clock className="w-8 h-8 stroke-1 text-slate-300" />
                      <span>Chưa có dữ liệu lưu lượng khung giờ</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart
                        data={dynamicLineData}
                        margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#f1f5f9"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: "none",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            fontSize: 12,
                          }}
                          formatter={(v, name) => [`${v} lượt`, name === "checkin" ? "Check-in" : "Check-out"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="checkin"
                          name="Check-in"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          dot={{ fill: "#4f46e5", r: 4, strokeWidth: 2, stroke: "white" }}
                          activeDot={{ r: 6, fill: "#4f46e5" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="checkout"
                          name="Check-out"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "white" }}
                          activeDot={{ r: 6, fill: "#10b981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Survey & Anonymous Feedback from View v_feedback_an_danh */}
                <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xs border border-slate-200 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <MessageSquareText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display font-bold text-lg text-slate-900">
                            Khảo sát & Đánh giá từ người tham gia
                          </h2>
                          {hasSurvey && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {totalFeedbackCount} lượt đánh giá
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Điểm đánh giá trung bình và góp ý ẩn danh từ sinh viên đã tham dự sự kiện.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedEventId) return
                        setRefreshing(true)
                        reportsService
                          .organizerAnalytics(selectedEventId)
                          .then((res) => {
                            if (res.data) {
                              setOrganizerAnalytics(res.data)
                            }
                            showToast(
                              `Đã cập nhật dữ liệu báo cáo sự kiện #${selectedEventId}.`,
                              "success",
                            )
                          })
                          .catch((err) => {
                            showToast(getApiErrorMessage(err), "error")
                          })
                          .finally(() => {
                            setRefreshing(false)
                          })
                      }}
                      disabled={refreshing || !selectedEventId}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 w-fit cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      <span>
                        {refreshing ? "Đang làm mới..." : "Làm mới số liệu"}
                      </span>
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
                      Đang tải dữ liệu khảo sát...
                    </div>
                  ) : hasSurvey ? (
                    <div className="space-y-6">
                      {/* Survey Rating Scores */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <span className="text-xs text-slate-500 font-medium">Chất lượng nội dung</span>
                          <div className="text-xl font-bold text-indigo-600 mt-1">
                            {organizerAnalytics?.diem_noi_dung_tb != null
                              ? `${Number(organizerAnalytics.diem_noi_dung_tb).toFixed(1)} / 5.0`
                              : "Chưa có"}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <span className="text-xs text-slate-500 font-medium">Đánh giá diễn giả</span>
                          <div className="text-xl font-bold text-emerald-600 mt-1">
                            {organizerAnalytics?.diem_dien_gia_tb != null
                              ? `${Number(organizerAnalytics.diem_dien_gia_tb).toFixed(1)} / 5.0`
                              : "Chưa có"}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                          <span className="text-xs text-slate-500 font-medium">Khâu tổ chức & Hậu cần</span>
                          <div className="text-xl font-bold text-amber-600 mt-1">
                            {organizerAnalytics?.diem_to_chuc_tb != null
                              ? `${Number(organizerAnalytics.diem_to_chuc_tb).toFixed(1)} / 5.0`
                              : "Chưa có"}
                          </div>
                        </div>
                      </div>

                      {/* Anonymous Feedback Comments */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Nhận xét ẩn danh từ người tham gia ({feedbackItems.length} góp ý mới nhất)
                          </h3>
                        </div>
                        {visibleFeedback.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                            Các phiếu đánh giá chưa có nhận xét bằng văn bản.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {visibleFeedback.map((fb, idx) => (
                              <div
                                key={`${fb.thoi_gian_gui || idx}-${idx}`}
                                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-700">
                                    Người tham gia ẩn danh · {formatFeedbackDate(fb.thoi_gian_gui)}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                                      Nội dung {fb.diem_noi_dung}/5
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                                      Diễn giả {fb.diem_dien_gia}/5
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">
                                      Tổ chức {fb.diem_to_chuc}/5
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {fb.y_kien_dong_gop}
                                </p>
                              </div>
                            ))}
                            {feedbackItems.length > 5 && (
                              <button
                                type="button"
                                onClick={() => setShowAllFeedback((prev) => !prev)}
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-indigo-600 cursor-pointer transition-colors"
                              >
                                {showAllFeedback
                                  ? "Thu gọn nhận xét"
                                  : `Xem thêm nhận xét (còn ${feedbackItems.length - 5})`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <MessageSquareText className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">
                        Chưa có dữ liệu khảo sát đánh giá
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                        {selectedEventId
                          ? `Sự kiện #${selectedEventId} chưa ghi nhận phản hồi khảo sát nào từ người tham gia. Điểm đánh giá chất lượng (nội dung, diễn giả, tổ chức) sẽ hiển thị tại đây ngay khi người tham dự gửi biểu mẫu đánh giá.`
                          : "Chưa có phản hồi khảo sát nào cho sự kiện đang chọn."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </OrgLayout>
  )
}

function KpiCard({
  icon,
  label,
  value,
  change,
  changePositive,
  color,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  change: string
  changePositive: boolean
  color: string
  bg: string
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border"
      style={{ borderColor: "#f1f5f9" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: bg }}
        >
          <svg
            className="w-5 h-5"
            style={{ color }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {icon}
          </svg>
        </div>
      </div>
      <div
        className="font-display font-bold text-2xl lg:text-3xl mb-1"
        style={{ color: "#1a1a2e" }}
      >
        {value}
      </div>
      <div
        className="text-sm font-medium mb-2 leading-snug"
        style={{ color: "#475569" }}
      >
        {label}
      </div>
      <div
        className="text-xs font-medium"
        style={{ color: changePositive ? "#059669" : "#dc2626" }}
      >
        {changePositive ? "↑" : "↓"} {change}
      </div>
    </div>
  )
}
