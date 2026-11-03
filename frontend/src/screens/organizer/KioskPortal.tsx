import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { getApiErrorMessage } from "../../api/errors"
import { useNavigate, useParams } from "react-router"
import { attendanceService } from "../../api/services/attendance.service"
import { isApiMode } from "../../api/config"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"

export default function KioskPortal() {
  const { role } = useUser()
  const { eventId = "" } = useParams()
  const navigate = useNavigate()
  const { getEvent } = useApp()
  const event = getEvent(eventId) || getEvent(`EVT${eventId}`)
  const [seconds, setSeconds] = useState(30)
  const [totp, setTotp] = useState("482913")
  const [kioskToken, setKioskToken] = useState("")
  const [loading, setLoading] = useState(isApiMode())
  const [error, setError] = useState("")
  const [gate, setGate] = useState<"closed" | "checkin" | "checkout">("closed")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmKeyword, setConfirmKeyword] = useState("")
  const [simulatedTimeMode, setSimulatedTimeMode] =
    useState<"real" | "locked" | "early" | "ended">("real")
  const [fallbackTriggered, setFallbackTriggered] = useState(false)

  // Calculate event timeline
  const now = new Date()
  const rawStartDate = event?.thoi_gian_bat_dau
    ? new Date(event.thoi_gian_bat_dau)
    : event?.date
      ? new Date(
          `${event.date}T${event.time?.split(" ")[0] || "08:30"}:00+07:00`,
        )
      : new Date(now.getTime() - 60 * 60 * 1000)

  const rawEndDate = event?.thoi_gian_ket_thuc
    ? new Date(event.thoi_gian_ket_thuc)
    : event?.date
      ? new Date(
          `${event.date}T${event.endTime?.split(" ")[0] || "11:30"}:00+07:00`,
        )
      : new Date(now.getTime() + 90 * 60 * 1000)

  // Simulated effective time based on testing toggle
  let effectiveNow = now.getTime()
  if (simulatedTimeMode === "locked") {
    // 60 minutes before end
    effectiveNow = rawEndDate.getTime() - 60 * 60 * 1000
  } else if (simulatedTimeMode === "early") {
    // 15 minutes before end (within the 25m early window)
    effectiveNow = rawEndDate.getTime() - 15 * 60 * 1000
  } else if (simulatedTimeMode === "ended") {
    // Past end time
    effectiveNow = rawEndDate.getTime() + 5 * 60 * 1000
  }

  const tEnd = rawEndDate.getTime()
  const tEndMinus25m = tEnd - 25 * 60 * 1000
  const tStartMinus30m = rawStartDate.getTime() - 30 * 60 * 1000
  const tKioskExpiry = tEnd + 15 * 60 * 1000

  const canOpenCheckin = effectiveNow >= tStartMinus30m
  const isCheckoutLocked = effectiveNow < tEndMinus25m
  const isEarlyCheckout = effectiveNow >= tEndMinus25m && effectiveNow < tEnd
  const isPastEndTime = effectiveNow >= tEnd

  // UC-OPS-01.AC.1: Auto Fallback Check-out when touching T_end
  useEffect(() => {
    if (isPastEndTime && gate === "closed" && !fallbackTriggered) {
      setFallbackTriggered(true)
      setGate("checkout")
      if (isApiMode()) {
        attendanceService.openCheckout(eventId).catch(() => {})
      }
    }
  }, [isPastEndTime, gate, fallbackTriggered, eventId])

  useEffect(() => {
    let active = true
    let activeKioskToken = ""
    async function fetchKioskCode(token: string) {
      try {
        const response = await attendanceService.totpStream(token)
        if (!active) return
        const data = (response.data ?? {}) as {
          totp_code?: string
          totp?: string
          expires_in?: number
        }
        const code = data.totp_code || data.totp
        if (!code || !/^\d{6}$/.test(code))
          throw new Error("Backend chưa trả về TOTP hợp lệ.")
        setTotp(code)
        setSeconds(Math.max(1, data.expires_in || 30))
        setError("")
      } catch (e) {
        if (active) {
          setError(getApiErrorMessage(e))
          setTotp("")
        }
      }
    }
    if (isApiMode()) {
      setLoading(true)
      attendanceService
        .startKiosk(eventId)
        .then((response) => {
          if (!active) return
          const token = response.data.kiosk_token
          if (!token) throw new Error("Không nhận được Kiosk Token.")
          activeKioskToken = token
          setKioskToken(token)
          return fetchKioskCode(token)
        })
        .catch((e) => {
          if (active) {
            setError(getApiErrorMessage(e))
            setTotp("")
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    const timer = window.setInterval(() => {
      if (!active) return
      setSeconds((value) => {
        if (value <= 1) {
          if (isApiMode()) {
            if (activeKioskToken) void fetchKioskCode(activeKioskToken)
          } else {
            const bytes = new Uint32Array(1)
            crypto.getRandomValues(bytes)
            setTotp(String(100000 + (bytes[0] % 900000)))
          }
          return 30
        }
        return value - 1
      })
    }, 1000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [eventId])

  async function setGateMode(
    next: typeof gate,
    payload?: { confirm?: string },
  ) {
    try {
      if (isApiMode()) {
        if (next === "checkin") await attendanceService.openCheckin(eventId)
        if (next === "checkout")
          await attendanceService.openCheckout(eventId, payload)
        if (next === "closed") await attendanceService.closeGates(eventId)
      }
      setGate(next)
      setError("")
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  function handleCheckoutClick() {
    if (isCheckoutLocked) {
      return
    }
    if (isEarlyCheckout) {
      setShowConfirmModal(true)
      setConfirmKeyword("")
      return
    }
    void setGateMode("checkout")
  }

  function handleConfirmEarlyCheckout() {
    if (
      confirmKeyword.trim().toUpperCase() !== "CONFIRM" &&
      confirmKeyword.trim().toUpperCase() !== "XÁC NHẬN"
    ) {
      return
    }
    setShowConfirmModal(false)
    void setGateMode("checkout", { confirm: confirmKeyword.trim() })
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Kiosk Hội Trường (
              {role === "admin" || role === "student_affairs"
                ? "Quản trị viên (Admin)"
                : "Ban tổ chức"}
              )
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 font-mono">
              Phiên độc lập:{" "}
              {kioskToken
                ? `TOKEN_${kioskToken.slice(0, 8)}`
                : "KSK-SESSION-ACTIVE"}
            </span>
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl mt-1 text-white">
            {event?.title || `Sự kiện #${eventId}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Phòng:{" "}
            <strong className="text-slate-200">
              {event?.room || "Hội trường A"}
            </strong>{" "}
            · Bắt đầu:{" "}
            <strong className="text-slate-200">{event?.time || "08:30"}</strong>{" "}
            · Kết thúc:{" "}
            <strong className="text-slate-200">
              {event?.endTime || "11:30"}
            </strong>{" "}
            · Hết hạn phiên:{" "}
            <strong className="text-amber-400">
              {new Date(tKioskExpiry).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>{" "}
            (T_end + 15m)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <span>{isFullscreen ? "🗗" : "⛶"}</span>
            <span className="hidden sm:inline">
              {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            </span>
          </button>
          <button
            onClick={() => {
              if (role === "admin" || role === "student_affairs") {
                navigate("/admin/dashboard")
              } else {
                navigate("/organizer/events")
              }
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition-colors"
          >
            {role === "admin" || role === "student_affairs"
              ? "Thoát về Admin Portal"
              : "Thoát Kiosk"}
          </button>
        </div>
      </header>

      {/* Fallback & Contextual Banners */}
      {fallbackTriggered && (
        <div className="my-3 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3 text-emerald-200 text-xs sm:text-sm">
          <span className="text-xl">⚡</span>
          <div>
            <strong>Cơ chế Tự động Kích hoạt:</strong>{" "}
            Sự kiện đã chạm mốc giờ kết thúc kế hoạch (
            {event?.endTime || "11:30"}). Hệ thống đã tự động bật cổng Check-out
            để sinh viên quét mã ra về, chống rủi ro bị 0 Điểm Rèn Luyện.
          </div>
        </div>
      )}

      {/* Simulation Controls for testing time rules */}
      <div className="my-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-semibold text-slate-300">
            ⏱️ Giả lập trạng thái thời gian:
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            ["real", "Thời gian thực"],
            ["locked", "< T_end - 25m (Khóa Check-out)"],
            ["early", "T_end - 25m (Mở sớm: Cần CONFIRM)"],
            ["ended", ">= T_end (Mở bình thường / Fallback)"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => {
                setSimulatedTimeMode(mode as any)
                if (mode === "ended" && gate === "closed") {
                  setFallbackTriggered(true)
                  setGate("checkout")
                }
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                simulatedTimeMode === mode
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 grid lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto w-full py-6">
        {/* QR Code Presentation Box */}
        <div className="lg:col-span-2 text-center flex flex-col items-center">
          <div className="w-84 h-84 max-w-full rounded-3xl bg-white p-6 shadow-2xl flex flex-col items-center justify-center relative border-4 border-indigo-500/20">
            {totp && !error ? (
              <>
                <QRCodeSVG
                  value={`CEH1K.${event?.ma_su_kien || eventId}.${totp}`}
                  size={245}
                  level="M"
                  aria-label="QR Kiosk điểm danh"
                />
                {gate === "closed" && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-4">
                    <span className="text-3xl mb-2">🔒</span>
                    <p className="font-display font-bold text-lg text-white">
                      Cổng đang đóng
                    </p>
                    <p className="text-xs text-slate-300 text-center mt-1">
                      Vui lòng chọn mở cổng Check-in hoặc Check-out ở bảng điều
                      khiển bên phải.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-slate-600 text-sm font-medium" role="status">
                {loading
                  ? "Đang khởi tạo Kiosk độc lập..."
                  : "QR chưa khả dụng"}
              </div>
            )}
          </div>

          {/* Countdown & Progress bar */}
          <div className="w-84 max-w-full mt-4">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(seconds / 30) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 text-amber-300 text-sm font-semibold"
            >
              {error}
            </p>
          )}

          <p className="font-mono text-xl sm:text-2xl font-bold mt-3 text-cyan-300 tracking-wider">
            CEH1K.{event?.ma_su_kien || eventId}.{totp}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dynamic TOTP QR (RFC 6238) đổi sau{" "}
            <strong className="text-cyan-300 font-mono text-base">
              {seconds}s
            </strong>{" "}
            · Đồng bộ chuẩn NTP máy chủ
          </p>
        </div>

        {/* Gate Control Panel */}
        <aside className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Trạng thái cổng điểm danh
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <span
                className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                  gate === "closed"
                    ? "bg-slate-500"
                    : gate === "checkin"
                      ? "bg-indigo-500"
                      : "bg-cyan-400"
                }`}
              />
              <p className="font-display font-bold text-2xl text-white">
                {gate === "closed"
                  ? "Cổng đang đóng"
                  : gate === "checkin"
                    ? "Đang mở Check-in (Vào)"
                    : "Đang mở Check-out (Ra)"}
              </p>
            </div>
            {gate !== "closed" && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <span>✓</span> Sinh viên có thể quét mã trực tiếp trên màn hình
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {/* Check-in Gate Button */}
            <div>
              <button
                onClick={() => void setGateMode("checkin")}
                disabled={
                  !canOpenCheckin ||
                  loading ||
                  (isApiMode() && (!kioskToken || !!error))
                }
                className={`w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  gate === "checkin"
                    ? "bg-indigo-600 ring-2 ring-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                    : canOpenCheckin
                      ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                <span>🚪</span>
                <span>Mở cổng Check-in</span>
              </button>
              {!canOpenCheckin && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Chỉ khả dụng từ 30 phút trước giờ bắt đầu (
                  {new Date(tStartMinus30m).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  ).
                </p>
              )}
            </div>

            {/* Check-out Gate Button with 25-minute constraint */}
            <div>
              <button
                onClick={handleCheckoutClick}
                disabled={
                  isCheckoutLocked ||
                  loading ||
                  (isApiMode() && (!kioskToken || !!error))
                }
                className={`w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  gate === "checkout"
                    ? "bg-cyan-500 ring-2 ring-cyan-300 text-navy font-bold shadow-lg shadow-cyan-500/30"
                    : !isCheckoutLocked
                      ? isEarlyCheckout
                        ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer"
                        : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 cursor-pointer"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                <span>🏁</span>
                <span>
                  {isEarlyCheckout
                    ? "Mở sớm Check-out (25m cuối)"
                    : "Mở cổng Check-out"}
                </span>
              </button>

              {/* Ràng buộc Check-out (T_end - 25m) message per SRS UC-OPS-01 */}
              {isCheckoutLocked ? (
                <p className="text-[11px] text-amber-400 mt-1.5 leading-relaxed">
                  ⚠️ <strong>Ràng buộc T_end - 25m:</strong> Chỉ được mở cổng
                  Check-out tối đa 25 phút trước giờ kết thúc kế hoạch (từ{" "}
                  {new Date(tEndMinus25m).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  ).
                </p>
              ) : isEarlyCheckout ? (
                <p className="text-[11px] text-amber-300 mt-1.5 leading-relaxed">
                  ⚡ <strong>Khung mở sớm (T_end - 25m):</strong> Mở Check-out
                  lúc này yêu cầu nhập xác nhận từ khóa{" "}
                  <code className="bg-amber-950 px-1 rounded text-amber-200">
                    CONFIRM
                  </code>{" "}
                  hoặc{" "}
                  <code className="bg-amber-950 px-1 rounded text-amber-200">
                    XÁC NHẬN
                  </code>
                  .
                </p>
              ) : (
                <p className="text-[11px] text-emerald-400 mt-1.5 leading-relaxed">
                  ✓ Đã chạm/vượt giờ kết thúc kế hoạch (
                  {event?.endTime || "11:30"}). Mở bình thường.
                </p>
              )}
            </div>

            {/* Close Gate Button */}
            <button
              onClick={() => void setGateMode("closed")}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Đóng tất cả cổng điểm danh
            </button>
          </div>

          <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 space-y-1">
            <p>
              🔒 <strong>Cơ chế Tách phiên Kiosk:</strong> Phiên Kiosk sử dụng{" "}
              <code className="text-slate-300">kiosk_token_hash</code> (SHA-256)
              độc lập, không bị ảnh hưởng khi các tài khoản khác đăng nhập/đăng
              xuất trên thiết bị cá nhân.
            </p>
            <p>
              ⏰ <strong>Thời gian thu hồi tự động:</strong> Cổng và phiên tự
              động đóng tại{" "}
              <code className="text-slate-300">
                {new Date(tKioskExpiry).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </code>{" "}
              (T_end + 15m).
            </p>
          </div>
        </aside>
      </main>

      {/* Early Checkout Confirmation Modal (UC-OPS-01) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              ⚠️
            </div>
            <h3 className="font-display font-bold text-lg text-center text-white">
              Xác nhận mở cổng Check-out sớm
            </h3>
            <p className="text-xs text-slate-300 mt-2 text-center leading-relaxed">
              Bạn đang yêu cầu mở cổng Check-out sớm hơn giờ kết thúc kế hoạch
              (trong khung 25 phút cuối). Hành động này sẽ chốt{" "}
              <strong className="text-amber-300 font-mono">
                thoi_gian_ket_thuc_thuc_te = NOW()
              </strong>{" "}
              và ghi vết kiểm toán{" "}
              <strong className="text-amber-300 font-mono">
                EARLY_CHECKOUT_CONFIRM
              </strong>
              .
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nhập từ khóa{" "}
                <span className="text-cyan-300 font-mono font-bold">
                  CONFIRM
                </span>{" "}
                hoặc <span className="text-cyan-300 font-bold">XÁC NHẬN</span>{" "}
                để tiếp tục:
              </label>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder="Nhập CONFIRM hoặc XÁC NHẬN"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-cyan-300 outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-750"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmEarlyCheckout}
                disabled={
                  confirmKeyword.trim().toUpperCase() !== "CONFIRM" &&
                  confirmKeyword.trim().toUpperCase() !== "XÁC NHẬN"
                }
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md transition-colors"
              >
                Xác nhận mở cổng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
