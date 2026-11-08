import { useState, useEffect } from "react"
import type { Ticket } from "../../data/mock"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import { useToast } from "../../components/Toast"
import { parseCalendarDate } from "../../utils/date"
import {
  CertificateBadge,
  CertificatePreview,
} from "../management/AffairsOperations"
import type { Certificate } from "../../context/AppContext"
import { feedbackService } from "../../api/services/feedback.service"

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> =
  {
    pending: { bg: "#eef2ff", text: "#4338ca", label: "Chưa check-in" },
    attended: { bg: "#dcfce7", text: "#15803d", label: "Đã tham dự" },
    cancelled: { bg: "#fee2e2", text: "#b91c1c", label: "Đã hủy" },
    DaDangKy: { bg: "#eef2ff", text: "#4338ca", label: "Chưa check-in" },
    DaCheckIn: { bg: "#dcfce7", text: "#15803d", label: "Đã check-in" },
    DaCheckOut: { bg: "#e0f2fe", text: "#0369a1", label: "Đã check-out" },
    DaHuy: { bg: "#fee2e2", text: "#b91c1c", label: "Đã hủy" },
  }

interface Props {
  onNavigate: (screen: string) => void
  onSelectEvent: (eventId: string) => void
  initialTab?: "upcoming" | "waitlist" | "history"
}

