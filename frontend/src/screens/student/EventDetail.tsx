import { useState, useEffect } from "react"
import { TOPIC_LABELS, type Ticket } from "../../data/mock"
import {
  useApp,
  computeEventStatus,
  EVENT_STATUS_LABELS,
  type LiveEvent,
} from "../../context/AppContext"
import { mapContractEventToLiveEvent } from "../../context/EventDataContext"
import { useUser } from "../../context/UserContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage } from "../../api/errors"
import {
  Calendar,
  MapPin,
  Award,
  User as UserIcon,
  Clock,
  Share2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react"

const TOPIC_COLORS: Record<string, string> = {
  academic: "#4f46e5",
  skill: "#0891b2",
  culture: "#7c3aed",
  sport: "#059669",
  community: "#d97706",
}

interface Props {
  eventId: string
  isGuest?: boolean
  onBack: () => void
  onRegister: (ticket: Ticket) => void
  onViewTicket: () => void
  onRequireLogin?: () => void
}

const TABS = [
  "Giới thiệu",
  "Lịch trình",
  "Diễn giả",
  "Quyền lợi & Điểm",
] as const

export default function EventDetail({
  eventId,
  isGuest = false,
  onBack,
  onRegister,
  onViewTicket,
  onRequireLogin,
}: Props) {
  const {
    getEvent,
    getUserActiveTicket,
    registerEvent,
    getStudentWaitlistEntries,
    joinWaitlist,
    claimWaitlistOffer,
    declineWaitlistOffer,
    tickets,
  } = useApp()
  const { user } = useUser()
  const { showToast } = useToast()
  const [tab, setTab] = useState<typeof TABS[number]>("Giới thiệu")
  const [registering, setRegistering] = useState(false)
  const [showWaitlistRules, setShowWaitlistRules] = useState(false)
  const [fetchedEvent, setFetchedEvent] = useState<LiveEvent | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const cachedEvent = getEvent(eventId)
  const event = cachedEvent || fetchedEvent

  useEffect(() => {
    if (!cachedEvent && eventId) {
      let cancelled = false
      setLoadingDetail(true)
      setDetailError(null)
      const numId = Number(eventId.replace(/\D/g, "")) || eventId
      eventsService
        .publicDetail(numId)
        .then((res) => {
          if (!cancelled && res.data) {
            setFetchedEvent(mapContractEventToLiveEvent(res.data))
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setDetailError(getApiErrorMessage(err))
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingDetail(false)
          }
        })
      return () => {
        cancelled = true
      }
    }
  }, [cachedEvent, eventId])

  if (loadingDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-xl w-1/3 mb-4" />
        <div className="h-64 bg-slate-200 rounded-3xl w-full mb-6" />
        <div className="h-4 bg-slate-200 rounded-md w-2/3 mb-2" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 mb-2">Không tìm thấy thông tin sự kiện.</p>
        {detailError && (
          <p className="text-xs text-rose-500 mb-4">{detailError}</p>
        )}
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    )
  }

  const activeTicket = !isGuest
    ? getUserActiveTicket(event.id, user.studentId)
    : undefined
  const status = computeEventStatus(event)
  const pct = Math.round((event.registered / event.capacity) * 100)
  const waitlistEntry = !isGuest
    ? getStudentWaitlistEntries(user.studentId).find(
      (entry) =>
        entry.ma_su_kien === event.ma_su_kien &&
        ["WAITING", "OFFERED"].includes(entry.trang_thai),
    )
    : undefined

  // UC-DISC-02 & UC-BOOK-01: Smart Action Button state machine (13 states)
  let ctaLabel = isGuest
    ? "Đăng nhập để đăng ký giữ chỗ"
    : "Đăng ký giữ chỗ ngay"
  let ctaEnabled = true
  let ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"

  if (event.trang_thai === "CANCELLED") {
    ctaLabel = "Sự kiện đã bị hủy"
    ctaEnabled = false
    ctaClass =
      "bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-200"
  } else if (!isGuest && activeTicket) {
    if (activeTicket.status === "DaCheckOut") {
      ctaLabel = "Làm khảo sát & Nhận chứng nhận"
      ctaClass = "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
    } else if (activeTicket.status === "DaCheckIn") {
      ctaLabel = "Đã Check-in · Xem vé / Điểm danh ra"
      ctaClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
    } else {
      ctaLabel = "Bạn đã có vé · Xem vé & Điểm danh"
      ctaClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
    }
  } else if (status === "full") {
    if (waitlistEntry) {
      ctaLabel =
        waitlistEntry.trang_thai === "OFFERED"
          ? "Bạn có suất nhận vé (Sàn 15p) — Mở Ví vé"
          : `Đang trong hàng chờ FIFO #${waitlistEntry.so_thu_tu}`
      ctaEnabled = waitlistEntry.trang_thai === "OFFERED"
      ctaClass =
        waitlistEntry.trang_thai === "OFFERED"
          ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
          : "bg-amber-100 text-amber-800 cursor-default"
    } else {
      ctaLabel = isGuest
        ? "Đăng nhập để tham gia hàng đợi chờ"
        : "Tham gia danh sách chờ FIFO"
      ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
    }
  } else if (status === "closed") {
    ctaLabel = "Hết hạn đăng ký (Trước giờ G 2 tiếng)"
    ctaEnabled = false
    ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
  } else if (status === "ended") {
    ctaLabel = "Sự kiện đã kết thúc"
    ctaEnabled = false
    ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
  }

  async function handleCTA() {
    if (isGuest) {
      if (onRequireLogin) onRequireLogin()
      return
    }
    if (activeTicket) {
      onViewTicket()
      return
    }
    if (status === "full") {
      if (waitlistEntry?.trang_thai === "OFFERED") {
        onViewTicket()
      } else if (!waitlistEntry) {
        setShowWaitlistRules(true)
      }
      return
    }
    if (!ctaEnabled || registering) return

    // UC-BOOK-01: Check for potential schedule conflict with existing active tickets
    const conflictingTicket = tickets.find(
      (t) =>
        t.studentId === user.studentId &&
        t.status !== "cancelled" &&
        t.status !== "DaHuy" &&
        t.eventId !== event.id &&
        t.eventDate === event.date,
    )
    if (conflictingTicket) {
      showToast(
        `Cảnh báo: Bạn đã giữ vé sự kiện "${conflictingTicket.eventTitle}" trong cùng ngày ${event.date}.`,
        "warning",
      )
    }

    setRegistering(true)
    const result = await registerEvent(event!, user)
    setRegistering(false)
    if (result.success && result.ticket) {
      onRegister(result.ticket)
    } else {
      showToast(result.error ?? "Đăng ký thất bại", "error")
    }
  }

  const dateObj = new Date(event.date)
  const dateFormatted = dateObj.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Web Breadcrumb Navigation */}
      <nav className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            onClick={onBack}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Trang chủ
          </button>
          <span>/</span>
          <button
            onClick={onBack}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Sự kiện
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
            {event.title}
          </span>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Danh sách sự kiện</span>
        </button>
      </nav>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3 width): Main Event Presentation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: TOPIC_COLORS[event.topic] || "#4f46e5" }}
              >
                {TOPIC_LABELS[event.topic]}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {event.organizer}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${status === "open"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : status === "nearly_full"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}
              >
                {EVENT_STATUS_LABELS[status]}
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 leading-tight">
              {event.title}
            </h1>

            {/* Speaker banner info */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                {event.speaker.split(" ").slice(-1)[0][0] || "D"}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  Diễn giả / Chủ trì
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {event.speaker}
                </p>
              </div>
            </div>
          </div>

          {/* High-res Banner Image */}
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-100 shadow-xs border border-slate-200">
            <img
              src={event.banner}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Already registered banner (if user already registered) */}
          {activeTicket && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-emerald-900">
                    Bạn đã đăng ký thành công sự kiện này
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Mã vé:{" "}
                    <span className="font-mono font-bold">
                      {activeTicket.id}
                    </span>{" "}
                    · Trạng thái:{" "}
                    {activeTicket.status === "pending"
                      ? "Chưa check-in"
                      : "Đã check-in"}
                  </p>
                </div>
              </div>

              <button
                onClick={onViewTicket}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors flex-shrink-0 cursor-pointer"
              >
                Xem vé ngay
              </button>
            </div>
          )}

          {/* Web Tabbed Content */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Tab header */}
            <div className="border-b border-slate-200 px-6 pt-3 flex gap-4 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${tab === t
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="p-6 sm:p-8">
              {tab === "Giới thiệu" && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Mô tả sự kiện
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>

                  <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">
                        Hình thức & Địa điểm
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {event.ten_phong || event.room} · Cơ sở{" "}
                        {event.co_so === "CoSo2" ? "2 (Dĩ An)" : "1 (Thủ Đức)"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Điểm danh 2 chiều bằng QR HMAC (CEH1 standard)
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">
                        Đơn vị chủ trì (Host)
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {event.ten_don_vi_host || event.organizer}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {event.danh_sach_ten_dong_to_chuc &&
                          event.danh_sach_ten_dong_to_chuc.length > 0
                          ? `Đồng tổ chức: ${event.danh_sach_ten_dong_to_chuc.join(", ")}`
                          : "Phối hợp cùng Phòng Công tác Sinh viên"}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">
                        Đối tượng tham gia
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {event.doi_tuong_tham_gia ||
                          "Sinh viên toàn trường UIT"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Yêu cầu tài khoản sinh viên chính thức
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-700">
                        Chỉ tiêu rèn luyện (DRL)
                      </p>
                      <p className="text-sm font-bold text-indigo-900 mt-1">
                        {event.dieu_khoan_drl === "Dieu4"
                          ? "Cộng Điều 4"
                          : "Cộng Điều 3"}
                        : +{event.diem_drl_du_kien || 5} điểm
                      </p>
                      <p className="text-xs text-indigo-600 mt-0.5">
                        {event.gio_tinh_nguyen
                          ? `Cộng thêm ${event.gio_tinh_nguyen} giờ tình nguyện`
                          : "Cấp chứng nhận số sau khi đối soát đạt 70%"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "Lịch trình" && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900 mb-4">
                    Lịch trình chi tiết
                  </h3>
                  <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
                    {event.schedule.map((item, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-4 border-indigo-600" />
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                          {item.time}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 mt-1.5">
                          {item.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "Diễn giả" && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Thông tin diễn giả
                  </h3>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-display font-bold text-xl flex items-center justify-center flex-shrink-0">
                      {event.speaker.split(" ").slice(-1)[0][0]}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-slate-900">
                        {event.speaker}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chuyên gia khách mời danh dự
                      </p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Chuyên gia giàu kinh nghiệm trong lĩnh vực khoa học công
                        nghệ và đổi mới sáng tạo, trực tiếp chia sẻ và giao lưu
                        cùng sinh viên.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "Quyền lợi & Điểm" && (
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Quyền lợi dành cho người tham gia
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.benefits.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 text-xs font-bold border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-800">
                          {b}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                    <p className="text-xs font-bold text-indigo-900">
                      Quy tắc công nhận điểm rèn luyện:
                    </p>
                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                      Sinh viên cần hoàn thành cả 2 lượt Check-in khi vào và
                      Check-out khi kết thúc sự kiện. Thời lượng tham gia tối
                      thiểu 70% để được tự động xét công nhận điểm rèn luyện và
                      cấp chứng nhận số.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Sticky Booking Widget */}
        <div className="lg:col-span-1 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            {/* Status & capacity */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${status === "open"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : status === "nearly_full"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}
              >
                {EVENT_STATUS_LABELS[status]}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {event.registered}/{event.capacity} chỗ
              </span>
            </div>

            {/* Capacity meter */}
            <div className="space-y-1 mb-5">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 90
                    ? "bg-rose-500"
                    : pct >= 70
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                    }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-right text-slate-400">
                {event.capacity - event.registered > 0
                  ? "Còn " +
                  (event.capacity - event.registered) +
                  " suất đăng ký"
                  : "Đã hết chỗ"}
              </p>
            </div>

            {/* Key Event Facts */}
            <div className="space-y-3.5 mb-6 text-xs border-y border-slate-100 py-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {dateFormatted}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {event.time} - {event.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">{event.room}</p>
                  <p className="text-slate-500 mt-0.5">{event.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    +5 Điểm rèn luyện
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    Kèm Chứng nhận số sau sự kiện
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserIcon className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800">
                    {isGuest ? "Dành cho sinh viên toàn trường" : user.name}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {isGuest
                      ? "Yêu cầu đăng nhập tài khoản sinh viên"
                      : `${user.studentId} · ${user.faculty}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Waitlist Info Panel for Full Events (UC-BOOK-02) */}
            {status === "full" && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Hàng đợi danh sách chờ (FIFO)</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Vé chính thức đã phát hết. Khi có sinh viên hủy vé trước{" "}
                  <b>T-4h</b>, hệ thống tự động gửi Offer cho sinh viên xếp đầu
                  hàng đợi với Claim Window tối thiểu 15 phút.
                </p>

                {waitlistEntry ? (
                  <div className="mt-2 pt-2.5 border-t border-amber-200/80 space-y-2">
                    {waitlistEntry.trang_thai === "OFFERED" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                          <p className="font-bold text-amber-950">
                            Suất nhận vé ưu tiên đã sẵn sàng!
                          </p>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Hạn chót xác nhận:{" "}
                          <b>
                            {waitlistEntry.han_chot_xac_nhan
                              ? new Date(
                                waitlistEntry.han_chot_xac_nhan,
                              ).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              : "Trong vòng 45 phút"}
                          </b>
                          . Sau thời gian này vé sẽ chuyển cho người kế tiếp.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={async () => {
                              const result = await claimWaitlistOffer(
                                waitlistEntry.id,
                              )
                              showToast(
                                result.success
                                  ? "Đã nhận vé thành công từ hàng chờ!"
                                  : result.error || "Không thể nhận vé.",
                                result.success ? "success" : "error",
                              )
                              if (result.success) onViewTicket()
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Xác nhận nhận vé
                          </button>
                          <button
                            onClick={async () => {
                              const result = await declineWaitlistOffer(
                                waitlistEntry.id,
                              )
                              showToast(
                                result.success
                                  ? "Đã từ chối suất giữ chỗ."
                                  : result.error || "Không thể từ chối.",
                                result.success ? "info" : "error",
                              )
                            }}
                            className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-amber-950">
                          <span>
                            Vị trí của bạn: <b>#{waitlistEntry.so_thu_tu}</b>
                          </span>
                          <span className="text-[11px] text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full font-semibold">
                            Đang chờ slot trống
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700">
                          Hệ thống sẽ gửi email và thông báo đẩy khi có người
                          hủy vé. Hàng đợi đóng tại mốc T-2h.
                        </p>
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                "Bạn có chắc chắn muốn rút khỏi hàng chờ cho sự kiện này?",
                              )
                            )
                              return
                            const result = await declineWaitlistOffer(
                              waitlistEntry.id,
                            )
                            showToast(
                              result.success
                                ? "Đã rút khỏi hàng chờ."
                                : result.error || "Không thể hủy.",
                              result.success ? "info" : "error",
                            )
                          }}
                          className="w-full py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 text-[11px] font-medium"
                        >
                          Rút khỏi hàng chờ
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 font-medium">
                    Hàng đợi tự động đóng trước giờ G 2 tiếng (T-2h). Nhấn nút
                    bên dưới để lấy số thứ tự FIFO.
                  </p>
                )}
              </div>
            )}

            {/* Big CTA Action Button */}
            <button
              onClick={handleCTA}
              disabled={(!isGuest && !ctaEnabled) || registering}
              className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all cursor-pointer ${ctaClass}`}
            >
              {registering ? "Đang xử lý đăng ký..." : ctaLabel}
            </button>

            {/* Share Event Button (Guest & Student - SRS RBAC Row 9) */}
            <button
              type="button"
              onClick={() => {
                const url = window.location.href
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url)
                  showToast(
                    "Đã sao chép liên kết sự kiện vào bộ nhớ tạm!",
                    "success",
                  )
                } else {
                  showToast(`Liên kết: ${url}`, "info")
                }
              }}
              className="w-full mt-2.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Sao chép liên kết chia sẻ sự kiện"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Chia sẻ liên kết sự kiện</span>
            </button>

            {isGuest ? (
              <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                Nhấn để chuyển sang trang đăng nhập tài khoản sinh viên và hoàn
                tất giữ chỗ.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
                Mã vé điện tử và QR check-in được lưu trực tiếp vào mục Vé của
                tôi.
              </p>
            )}
          </div>

          {/* Quick Help Card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-1">Cần trợ giúp?</p>
            <p className="leading-relaxed">
              Liên hệ Phòng Công tác Sinh viên (CTSV) qua email{" "}
              <span className="font-medium text-slate-700">
                ctsv@demo.edu.vn
              </span>{" "}
              nếu cần hỗ trợ đăng ký.
            </p>
          </div>
        </div>
      </div>
      {showWaitlistRules && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowWaitlistRules(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
                ⏳
              </span>
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Đăng ký vào hàng chờ vé FIFO
                </h2>
                <p className="text-xs text-slate-500">{event.title}</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-4 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="font-bold text-indigo text-sm">1.</span>
                <p>
                  <b>Nguyên tắc FIFO</b>: Phục vụ nghiêm ngặt theo thứ tự "Vào
                  trước - Ra trước". Khi có sinh viên hủy vé trước T-4h, người
                  đứng đầu sẽ nhận Offer.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                <span className="font-bold text-amber-700 text-sm">2.</span>
                <p>
                  <b>Kiểm tra trùng lịch tự động</b>: Nếu tại thời điểm cấp
                  Offer bạn đã có vé sự kiện khác cùng giờ, hệ thống sẽ gán{" "}
                  <code>SKIPPED_CONFLICT</code> và chuyển slot cho người kế
                  tiếp.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="font-bold text-indigo text-sm">3.</span>
                <p>
                  <b>Cửa sổ nhận vé (Claim Window)</b>: min(NOW() + 60m, T-2h).
                  Ngưỡng sàn tối thiểu 15 phút. Hệ thống không cấp Offer mới khi
                  còn dưới 15 phút.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="font-bold text-indigo text-sm">4.</span>
                <p>
                  <b>Đóng hàng đợi tại T-2h</b>: Toàn bộ danh sách chờ tự động
                  đóng trước giờ khai mạc 2 tiếng.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWaitlistRules(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  const result = await joinWaitlist(event, user)
                  setShowWaitlistRules(false)
                  showToast(
                    result.success
                      ? `Đã vào hàng chờ ở vị trí #${result.entry?.so_thu_tu}.`
                      : result.error || "Không thể tham gia hàng chờ.",
                    result.success ? "success" : "error",
                  )
                }}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
              >
                Xác nhận lấy số thứ tự FIFO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
