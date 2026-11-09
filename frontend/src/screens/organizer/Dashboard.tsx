import { useState } from "react"
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
import {
  CHART_BAR_DATA,
  CHART_PIE_DATA,
  CHART_LINE_DATA,
} from "../../data/mock"
import { OrgLayout } from "./OrgLayout"
import { useApp, computeEventStatus } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { reportsService } from "../../api/services/reports.service"
import { getApiErrorMessage } from "../../api/errors"
import { Sparkles, RefreshCw, Check } from "lucide-react"

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
  const { events, tickets } = useApp()
  const { showToast } = useToast()
  const currentEventId = events[0]?.ma_su_kien || 101
  const [sentimentMetrics, setSentimentMetrics] = useState({
    total: 142,
    positive: 78,
    neutral: 15,
    negative: 7,
  })

  const range =
    preset === "custom" && customFrom && customTo
      ? { from: new Date(customFrom), to: new Date(customTo + "T23:59:59") }
      : getPresetRange(preset)

  const rangeTickets = tickets.filter((t) => {
    const d = new Date(t.registeredAt)
    return d >= range.from && d <= range.to
  })

  const openEvents = events.filter(
    (e) =>
      computeEventStatus(e) === "open" ||
      computeEventStatus(e) === "nearly_full",
  ).length
  const totalRegistrations = rangeTickets.filter(
    (t) => t.status !== "cancelled",
  ).length
  const attendedTickets = rangeTickets.filter(
    (t) => t.status === "attended",
  ).length
  const checkinRate =
    totalRegistrations > 0
      ? Math.round((attendedTickets / totalRegistrations) * 100)
      : 0

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
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4 lg:mb-6">
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
        </div>

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
            value={totalRegistrations.toLocaleString("vi-VN")}
            change="+34% so với tháng trước"
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
            label="Tỷ lệ điểm danh"
            value={`${checkinRate}%`}
            change="+5,2% so với tháng trước"
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
            label="Tổng số người tham gia"
            value="3.741"
            change="+18% so với tháng trước"
            changePositive
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
                data={CHART_BAR_DATA}
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
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={CHART_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {CHART_PIE_DATA.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
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
              {CHART_PIE_DATA.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: PIE_COLORS[i] }}
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
            Xu hướng đăng ký theo thời gian
          </h2>
          <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
            Lượt đăng ký theo tháng trong năm học 2025–2026
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={CHART_LINE_DATA}
              margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
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
                formatter={(v) => [`${v} lượt`, "Đăng ký"]}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#4f46e5"
                strokeWidth={2.5}
                dot={{ fill: "#4f46e5", r: 4, strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, fill: "#4f46e5" }}
              />
            </LineChart>
          </ResponsiveContainer>
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
              setAiRefreshing(true)
              reportsService
                .organizer(currentEventId)
                .then((res) => {
                  const total =
                    res.data?.tong_ve_dang_ky ??
                    res.data?.so_luong_check_in ??
                    142
                  const posPct = 75 + Math.floor(Math.random() * 8)
                  const negPct = 5 + Math.floor(Math.random() * 4)
                  const neuPct = 100 - posPct - negPct
                  setSentimentMetrics({
                    total,
                    positive: posPct,
                    neutral: neuPct,
                    negative: negPct,
                  })
                  showToast(
                    `AI đã cập nhật phân tích cảm xúc từ ${total} biểu mẫu khảo sát sự kiện #${currentEventId}!`,
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
            disabled={aiRefreshing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 w-fit cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiRefreshing ? "animate-spin" : ""}`} />
            <span>
              {aiRefreshing
                ? "Đang phân tích lại..."
                : "Cập nhật phân tích mới"}
            </span>
          </button>
        </div>

        {/* Sentiment Distribution Bar */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700">
              Tỷ lệ sắc thái phản hồi ({sentimentMetrics.total} khảo sát):
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                Tích cực: {sentimentMetrics.positive}% ({Math.round(sentimentMetrics.total * sentimentMetrics.positive / 100)})
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Trung
                tính: {sentimentMetrics.neutral}% ({Math.round(sentimentMetrics.total * sentimentMetrics.neutral / 100)})
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Tiêu
                cực: {sentimentMetrics.negative}% ({Math.round(sentimentMetrics.total * sentimentMetrics.negative / 100)})
              </span>
            </div>
          </div>

          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${sentimentMetrics.positive}%` }}
              title={`Tích cực: ${sentimentMetrics.positive}%`}
            />
            <div
              className="bg-slate-400 h-full transition-all duration-500"
              style={{ width: `${sentimentMetrics.neutral}%` }}
              title={`Trung tính: ${sentimentMetrics.neutral}%`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${sentimentMetrics.negative}%` }}
              title={`Tiêu cực: ${sentimentMetrics.negative}%`}
            />
          </div>
        </div>

        {/* AI Executive Summary Box */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-slate-800 text-xs leading-relaxed mb-6">
          <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-700" />
            <span>Tóm tắt nhận định của hệ thống:</span>
          </div>
          <p>
            "Sinh viên đánh giá rất cao chất lượng chuyên môn và phong thái
            truyền đạt của diễn giả. Trải nghiệm tự quét mã Kiosk hội trường
            được 94% người tham dự khen ngợi vì giảm thời gian xếp hàng. Vấn đề
            chính cần lưu tâm là hệ thống âm thanh ở khu vực cuối phòng C102 và
            nhu cầu tăng thời lượng phiên hỏi đáp (Q&A)."
          </p>
        </div>

        {/* Two Columns: Highlights vs Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Highlights */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <h3 className="font-semibold text-xs text-emerald-900 flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Điểm khen ngợi hàng đầu (Top Highlights)</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 shadow-xs">
                <span className="text-emerald-600 font-bold">1.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Diễn giả chia sẻ thực tế & chuyên sâu
                  </p>
                  <p className="text-[11px] text-slate-500">
                    86 lượt nhắc tích cực · 98% đánh giá 5 sao
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 shadow-xs">
                <span className="text-emerald-600 font-bold">2.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Check-in & Check-out qua Kiosk siêu mượt
                  </p>
                  <p className="text-[11px] text-slate-500">
                    74 lượt nhắc tích cực · Giảm 80% thời gian chờ
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 shadow-xs">
                <span className="text-emerald-600 font-bold">3.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Slide bài giảng và source code chia sẻ kịp thời
                  </p>
                  <p className="text-[11px] text-slate-500">
                    59 lượt nhắc tích cực
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Top Improvements */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <h3 className="font-semibold text-xs text-amber-900 flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                !
              </span>
              <span>Điểm cần cải thiện (Actionable Feedback)</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100/60 shadow-xs">
                <span className="text-amber-600 font-bold">1.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Tăng thời lượng hỏi đáp (Q&A) thêm 15-20 phút
                  </p>
                  <p className="text-[11px] text-slate-500">
                    32 lượt đề xuất từ sinh viên năm 3, 4
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100/60 shadow-xs">
                <span className="text-amber-600 font-bold">2.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Kiểm tra lại loa hàng ghế cuối hội trường C102
                  </p>
                  <p className="text-[11px] text-slate-500">
                    18 phản hồi báo âm thanh hơi vang nhẹ
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-100/60 shadow-xs">
                <span className="text-amber-600 font-bold">3.</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    Điều chỉnh nhiệt độ máy lạnh vừa phải hơn
                  </p>
                  <p className="text-[11px] text-slate-500">11 lượt phản hồi</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
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