export default function MyTickets({
  onNavigate,
  onSelectEvent,
  initialTab = "upcoming",
}: Props) {
  const {
    tickets,
    cancelTicket,
    getStudentWaitlistEntries,
    claimWaitlistOffer,
    declineWaitlistOffer,
    refreshTickets,
    ticketsLoading,
    ticketsError,
  } = useApp()
  const { user } = useUser()
  const { showToast } = useToast()

  useEffect(() => {
    if (refreshTickets) {
      void refreshTickets(user)
    }
  }, [user, refreshTickets])
  const [tab, setTab] = useState<"upcoming" | "waitlist" | "history">(
    initialTab,
  )
  const [showQR, setShowQR] = useState<Ticket | null>(null)
  const [showCancelModal, setShowCancelModal] = useState<Ticket | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [afterEvent, setAfterEvent] = useState<Ticket | null>(null)
  const [wakeLockActive, setWakeLockActive] = useState(false)

  // UC-TCK-01: Auto-request Screen Wake Lock when ticket QR is open
  useEffect(() => {
    let sentinel: { release: () => Promise<void> } | null = null
    if (showQR && "wakeLock" in navigator) {
      ;(navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
        .request("screen")
        .then((s) => {
          sentinel = s
          setWakeLockActive(true)
        })
        .catch(() => {
          setWakeLockActive(false)
        })
    }
    return () => {
      if (sentinel) {
        sentinel.release().catch(() => {})
        setWakeLockActive(false)
      }
    }
  }, [showQR])

  const myTickets = tickets.filter((t) => t.studentId === user.studentId)
  const upcoming = myTickets.filter((t) => t.status === "pending")
  const history = myTickets.filter((t) => t.status !== "pending")
  const list = tab === "upcoming" ? upcoming : history
  const waitlist = getStudentWaitlistEntries(user.studentId)

  async function handleCancel() {
    if (!showCancelModal || cancelling) return
    setCancelling(true)
    const result = await cancelTicket(showCancelModal.id, cancelReason)
    setCancelling(false)
    if (result.success) {
      showToast("Đã hủy vé thành công", "success")
      setShowCancelModal(null)
      setCancelReason("")
    } else {
      showToast(result.error ?? "Hủy vé thất bại", "error")
      setShowCancelModal(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Web Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Vé của tôi</span>
      </nav>

      {/* Page Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Vé sự kiện của tôi
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Quản lý vé đã đăng ký, hiển thị mã QR khi check-in tại hội trường
              và thực hiện khảo sát / nhận chứng chỉ số sau sự kiện.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate("checkin")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs hover:bg-cyan-700 transition-colors shadow-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>📷 Tự quét mã Kiosk Hội trường</span>
            </button>
            <button
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <span>+ Khám phá sự kiện</span>
            </button>
          </div>
        </div>

        {/* Web Tabs */}
        <div className="flex border-b border-slate-200 mt-8 gap-8">
          {(["upcoming", "waitlist", "history"] as const).map((t) => {
            const count =
              t === "upcoming"
                ? upcoming.length
                : t === "waitlist"
                  ? waitlist.length
                  : history.length
            const label =
              t === "upcoming"
                ? "Sắp diễn ra"
                : t === "waitlist"
                  ? "Danh sách chờ"
                  : "Lịch sử tham dự"
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    active
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {tab === "waitlist" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {waitlist.length === 0 ? (
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-10 text-center">
              <h3 className="font-display font-bold text-lg text-navy">
                Chưa có bản ghi danh sách chờ
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Khi sự kiện giới hạn chỗ hết vé, bạn có thể tham gia hàng đợi
                FIFO trước mốc T-2h.
              </p>
            </div>
          ) : (
            waitlist.map((entry) => (
              <article
                key={entry.id}
                className={`rounded-3xl border p-6 shadow-sm ${
                  entry.trang_thai === "OFFERED"
                    ? "bg-amber-50 border-amber-300"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    {entry.trang_thai === "OFFERED"
                      ? "Có suất chờ xác nhận"
                      : `Hàng đợi #${entry.so_thu_tu}`}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    #{entry.id}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-navy mt-4">
                  {entry.ten_su_kien}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  {entry.ten_phong} ·{" "}
                  {new Date(entry.thoi_gian_bat_dau).toLocaleString("vi-VN")}
                </p>
                {entry.trang_thai === "OFFERED" ? (
                  <>
                    <div className="mt-4 p-3 rounded-xl bg-white/70 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900">
                        Hạn xác nhận:{" "}
                        {entry.han_chot_xac_nhan
                          ? new Date(entry.han_chot_xac_nhan).toLocaleString(
                              "vi-VN",
                            )
                          : "Theo server_time"}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Quá hạn hoặc phát hiện trùng lịch, suất sẽ chuyển cho
                        người kế tiếp.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          const result = await claimWaitlistOffer(entry.id)
                          showToast(
                            result.success
                              ? "Đã nhận vé từ danh sách chờ."
                              : result.error || "Không thể nhận vé.",
                            result.success ? "success" : "error",
                          )
                          if (result.success) setTab("upcoming")
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        Xác nhận nhận vé
                      </button>
                      <button
                        onClick={async () => {
                          const result = await declineWaitlistOffer(entry.id)
                          showToast(
                            result.success
                              ? "Đã từ chối suất giữ chỗ."
                              : result.error || "Không thể từ chối suất.",
                            result.success ? "info" : "error",
                          )
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                      >
                        Từ chối
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 leading-relaxed">
                      Trạng thái:{" "}
                      <b>
                        Đang chờ slot trống (Thứ tự FIFO #{entry.so_thu_tu})
                      </b>
                      . Hệ thống tự động kiểm tra trùng lịch và gửi thông báo
                      khi có người hủy vé. Hàng đợi đóng tại mốc T-2h.
                    </p>
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            "Bạn có chắc chắn muốn rút khỏi hàng chờ cho sự kiện này?",
                          )
                        )
                          return
                        const result = await declineWaitlistOffer(entry.id)
                        showToast(
                          result.success
                            ? "Đã rút khỏi hàng chờ."
                            : result.error || "Không thể hủy.",
                          result.success ? "info" : "error",
                        )
                      }}
                      className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Rút khỏi hàng chờ
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      {ticketsError && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs">
          <span>⚠️ {ticketsError}</span>
          <button
            onClick={() => refreshTickets && refreshTickets(user)}
            className="underline font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Ticket List View */}
      {tab !== "waitlist" &&
        (ticketsLoading && list.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto mb-3" />
            <div className="h-4 bg-slate-200 rounded-md w-3/4 mx-auto mb-2" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2 mx-auto" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
              {tab === "upcoming"
                ? "Chưa có vé sắp diễn ra"
                : "Chưa có lịch sử tham dự"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {tab === "upcoming"
                ? "Bạn chưa đăng ký sự kiện nào sắp tới. Hãy xem danh sách sự kiện đang mở để giữ chỗ!"
                : "Lịch sử tham dự và chứng nhận sự kiện đã hoàn thành sẽ xuất hiện tại đây."}
            </p>
            <button
              onClick={() => onNavigate("home")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Khám phá sự kiện ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((ticket) => {
              const ss = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.pending
              const dateObj = parseCalendarDate(ticket.eventDate) ?? new Date(0)
              const dayStr = dateObj.toLocaleDateString("vi-VN", {
                day: "2-digit",
              })
              const monthStr = dateObj.toLocaleDateString("vi-VN", {
                month: "short",
                year: "numeric",
              })

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-6">
                    {/* Top row: Status badge + Ticket ID */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: ss.bg, color: ss.text }}
                      >
                        {ss.label}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        #{ticket.id}
                      </span>
                    </div>

                    {/* Event title & link */}
                    <button
                      onClick={() => onSelectEvent(ticket.eventId)}
                      className="font-display font-bold text-lg text-slate-900 hover:text-indigo-600 transition-colors text-left line-clamp-2 leading-snug mb-3 cursor-pointer"
                    >
                      {ticket.eventTitle}
                    </button>

                    {/* Metadata rows */}
                    <div className="space-y-2 text-xs text-slate-600 mb-5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">📅</span>
                        <span className="font-medium text-slate-800">
                          {(
                            parseCalendarDate(ticket.eventDate) ?? new Date(0)
                          ).toLocaleDateString("vi-VN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}{" "}
                          · {ticket.eventTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">📍</span>
                        <span className="truncate">{ticket.eventLocation}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">👤</span>
                        <span>
                          {ticket.studentName} ({ticket.studentId})
                        </span>
                      </div>

                      {ticket.checkinTime && (
                        <div className="flex items-center gap-2 text-emerald-700 font-medium pt-1">
                          <span>✓</span>
                          <span>Check-in lúc {ticket.checkinTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => onSelectEvent(ticket.eventId)}
                      className="text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
                    >
                      Xem chi tiết sự kiện →
                    </button>

                    <div className="flex items-center gap-2">
                      {ticket.status === "pending" && (
                        <>
                          <button
                            onClick={() => setShowCancelModal(ticket)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Hủy vé
                          </button>
                          <button
                            onClick={() => setShowQR(ticket)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                            <span>Hiện mã QR</span>
                          </button>
                        </>
                      )}

                      {ticket.status === "attended" && (
                        <button
                          onClick={() => setAfterEvent(ticket)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Sau sự kiện (Điểm & Chứng nhận) →
                        </button>
                      )}

                      {ticket.status === "cancelled" && (
                        <span className="text-xs font-medium text-rose-600">
                          Vé đã hủy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

      {/* Centered Web QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowQR(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-slate-900">
                Mã vé điện tử
              </h2>
              <button
                onClick={() => setShowQR(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-6">{showQR.eventTitle}</p>

            <div className="flex justify-center mb-6">
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl shadow-inner">
                <MiniQR seed={hashCode(showQR.id)} />
              </div>
            </div>

            {wakeLockActive && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-4 border border-emerald-100">
                <span>☀️</span>
                <span>Screen Wake Lock đang giữ sáng màn hình</span>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-4 text-center mb-6 border border-slate-100">
              <p className="font-mono font-bold text-xs sm:text-sm text-slate-900 tracking-wider break-all">
                {showQR.ma_ve_uuid || showQR.id}
              </p>
              <p className="text-xs text-slate-600 mt-1.5 font-medium">
                {showQR.studentName} · {showQR.studentId}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono break-all">
                HMAC-SHA256:{" "}
                {showQR.payload_qr ||
                  showQR.qrCode ||
                  `CEHTK.${showQR.id}.${user.studentId}.HMAC_SIG`}
              </p>
              <p className="text-[11px] text-indigo-600 mt-1 font-medium">
                Xuất trình mã này tại bàn đón tiếp để CTV quét mã qua HMAC Token
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                In vé / Lưu PDF
              </button>
              <button
                onClick={() => setShowQR(null)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Web Cancel Confirm Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowCancelModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 text-center mb-2">
              Xác nhận hủy đăng ký
            </h3>
            <p className="text-xs font-semibold text-slate-700 text-center mb-1">
              {showCancelModal.eventTitle}
            </p>
            <p className="text-xs text-slate-500 text-center mb-6">
              Bạn có chắc muốn hủy vé này? Suất tham gia sẽ được nhường lại cho
              sinh viên khác trong danh sách chờ.
            </p>
            <label className="block mb-4">
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Lý do hủy vé
              </span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                placeholder="Nhập lý do để Ban tổ chức đối soát..."
                className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
              />
              <span className="block text-[11px] text-slate-400 mt-1">
                Chỉ vé DaDangKy và trước mốc T-4h mới được hủy.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Giữ vé
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Web AfterEvent Modal */}
      {afterEvent && (
        <AfterEvent ticket={afterEvent} onClose={() => setAfterEvent(null)} />
      )}
    </div>
  )
}

function AfterEvent({
  ticket,
  onClose,
}: {
  ticket: Ticket
  onClose: () => void
}) {
  const { user } = useUser()
  const {
    attendanceRecords,
    surveyResponses,
    submitSurvey,
    certificates,
    requestStudentReview,
  } = useApp()
  const { showToast } = useToast()
  const [tab, setTab] = useState<"result" | "survey" | "certificate">("result")
  const [preview, setPreview] = useState<Certificate | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewReason, setReviewReason] = useState("")
  const [form, setForm] = useState({
    overall: 5,
    content: 5,
    organization: 4,
    venue: 4,
    useful: "",
    improvement: "",
    joinAgain: true,
  })

  const record = attendanceRecords.find(
    (row) => row.studentId === user.studentId,
  )
  const myCertificate = certificates.find(
    (item) =>
      item.studentId === user.studentId && item.eventId === ticket.eventId,
  )
  const sent = surveyResponses.some(
    (item) =>
      item.eventId === ticket.eventId && item.studentId === user.studentId,
  )

  function sendSurvey() {
    void feedbackService.submit(ticket.eventId, {
      ...form,
      ma_su_kien: Number(ticket.eventId) || 1,
    }).catch(() => null)
    const result = submitSurvey({
      eventId: ticket.eventId,
      studentId: user.studentId,
      ...form,
    })
    showToast(
      result.success
        ? "Đã gửi đánh giá ẩn danh."
        : result.error || "Không thể gửi đánh giá.",
      result.success ? "success" : "error",
    )
  }

  function sendReview() {
    if (!record) return
    const result = requestStudentReview(record.id, reviewReason)
    showToast(
      result.success
        ? "Đã gửi yêu cầu kiểm tra lại."
        : result.error || "Không thể gửi yêu cầu.",
      result.success ? "success" : "error",
    )
    if (result.success) setReviewOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">
              Khu vực Sau sự kiện
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-md">
              {ticket.eventTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
            {([
              ["result", "Kết quả tham gia"],
              ["survey", "Đánh giá sự kiện"],
              ["certificate", "Chứng nhận"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex-1 transition-all cursor-pointer ${
                  tab === value
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "result" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-slate-900">
                  Kết quả đối soát điểm danh
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    record?.status === "recognized"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {record?.status === "recognized"
                    ? "Đã công nhận chính thức"
                    : "Đang thẩm định"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Check-in", ticket.checkinTime || "—"],
                  ["Check-out", ticket.checkoutTime || "—"],
                  ["Thời lượng hợp lệ", (record?.validMinutes || 0) + " phút"],
                  ["Tỷ lệ tham gia", (record?.participationRatio || 0) + "%"],
                  ["Điểm đề xuất", (record?.proposedPoints || 0) + " điểm"],
                  [
                    "Điểm chính thức",
                    record?.officialPoints !== undefined
                      ? record.officialPoints + " điểm"
                      : "Chưa công nhận",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <p className="text-[11px] text-slate-400 font-medium">
                      {label}
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
                Điểm này là điểm đóng góp từ sự kiện, được chuyển tự động vào
                bảng điểm cá nhân sau khi Phòng CTSV duyệt.
              </div>

              <button
                onClick={() => setReviewOpen(true)}
                className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-700 font-semibold text-xs hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Gửi yêu cầu phúc khảo / kiểm tra lại kết quả
              </button>
            </section>
          )}

          {tab === "survey" && (
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-semibold text-slate-900">
                    Khảo sát ẩn danh 48 giờ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mở trong vòng 48 giờ sau khi sự kiện kết thúc
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    sent
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {sent ? "Đã gửi đánh giá" : "Đang mở khảo sát"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 text-purple-900 text-xs leading-relaxed border border-purple-100">
                Quyền gửi và chống gửi trùng được kiểm tra hoàn toàn độc lập với
                nội dung. Ban tổ chức chỉ xem báo cáo tổng hợp khi có tối thiểu
                5 phản hồi.
              </div>

              {sent ? (
                <div className="text-center py-8">
                  <p className="font-semibold text-emerald-700 text-sm">
                    Cảm ơn bạn đã đóng góp ý kiến!
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Phản hồi của bạn đã được ghi nhận ẩn danh an toàn.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <Rating
                    label="Mức độ hài lòng chung"
                    value={form.overall}
                    onChange={(value) => setForm({ ...form, overall: value })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Rating
                      label="Nội dung"
                      value={form.content}
                      onChange={(value) => setForm({ ...form, content: value })}
                    />
                    <Rating
                      label="Tổ chức"
                      value={form.organization}
                      onChange={(value) =>
                        setForm({ ...form, organization: value })
                      }
                    />
                    <Rating
                      label="Địa điểm"
                      value={form.venue}
                      onChange={(value) => setForm({ ...form, venue: value })}
                    />
                  </div>
                  <label className="block text-xs font-medium text-slate-700">
                    Điều bạn thấy ấn tượng / hữu ích nhất
                    <textarea
                      value={form.useful}
                      onChange={(e) =>
                        setForm({ ...form, useful: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500"
                      placeholder="Chia sẻ ngắn gọn..."
                    />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Ý kiến đóng góp để cải thiện
                    <textarea
                      value={form.improvement}
                      onChange={(e) =>
                        setForm({ ...form, improvement: e.target.value })
                      }
                      rows={2}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500"
                      placeholder="Góp ý cho sự kiện sau..."
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.joinAgain}
                      onChange={(e) =>
                        setForm({ ...form, joinAgain: e.target.checked })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>
                      Tôi muốn tiếp tục tham gia các sự kiện tương tự trong
                      tương lai
                    </span>
                  </label>
                  <button
                    onClick={sendSurvey}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Gửi phản hồi ẩn danh
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "certificate" && (
            <section className="space-y-4">
              <h3 className="font-display font-semibold text-slate-900">
                Chứng nhận số của sự kiện
              </h3>
              {myCertificate ? (
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {myCertificate.eventTitle}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        {myCertificate.code}
                      </p>
                    </div>
                    <CertificateBadge status={myCertificate.status} />
                  </div>
                  <button
                    disabled={myCertificate.status !== "issued"}
                    onClick={() => setPreview(myCertificate)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer"
                  >
                    Xem chứng nhận & tải PDF
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-semibold text-slate-700 text-xs">
                    Đang chờ Phòng CTSV cấp phát
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Chứng nhận số sẽ được cấp sau khi hoàn tất đối soát dữ liệu
                    điểm danh.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Review Request Modal */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-base text-slate-900">
              Yêu cầu kiểm tra lại kết quả
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mô tả sự cố về check-in hoặc thời lượng tham gia.
            </p>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs mt-3 outline-none focus:border-indigo-500"
              placeholder="Nhập lý do kiểm tra lại..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReviewOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={sendReview}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <CertificatePreview
          certificate={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}

function Rating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600 mb-1.5">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-8 h-8 rounded-lg text-base cursor-pointer transition-colors ${
              star <= value
                ? "bg-amber-50 text-amber-500 font-bold"
                : "bg-slate-50 text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

function hashCode(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++)
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function MiniQR({ seed }: { seed: number }) {
  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {[
        [0, 0],
        [126, 0],
        [0, 126],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect
            x={x + 2}
            y={y + 2}
            width={52}
            height={52}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={6}
            rx={4}
          />
          <rect
            x={x + 16}
            y={y + 16}
            width={24}
            height={24}
            fill="#1a1a2e"
            rx={2}
          />
        </g>
      ))}
      {Array.from({ length: 200 }, (_, i) => {
        const v = Math.sin(seed + i * 7.3 + 1)
        if (v * 0.5 + 0.5 < 0.45) return null
        const col = (i % 16) * 10 + 20
        const row = Math.floor(i / 16) * 10 + 20
        if (col < 70 && (row < 70 || row > 110)) return null
        if (col > 110 && row < 70) return null
        return (
          <rect
            key={i}
            x={col}
            y={row}
            width={8}
            height={8}
            fill="#1a1a2e"
            rx={1}
          />
        )
      })}
    </svg>
  )
}
