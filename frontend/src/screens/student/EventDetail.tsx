import { useState, useEffect, useCallback } from "react"
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
import {
  bookingsService,
  type BookingPrecheckData,
} from "../../api/services/bookings.service"
import { getApiErrorMessage } from "../../api/errors"
import {
  Calendar,
  MapPin,
  Award,
  User as UserIcon,
  Clock,
  Share2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react"

const TOPIC_COLORS: Record<string, string> = {
  academic: "#4f46e5",
  skill: "#0891b2",
  culture: "#7c3aed",
  sport: "#059669",
  community: "#d97706",
}

const TOPIC_PALETTE = [
  "#4f46e5",
  "#0891b2",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#db2777",
]

function getTopicColor(name: string): string {
  if (TOPIC_COLORS[name]) return TOPIC_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return TOPIC_PALETTE[hash % TOPIC_PALETTE.length]
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
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
  const [prechecking, setPrechecking] = useState(false)
  const [showWaitlistRules, setShowWaitlistRules] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [precheckData, setPrecheckData] = useState<BookingPrecheckData | null>(null)
  const [fetchedEvent, setFetchedEvent] = useState<LiveEvent | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [offerSecondsLeft, setOfferSecondsLeft] = useState<number | null>(null)

  const reloadDetail = useCallback(() => {
    setReloadTick((t) => t + 1)
  }, [])

  const cachedEvent = getEvent(eventId)
  const event = fetchedEvent || (!loadingDetail ? cachedEvent : undefined)

  useEffect(() => {
    setTab("Giới thiệu")
    setShowWaitlistRules(false)
    setShowBookingModal(false)
    setPrecheckData(null)
    setFetchedEvent(null)
    setOfferSecondsLeft(null)
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
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
  }, [eventId, isGuest, user.studentId, reloadTick])

  const backendBtnForTimer = fetchedEvent?.nut_bam_dieu_huong
  useEffect(() => {
    if (
      backendBtnForTimer?.trang_thai_nut === "CO_OFFER_WAITLIST" &&
      backendBtnForTimer.cho_phep_bam
    ) {
      const computeRemaining = (): number => {
        if (backendBtnForTimer.han_chot_offer) {
          const diff = Math.floor(
            (new Date(backendBtnForTimer.han_chot_offer).getTime() -
              Date.now()) /
              1000,
          )
          if (Number.isFinite(diff)) return Math.max(0, diff)
        }
        return Math.max(0, backendBtnForTimer.so_giay_offer_con_lai ?? 0)
      }

      setOfferSecondsLeft(computeRemaining())
      const timer = setInterval(() => {
        setOfferSecondsLeft((prev) => {
          if (prev === null) return null
          return Math.max(0, prev - 1)
        })
      }, 1000)
      return () => clearInterval(timer)
    }
    setOfferSecondsLeft(null)
  }, [
    backendBtnForTimer?.trang_thai_nut,
    backendBtnForTimer?.cho_phep_bam,
    backendBtnForTimer?.han_chot_offer,
    backendBtnForTimer?.so_giay_offer_con_lai,
  ])

  if (loadingDetail && !fetchedEvent) {
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
    ? (getUserActiveTicket(event.id, user.studentId) ||
       getUserActiveTicket(String(event.ma_su_kien), user.studentId))
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

  // UC-DISC-02 & UC-BOOK-01: Smart Action Button state machine (authoritative Backend first, local fallback offline)
  const backendBtn = event.nut_bam_dieu_huong
  const isHappening = event.trang_thai === "HAPPENING" && status !== "ended"
  const statusBadgeLabel = isHappening
    ? "Đang diễn ra"
    : status === "closed"
      ? "Đã đóng đăng ký"
      : EVENT_STATUS_LABELS[status]
  const statusBadgeClass = isHappening
    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
    : status === "open"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : status === "nearly_full"
        ? "bg-amber-50 text-amber-700 border border-amber-100"
        : status === "ended" || status === "closed"
          ? "bg-slate-100 text-slate-600 border border-slate-200"
          : "bg-rose-50 text-rose-700 border border-rose-100"

  let ctaLabel = isGuest ? "Đăng nhập để đặt vé" : "Đăng ký tham gia ngay"
  let ctaEnabled = true
  let ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
  let showMyTicketsLink = false

  if (backendBtn) {
    ctaLabel = backendBtn.thong_diep_nut
    ctaEnabled = backendBtn.cho_phep_bam

    if (
      backendBtn.trang_thai_nut === "CO_OFFER_WAITLIST" &&
      backendBtn.cho_phep_bam &&
      offerSecondsLeft !== null
    ) {
      if (offerSecondsLeft > 0) {
        ctaLabel = `Bạn có 1 slot đang chờ nhận - Còn ${formatCountdown(offerSecondsLeft)}`
        ctaEnabled = true
      } else {
        ctaLabel = "Suất chờ đã hết hạn, vui lòng tải lại trạng thái"
        ctaEnabled = false
      }
    }

    switch (backendBtn.trang_thai_nut) {
      case "CHUA_DANG_NHAP":
        ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        break
      case "DANG_KY":
        ctaClass = ctaEnabled
          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          : "bg-slate-200 text-slate-500 cursor-not-allowed"
        break
      case "DA_CO_VE":
        if (ctaEnabled) {
          ctaClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        } else {
          ctaClass = "bg-slate-200 text-slate-600 cursor-not-allowed"
          showMyTicketsLink = true
        }
        break
      case "DANG_O_WAITLIST":
        ctaClass = "bg-amber-100 text-amber-800 cursor-not-allowed"
        break
      case "CO_OFFER_WAITLIST":
        ctaClass = ctaEnabled
          ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
          : "bg-slate-200 text-slate-500 cursor-not-allowed"
        break
      case "VAO_WAITLIST":
        ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        break
      case "HET_VE_DONG_WAITLIST_T2H":
      case "DONG_DANG_KY_T2H":
      case "SU_KIEN_DANG_DIEN_RA_DONG_DK":
      case "SU_KIEN_DA_KET_THUC":
        ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
        break
      case "VAO_DIEM_DANH":
        ctaClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        break
      case "LAM_FEEDBACK_NHAN_CERT":
        ctaClass = ctaEnabled
          ? "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
          : "bg-slate-200 text-slate-500 cursor-not-allowed"
        break
      case "SU_KIEN_DA_HUY":
        ctaClass = "bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-200"
        break
      default:
        ctaClass = ctaEnabled
          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          : "bg-slate-200 text-slate-500 cursor-not-allowed"
    }
  } else {
    // Local fallback computation when offline
    if (event.trang_thai === "CANCELLED") {
      ctaLabel = "Sự kiện đã bị hủy"
      ctaEnabled = false
      ctaClass =
        "bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-200"
    } else if (status === "ended") {
      ctaLabel = "Sự kiện đã kết thúc"
      ctaEnabled = false
      ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
    } else if (isHappening && !event.khong_gioi_han_slot && !activeTicket) {
      ctaLabel = "Sự kiện đang diễn ra (Đã đóng đăng ký)"
      ctaEnabled = false
      ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
    } else if (!isGuest && activeTicket) {
      if (isHappening) {
        ctaLabel = "Vào điểm danh / Xem vé"
        ctaEnabled = true
        ctaClass = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
      } else {
        ctaLabel = "Bạn đã đăng ký vé"
        ctaEnabled = false
        ctaClass = "bg-slate-200 text-slate-600 cursor-not-allowed"
        showMyTicketsLink = true
      }
    } else if (status === "closed") {
      ctaLabel = "Đã đóng đăng ký"
      ctaEnabled = false
      ctaClass = "bg-slate-200 text-slate-500 cursor-not-allowed"
    } else if (status === "full") {
      if (waitlistEntry) {
        ctaLabel =
          waitlistEntry.trang_thai === "OFFERED"
            ? "Bạn có 1 slot đang chờ nhận"
            : `Bạn đang ở vị trí số ${waitlistEntry.so_thu_tu} trong danh sách chờ`
        ctaEnabled = waitlistEntry.trang_thai === "OFFERED"
        ctaClass =
          waitlistEntry.trang_thai === "OFFERED"
            ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
            : "bg-amber-100 text-amber-800 cursor-not-allowed"
      } else {
        ctaLabel = isGuest ? "Đăng nhập để đặt vé" : "Tham gia danh sách chờ"
        ctaClass = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
      }
    }
  }

  function buildLocalPrecheckFallback(targetEvent: LiveEvent): BookingPrecheckData {
    const newStart = new Date(targetEvent.thoi_gian_bat_dau).getTime()
    const newEnd = new Date(targetEvent.thoi_gian_ket_thuc).getTime()

    const overlaps = tickets
      .filter((t) => {
        if (
          t.studentId !== user.studentId ||
          t.status === "cancelled" ||
          t.trang_thai === "DaHuy" ||
          String(t.ma_su_kien) === String(targetEvent.ma_su_kien)
        ) {
          return false
        }
        const exStart = t.thoi_gian_bat_dau
          ? new Date(t.thoi_gian_bat_dau).getTime()
          : NaN
        const exEnd = t.thoi_gian_ket_thuc
          ? new Date(t.thoi_gian_ket_thuc).getTime()
          : NaN
        if (!Number.isFinite(newStart) || !Number.isFinite(newEnd) || !Number.isFinite(exStart) || !Number.isFinite(exEnd)) {
          return false
        }
        return newStart < exEnd && newEnd > exStart
      })
      .map((t) => {
        const matchedEvent = getEvent(String(t.ma_su_kien))
        return {
          ma_su_kien: t.ma_su_kien || Number(t.eventId) || 0,
          ten_su_kien: t.ten_su_kien || t.eventTitle,
          thoi_gian_bat_dau: t.thoi_gian_bat_dau || "",
          thoi_gian_ket_thuc: t.thoi_gian_ket_thuc || "",
          khong_gioi_han_slot: Boolean(matchedEvent?.khong_gioi_han_slot),
          ten_phong: t.ten_phong,
        }
      })

    const hasHardConflict =
      !targetEvent.khong_gioi_han_slot &&
      overlaps.some((o) => !o.khong_gioi_han_slot)

    return {
      co_the_dat: !hasHardConflict,
      khong_gioi_han_slot: Boolean(targetEvent.khong_gioi_han_slot),
      ly_do_chan: hasHardConflict ? "SCHEDULE_CONFLICT_HARD" : null,
      canh_bao_trung_lich_mem:
        !hasHardConflict && overlaps.length > 0
          ? "Lưu ý: Sự kiện này trùng khung giờ với sự kiện bạn đã đăng ký. Bạn vẫn có thể đăng ký nhưng vui lòng tự cân nhắc sắp xếp thời gian."
          : null,
      su_kien_trung: overlaps,
    }
  }

  async function handleCTA() {
    if (!ctaEnabled || registering || prechecking || !event) return

    if (
      (backendBtn && backendBtn.trang_thai_nut === "CHUA_DANG_NHAP") ||
      (!backendBtn && isGuest)
    ) {
      if (onRequireLogin) onRequireLogin()
      return
    }
    if (
      backendBtn &&
      ["DA_CO_VE", "VAO_DIEM_DANH", "LAM_FEEDBACK_NHAN_CERT"].includes(
        backendBtn.trang_thai_nut,
      )
    ) {
      onViewTicket()
      return
    }
    if (!backendBtn && activeTicket) {
      onViewTicket()
      return
    }
    if (
      (backendBtn && backendBtn.trang_thai_nut === "CO_OFFER_WAITLIST") ||
      waitlistEntry?.trang_thai === "OFFERED"
    ) {
      onViewTicket()
      return
    }
    if (
      (backendBtn && backendBtn.trang_thai_nut === "VAO_WAITLIST") ||
      (!backendBtn && status === "full" && !waitlistEntry)
    ) {
      setShowWaitlistRules(true)
      return
    }

    // UC-BOOK-01 Bước 2: Gọi API precheck kiểm tra điều kiện & trùng lịch trước khi mở Modal xác nhận
    setPrechecking(true)
    let check: BookingPrecheckData
    try {
      const res = await bookingsService.precheck(event.ma_su_kien)
      const data = res?.data
      if (data && (typeof data.co_the_dat === "boolean" || typeof data.du_dieu_kien === "boolean")) {
        check = data
      } else {
        check = buildLocalPrecheckFallback(event)
      }
    } catch {
      check = buildLocalPrecheckFallback(event)
    } finally {
      setPrechecking(false)
    }

    if (check.ly_do_chan === "SLOT_SOLD_OUT") {
      showToast(
        "Sự kiện vừa hết vé! Hệ thống đã cập nhật sang danh sách chờ.",
        "warning",
      )
      reloadDetail()
      return
    }
    if (check.ly_do_chan === "REGISTRATION_CLOSED") {
      showToast("Đã đóng đăng ký cho sự kiện này.", "warning")
      reloadDetail()
      return
    }
    if (check.ly_do_chan === "ALREADY_REGISTERED") {
      showToast("Bạn đã đăng ký vé sự kiện này trước đó.", "info")
      reloadDetail()
      return
    }

    setPrecheckData(check)
    setShowBookingModal(true)
  }

  async function confirmBookTicket() {
    if (!event || registering) return
    setRegistering(true)
    const result = await registerEvent(event, user)
    setRegistering(false)
    setShowBookingModal(false)

    if (result.success && result.ticket) {
      reloadDetail()
      onRegister(result.ticket)
    } else {
      showToast(result.error ?? "Đăng ký thất bại", "error")
      // Đồng bộ lại ngay Smart Action Button trên màn hình (vd EX.2 hết vé -> Tham gia danh sách chờ)
      reloadDetail()
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
                style={{
                  background: getTopicColor(
                    event.ten_chuyen_de || String(event.topic),
                  ),
                }}
              >
                {event.ten_chuyen_de ||
                  TOPIC_LABELS[event.topic] ||
                  String(event.topic || "Chuyên đề")}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {event.organizer}
              </span>
              {event.khong_gioi_han_slot && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Mở tự do
                </span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass}`}
              >
                {statusBadgeLabel}
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

          {/* Already registered banner (hidden when event ended & ineligible) */}
          {activeTicket &&
            status !== "ended" &&
            backendBtn?.trang_thai_nut !== "SU_KIEN_DA_KET_THUC" && (
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
                      {activeTicket.trang_thai === "DaCheckOut" ||
                      activeTicket.status === "DaCheckOut"
                        ? "Đã check-out"
                        : activeTicket.trang_thai === "DaCheckIn" ||
                            activeTicket.status === "DaCheckIn"
                          ? "Đã check-in"
                          : "Chưa check-in"}
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
                      {event.danh_sach_ten_dong_to_chuc &&
                        event.danh_sach_ten_dong_to_chuc.length > 0 && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Đồng tổ chức:{" "}
                            {event.danh_sach_ten_dong_to_chuc.join(", ")}
                          </p>
                        )}
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

                    {event.dieu_khoan_drl === "KhongCo" ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500">
                          Chỉ tiêu rèn luyện (DRL)
                        </p>
                        <p className="text-sm font-bold text-slate-800 mt-1">
                          Không cộng điểm rèn luyện
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {event.gio_tinh_nguyen > 0
                            ? `Cộng ${event.gio_tinh_nguyen} giờ tình nguyện xã hội`
                            : "Hoạt động giao lưu / ngoại khóa"}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-700">
                          Chỉ tiêu rèn luyện (DRL)
                        </p>
                        <p className="text-sm font-bold text-indigo-900 mt-1">
                          {event.dieu_khoan_drl === "Dieu4"
                            ? "Cộng Điều 4"
                            : "Cộng Điều 3"}
                          : +{event.diem_drl_du_kien ?? 0} điểm
                        </p>
                        <p className="text-xs text-indigo-600 mt-0.5">
                          {event.gio_tinh_nguyen > 0
                            ? `Cộng thêm ${event.gio_tinh_nguyen} giờ tình nguyện`
                            : "Cấp chứng nhận số sau khi đối soát đạt 70%"}
                        </p>
                      </div>
                    )}
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

                  {event.dieu_khoan_drl === "KhongCo" ? (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">
                        Thông tin điểm rèn luyện:
                      </p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Sự kiện này không áp dụng xét công nhận điểm rèn luyện.
                      </p>
                    </div>
                  ) : (
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
                  )}
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
                className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadgeClass}`}
              >
                {statusBadgeLabel}
              </span>
              {event.khong_gioi_han_slot ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Mở tự do
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {event.registered}/{event.capacity} chỗ
                </span>
              )}
            </div>

            {/* Capacity meter */}
            {!event.khong_gioi_han_slot && (
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
            )}

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
                    {event.dieu_khoan_drl === "KhongCo"
                      ? "Không cộng điểm rèn luyện"
                      : `+${event.diem_drl_du_kien ?? 0} Điểm rèn luyện (${event.dieu_khoan_drl === "Dieu4" ? "Điều 4" : "Điều 3"})`}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {event.gio_tinh_nguyen > 0
                      ? `Cộng ${event.gio_tinh_nguyen} giờ tình nguyện xã hội`
                      : event.dieu_khoan_drl === "KhongCo"
                        ? "Hoạt động giao lưu / ngoại khóa"
                        : "Kèm Chứng nhận số sau sự kiện"}
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

            {/* Waitlist Info Panel for Full PUBLISHED Events (UC-BOOK-02) */}
            {event.trang_thai === "PUBLISHED" &&
              (status === "full" ||
                (backendBtn &&
                  [
                    "VAO_WAITLIST",
                    "DANG_O_WAITLIST",
                    "CO_OFFER_WAITLIST",
                  ].includes(backendBtn.trang_thai_nut))) && (() => {
                const isOffered =
                  backendBtn?.trang_thai_nut === "CO_OFFER_WAITLIST" ||
                  waitlistEntry?.trang_thai === "OFFERED"
                const isWaiting =
                  backendBtn?.trang_thai_nut === "DANG_O_WAITLIST" ||
                  waitlistEntry?.trang_thai === "WAITING"
                const effectiveOfferId =
                  waitlistEntry?.id ?? backendBtn?.ma_hang_doi ?? null
                const waitlistPosition =
                  backendBtn?.so_thu_tu_waitlist ?? waitlistEntry?.so_thu_tu
                const offerDeadline =
                  backendBtn?.han_chot_offer ?? waitlistEntry?.han_chot_xac_nhan

                return (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Hàng đợi danh sách chờ (FIFO)</span>
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      Vé chính thức đã phát hết. Khi có sinh viên hủy vé trước{" "}
                      <b>T-4h</b>, hệ thống tự động gửi Offer cho sinh viên xếp
                      đầu hàng đợi với Claim Window tối thiểu 15 phút.
                    </p>

                    {isOffered ? (
                      <div className="mt-2 pt-2.5 border-t border-amber-200/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
                          <p className="font-bold text-amber-950">
                            Suất nhận vé ưu tiên đã sẵn sàng!
                            {offerSecondsLeft !== null &&
                              ` (Còn ${formatCountdown(offerSecondsLeft)})`}
                          </p>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Hạn chót xác nhận:{" "}
                          <b>
                            {offerDeadline
                              ? new Date(offerDeadline).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Trong vòng 60 phút"}
                          </b>
                          . Sau thời gian này vé sẽ chuyển cho người kế tiếp.
                        </p>
                        {effectiveOfferId && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={async () => {
                                const result =
                                  await claimWaitlistOffer(effectiveOfferId)
                                showToast(
                                  result.success
                                    ? "Đã nhận vé thành công từ hàng chờ!"
                                    : result.error || "Không thể nhận vé.",
                                  result.success ? "success" : "error",
                                )
                                if (result.success) {
                                  reloadDetail()
                                  onViewTicket()
                                }
                              }}
                              disabled={offerSecondsLeft === 0}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                              Xác nhận nhận vé
                            </button>
                            <button
                              onClick={async () => {
                                const result =
                                  await declineWaitlistOffer(effectiveOfferId)
                                showToast(
                                  result.success
                                    ? "Đã từ chối suất giữ chỗ."
                                    : result.error || "Không thể từ chối.",
                                  result.success ? "info" : "error",
                                )
                                if (result.success) reloadDetail()
                              }}
                              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    ) : isWaiting ? (
                      <div className="mt-2 pt-2.5 border-t border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between text-amber-950">
                          <span>
                            Vị trí của bạn: <b>#{waitlistPosition}</b>
                          </span>
                          <span className="text-[11px] text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full font-semibold">
                            Đang chờ slot trống
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-700">
                          Hệ thống sẽ gửi email và thông báo đẩy khi có người
                          hủy vé. Hàng đợi tự động đóng tại mốc T-2h.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 font-medium">
                        Hàng đợi tự động đóng trước giờ G 2 tiếng (T-2h). Nhấn
                        nút bên dưới để lấy số thứ tự FIFO.
                      </p>
                    )}
                  </div>
                )
              })()}

            {/* Big CTA Action Button */}
            <button
              onClick={handleCTA}
              disabled={!ctaEnabled || registering || prechecking}
              className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${
                !ctaEnabled || registering || prechecking
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              } ${ctaClass}`}
            >
              {prechecking
                ? "Đang kiểm tra điều kiện..."
                : registering
                  ? "Đang xử lý đăng ký..."
                  : ctaLabel}
            </button>

            {/* SRS UC-DISC-02: Link "Vé của tôi" đi kèm nút Disabled "Bạn đã đăng ký vé" */}
            {showMyTicketsLink && (
              <button
                type="button"
                onClick={onViewTicket}
                className="w-full mt-2 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Vé của tôi →</span>
              </button>
            )}

            {/* Share Event Button (Guest & Student - SRS UC-DISC-02.AC.1 OpenGraph SSR URL) */}
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/events/${event.ma_su_kien}/share`
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(url)
                  showToast(
                    "Đã sao chép liên kết chia sẻ OpenGraph vào bộ nhớ tạm!",
                    "success",
                  )
                } else {
                  showToast(`Liên kết chia sẻ: ${url}`, "info")
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
                  if (result.success) reloadDetail()
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

      {/* UC-BOOK-01 Bước 2–3: Modal Xem lại thông tin & Xác nhận đặt vé */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !registering && setShowBookingModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 mb-1.5">
                  Xác nhận đăng ký tham dự
                </span>
                <h2 className="font-display font-bold text-lg text-slate-900 leading-snug">
                  {event.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !registering && setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer shrink-0"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs mb-4">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {dateFormatted} · {event.time} - {event.endTime}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Địa điểm:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {event.room} ({event.location})
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Loại vé:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {event.khong_gioi_han_slot
                    ? "Sự kiện mở tự do (Không giới hạn slot)"
                    : "Sự kiện giới hạn slot (Vé điện tử HMAC-SHA256)"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Sinh viên:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {user.name} ({user.studentId})
                </span>
              </div>
            </div>

            {/* Hard Block khi trùng 2 sự kiện giới hạn slot (UC-BOOK-01.EX.1) */}
            {precheckData?.ly_do_chan === "SCHEDULE_CONFLICT_HARD" && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Không thể đăng ký do trùng lịch giới hạn slot!</span>
                </div>
                <p className="leading-relaxed">
                  Bạn đang giữ vé của sự kiện giới hạn slot{" "}
                  <b>
                    '{precheckData.su_kien_trung?.[0]?.ten_su_kien || "khác"}'
                  </b>{" "}
                  diễn ra trùng khung giờ. Để tránh chiếm chỗ ảo, vui lòng hủy vé
                  sự kiện cũ (trước mốc T-4h) nếu muốn tham gia sự kiện này.
                </p>
              </div>
            )}

            {/* Soft Warning màu vàng khi 1 trong 2 sự kiện là mở tự do (UC-BOOK-01 Bước 2) */}
            {precheckData?.ly_do_chan !== "SCHEDULE_CONFLICT_HARD" &&
              precheckData?.canh_bao_trung_lich_mem && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Cảnh báo trùng khung giờ (Cảnh báo mềm)</span>
                  </div>
                  <p className="leading-relaxed">
                    {precheckData.canh_bao_trung_lich_mem}
                  </p>
                  {precheckData.su_kien_trung &&
                    precheckData.su_kien_trung.length > 0 && (
                      <ul className="list-disc pl-4 pt-1 text-[11px] text-amber-800 space-y-0.5">
                        {precheckData.su_kien_trung.map((ev) => (
                          <li key={ev.ma_su_kien}>
                            <b>{ev.ten_su_kien}</b> (
                            {new Date(ev.thoi_gian_bat_dau).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            –{" "}
                            {new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                            )
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
              )}

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                disabled={registering}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {precheckData?.ly_do_chan === "SCHEDULE_CONFLICT_HARD"
                  ? "Đóng"
                  : "Hủy bỏ"}
              </button>
              {precheckData?.ly_do_chan === "SCHEDULE_CONFLICT_HARD" ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false)
                    onViewTicket()
                  }}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Mở Vé của tôi
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmBookTicket}
                  disabled={registering}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {registering ? "Đang giữ vé..." : "Xác nhận đặt vé"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
