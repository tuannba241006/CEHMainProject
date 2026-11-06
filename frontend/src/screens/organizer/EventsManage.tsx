import { useState, useMemo } from "react"
import { STATUS_LABELS, TOPIC_LABELS } from "../../data/mock"
import { OrgLayout } from "./OrgLayout"
import { formatCalendarDate } from "../../utils/date"
import { useApp, type EventStatus } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { isApiMode } from "../../api/config"
import { getApiErrorMessage } from "../../api/errors"
import { useUser } from "../../context/UserContext"

const STATUS_COLORS: Record<EventStatus, { bg: string; text: string }> = {
  open: { bg: "#dcfce7", text: "#15803d" },
  nearly_full: { bg: "#fef9c3", text: "#a16207" },
  full: { bg: "#fee2e2", text: "#b91c1c" },
  draft: { bg: "#f1f5f9", text: "#64748b" },
  closed: { bg: "#e0e7ff", text: "#4338ca" },
  ended: { bg: "#f1f5f9", text: "#94a3b8" },
}

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export default function EventsManage({ onNavigate, onLogout }: Props) {
  const {
    events: EVENTS,
    approvalCases,
    updateApproval,
    cancelEvent,
    computeStatus,
  } = useApp()
  const { showToast } = useToast()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [reopenModal, setReopenModal] = useState<{
    id: string
    title: string
  } | null>(null)
  const [reopenReason, setReopenReason] = useState("")
  const [withdrawModal, setWithdrawModal] = useState<{
    id: string
    title: string
  } | null>(null)
  const [withdrawReason, setWithdrawReason] = useState("")
  const [cancelModal, setCancelModal] = useState<{
    id: string
    title: string
  } | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  async function handleReopen() {
    if (!reopenModal) return
    try {
      if (isApiMode()) {
        await eventsService.reopen(reopenModal.id, reopenReason)
      }
      updateApproval(reopenModal.id, "reopen", reopenReason)
      showToast(
        `Đã tái mở sự kiện "${reopenModal.title}" về bản nháp. Bạn có thể chỉnh sửa và gửi duyệt lại.`,
        "success",
      )
      setReopenModal(null)
      setReopenReason("")
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
    try {
      if (isApiMode()) {
        await eventsService.withdraw(withdrawModal.id, withdrawReason)
      }
      updateApproval(withdrawModal.id, "withdraw", withdrawReason)
      showToast(
        `Đã rút hồ sơ đề xuất "${withdrawModal.title}" về bản nháp.`,
        "success",
      )
      setWithdrawModal(null)
      setWithdrawReason("")
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
    try {
      if (isApiMode()) {
        await eventsService.emergencyCancel(cancelModal.id, cancelReason)
      }
      cancelEvent(cancelModal.id, cancelReason)
      showToast(
        `Đã hủy sự kiện "${cancelModal.title}". Hệ thống đang gửi email thông báo hủy và giải phóng vé.`,
        "success",
      )
      setCancelModal(null)
      setCancelReason("")
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
    const targetUnit = isPctsAdmin
      ? "sinh viên"
      : (user.don_vi?.ten_don_vi || "").toLowerCase()
    const unitId = user.ma_don_vi_to_chuc || user.don_vi?.ma_don_vi

    return EVENTS.filter((e: any) => {
      const hostName = (
        e.organizer ||
        e.don_vi_host?.ten_don_vi ||
        e.ten_don_vi_host ||
        ""
      ).toLowerCase()
      const hostId = e.don_vi_host?.ma_don_vi || e.ma_don_vi_to_chuc
      const isHost =
        (unitId && hostId === unitId) ||
        (targetUnit && hostName.includes(targetUnit))
      const isCoHost = (
        e.coHosts ||
        e.danh_sach_ten_dong_to_chuc ||
        []
      ).some((ch: string) => ch.toLowerCase().includes(targetUnit))
      return isHost || isCoHost
    })
  }, [EVENTS, role, user])

  const filtered = scopedEvents.filter(
    (e) =>
      (statusFilter === "all" || computeStatus(e) === statusFilter) &&
      (e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase())),
  )

  const statusTabs = [
    { id: "all", label: "Tất cả" },
    { id: "draft", label: "Bản nháp" },
    { id: "open", label: "Đang mở" },
    { id: "nearly_full", label: "Sắp hết" },
    { id: "closed", label: "Đã đóng" },
    { id: "ended", label: "Đã kết thúc" },
  ]

  return (
    <OrgLayout current="org-events" onNavigate={onNavigate} onLogout={onLogout}>
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
          <div className="mt-3 space-y-2">
            {approvalCases.slice(0, 3).map((item) => (
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
                        setWithdrawModal({ id: item.id, title: item.title })
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
                        setReopenModal({ id: item.id, title: item.title })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Tái mở bản nháp bị từ chối để chỉnh sửa lại (UC-EVT-03.AC.2)"
                    >
                      <span>🔄</span>
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
                        <span className="text-4xl mb-3">📅</span>
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
                  const pct = Math.round(
                    (event.registered / event.capacity) * 100,
                  )
                  return (
                    <tr
                      key={event.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                      style={{ borderColor: "#f8fafc" }}
                    >
                      <td className="px-4 py-4">
                        <div
                          className="font-medium leading-snug"
                          style={{ color: "#1a1a2e", maxWidth: 240 }}
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
                        {event.capacity}
                      </td>
                      <td
                        className="px-4 py-4 text-xs text-center font-mono"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "#475569",
                        }}
                      >
                        {event.registered}
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
                                background: pct >= 90 ? "#dc2626" : "#4f46e5",
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
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {STATUS_LABELS[eventStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <ActionBtn
                            title="Xem"
                            onClick={() => onNavigate("org-participants")}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Chỉnh sửa"
                            onClick={() => onNavigate("org-event-form")}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Người tham gia"
                            onClick={() => onNavigate("org-participants")}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Mở Kiosk Hội trường (Dynamic QR)"
                            onClick={() =>
                              onNavigate(`/organizer/kiosk/${event.id}`)
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Soát vé Camera"
                            onClick={() => onNavigate("staff-scanner")}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Tái mở bản nháp để chỉnh sửa lại (UC-EVT-03.AC.2)"
                            onClick={() =>
                              setReopenModal({
                                id: event.id,
                                title: event.title,
                              })
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </ActionBtn>
                          <ActionBtn
                            title="Hủy sự kiện khẩn cấp (Host A)"
                            onClick={() =>
                              setCancelModal({
                                id: event.id,
                                title: event.title,
                              })
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <span className="text-3xl mb-2 inline-block">📅</span>
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
            const pct = Math.round((event.registered / event.capacity) * 100)
            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-4 shadow-sm border"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-display font-semibold text-sm leading-snug"
                      style={{ color: "#1a1a2e" }}
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
                    {STATUS_LABELS[eventStatus]}
                  </span>
                </div>
                <div
                  className="space-y-1.5 text-xs mb-3"
                  style={{ color: "#64748b" }}
                >
                  <p>
                    📅 {formatCalendarDate(event.date)} · {event.room}
                  </p>
                  <p>
                    👥 {event.registered}/{event.capacity} chỗ ({pct}%)
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
                      background: pct >= 90 ? "#dc2626" : "#4f46e5",
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate("org-participants")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium border"
                    style={{
                      borderColor: "#e2e8f0",
                      color: "#475569",
                      background: "white",
                    }}
                  >
                    Người tham gia
                  </button>
                  <button
                    onClick={() => onNavigate("org-event-form")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium"
                    style={{ background: "#eef2ff", color: "#4f46e5" }}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => onNavigate(`/organizer/kiosk/${event.id}`)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold"
                    style={{ background: "#1e1b4b", color: "#38bdf8" }}
                    title="Chiếu Kiosk Hội trường"
                  >
                    Kiosk
                  </button>
                  <button
                    onClick={() => onNavigate("staff-scanner")}
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-white"
                    style={{ background: "#4f46e5" }}
                    title="Soát vé Camera qua điện thoại"
                  >
                    📷 Quét vé
                  </button>
                  <button
                    onClick={() =>
                      setReopenModal({
                        id: event.id,
                        title: event.title,
                      })
                    }
                    className="py-2 px-2.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                    title="Tái mở bản nháp để chỉnh sửa lại"
                  >
                    🔄 Tái mở
                  </button>
                  <button
                    onClick={() =>
                      setCancelModal({
                        id: event.id,
                        title: event.title,
                      })
                    }
                    className="py-2 px-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100"
                    title="Hủy sự kiện khẩn cấp"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )
          }))}
        </div>
      </div>

      {reopenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-2">
              <span className="text-xl">🔄</span>
              <h2 className="font-display font-bold text-lg text-navy">
                Tái mở bản nháp sự kiện
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {reopenModal.title} (POST /events/{reopenModal.id}/reopen)
            </p>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-800 mb-4 leading-relaxed">
              Khôi phục sự kiện bị từ chối quay về trạng thái <b>Bản nháp (Draft)</b> theo quy chuẩn <b>UC-EVT-03.AC.2</b>. Sau khi mở lại, Ban tổ chức có thể tiếp tục chỉnh sửa nội dung, danh sách đồng tổ chức, cấu hình phòng và gửi duyệt lại.
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
              <span className="text-xl">⚠️</span>
              <h2 className="font-display font-bold text-lg text-navy">
                Hủy sự kiện khẩn cấp (Host A)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {cancelModal.title} (RBAC Dòng 8: POST /events/{cancelModal.id}
              /emergency-cancel)
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
    </OrgLayout>
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
      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <svg
        className="w-4 h-4"
        style={{ color: "#64748b" }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {children}
      </svg>
    </button>
  )
}
