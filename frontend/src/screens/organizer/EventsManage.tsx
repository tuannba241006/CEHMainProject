import { useState, useMemo, useEffect, useCallback } from "react"
import { TOPIC_LABELS } from "../../data/mock"
import { OrgLayout } from "./OrgLayout"
import { ManagementLayout } from "../management/ManagementLayout"
import { formatCalendarDate } from "../../utils/date"
import { useApp, type EventStatus } from "../../context/AppContext"
import {
  mapContractEventToLiveEvent,
  type LiveEvent,
} from "../../context/EventDataContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { api } from "../../api/client"
import { getApiErrorMessage } from "../../api/errors"
import { useUser } from "../../context/UserContext"
import type { Topic } from "../../data/contract"
import {
  RefreshCw,
  Calendar,
  Users,
  Camera,
  AlertTriangle,
  Eye,
  Edit3,
  BarChart3,
  Monitor,
  Undo2,
  X,
  MapPin,
  Clock,
  ExternalLink,
  Award,
} from "lucide-react"

const LIFECYCLE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: "Bản nháp", bg: "#f1f5f9", text: "#475569" },
  WAITING_COHOST_CONFIRM: { label: "Chờ Co-host xác nhận", bg: "#fef3c7", text: "#b45309" },
  COHOST_REJECTED: { label: "Co-host từ chối", bg: "#fee2e2", text: "#b91c1c" },
  PENDING_FACULTY: { label: "Chờ Khoa duyệt", bg: "#e0f2fe", text: "#0369a1" },
  PENDING_ADMIN: { label: "Chờ CTSV duyệt", bg: "#e0e7ff", text: "#4338ca" },
  APPROVED: { label: "Đã duyệt (Chờ công bố)", bg: "#d1fae5", text: "#047857" },
  PUBLISHED: { label: "Đang mở đăng ký", bg: "#dcfce7", text: "#15803d" },
  HAPPENING: { label: "Đang diễn ra", bg: "#cffafe", text: "#0e7490" },
  COMPLETED: { label: "Đã kết thúc", bg: "#f1f5f9", text: "#64748b" },
  REJECTED: { label: "Bị từ chối", bg: "#fee2e2", text: "#b91c1c" },
  CANCELLED: { label: "Đã hủy", bg: "#ffe4e6", text: "#be123c" },
}

function getEventBadge(event: LiveEvent, computed: EventStatus) {
  const raw = (event.trang_thai || "").toUpperCase()
  if (raw && LIFECYCLE_BADGE[raw]) {
    if (raw === "PUBLISHED" && computed === "full") {
      return { label: "Hết chỗ", bg: "#fee2e2", text: "#b91c1c" }
    }
    if (raw === "PUBLISHED" && computed === "nearly_full") {
      return { label: "Sắp hết chỗ", bg: "#fef9c3", text: "#a16207" }
    }
    return LIFECYCLE_BADGE[raw]
  }
  return LIFECYCLE_BADGE.PUBLISHED
}

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
  layout?: "organizer" | "faculty"
}

