import { useState, useEffect } from "react"
import { useApp, type CheckInResult } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import { isApiMode } from "../../api/config"
import { attendanceService } from "../../api/services/attendance.service"
import { getApiErrorMessage } from "../../api/errors"

interface Props {
  onLogout: () => void
  onBack?: () => void
  onNavigateToEvents?: () => void
}

interface HistoryEntry {
  name: string
  studentId: string
  time: string
  status: "success" | "failed"
  message?: string
}

export default function QRScanner({
  onLogout,
  onBack,
  onNavigateToEvents,
}: Props) {
  const {
    events,
    checkIn,
    checkOut,
    getCheckedInCount,
    getActiveParticipants,
    getStudentPermissions,
  } = useApp()
  const { user, role } = useUser()
  const isFaculty =
    role === "faculty_manager" ||
    user.don_vi?.loai_don_vi === "Khoa" ||
    (typeof user.email === "string" &&
      (user.email.includes("httt@") || user.email.includes("bql.")))
  const isAdmin =
    role === "admin" ||
    role === "student_affairs" ||
    user.loai_tai_khoan === "Admin"
  const isOrg =
    role === "organizer" ||
    user.loai_tai_khoan === "ToChuc"
  const assignedIds = getStudentPermissions(user.studentId).map(
    (permission) => permission.eventId,
  )
  const userAssignedEvents = events.filter((event) =>
    assignedIds.includes(event.id),
  )
  // If user is ticket staff or no specific assigned IDs, allow selecting any active event
  const assignedEvents =
    userAssignedEvents.length > 0
      ? userAssignedEvents
      : events.filter((e) => !e.isCancelled)

  const [tab, setTab] = useState<"scan" | "history">("scan")
  const [manualCode, setManualCode] = useState("")
  const [flashOn, setFlashOn] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState(
    assignedEvents[0]?.id ?? "",
  )
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [scanLine, setScanLine] = useState(0)
  const [scanMode, setScanMode] = useState<"checkin" | "checkout">("checkin")

  useEffect(() => {
    const id = setInterval(() => setScanLine((v) => (v + 1.5) % 100), 16)
    return () => clearInterval(id)
  }, [])

  const selectedEvent = events.find((e) => e.id === selectedEventId)
  const checkedInCount = selectedEventId
    ? getCheckedInCount(selectedEventId)
    : 0
  const totalActive = selectedEventId
    ? getActiveParticipants(selectedEventId).length
    : 0

  async function handleScan(code?: string) {
    const input = (code || manualCode).trim()
    if (!input) return

    const selectedEvt = events.find((e) => e.id === selectedEventId)
    const eventIdNum = selectedEvt?.ma_su_kien || Number(selectedEventId) || 101

    if (isApiMode()) {
      try {
        await attendanceService.staffScan({
          ma_su_kien: eventIdNum,
          che_do_quet: scanMode === "checkin" ? "CHECK_IN" : "CHECK_OUT",
          chuoi_qr_ve: input,
        })
      } catch (err) {
        setResult({
          success: false,
          type: "not_found",
          message: getApiErrorMessage(err),
        })
        return
      }
    }

    const res =
      scanMode === "checkin"
        ? checkIn(input, selectedEventId)
        : checkOut(input, selectedEventId)
    setResult(res)

    const entry: HistoryEntry = {
      name: res.studentName ?? "—",
      studentId: res.studentId ?? input,
      time:
        res.time ??
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      status: res.success ? "success" : "failed",
      message: res.success ? undefined : res.message,
    }
    setHistory((prev) => [entry, ...prev])

    if (res.success) {
      setTimeout(() => setResult(null), 3000)
    }
    setManualCode("")
  }

  function handleDemoScan() {
    const demoQr =
      selectedEventId === "EVT001"
        ? "TKT-2026-001928|EVT001|22521088"
        : "TKT-2026-003412|EVT005|22521001"
    handleScan(demoQr)
  }

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#0f0f1a" }}
    >
      {/* Header with safe area */}
      <div className="px-4 pb-3 safe-area-top" style={{ paddingBottom: 12 }}>
        <div className="pt-3 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              <span>📷</span>
              <span>
                {isFaculty
                  ? "Ban Quản lý Khoa soát vé"
                  : isOrg
                    ? "Ban tổ chức soát vé"
                    : isAdmin
                      ? "Kiểm tra hiện trường Admin"
                      : "Bàn soát vé Cộng tác viên"}
              </span>
            </div>
            <h1 className="font-display font-bold text-lg text-white">
              {isFaculty
                ? "Soát vé sự kiện (Ban Quản lý Khoa)"
                : isOrg
                  ? "Soát vé sự kiện (Ban tổ chức)"
                  : isAdmin
                    ? "Thanh tra & Quét kiểm tra vé"
                    : "Quét mã vé Sinh viên"}
            </h1>
            <p className="text-xs text-slate-400">
              Quét mã QR HMAC trên vé của sinh viên và đối chiếu thẻ sinh viên
              vật lý
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer"
              >
                {isFaculty
                  ? "← Bảng Thẩm định Khoa"
                  : isOrg
                    ? "← Quản lý sự kiện"
                    : isAdmin
                      ? "← Cổng Quản trị Admin"
                      : "← Ví vé của tôi"}
              </button>
            )}
            {isFaculty && onNavigateToEvents && (
              <button
                onClick={onNavigateToEvents}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                🎪 Sự kiện Khoa
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex mx-4 mb-3 p-1 rounded-xl"
        style={{ background: "rgba(79,70,229,0.15)" }}
      >
        {([
          ["checkin", "Ghi nhận vào"],
          ["checkout", "Ghi nhận ra"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setScanMode(value)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{
              background: scanMode === value ? "#4f46e5" : "transparent",
              color: scanMode === value ? "white" : "#818cf8",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className="flex mx-4 mb-3 p-1 rounded-xl"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {(["scan", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t ? "#4f46e5" : "transparent",
              color: tab === t ? "white" : "#475569",
            }}
          >
            {t === "scan" ? "Quét mã QR" : `Lịch sử (${history.length})`}
          </button>
        ))}
      </div>

      {tab === "scan" ? (
        <>
          {/* Event selector */}
          <div className="px-4 mb-3">
            <p
              className="text-xs font-medium mb-1.5"
              style={{ color: "#475569" }}
            >
              Sự kiện hiện tại
            </p>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {assignedEvents.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                  style={{ background: "#1a1a2e", color: "white" }}
                >
                  {e.title}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <div className="flex gap-4 mt-2">
                <p className="text-xs" style={{ color: "#334155" }}>
                  Đã điểm danh:{" "}
                  <span
                    style={{ color: "#4f46e5", fontFamily: "var(--font-mono)" }}
                  >
                    {checkedInCount}
                  </span>
                  {" / "}
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {totalActive}
                  </span>{" "}
                  đăng ký
                </p>
              </div>
            )}
          </div>

          {/* Camera viewport */}
          <div
            className="mx-4 rounded-3xl overflow-hidden relative flex-shrink-0"
            style={{
              height: "55vw",
              maxHeight: 300,
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg
                className="w-20 h-20"
                style={{ color: "#4f46e5" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-40 h-40">
                {[
                  ["top", "left"],
                  ["top", "right"],
                  ["bottom", "left"],
                  ["bottom", "right"],
                ].map(([v, h], i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{ [v]: 0, [h]: 0, width: 28, height: 28 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        [v]: 0,
                        [h]: 0,
                        width: 2,
                        height: 24,
                        background: "#818cf8",
                        borderRadius: 1,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        [v]: 0,
                        [h]: 0,
                        width: 24,
                        height: 2,
                        background: "#818cf8",
                        borderRadius: 1,
                      }}
                    />
                  </div>
                ))}
                <div
                  className="absolute left-0 right-0"
                  style={{
                    height: 2,
                    top: `${scanLine}%`,
                    background:
                      "linear-gradient(to right, transparent, #4f46e5, transparent)",
                    boxShadow: "0 0 12px #4f46e5",
                  }}
                />
                <p
                  className="absolute text-xs font-medium text-center w-full whitespace-nowrap"
                  style={{ bottom: -28, color: "#475569" }}
                >
                  Đưa mã QR vào khung
                </p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => setFlashOn((f) => !f)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: flashOn ? "#f59e0b" : "rgba(255,255,255,0.12)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: flashOn ? "white" : "#64748b" }}
                  fill={flashOn ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Manual input */}
          <div className="mx-4 mt-4">
            <p className="text-xs mb-2" style={{ color: "#475569" }}>
              Nhập mã vé thủ công
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="VD: TKT-2026-003412"
                className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "var(--font-mono)",
                }}
              />
              <button
                onClick={() => handleScan()}
                className="px-4 py-3 rounded-2xl text-sm font-semibold text-white flex-shrink-0"
                style={{ background: "#4f46e5" }}
              >
                Xác nhận
              </button>
            </div>
          </div>

          {/* Demo scan: 2 student tickets */}
          <div className="px-4 mt-3 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400">
              Mô phỏng quét mã vé sinh viên thường đến hội trường:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleScan("TKT-2026-001928|EVT001|22521088")}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-colors bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 cursor-pointer"
              >
                🎟️ Vé SV: Nguyễn Ngọc Mai (22521088)
              </button>
              <button
                onClick={() => handleScan("TKT-2026-003412|EVT005|22521001")}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-colors bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 cursor-pointer"
              >
                🎟️ Vé SV: Cao Duy Anh (22521001)
              </button>
            </div>
          </div>

          {/* Recent history preview */}
          {history.length > 0 && (
            <div className="px-4 mt-5 pb-6">
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: "#334155" }}
              >
                Điểm danh gần đây
              </h3>
              <div className="space-y-2">
                {history.slice(0, 3).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            h.status === "success" ? "#059669" : "#dc2626",
                        }}
                      >
                        {h.status === "success" ? (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {h.name}
                        </p>
                        <p
                          className="text-xs"
                          style={{
                            color: "#475569",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {h.studentId}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs"
                      style={{
                        color: "#334155",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {h.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* History tab */
        <div className="flex-1 px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-base text-white">
              Lịch sử điểm danh
            </h2>
            <span
              className="text-xs"
              style={{ color: "#475569", fontFamily: "var(--font-mono)" }}
            >
              {history.filter((h) => h.status === "success").length} thành công
            </span>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "#334155" }}>
                Chưa có lịch sử điểm danh
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        h.status === "success"
                          ? "rgba(5,150,105,0.2)"
                          : "rgba(220,38,38,0.2)",
                    }}
                  >
                    {h.status === "success" ? (
                      <svg
                        className="w-4 h-4"
                        style={{ color: "#059669" }}
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
                    ) : (
                      <svg
                        className="w-4 h-4"
                        style={{ color: "#dc2626" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {h.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: "#475569",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {h.studentId} · {h.time}
                    </p>
                    {h.message && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#dc2626" }}
                      >
                        {h.message}
                      </p>
                    )}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{
                      background:
                        h.status === "success"
                          ? "rgba(5,150,105,0.15)"
                          : "rgba(220,38,38,0.15)",
                      color: h.status === "success" ? "#059669" : "#dc2626",
                    }}
                  >
                    {h.status === "success" ? "Thành công" : "Thất bại"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result overlay */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{
            background: result.success
              ? "rgba(5,150,105,0.97)"
              : "rgba(220,38,38,0.97)",
          }}
        >
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {result.success ? (
                <svg
                  className="w-12 h-12 text-white"
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
              ) : (
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0L22.303 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>

            {result.success ? (
              <>
                <h2 className="font-display font-bold text-2xl text-white mb-3">
                  {scanMode === "checkin"
                    ? "Check-in thành công!"
                    : "Check-out thành công!"}
                </h2>
                <p
                  className="font-display text-xl font-semibold mb-1"
                  style={{ color: "#d1fae5" }}
                >
                  {result.studentName}
                </p>
                <p
                  className="text-sm mb-0.5"
                  style={{ color: "#a7f3d0", fontFamily: "var(--font-mono)" }}
                >
                  MSSV: {result.studentId}
                </p>
                {result.faculty && (
                  <p className="text-sm" style={{ color: "#a7f3d0" }}>
                    {result.faculty}
                  </p>
                )}
                {result.time && (
                  <p
                    className="text-sm mt-1"
                    style={{ color: "#6ee7b7", fontFamily: "var(--font-mono)" }}
                  >
                    Thời gian: {result.time}
                  </p>
                )}
                <p className="text-sm mt-2" style={{ color: "#a7f3d0" }}>
                  Đã ghi nhận vào hệ thống
                </p>
                <p className="text-xs mt-4 opacity-60 text-white">
                  Tự động đóng sau 2 giây...
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display font-bold text-2xl text-white mb-3">
                  Không thể điểm danh
                </h2>
                <p className="text-base mb-8" style={{ color: "#fecaca" }}>
                  {result.message}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="px-8 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: "white", color: "#dc2626" }}
                >
                  Quét lại
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
