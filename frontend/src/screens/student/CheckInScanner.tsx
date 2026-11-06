import { useState, useEffect, useRef } from "react"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import { isApiMode } from "../../api/config"
import { attendanceService } from "../../api/services/attendance.service"
import { ticketsService } from "../../api/services/tickets.service"
import { getApiErrorMessage } from "../../api/errors"
import type { Ticket } from "../../data/contract"
import { kioskQrPattern, useKioskCamera } from "../../hooks/useKioskCamera"

type ScanMode = "checkin" | "checkout"

interface Props {
  onNavigate: (screen: string) => void
}

interface ScanResult {
  mode: ScanMode
  eventTitle: string
  time: string
  message: string
  score?: {
    durationMinutes: number
    attendancePercentage: number
    drlRate: number
  }
}

const attendanceTime = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

function modeForTicket(status?: Ticket["trang_thai"]): ScanMode {
  return status === "DaCheckIn" || status === "DaCheckOut" ? "checkout" : "checkin"
}

function getDeviceId() {
  const stored = localStorage.getItem("ceh_device_id")
  if (stored && /^[!-~]{8,100}$/.test(stored)) return stored

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const id = "DEV-" + Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")
  localStorage.setItem("ceh_device_id", id)
  return id
}

export default function CheckInScanner({ onNavigate }: Props) {
  const { user } = useUser()
  const { tickets, checkIn, checkOut } = useApp()
  const apiMode = isApiMode()
  const [deviceId] = useState(getDeviceId)
  const [wallet, setWallet] = useState<Ticket[]>([])
  const [walletLoading, setWalletLoading] = useState(apiMode)
  const [walletError, setWalletError] = useState("")
  const [selection, setSelection] = useState("")
  const [modeOverride, setModeOverride] = useState<ScanMode | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState("")
  const inFlightRef = useRef(false)
  const { cameraState, videoRef, startCamera, stopCamera } = useKioskCamera(
    (code) => { void processCode(code) },
  )

  useEffect(() => {
    if (!apiMode) return
    let active = true
    setWalletLoading(true)
    setWalletError("")
    ticketsService
      .mine({ tab: "upcoming", limit: 100 })
      .then(({ data }) => {
        if (active) setWallet(data)
      })
      .catch((error: unknown) => {
        if (active) setWalletError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (active) setWalletLoading(false)
      })
    return () => {
      active = false
    }
  }, [apiMode, user.studentId])

  const studentTickets = tickets.filter(
    (ticket) =>
      ticket.studentId === user.studentId &&
      ticket.trang_thai !== "DaHuy" &&
      ticket.status !== "cancelled",
  )
  const eventOptions = apiMode
    ? wallet
        .filter((ticket) => ticket.trang_thai !== "DaHuy")
        .map((ticket) => ({
          id: String(ticket.ma_su_kien),
          title: ticket.ten_su_kien,
          status: ticket.trang_thai,
          room: ticket.ten_phong,
          location: ticket.co_so,
        }))
    : studentTickets.map((ticket) => ({
        id: ticket.eventId,
        title: ticket.eventTitle,
        status: ticket.checkoutTime
          ? "DaCheckOut"
          : ticket.checkinTime
            ? "DaCheckIn"
            : ticket.trang_thai,
        room: ticket.ten_phong,
        location: ticket.co_so,
      }))

  const selectedEventId = selection || eventOptions[0]?.id || ""
  const selectedEvent = eventOptions.find((event) => event.id === selectedEventId)
  const scanMode = modeOverride ?? modeForTicket(selectedEvent?.status)

  function enableCamera() {
    setError("")
    void startCamera()
  }

  async function processCode(rawCode: string) {
    if (inFlightRef.current || walletLoading) return

    const input = rawCode.trim()
    const qr = kioskQrPattern.exec(input)
    const eventId = qr?.[1] ?? selectedEventId
    const code = qr?.[2] ?? input
    if (!/^[0-9]{6}$/.test(code) || !eventId) {
      setError("Vui lòng chọn sự kiện và nhập mã Kiosk gồm 6 chữ số hoặc quét mã QR Kiosk.")
      return
    }

    inFlightRef.current = true
    setLoading(true)
    setError("")
    setResult(null)
    stopCamera()

    const event = eventOptions.find((item) => item.id === eventId)
    const mode = modeOverride ?? modeForTicket(event?.status)
    const eventTitle = event?.title || `Sự kiện #${eventId}`

    try {
      if (apiMode) {
        const payload = { ma_su_kien: Number(eventId), totp_code: code }
        if (mode === "checkin") {
          const { data, message } = await attendanceService.selfCheckin(payload, deviceId)
          setWallet((current) => current.map((ticket) =>
            ticket.ma_dang_ky === data.ma_dang_ky ? { ...ticket, ...data } : ticket,
          ))
          setResult({
            mode,
            eventTitle,
            time: attendanceTime.format(new Date(data.thoi_gian_check_in)),
            message: message || "Điểm danh Check-in thành công.",
          })
        } else {
          const { data, message } = await attendanceService.selfCheckout(payload, deviceId)
          setWallet((current) => current.map((ticket) =>
            ticket.ma_dang_ky === data.ma_dang_ky ? { ...ticket, ...data } : ticket,
          ))
          setResult({
            mode,
            eventTitle,
            time: attendanceTime.format(new Date(data.thoi_gian_check_out)),
            message: message || "Điểm danh Check-out thành công.",
            score: {
              durationMinutes: data.thoi_luong_tham_du_phut,
              attendancePercentage: data.ty_le_tham_du_pct,
              drlRate: data.ti_le_drl,
            },
          })
        }
      } else {
        const ticket = studentTickets.find(
          (item) => item.eventId === eventId || String(item.ma_su_kien) === eventId,
        )
        if (!ticket) throw new Error("Không tìm thấy vé tham dự sự kiện.")
        const scan = mode === "checkin" ? checkIn : checkOut
        const outcome = scan(ticket.qrCode, ticket.eventId)
        if (!outcome.success) throw new Error(outcome.message)
        setResult({
          mode,
          eventTitle: ticket.eventTitle,
          time: outcome.time || attendanceTime.format(new Date()),
          message: outcome.message,
        })
      }

      if (event) setSelection(event.id)
      setModeOverride(null)
      setManualCode("")
    } catch (error) {
      setError(getApiErrorMessage(error))
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Web Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate("tickets")}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Vé của tôi
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">
          Tự quét mã Kiosk điểm danh
        </span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>
                Dành cho Sinh viên: Tự điểm danh bằng Dynamic TOTP QR
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Tự quét mã Kiosk Hội trường
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sinh viên tự hướng camera điện thoại về màn chiếu hội trường để
              quét mã QR xoay vòng 30 giây tự động Check-in & Check-out. (Nếu
              tại cửa có CTV điểm danh, bạn có thể vào mục <b>"Vé của tôi"</b>{" "}
              để giơ mã QR vé cho CTV quét).
            </p>
          </div>

          {/* Event Selector */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 min-w-[280px]">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Sự kiện bạn đang tham dự:
            </label>
            {walletLoading ? (
              <p className="text-xs text-slate-500">Đang tải vé tham dự…</p>
            ) : walletError ? (
              <p className="text-xs text-rose-600" role="alert">{walletError}</p>
            ) : eventOptions.length === 0 ? (
              <p className="text-xs font-semibold text-amber-700">
                Bạn chưa có vé tham dự sự kiện nào đang diễn ra hôm nay.
              </p>
            ) : (
              <select
                value={selectedEventId}
                disabled={loading}
                onChange={(e) => {
                  setSelection(e.target.value)
                  setModeOverride(null)
                  setResult(null)
                  setError("")
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-none cursor-pointer"
              >
                {eventOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (
                    {t.status === "DaCheckIn"
                      ? "Đã Check-in"
                      : t.status === "DaCheckOut"
                        ? "Đã Check-out"
                        : "Chưa Check-in"}
                    )
                  </option>
                ))}
              </select>
            )}
            {selectedEvent && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                📍 {selectedEvent.room} · {selectedEvent.location}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Camera Scanner + Manual TOTP */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Switcher: Check-in vs Check-out */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex gap-2">
            <button
              disabled={loading}
              onClick={() => {
                setModeOverride("checkin")
                setResult(null)
                setError("")
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                scanMode === "checkin"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>➡️ Quét vào (Check-in)</span>
            </button>
            <button
              disabled={loading}
              onClick={() => {
                setModeOverride("checkout")
                setResult(null)
                setError("")
              }}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                scanMode === "checkout"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>⬅️ Quét ra (Check-out)</span>
            </button>
          </div>

          {/* Camera Viewfinder Card */}
          <div className="bg-slate-900 rounded-3xl overflow-hidden p-6 text-white shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">
                  Ống kính quét Kiosk · Chế độ{" "}
                  {scanMode === "checkin" ? "Check-in" : "Check-out"}
                </span>
              </div>

              {cameraState === "active" && (
                <button
                  onClick={stopCamera}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Tắt camera
                </button>
              )}
            </div>

            {/* Viewfinder frame */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {cameraState === "idle" && (
                <div className="text-center p-6 space-y-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm text-slate-200">
                    Sẵn sàng quét mã Kiosk
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Bật camera và hướng về màn chiếu hội trường đang hiển thị mã
                    QR động.
                  </p>
                  <button
                    onClick={enableCamera}
                    disabled={loading || walletLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Bật Camera quét mã
                  </button>
                </div>
              )}

              {cameraState === "requesting" && (
                <div className="text-center p-6 space-y-2 z-10 text-slate-300 text-xs">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang xin quyền truy cập máy ảnh...
                </div>
              )}

              {cameraState === "denied" && (
                <div className="text-center p-6 space-y-2 z-10 text-rose-400 text-xs">
                  <p className="font-bold">Không thể truy cập máy ảnh</p>
                  <p className="text-slate-400">
                    Vui lòng cấp quyền camera trong cài đặt trình duyệt, hoặc
                    nhập mã TOTP 6 số thủ công bên dưới.
                  </p>
                </div>
              )}

              {cameraState === "unavailable" && (
                <div className="text-center p-6 space-y-2 z-10 text-slate-300 text-xs">
                  <p>Không tìm thấy camera. Bạn có thể nhập mã Kiosk thủ công.</p>
                  <button onClick={enableCamera} disabled={loading} className="underline">
                    Thử lại camera
                  </button>
                </div>
              )}

              {cameraState === "active" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-indigo-500 rounded-3xl shadow-2xl" />
                </div>
              )}
            </div>

            {!apiMode && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Demo mô phỏng nhanh:</span>
                <button
                  onClick={() => processCode("482913")}
                  disabled={loading || cameraState === "requesting"}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 font-semibold cursor-pointer transition-colors"
                >
                  Quét mã Kiosk mẫu ({scanMode.toUpperCase()})
                </button>
              </div>
            )}
          </div>

          {/* Manual TOTP 6-digit Fallback Input */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-display font-bold text-sm text-slate-900 mb-1">
              Nhập mã số Kiosk thủ công (Fallback)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nếu điện thoại không quét được QR trên màn chiếu, hãy nhập chuỗi 6
              chữ số hiển thị dưới mã QR Kiosk.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={manualCode}
                onChange={(e) =>
                  setManualCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="VD: 482913"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-base tracking-widest text-slate-900 outline-none focus:border-indigo-600"
              />
              <button
                onClick={() => processCode(manualCode)}
                disabled={loading || walletLoading || cameraState === "requesting" || manualCode.length < 6}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Đang xác thực..." : "Xác nhận"}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                ⚠️ {error}
              </p>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Result Card & Anti-fraud Device Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Card */}
          {result ? (
            <div
              className="rounded-3xl p-6 border shadow-xs animate-in fade-in duration-200 bg-emerald-50/70 border-emerald-200 text-emerald-950"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl bg-emerald-600 text-white"
                >
                  ✓
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">
                    {result.mode === "checkin"
                      ? "Check-in thành công"
                      : "Check-out thành công"}
                  </h3>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Ghi nhận lúc: {result.time}
                  </p>
                </div>
              </div>

              <p className="text-xs font-semibold mb-2">{result.eventTitle}</p>
              <p className="text-xs leading-relaxed mb-4 text-slate-700">
                {result.message}
              </p>

              {result.score && (
                <dl className="p-3 bg-white/80 rounded-2xl border border-emerald-200 mb-4 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <dt>Thời lượng tham dự</dt>
                    <dd>{result.score.durationMinutes} phút</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>Tỷ lệ tham dự</dt>
                    <dd>{result.score.attendancePercentage.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>Mức hưởng Điểm rèn luyện</dt>
                    <dd>{result.score.drlRate * 100}%</dd>
                  </div>
                </dl>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate("tickets")}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Xem vé trong ví
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-white cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Anti-Fraud Notice & Device Info */
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-display font-bold text-sm text-slate-900">
                Khung chống gian lận & Ràng buộc thiết bị (Device Binding)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Để đảm bảo tính trung thực trong việc tính Điểm rèn luyện (ĐRL),
                hệ thống áp dụng cơ chế <strong>Device Binding</strong>:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Mã thiết bị của bạn:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {deviceId}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Tài khoản sinh viên:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {user.studentId}
                  </span>
                </div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  Mỗi thiết bị chỉ được điểm danh cho đúng 01 tài khoản sinh
                  viên trong suốt sự kiện.
                </li>
                <li>
                  Mã QR Kiosk xoay vòng mỗi 30 giây để chống hành vi chụp ảnh
                  gửi ra ngoài.
                </li>
                <li>
                  Cổng Check-out chỉ mở trước giờ kết thúc sự kiện 25 phút.
                </li>
              </ul>
            </div>
          )}

          {/* Guide for Student */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-5 text-xs text-indigo-900 space-y-2">
            <p className="font-bold">Lưu ý khi tham gia:</p>
            <p className="text-indigo-800 leading-relaxed">
              Bạn cần thực hiện đủ cả 2 lượt:{" "}
              <strong>Check-in khi bắt đầu</strong> và{" "}
              <strong>Check-out khi kết thúc</strong> để hệ thống tính thời
              lượng và mức hưởng Điểm rèn luyện.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
