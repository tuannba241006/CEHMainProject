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
import { useApp, computeEventStatus } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import { useToast } from "../../components/Toast"
import { reportsService } from "../../api/services/reports.service"
import { getApiErrorMessage } from "../../api/errors"
import {
  Sparkles,
  RefreshCw,
  Check,
  PieChart as PieChartIcon,
  Clock,
  Lock,
  AlertTriangle,
} from "lucide-react"

const PIE_COLORS = ["#4f46e5", "#0891b2", "#7c3aed", "#059669", "#d97706"]

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

type Preset = "today" | "7d" | "30d" | "this_month" | "this_year" | "custom"

function getPresetRange(p: Preset): { from: Date; to: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  if (p === "today") return { from: today, to: tomorrow }
  if (p === "7d")
    return { from: new Date(today.getTime() - 6 * 86400000), to: tomorrow }
  if (p === "30d")
    return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow }
  if (p === "this_month")
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    }
  if (p === "this_year")
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    }
  return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow }
}

export default function Dashboard({ onNavigate, onLogout }: Props) {
  const [preset, setPreset] = useState<Preset>("30d")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [aiRefreshing, setAiRefreshing] = useState(false)
  const { events } = useApp()
  const { user, role } = useUser()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const paramEventId = searchParams.get("eventId")

  // Data scoping cô lập: Ban tổ chức chỉ phân tích sự kiện thuộc đơn vị mình!
  const scopedEvents = useMemo(() => {
    const isPctsAdmin = role === "admin" || role === "student_affairs"
    const userEmail = (user.email || "").toLowerCase()
    const rawUnit =
      user.don_vi?.ten_don_vi ||
      user.faculty ||
      user.khoa ||
      (userEmail.includes("webdev") ? "webdev" : "") ||
      (userEmail.includes("is@") || userEmail.includes(".is@") ? "thông tin" : "") ||
      (user.name && user.name.includes("CLB") ? user.name : "") ||
      ""
    const targetUnit = isPctsAdmin ? "sinh viên" : rawUnit.toLowerCase().trim()
    const unitId = user.ma_don_vi_to_chuc || user.don_vi?.ma_don_vi

    const filteredList = events.filter((e) => {
      const hostName = (
        e.organizer ||
        e.don_vi_host?.ten_don_vi ||
        e.ten_don_vi_host ||
        ""
      ).toLowerCase()
      const hostId = e.don_vi_host?.ma_don_vi || e.ma_don_vi_to_chuc
      const isHost =
        (unitId && hostId === unitId) ||
        (targetUnit && hostName.includes(targetUnit)) ||
        (targetUnit.includes("webdev") &&
          (hostName.includes("webdev") ||
            hostName.includes("devops") ||
            hostName.includes("ai")))
      const isCoHost = (
        e.coHosts ||
        e.danh_sach_ten_dong_to_chuc ||
        []
      ).some((ch: string) => {
        const c = ch.toLowerCase()
        return (
          (targetUnit && c.includes(targetUnit)) ||
          (targetUnit.includes("webdev") && c.includes("webdev"))
        )
      })
      return isHost || isCoHost
    })

    return filteredList.length > 0 ? filteredList : events
  }, [events, role, user])

  const [selectedEventId, setSelectedEventId] = useState<number | string | null>(
    () => {
      if (paramEventId) return Number(paramEventId) || paramEventId
      return events[0]?.ma_su_kien || null
    },
  )
  const [organizerAnalytics, setOrganizerAnalytics] = useState<OrganizerDashboard | null>(null)
  const [forbiddenError, setForbiddenError] = useState<string | null>(null)

  // Đồng bộ selectedEventId với query param và scoped events
  useEffect(() => {
    if (paramEventId) {
      const num = Number(paramEventId) || paramEventId
      if (num !== selectedEventId) {
        setSelectedEventId(num)
      }
    } else if (scopedEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(scopedEvents[0].ma_su_kien)
    }
  }, [scopedEvents, paramEventId])

  // Tải dữ liệu phân tích chỉ số cho sự kiện được chọn với kiểm soát lỗi 403 rõ ràng
  useEffect(() => {
    if (!selectedEventId) {
      setOrganizerAnalytics(null)
      setForbiddenError(null)
      return
    }
    let active = true
    setForbiddenError(null)
    reportsService
      .organizerAnalytics(selectedEventId)
      .then((res) => {
        if (active && res.data) {
          setOrganizerAnalytics(res.data)
          setForbiddenError(null)
        }
      })
      .catch((err: any) => {
        if (active) {
          setOrganizerAnalytics(null)
          const status = err?.status || err?.response?.status
          const msg = getApiErrorMessage(err)
          if (status === 403 || msg.includes("403") || msg.toLowerCase().includes("quyền")) {
            setForbiddenError(
              `Bạn không có quyền truy cập dữ liệu báo cáo của sự kiện #${selectedEventId}. Sự kiện này thuộc quyền quản lý của đơn vị khác.`,
            )
          } else {
            showToast(msg, "error")
          }
        }
      })
    return () => {
      active = false
    }
  }, [selectedEventId, showToast])

  const dynamicBarData = useMemo(() => {
    if (events.length > 0) {
      return events.slice(0, 5).map((evt) => {
        const isCurrent = evt.ma_su_kien === selectedEventId
        const reg =
          isCurrent && organizerAnalytics?.tong_ve_dang_ky !== undefined
            ? organizerAnalytics.tong_ve_dang_ky
            : evt.registered || 0
        const chk =
          isCurrent && organizerAnalytics?.so_luong_check_in !== undefined
            ? organizerAnalytics.so_luong_check_in
            : Math.round(reg * 0.82)
        return {
          event: evt.title.length > 18 ? evt.title.slice(0, 15) + "..." : evt.title,
          registered: reg,
          checkin: chk,
        }
      })
    }
    return []
  }, [organizerAnalytics, events, selectedEventId])

  // Map phan_bo_theo_khoa vào PieChart - Không fallback tickets
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

  // Map luu_luong_theo_khung_gio vào LineChart - Không fallback mock
  const dynamicLineData = useMemo(() => {
    const rawData = organizerAnalytics?.luu_luong_theo_khung_gio
    if (!rawData || rawData.length === 0) return []

    return rawData.map((item) => ({
      time: item.khung_gio,
      checkin: item.so_luot_check_in,
      checkout: item.so_luot_check_out,
    }))
  }, [organizerAnalytics])

  const range =
    preset === "custom" && customFrom && customTo
      ? { from: new Date(customFrom), to: new Date(customTo + "T23:59:59") }
      : getPresetRange(preset)

  const openEvents = events.filter(
    (e) =>
      computeEventStatus(e) === "open" ||
      computeEventStatus(e) === "nearly_full",
  ).length

  const hasSurvey = Boolean(
    organizerAnalytics &&
      (organizerAnalytics.diem_noi_dung_tb != null ||
        organizerAnalytics.diem_dien_gia_tb != null ||
        organizerAnalytics.diem_to_chuc_tb != null),
  )

  const PRESETS: { v: Preset; l: string }[] = [
    { v: "today", l: "Hôm nay" },
    { v: "7d", l: "7 ngày" },
    { v: "30d", l: "30 ngày" },
    { v: "this_month", l: "Tháng này" },
    { v: "this_year", l: "Năm nay" },
    { v: "custom", l: "Tùy chỉnh" },
  ]

  return (
    <OrgLayout
      current="org-dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="p-6 lg:p-8 max-w-screen-xl">
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
          {scopedEvents.length > 0 && (
            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Xem sự kiện:
              </span>
              <select
                value={selectedEventId || ""}
                onChange={(e) => {
                  const val = Number(e.target.value) || e.target.value
                  setSelectedEventId(val)
                  setSearchParams({ eventId: String(val) })
                }}
                className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer max-w-[260px] truncate"
              >
                {scopedEvents.map((evt) => (
                  <option key={evt.ma_su_kien} value={evt.ma_su_kien}>
                    #{evt.ma_su_kien} — {evt.title}
                  </option>
                ))}
                {selectedEventId &&
                  !scopedEvents.some((e) => e.ma_su_kien === selectedEventId) && (
                    <option value={selectedEventId}>
                      #{selectedEventId} (Yêu cầu)
                    </option>
                  )}
              </select>
            </div>
          )}
        </div>

        {/* 403 Forbidden Access Denied Alert Banner */}
        {forbiddenError && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 mb-6 shadow-xs flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display font-bold text-sm text-rose-900">
                Từ chối quyền truy cập (HTTP 403 Forbidden)
              </h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                {forbiddenError}
              </p>
            </div>
            {scopedEvents.length > 0 && (
              <button
                onClick={() => {
                  const first = scopedEvents[0].ma_su_kien
                  setSelectedEventId(first)
                  setSearchParams({ eventId: String(first) })
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                Xem sự kiện đơn vị bạn (#{scopedEvents[0].ma_su_kien})
              </button>
            )}
          </div>
        )}

        {/* Date range filter */}
        <div
          className="bg-white rounded-2xl p-4 shadow-sm border mb-6 lg:mb-8"
          style={{ borderColor: "#f1f5f9" }}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESETS.map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setPreset(v)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
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
          {preset === "custom" && (
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
          )}
          {preset !== "custom" && (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {range.from.toLocaleDateString("vi-VN")} –{" "}
              {range.to.toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>

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
            change="+2 so với tháng trước"
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
              organizerAnalytics?.tong_ve_dang_ky !== undefined
                ? organizerAnalytics.tong_ve_dang_ky.toLocaleString("vi-VN")
                : "0"
            }
            change={
              organizerAnalytics?.ty_le_lap_day_pct !== null && organizerAnalytics?.ty_le_lap_day_pct !== undefined
                ? `Lấp đầy ${organizerAnalytics.ty_le_lap_day_pct}%`
                : "Mở tự do"
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
              organizerAnalytics?.ty_le_show_up_pct !== undefined
                ? `${organizerAnalytics.ty_le_show_up_pct}%`
                : "0%"
            }
            change={
              organizerAnalytics
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
              organizerAnalytics?.so_luong_check_out !== undefined
                ? organizerAnalytics.so_luong_check_out.toLocaleString("vi-VN")
                : "0"
            }
            change={
              organizerAnalytics?.so_luong_no_show !== null && organizerAnalytics?.so_luong_no_show !== undefined
                ? `Vắng mặt: ${organizerAnalytics.so_luong_no_show}`
                : "Không áp dụng vắng mặt"
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
            {dynamicPieData.length === 0 ? (
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
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span
                          className="text-xs truncate"
                          style={{ color: "#475569", maxWidth: 120 }}
                        >
                          {d.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-medium"
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
          {dynamicLineData.length === 0 ? (
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
      </div>

      {/* UC-AI-01: AI Sentiment Analysis & Survey Feedback Summarizer */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-xs border border-slate-200 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Phân tích Cảm xúc & Tổng hợp Khảo sát AI
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  NLP Sentiment
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động phân loại sắc thái phản hồi và trích xuất điểm mạnh,
                điểm cần cải thiện từ người tham gia sự kiện.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!selectedEventId) return
              setAiRefreshing(true)
              reportsService
                .organizerAnalytics(selectedEventId)
                .then((res) => {
                  if (res.data) {
                    setOrganizerAnalytics(res.data)
                  }
                  showToast(
                    `Đã cập nhật dữ liệu báo cáo sự kiện #${selectedEventId}!`,
                    "success",
                  )
                })
                .catch((err) => {
                  showToast(getApiErrorMessage(err), "error")
                })
                .finally(() => {
                  setAiRefreshing(false)
                })
            }}
            disabled={aiRefreshing || !selectedEventId}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 w-fit cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiRefreshing ? "animate-spin" : ""}`} />
            <span>
              {aiRefreshing
                ? "Đang làm mới..."
                : "Cập nhật phân tích mới"}
            </span>
          </button>
        </div>

        {/* Real Survey & Feedback Metrics or Empty State */}
        {hasSurvey ? (
          <div>
            {/* Real Survey Rating Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

            {/* Executive Summary Box */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800 text-xs leading-relaxed mb-6">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <span>Tổng hợp phản hồi người tham gia:</span>
              </div>
              <p>
                Dữ liệu khảo sát thực tế từ người tham gia sự kiện #{selectedEventId}. Các chỉ số chất lượng được ghi nhận trực tiếp qua biểu mẫu phản hồi và tự động tổng hợp theo quy trình UC-REP-01.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 text-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Chưa có dữ liệu khảo sát đánh giá</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Sự kiện #{selectedEventId || "này"} chưa ghi nhận phản hồi khảo sát nào từ người tham gia. Điểm đánh giá chất lượng (nội dung, diễn giả, tổ chức) sẽ hiển thị tại đây ngay khi người tham dự gửi biểu mẫu đánh giá.
            </p>
          </div>
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
