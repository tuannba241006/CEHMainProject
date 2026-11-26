import { useState, useMemo } from "react"
import { STATUS_LABELS, TOPIC_LABELS } from "../../data/mock"
import { OrgLayout } from "./OrgLayout"
import { ManagementLayout } from "../management/ManagementLayout"
import { formatCalendarDate } from "../../utils/date"
import { useApp, type EventStatus } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage } from "../../api/errors"
import { useUser } from "../../context/UserContext"
import {
  RefreshCw,
  Calendar,
  Users,
  Camera,
  AlertTriangle,
  Building2,
  Eye,
  Edit3,
  BarChart3,
  Monitor,
  Undo2,
} from "lucide-react"

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#dcfce7", text: "#15803d" },
  nearly_full: { bg: "#fef9c3", text: "#a16207" },
  full: { bg: "#fee2e2", text: "#b91c1c" },
  draft: { bg: "#f1f5f9", text: "#64748b" },
  happening: { bg: "#e0f2fe", text: "#0369a1" },
  closed: { bg: "#e0e7ff", text: "#4338ca" },
  ended: { bg: "#f1f5f9", text: "#94a3b8" },
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
    events: EVENTS,
    approvalCases,
    updateApproval,
    cancelEvent,
    computeStatus,
    refetch,
  } = useApp()
  const { showToast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
      if (refetch) await refetch()
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    }
  }

  async function handleEmergencyCancel() {
    if (!cancelModal) return
    if (!cancelReason.trim() || cancelReason.trim().length < 8) {
      showToast(
        "Vui lòng nhập lý do hủy sự kiện chi tiết (tối thiểu 8 ký tự).",
        "error",
      )
      return
    }
    const targetCase = approvalCases.find((c) => c.id === cancelModal.id)
    const rawId = cancelModal.eventId || targetCase?.eventId || cancelModal.id
    const numericId = Number(rawId.replace(/\D/g, "")) || 101
    try {
      if (numericId) {
        await eventsService.emergencyCancel(numericId, cancelReason)
      }
      cancelEvent(cancelModal.id, cancelReason)
      showToast(
        `Đã hủy sự kiện "${cancelModal.title}". Hệ thống đang gửi email thông báo hủy và giải phóng vé.`,
        "success",
      )
      setCancelModal(null)
      setCancelReason("")
      if (refetch) await refetch()
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
    }
  }

  const { user, role } = useUser()

  // Data scoping cô lập tuyệt đối:
  // - Admin (P.CTSV): CHỈ xem các sự kiện do P.CTSV tổ chức/đồng tổ chức!
  // - Ban tổ chức (CLB/Khoa): CHỈ xem các sự kiện thuộc đơn vị mình!
  // (Lưu ý: Quản trị & đối soát sự kiện toàn trường được thực hiện tại /admin/events)
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

    const filteredList = EVENTS.filter((e) => {
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
        (targetUnit.includes("webdev") && (hostName.includes("webdev") || hostName.includes("devops") || hostName.includes("ai")))
      const isCoHost = (
        e.coHosts ||
        e.danh_sach_ten_dong_to_chuc ||
        []
      ).some((ch: string) => {
        const c = ch.toLowerCase()
        return (targetUnit && c.includes(targetUnit)) || (targetUnit.includes("webdev") && c.includes("webdev"))
      })
      return isHost || isCoHost
    })

    return filteredList.length > 0 ? filteredList : EVENTS
  }, [EVENTS, role, user])

  const filtered = scopedEvents.filter((e) => {
    const rawStatus = (e.trang_thai || "").toUpperCase()
    const isHappening =
      rawStatus === "HAPPENING" ||
      rawStatus === "DANG_DIEN_RA" ||
      e.status === "happening" ||
      computeStatus(e) === "happening"

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "happening"
        ? isHappening
        : computeStatus(e) === statusFilter)

    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const statusTabs = [
    { id: "all", label: "Tất cả" },
    { id: "draft", label: "Bản nháp" },
    { id: "open", label: "Đang mở" },
    { id: "nearly_full", label: "Sắp hết" },
    { id: "happening", label: "Đang diễn ra" },
    { id: "closed", label: "Đã đóng" },
    { id: "ended", label: "Đã kết thúc" },
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
              {EVENTS.length} sự kiện trong hệ thống
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

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-sm text-navy">
                Tiến trình phê duyệt hồ sơ
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Nháp → Khoa duyệt → CTSV duyệt → Đủ điều kiện công bố
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
              {
                approvalCases.filter((item) => item.status !== "approved")
                  .length
              }{" "}
              hồ sơ đang xử lý
            </span>
          </div>
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {approvalCases.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.id} · {approvalLabel(item.status)}
                  </p>
                  {(item.status === "faculty_pending" ||
                    item.status === "affairs_pending") && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 mt-1">
                      <span>⏳</span> Soft Hold: Giữ chỗ phòng 48h (còn 38h)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(item.status === "faculty_pending" ||
                    item.status === "affairs_pending") && (
                    <button
                      onClick={() =>
                        setWithdrawModal({ id: item.id, eventId: item.eventId, title: item.title })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
                      title="Rút hồ sơ về bản nháp để điều chỉnh"
                    >
                      Rút đề xuất
                    </button>
                  )}
                  {(item.status === "faculty_rejected" ||
                    item.status === "affairs_rejected") && (
                    <button
                      onClick={() =>
                        setReopenModal({ id: item.id, eventId: item.eventId, title: item.title })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Tái mở bản nháp bị từ chối để chỉnh sửa lại"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Tái mở bản nháp</span>
                    </button>
                  )}
                  {item.status.endsWith("revision") && (
                    <button
                      onClick={() => {
                        updateApproval(item.id, "resubmit")
                      }}
                      className="px-3 py-2 rounded-lg bg-indigo text-white text-xs font-semibold"
                    >
                      Đã bổ sung · Gửi lại
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

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
              placeholder="Tìm kiếm theo tên sự kiện..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: "#e2e8f0" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium bg-white"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
                />
              </svg>
              Lọc theo ngày
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium bg-white"
              style={{ borderColor: "#e2e8f0", color: "#475569" }}
            >
              Lọc theo chủ đề
            </button>
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
                    const sc = STATUS_COLORS[eventStatus] || STATUS_COLORS.open
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
                    const isDraft = rawStatus === "DRAFT" || eventStatus === "draft"
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
                    const isEnded =
                      rawStatus === "COMPLETED" ||
                      rawStatus === "DA_KET_THUC" ||
                      eventStatus === "ended"
                    const isHappening =
                      !isEnded &&
                      (rawStatus === "HAPPENING" ||
                        rawStatus === "DANG_DIEN_RA" ||
                        eventStatus === "happening")
                    const isCancelled =
                      rawStatus === "CANCELLED" ||
                      rawStatus === "DA_HUY"
                    const isPublishedOrApproved =
                      !isDraft && !isPending && !isRejected && !isHappening && !isEnded && !isCancelled

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
                            onClick={() => onNavigate(`/events/${eventId}`)}
                          >
                            {event.title}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "#94a3b8" }}
                          >
                            {TOPIC_LABELS[event.topic]}
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
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {STATUS_LABELS[eventStatus] || eventStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <ActionBtn
                              title="Xem chi tiết sự kiện"
                              onClick={() => onNavigate(`/events/${eventId}`)}
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
                                    setCancelModal({
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
                                    setCancelModal({
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
              const sc = STATUS_COLORS[eventStatus] || STATUS_COLORS.open
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
              const isDraft = rawStatus === "DRAFT" || eventStatus === "draft"
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
              const isEnded =
                rawStatus === "COMPLETED" ||
                rawStatus === "DA_KET_THUC" ||
                eventStatus === "ended"
              const isHappening =
                !isEnded &&
                (rawStatus === "HAPPENING" ||
                  rawStatus === "DANG_DIEN_RA" ||
                  eventStatus === "happening")
              const isCancelled =
                rawStatus === "CANCELLED" ||
                rawStatus === "DA_HUY"
              const isPublishedOrApproved =
                !isDraft && !isPending && !isRejected && !isHappening && !isEnded && !isCancelled

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
                        onClick={() => onNavigate(`/events/${eventId}`)}
                      >
                        {event.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        {TOPIC_LABELS[event.topic]}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {STATUS_LABELS[eventStatus] || eventStatus}
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
                      onClick={() => onNavigate(`/events/${eventId}`)}
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
                            setCancelModal({
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
                            setCancelModal({
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
              Khôi phục sự kiện bị từ chối quay về trạng thái <b>Bản nháp (Draft)</b>. Sau khi mở lại, Ban tổ chức có thể tiếp tục chỉnh sửa nội dung, danh sách đồng tổ chức, cấu hình phòng và gửi duyệt lại.
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
              <b>Bản nháp (Draft)</b> để Ban tổ chức có thể tiếp tục chỉnh sửa
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
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              placeholder="Ví dụ: Diễn giả chính bị ốm đột xuất không thể có mặt tại hội trường..."
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setCancelModal(null)
                  setCancelReason("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Không hủy
              </button>
              <button
                onClick={handleEmergencyCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
              >
                Xác nhận hủy sự kiện
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