export default function EventsManage({
  onNavigate,
  onLogout,
  layout = "organizer",
}: Props) {
  const {
    approvalCases,
    updateApproval,
    cancelEvent,
    computeStatus,
    refetch,
  } = useApp()
  const { showToast } = useToast()
  const { user } = useUser()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [topics, setTopics] = useState<Topic[]>([])
  const [orgEvents, setOrgEvents] = useState<LiveEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [detailModal, setDetailModal] = useState<LiveEvent | null>(null)
  const [reopenModal, setReopenModal] = useState<{
    id: string
    eventId?: string
    title: string
  } | null>(null)
  const [reopenReason, setReopenReason] = useState("")
  const [withdrawModal, setWithdrawModal] = useState<{
    id: string
    eventId?: string
    title: string
  } | null>(null)
  const [withdrawReason, setWithdrawReason] = useState("")
  const [cancelModal, setCancelModal] = useState<{
    id: string
    eventId?: string
    title: string
  } | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelReasonTouched, setCancelReasonTouched] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  function openCancelModal(target: { id: string; eventId?: string; title: string }) {
    setCancelReason("")
    setCancelReasonTouched(false)
    setCancelModal(target)
  }

  const loadOrganizerEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const res = await eventsService.organizerList({ limit: 100 })
      if (Array.isArray(res.data)) {
        setOrgEvents(res.data.map(mapContractEventToLiveEvent))
      }
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    } finally {
      setLoadingEvents(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadOrganizerEvents()
  }, [loadOrganizerEvents, user.email])

  useEffect(() => {
    let active = true
    api
      .get<{ data: Topic[] }>("/topics")
      .then((res) => {
        if (active && Array.isArray(res.data)) setTopics(res.data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  async function handleReopen() {
    if (!reopenModal) return
    const targetCase = approvalCases.find((c) => c.id === reopenModal.id)
    const rawId = reopenModal.eventId || targetCase?.eventId || reopenModal.id
    const numericId = Number(rawId.replace(/\D/g, "")) || 2050
    try {
      if (numericId) {
        await eventsService.reopen(numericId, reopenReason || "Tái mở sửa lại")
      }
      await updateApproval(reopenModal.id, "reopen", reopenReason, true)
      showToast(
        `Đã tái mở sự kiện "${reopenModal.title}" về bản nháp. Bạn có thể chỉnh sửa và gửi duyệt lại.`,
        "success",
      )
      setReopenModal(null)
      setReopenReason("")
      await loadOrganizerEvents()
      if (refetch) await refetch()
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    }
  }

  async function handleWithdraw() {
    if (!withdrawModal) return
    if (!withdrawReason.trim() || withdrawReason.trim().length < 5) {
      showToast("Vui lòng nhập lý do rút hồ sơ (tối thiểu 5 ký tự).", "error")
      return
    }
    const targetCase = approvalCases.find((c) => c.id === withdrawModal.id)
    const rawId = withdrawModal.eventId || targetCase?.eventId || withdrawModal.id
    const numericId = Number(rawId.replace(/\D/g, "")) || 2050
    try {
      if (numericId) {
        await eventsService.withdraw(numericId, withdrawReason)
      }
      await updateApproval(withdrawModal.id, "withdraw", withdrawReason, true)
      showToast(
        `Đã rút hồ sơ đề xuất "${withdrawModal.title}" về bản nháp.`,
        "success",
      )
      setWithdrawModal(null)
      setWithdrawReason("")
      await loadOrganizerEvents()
      if (refetch) await refetch()
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    }
  }

  async function handleEmergencyCancel() {
    if (!cancelModal || cancelling) return
    if (!cancelReason.trim() || cancelReason.trim().length < 8) {
      setCancelReasonTouched(true)
      showToast(
        "Vui lòng nhập lý do hủy sự kiện chi tiết (tối thiểu 8 ký tự).",
        "error",
      )
      return
    }
    const targetCase = approvalCases.find((c) => c.id === cancelModal.id)
    const rawId = cancelModal.eventId || targetCase?.eventId || cancelModal.id
    const numericId = Number(rawId.replace(/\D/g, "")) || 101
    setCancelling(true)
    try {
      if (numericId) {
        await eventsService.emergencyCancel(numericId, cancelReason.trim())
      }
      cancelEvent(cancelModal.id, cancelReason, true)
      showToast(
        `Đã hủy sự kiện "${cancelModal.title}". Hệ thống đang gửi email thông báo hủy và giải phóng vé.`,
        "success",
      )
      setCancelModal(null)
      setCancelReason("")
      setCancelReasonTouched(false)
      await loadOrganizerEvents()
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    } finally {
      setCancelling(false)
    }
  }

  // Pending / in-progress proposals strictly derived from organizer's real events
  const activeProposals = useMemo(() => {
    return orgEvents.filter((e) => {
      const s = (e.trang_thai || "").toUpperCase()
      return [
        "WAITING_COHOST_CONFIRM",
        "PENDING_FACULTY",
        "PENDING_ADMIN",
        "COHOST_REJECTED",
        "REJECTED",
      ].includes(s)
    })
  }, [orgEvents])

  const filtered = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return orgEvents.filter((e) => {
      const rawStatus = (e.trang_thai || "").toUpperCase()
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "DRAFT" && rawStatus === "DRAFT") ||
        (statusFilter === "WAITING_COHOST_CONFIRM" && rawStatus === "WAITING_COHOST_CONFIRM") ||
        (statusFilter === "PENDING" && (rawStatus === "PENDING_FACULTY" || rawStatus === "PENDING_ADMIN")) ||
        (statusFilter === "APPROVED" && rawStatus === "APPROVED") ||
        (statusFilter === "PUBLISHED" && rawStatus === "PUBLISHED") ||
        (statusFilter === "HAPPENING" && rawStatus === "HAPPENING") ||
        (statusFilter === "REJECTED" && (rawStatus === "REJECTED" || rawStatus === "COHOST_REJECTED")) ||
        (statusFilter === "COMPLETED" && rawStatus === "COMPLETED") ||
        (statusFilter === "CANCELLED" && rawStatus === "CANCELLED")

      const matchesSearch =
        !search.trim() ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        String(e.ma_su_kien).includes(search.trim())

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "upcoming" && e.date >= todayStr) ||
        (dateFilter === "past" && e.date < todayStr)

      const evtTopic = (e.ten_chuyen_de || String(e.topic || "")).toLowerCase()
      const matchesTopic =
        topicFilter === "all" || evtTopic === topicFilter.toLowerCase()

      return matchesStatus && matchesSearch && matchesDate && matchesTopic
    })
  }, [orgEvents, statusFilter, search, dateFilter, topicFilter])

  const statusTabs = [
    { id: "all", label: `Tất cả (${orgEvents.length})` },
    { id: "DRAFT", label: "Bản nháp" },
    { id: "WAITING_COHOST_CONFIRM", label: "Chờ Co-host" },
    { id: "PENDING", label: "Chờ duyệt" },
    { id: "APPROVED", label: "Đã duyệt" },
    { id: "PUBLISHED", label: "Đang mở" },
    { id: "HAPPENING", label: "Đang diễn ra" },
    { id: "REJECTED", label: "Bị từ chối" },
    { id: "COMPLETED", label: "Đã kết thúc" },
    { id: "CANCELLED", label: "Đã hủy" },
  ]

  const LayoutComponent = layout === "faculty" ? ManagementLayout : OrgLayout
  const layoutProps =
    layout === "faculty"
      ? {
          role: "faculty_manager" as const,
          current: "faculty-events",
          onNavigate,
          onLogout,
        }
      : {
          current: "org-events",
          onNavigate,
          onLogout,
        }

  return (
    <LayoutComponent {...(layoutProps as any)}>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl lg:text-3xl"
              style={{ color: "#1a1a2e" }}
            >
              Quản lý sự kiện
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {loadingEvents
                ? "Đang tải danh sách sự kiện của đơn vị..."
                : `${orgEvents.length} sự kiện thuộc đơn vị`}
            </p>
          </div>
          <button
            onClick={() => onNavigate("org-event-form")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white whitespace-nowrap"
            style={{ background: "#4f46e5" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Tạo sự kiện mới
          </button>
        </div>

        {/* Approval Progress Card */}
        {activeProposals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-sm text-navy">
                  Tiến trình phê duyệt hồ sơ
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nháp → Co-host xác nhận (nếu có) → Khoa duyệt → CTSV duyệt → Đủ điều kiện công bố
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                {activeProposals.length} hồ sơ đang xử lý
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {activeProposals.map((item) => {
                const rawSt = (item.trang_thai || "").toUpperCase()
                const badge = LIFECYCLE_BADGE[rawSt] || LIFECYCLE_BADGE.PENDING_FACULTY
                const isWaitingCohost = rawSt === "WAITING_COHOST_CONFIRM"
                const isPendingApproval =
                  rawSt === "WAITING_COHOST_CONFIRM" ||
                  rawSt === "PENDING_FACULTY" ||
                  rawSt === "PENDING_ADMIN"
                const isRejectedProposal =
                  rawSt === "REJECTED" || rawSt === "COHOST_REJECTED"
                const evId = String(item.ma_su_kien)

                return (
                  <div
                    key={item.ma_su_kien}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-mono">
                          #{item.ma_su_kien}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        {isWaitingCohost && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <span>⏳</span> Soft Hold 48h chờ đồng tổ chức
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPendingApproval && (
                        <button
                          onClick={() =>
                            setWithdrawModal({
                              id: `HS-${evId}`,
                              eventId: evId,
                              title: item.title,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                          title="Rút hồ sơ về bản nháp để điều chỉnh"
                        >
                          Rút đề xuất
                        </button>
                      )}
                      {isRejectedProposal && (
                        <button
                          onClick={() =>
                            setReopenModal({
                              id: `HS-${evId}`,
                              eventId: evId,
                              title: item.title,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Tái mở bản nháp bị từ chối để chỉnh sửa lại"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Tái mở bản nháp</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "#94a3b8" }}
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
              placeholder="Tìm kiếm theo tên, phòng hoặc mã sự kiện..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none bg-white focus:border-indigo-500"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Lọc theo ngày"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "all" | "upcoming" | "past")
              }
              className="px-3 py-2 rounded-xl border text-sm font-medium bg-white outline-none focus:border-indigo-500 cursor-pointer"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="past">Đã qua</option>
            </select>
            <select
              aria-label="Lọc theo chủ đề"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border text-sm font-medium bg-white outline-none focus:border-indigo-500 cursor-pointer"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              <option value="all">Tất cả chủ đề</option>
              {topics.map((t) => (
                <option key={t.ma_chuyen_de} value={t.ten_chuyen_de}>
                  {t.ten_chuyen_de}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status filter chips — horizontal scroll */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 mb-4"
          style={{ scrollbarWidth: "none" }}
        >
          {statusTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: statusFilter === t.id ? "#4f46e5" : "white",
                color: statusFilter === t.id ? "white" : "#64748b",
                border: `1px solid ${
                  statusFilter === t.id ? "#4f46e5" : "#e2e8f0"
                }`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div
          className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border"
          style={{ borderColor: "#f1f5f9" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    borderBottom: "2px solid #f1f5f9",
                  }}
                >
                  {[
                    "Tên sự kiện",
                    "Ngày tổ chức",
                    "Địa điểm",
                    "Sức chứa",
                    "Đã đăng ký",
                    "Tỷ lệ",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#94a3b8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Calendar className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-base font-semibold text-slate-700">
                          Chưa có sự kiện nào
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Đơn vị của bạn hiện chưa có sự kiện nào trong danh mục này. Hãy bấm "Tạo sự kiện mới" để bắt đầu lên kế hoạch!
                        </p>
                        <button
                          onClick={() => onNavigate("org-event-form")}
                          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          + Tạo sự kiện mới
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((event) => {
                    const eventStatus = computeStatus(event) as EventStatus
                    const badge = getEventBadge(event, eventStatus)
                    const isUnlimited =
                      !event.capacity ||
                      event.capacity <= 0 ||
                      event.capacity > 99999 ||
                      Boolean(event.khong_gioi_han_slot)
                    const pct = isUnlimited
                      ? 100
                      : Math.min(
                          100,
                          Math.round(((event.registered || 0) / event.capacity) * 100),
                        ) || 0
                    const eventId = String(event.ma_su_kien || event.id)
                    const rawStatus = (event.trang_thai || "").toUpperCase()
                    const isDraft = rawStatus === "DRAFT"
                    const isPending =
                      rawStatus === "CHO_PHE_DUYET" ||
                      rawStatus === "CHO_DUYET" ||
                      rawStatus === "WAITING_COHOST_CONFIRM" ||
                      rawStatus.includes("PENDING")
                    const isRejected =
                      rawStatus === "TU_CHOI" ||
                      rawStatus === "REJECTED" ||
                      rawStatus === "COHOST_REJECTED" ||
                      rawStatus.includes("REJECTED")
                    const isHappening =
                      rawStatus === "HAPPENING" ||
                      rawStatus === "DANG_DIEN_RA"
                    const isEnded =
                      rawStatus === "COMPLETED" ||
                      rawStatus === "DA_KET_THUC"
                    const isCancelled =
                      rawStatus === "CANCELLED" ||
                      rawStatus === "DA_HUY"
                    const isPublishedOrApproved =
                      rawStatus === "APPROVED" || rawStatus === "PUBLISHED"

                    return (
                      <tr
                        key={event.id}
                        className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#f8fafc" }}
                      >
                        <td className="px-4 py-4">
                          <div
                            className="font-medium leading-snug cursor-pointer hover:text-indigo-600"
                            style={{ color: "#1a1a2e", maxWidth: 240 }}
                            onClick={() => setDetailModal(event)}
                          >
                            {event.title}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "#94a3b8" }}
                          >
                            #{event.ma_su_kien} · {event.ten_chuyen_de || TOPIC_LABELS[event.topic] || event.topic}
                          </div>
                        </td>
                        <td
                          className="px-4 py-4 text-xs whitespace-nowrap"
                          style={{
                            color: "#475569",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {new Date(event.date).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          className="px-4 py-4 text-xs"
                          style={{ color: "#475569", maxWidth: 140 }}
                        >
                          {event.room}
                        </td>
                        <td
                          className="px-4 py-4 text-xs text-center font-mono"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "#475569",
                          }}
                        >
                          {isUnlimited ? "∞" : event.capacity}
                        </td>
                        <td
                          className="px-4 py-4 text-xs text-center font-mono"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "#475569",
                          }}
                        >
                          {event.registered || 0}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-16 h-1.5 rounded-full"
                              style={{ background: "#f1f5f9" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: isUnlimited
                                    ? "#10b981"
                                    : pct >= 90
                                      ? "#dc2626"
                                      : "#4f46e5",
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-mono"
                              style={{
                                fontFamily: "var(--font-mono)",
                                color: "#64748b",
                              }}
                            >
                              {isUnlimited ? "Tự do" : `${pct}%`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <ActionBtn
                              title="Xem chi tiết sự kiện"
                              onClick={() => setDetailModal(event)}
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </ActionBtn>

                            {isDraft && (
                              <ActionBtn
                                title="Chỉnh sửa bản nháp"
                                onClick={() =>
                                  onNavigate(`/organizer/events/${eventId}/edit`)
                                }
                              >
                                <Edit3 className="w-4 h-4 text-indigo-600" />
                              </ActionBtn>
                            )}

                            {isPending && (
                              <ActionBtn
                                title="Rút đề xuất về bản nháp"
                                onClick={() =>
                                  setWithdrawModal({
                                    id: event.id,
                                    eventId,
                                    title: event.title,
                                  })
                                }
                              >
                                <Undo2 className="w-4 h-4 text-amber-600" />
                              </ActionBtn>
                            )}

                            {isRejected && (
                              <ActionBtn
                                title="Tái mở bản nháp để chỉnh sửa lại"
                                onClick={() =>
                                  setReopenModal({
                                    id: event.id,
                                    eventId,
                                    title: event.title,
                                  })
                                }
                              >
                                <RefreshCw className="w-4 h-4 text-indigo-600" />
                              </ActionBtn>
                            )}

                            {isPublishedOrApproved && (
                              <>
                                <ActionBtn
                                  title="Danh sách người tham gia"
                                  onClick={() =>
                                    onNavigate(
                                      `/organizer/participants?eventId=${eventId}`,
                                    )
                                  }
                                >
                                  <Users className="w-4 h-4 text-slate-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Chỉnh sửa sự kiện"
                                  onClick={() =>
                                    onNavigate(
                                      `/organizer/events/${eventId}/edit`,
                                    )
                                  }
                                >
                                  <Edit3 className="w-4 h-4 text-indigo-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Hủy sự kiện khẩn cấp"
                                  onClick={() =>
                                    openCancelModal({
                                      id: event.id,
                                      eventId,
                                      title: event.title,
                                    })
                                  }
                                >
                                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                                </ActionBtn>
                              </>
                            )}

                            {isHappening && (
                              <>
                                <ActionBtn
                                  title="Mở Kiosk Hội trường (Dynamic QR)"
                                  onClick={() =>
                                    onNavigate(`/organizer/kiosk/${eventId}`)
                                  }
                                >
                                  <Monitor className="w-4 h-4 text-sky-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Soát vé Camera (Mobile Scanner)"
                                  onClick={() => onNavigate("staff-scanner")}
                                >
                                  <Camera className="w-4 h-4 text-indigo-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Danh sách người tham gia"
                                  onClick={() =>
                                    onNavigate(
                                      `/organizer/participants?eventId=${eventId}`,
                                    )
                                  }
                                >
                                  <Users className="w-4 h-4 text-slate-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Hủy sự kiện khẩn cấp"
                                  onClick={() =>
                                    openCancelModal({
                                      id: event.id,
                                      eventId,
                                      title: event.title,
                                    })
                                  }
                                >
                                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                                </ActionBtn>
                              </>
                            )}

                            {isEnded && (
                              <>
                                <ActionBtn
                                  title="Báo cáo & Thống kê sự kiện"
                                  onClick={() =>
                                    onNavigate(
                                      `/organizer/dashboard?eventId=${eventId}`,
                                    )
                                  }
                                >
                                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                                </ActionBtn>
                                <ActionBtn
                                  title="Danh sách người tham gia"
                                  onClick={() =>
                                    onNavigate(
                                      `/organizer/participants?eventId=${eventId}`,
                                    )
                                  }
                                >
                                  <Users className="w-4 h-4 text-slate-600" />
                                </ActionBtn>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <Calendar className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có sự kiện nào</p>
              <p className="text-xs text-slate-400 mt-1">Đơn vị chưa có sự kiện trong danh mục này.</p>
              <button
                onClick={() => onNavigate("org-event-form")}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Tạo sự kiện mới
              </button>
            </div>
          ) : (
            filtered.map((event) => {
              const eventStatus = computeStatus(event) as EventStatus
              const badge = getEventBadge(event, eventStatus)
              const isUnlimited =
                !event.capacity ||
                event.capacity <= 0 ||
                event.capacity > 99999 ||
                Boolean(event.khong_gioi_han_slot)
              const pct = isUnlimited
                ? 100
                : Math.min(
                    100,
                    Math.round(((event.registered || 0) / event.capacity) * 100),
                  ) || 0
              const eventId = String(event.ma_su_kien || event.id)
              const rawStatus = (event.trang_thai || "").toUpperCase()
              const isDraft = rawStatus === "DRAFT"
              const isPending =
                rawStatus === "CHO_PHE_DUYET" ||
                rawStatus === "CHO_DUYET" ||
                rawStatus === "WAITING_COHOST_CONFIRM" ||
                rawStatus.includes("PENDING")
              const isRejected =
                rawStatus === "TU_CHOI" ||
                rawStatus === "REJECTED" ||
                rawStatus === "COHOST_REJECTED" ||
                rawStatus.includes("REJECTED")
              const isHappening =
                rawStatus === "HAPPENING" ||
                rawStatus === "DANG_DIEN_RA"
              const isEnded =
                rawStatus === "COMPLETED" ||
                rawStatus === "DA_KET_THUC"
              const isCancelled =
                rawStatus === "CANCELLED" ||
                rawStatus === "DA_HUY"
              const isPublishedOrApproved =
                rawStatus === "APPROVED" || rawStatus === "PUBLISHED"

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-display font-semibold text-sm leading-snug cursor-pointer"
                        style={{ color: "#1a1a2e" }}
                        onClick={() => setDetailModal(event)}
                      >
                        {event.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        #{event.ma_su_kien} · {event.ten_chuyen_de || TOPIC_LABELS[event.topic] || event.topic}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div
                    className="space-y-1.5 text-xs mb-3"
                    style={{ color: "#64748b" }}
                  >
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatCalendarDate(event.date)} · {event.room}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {event.registered || 0}/{isUnlimited ? "Không giới hạn" : event.capacity} chỗ ({isUnlimited ? "Tự do" : `${pct}%`})
                      </span>
                    </p>
                  </div>
                  <div
                    className="h-1.5 rounded-full mb-3"
                    style={{ background: "#f1f5f9" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: isUnlimited
                          ? "#10b981"
                          : pct >= 90
                            ? "#dc2626"
                            : "#4f46e5",
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setDetailModal(event)}
                      className="py-1.5 px-3 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                    >
                      Chi tiết
                    </button>

                    {isDraft && (
                      <button
                        onClick={() => onNavigate(`/organizer/events/${eventId}/edit`)}
                        className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      >
                        Chỉnh sửa
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={() =>
                          setWithdrawModal({
                            id: event.id,
                            eventId,
                            title: event.title,
                          })
                        }
                        className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100"
                      >
                        Rút đề xuất
                      </button>
                    )}

                    {isRejected && (
                      <button
                        onClick={() =>
                          setReopenModal({
                            id: event.id,
                            eventId,
                            title: event.title,
                          })
                        }
                        className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Tái mở nháp</span>
                      </button>
                    )}

                    {isPublishedOrApproved && (
                      <>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/participants?eventId=${eventId}`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                        >
                          Người tham gia
                        </button>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/events/${eventId}/edit`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() =>
                            openCancelModal({
                              id: event.id,
                              eventId,
                              title: event.title,
                            })
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          Hủy sự kiện
                        </button>
                      </>
                    )}

                    {isHappening && (
                      <>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/kiosk/${eventId}`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-950 text-sky-400"
                        >
                          Kiosk
                        </button>
                        <button
                          onClick={() => onNavigate("staff-scanner")}
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-600 text-white flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Quét vé</span>
                        </button>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/participants?eventId=${eventId}`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 bg-white"
                        >
                          Người tham gia
                        </button>
                        <button
                          onClick={() =>
                            openCancelModal({
                              id: event.id,
                              eventId,
                              title: event.title,
                            })
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {isEnded && (
                      <>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/dashboard?eventId=${eventId}`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          Báo cáo
                        </button>
                        <button
                          onClick={() =>
                            onNavigate(`/organizer/participants?eventId=${eventId}`)
                          }
                          className="py-1.5 px-3 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 bg-white"
                        >
                          Người tham gia
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {detailModal && (() => {
        const dBadge = getEventBadge(detailModal, computeStatus(detailModal))
        const dRawStatus = (detailModal.trang_thai || "").toUpperCase()
        const dId = String(detailModal.ma_su_kien || detailModal.id)
        const dUnlimited = Boolean(detailModal.khong_gioi_han_slot) || !detailModal.capacity
        const canPreviewPublic = ["PUBLISHED", "HAPPENING", "COMPLETED"].includes(dRawStatus)

        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setDetailModal(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      #{detailModal.ma_su_kien}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: dBadge.bg, color: dBadge.text }}
                    >
                      {dBadge.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {detailModal.ten_chuyen_de || String(detailModal.topic)}
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-navy leading-snug">
                    {detailModal.title}
                  </h2>
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                  aria-label="Đóng chi tiết"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Thời gian tổ chức</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {formatCalendarDate(detailModal.date)} · {detailModal.time} – {detailModal.endTime}
                    </p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Phòng / Địa điểm</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {detailModal.location}
                    </p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Sức chứa & Đăng ký</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {dUnlimited
                        ? `${detailModal.registered || 0} đăng ký · Mở tự do (Không giới hạn slot)`
                        : `${detailModal.registered || 0} / ${detailModal.capacity} vé`}
                    </p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Quyền lợi ĐRL & Diễn giả</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {detailModal.dieu_khoan_drl === "KhongCo"
                        ? "Không cộng ĐRL"
                        : `+${detailModal.diem_drl_du_kien} điểm (${detailModal.dieu_khoan_drl === "Dieu4" ? "Điều 4" : "Điều 3"})`}
                      {detailModal.speaker ? ` · ${detailModal.speaker}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {detailModal.coHosts && detailModal.coHosts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">
                    Đơn vị đồng tổ chức:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailModal.coHosts.map((ch) => (
                      <span
                        key={ch}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 mb-1.5">
                  Mô tả sự kiện:
                </p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap">
                  {detailModal.description || "Chưa có mô tả chi tiết."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  {dRawStatus === "DRAFT" && (
                    <button
                      onClick={() => {
                        setDetailModal(null)
                        onNavigate(`/organizer/events/${dId}/edit`)
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Chỉnh sửa & Gửi duyệt
                    </button>
                  )}
                  {["PUBLISHED", "HAPPENING", "COMPLETED"].includes(dRawStatus) && (
                    <>
                      <button
                        onClick={() => {
                          setDetailModal(null)
                          onNavigate(`/organizer/dashboard?eventId=${dId}`)
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Xem báo cáo & Thống kê
                      </button>
                      <button
                        onClick={() => {
                          setDetailModal(null)
                          onNavigate(`/organizer/participants?eventId=${dId}`)
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Danh sách tham gia
                      </button>
                    </>
                  )}
                  {canPreviewPublic && (
                    <button
                      onClick={() => {
                        setDetailModal(null)
                        onNavigate(`/events/${dId}`)
                      }}
                      className="px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem trang công khai</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setDetailModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {reopenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="font-display font-bold text-lg text-navy">
                Tái mở bản nháp sự kiện
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {reopenModal.title}
            </p>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-800 mb-4 leading-relaxed">
              Khôi phục sự kiện bị từ chối quay về trạng thái <b>Bản nháp</b>. Sau khi mở lại, Ban tổ chức có thể tiếp tục chỉnh sửa nội dung, danh sách đồng tổ chức, cấu hình phòng và gửi duyệt lại.
            </div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do hoặc ghi chú chỉnh sửa (tùy chọn):
            </label>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
              placeholder="Ví dụ: Bổ sung phương án kiểm soát slot và cập nhật danh sách diễn giả mới..."
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setReopenModal(null)
                  setReopenReason("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReopen}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                Xác nhận tái mở nháp
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy">
              Rút đề xuất sự kiện về bản nháp
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              {withdrawModal.title}
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 mb-4">
              Hồ sơ đang chờ duyệt sẽ được rút về trạng thái{" "}
              <b>Bản nháp</b> để Ban tổ chức có thể tiếp tục chỉnh sửa
              trước khi gửi duyệt lại.
            </div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do rút hồ sơ:
            </label>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
              placeholder="Ví dụ: Cần cập nhật lại danh sách diễn giả và điều chỉnh kinh phí..."
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setWithdrawModal(null)
                  setWithdrawReason("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              >
                Xác nhận rút
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <h2 className="font-display font-bold text-lg text-navy">
                Hủy sự kiện khẩn cấp
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {cancelModal.title}
            </p>
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 leading-relaxed mb-4">
              <b>Cảnh báo nghiêm trọng:</b> Khi thực hiện hủy sự kiện, toàn bộ
              vé của sinh viên đã đăng ký sẽ bị hủy, hội trường sẽ được giải
              phóng lập tức và hệ thống sẽ tự động kích hoạt thông báo khẩn qua
              Email cho toàn thể sinh viên tham gia.
            </div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lý do hủy sự kiện (Bắt buộc):
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className={`w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                cancelReasonTouched && cancelReason.trim().length < 8
                  ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-rose-500/20 focus:border-rose-500"
              }`}
              placeholder="Ví dụ: Diễn giả chính bị ốm đột xuất không thể có mặt tại hội trường..."
            />
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span
                className={
                  cancelReasonTouched && cancelReason.trim().length < 8
                    ? "text-rose-600 font-medium"
                    : "text-slate-400"
                }
              >
                Tối thiểu 8 ký tự
              </span>
              <span
                className={`font-semibold ${
                  cancelReason.trim().length >= 8
                    ? "text-emerald-600"
                    : cancelReasonTouched
                      ? "text-rose-600"
                      : "text-slate-400"
                }`}
              >
                {cancelReason.trim().length}/8 ký tự
              </span>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setCancelModal(null)
                  setCancelReason("")
                  setCancelReasonTouched(false)
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Không hủy
              </button>
              <button
                onClick={handleEmergencyCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy sự kiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutComponent>
  )
}

function approvalLabel(
  status: import("../../context/AppContext").ApprovalStatus,
) {
  const labels: Record<import("../../context/AppContext").ApprovalStatus, string> =
    {
      draft: "Bản nháp",
      faculty_pending: "Chờ khoa duyệt",
      faculty_revision: "Khoa yêu cầu bổ sung",
      faculty_rejected: "Khoa từ chối",
      faculty_approved: "Khoa đã duyệt",
      affairs_pending: "Chờ CTSV duyệt",
      affairs_revision: "CTSV yêu cầu bổ sung",
      affairs_rejected: "CTSV từ chối",
      approved: "Đủ điều kiện công bố",
    }
  return labels[status]
}

function ActionBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
    >
      {children}
    </button>
  )
}
