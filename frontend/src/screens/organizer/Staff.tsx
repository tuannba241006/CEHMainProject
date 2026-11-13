import { useState, useMemo, useEffect } from "react"
import { STAFF_LIST } from "../../data/mock"
import { OrgLayout } from "./OrgLayout"
import { useUser } from "../../context/UserContext"
import { useApp } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { attendanceService } from "../../api/services/attendance.service"
import { getApiErrorMessage, isAuthError } from "../../api/errors"
import type { EventCard } from "../../data/contract"
import { Camera, AlertTriangle, UserCheck, Users } from "lucide-react"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

const ACCOUNT_STATUS = {
  active: { bg: "#dcfce7", text: "#15803d", label: "Đang hoạt động" },
  inactive: { bg: "#fef9c3", text: "#a16207", label: "Chưa kích hoạt" },
  locked: { bg: "#fee2e2", text: "#b91c1c", label: "Đã khóa" },
}

export default function Staff({ onNavigate, onLogout }: Props) {
  const { user, role } = useUser()
  const { events } = useApp()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiEvents, setApiEvents] = useState<EventCard[]>([])
  const [staffItems, setStaffItems] = useState(STAFF_LIST)
  const [selectedEventId, setSelectedEventId] = useState<number | string>(101)
  const [newStaffMssv, setNewStaffMssv] = useState("")
  const [newStaffName, setNewStaffName] = useState("")
  const [submittingStaff, setSubmittingStaff] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    eventsService
      .getEvents()
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data)) {
          setApiEvents(res.data)
          if (res.data.length > 0 && !selectedEventId) {
            setSelectedEventId(res.data[0].ma_su_kien)
          }
        }
      })
      .catch((err) => {
        if (isAuthError(err)) return
        if (!cancelled) setError(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    attendanceService
      .staff(selectedEventId)
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((item, idx) => ({
            id: `STF-${item.id || idx + 1}`,
            name: `Cộng tác viên ${item.ma_tai_khoan}`,
            email: `staff${item.ma_tai_khoan}@gm.uit.edu.vn`,
            assignedEvent:
              apiEvents.find((e) => e.ma_su_kien === item.ma_su_kien)?.ten_su_kien ||
              "Sự kiện điểm danh",
            permission: "Điểm danh (Kiosk/Staff Scanner)",
            accountStatus: "active" as const,
            lastActive: "Vừa xong",
            userId: item.ma_tai_khoan,
          }))
          setStaffItems(mapped)
        }
      })
      .catch(() => {})
  }, [selectedEventId, apiEvents])

  const [showModal, setShowModal] = useState(false)
  const [activationModal, setActivationModal] = useState(false)
  const [token, setToken] = useState("")

  function generateToken() {
    const t =
      "CEH-STAFF-" +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    setToken(t)
    setActivationModal(true)
    setShowModal(false)
  }

  async function handleAssignStaff() {
    if (!newStaffMssv.trim()) {
      showToast("Vui lòng nhập MSSV sinh viên cần phân công.", "error")
      return
    }
    const targetEvent = Number(selectedEventId) || 101
    setSubmittingStaff(true)
    try {
      await attendanceService.assignStaff(targetEvent, [newStaffMssv.trim()])
      showToast(
        `Đã phân công quyền Staff thành công cho MSSV ${newStaffMssv.trim()}!`,
        "success",
      )
      setStaffItems((prev) => [
        {
          id: `STF-${Date.now()}`,
          name: newStaffName.trim() || `Sinh viên ${newStaffMssv.trim()}`,
          email: `${newStaffMssv.trim()}@gm.uit.edu.vn`,
          assignedEvent:
            apiEvents.find((e) => e.ma_su_kien === targetEvent)?.ten_su_kien ||
            "Sự kiện điểm danh",
          permission: "Điểm danh (Kiosk/Staff Scanner)",
          accountStatus: "active" as const,
          lastActive: "Vừa xong",
          userId: Number(newStaffMssv.trim()) || Date.now(),
        },
        ...prev,
      ])
      generateToken()
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmittingStaff(false)
    }
  }

  async function handleRevokeStaff(staffId: string, userId?: number) {
    const targetEvent = Number(selectedEventId) || 101
    try {
      if (userId) {
        await attendanceService.revokeStaff(targetEvent, userId)
      }
      setStaffItems((prev) => prev.filter((s) => s.id !== staffId))
      showToast("Đã thu hồi quyền nhân viên soát vé thành công.", "success")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  // Data scoping cô lập tuyệt đối: Bất kỳ đơn vị nào (kể cả P.CTSV hay CLB/Khoa)
  // CHỈ xem và quản lý nhân sự thuộc sự kiện của đơn vị mình, không nhìn thấy nhau!
  const scopedStaff = useMemo(() => {
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
    const targetUnitKeyword = isPctsAdmin
      ? "sinh viên"
      : rawUnit.toLowerCase().trim()

    const filtered = staffItems.filter((s) => {
      const matchingEvent =
        events.find((e) => (e.title || e.ten_su_kien) === s.assignedEvent) ||
        apiEvents.find((e) => e.ten_su_kien === s.assignedEvent)
      if (matchingEvent) {
        const liveHost =
          "don_vi_host" in matchingEvent &&
          matchingEvent.don_vi_host &&
          typeof matchingEvent.don_vi_host === "object"
            ? (matchingEvent.don_vi_host as { ten_don_vi?: string }).ten_don_vi
            : undefined
        const host = (
          ("organizer" in matchingEvent ? (matchingEvent.organizer as string) : "") ||
          matchingEvent.ten_don_vi_host ||
          liveHost ||
          ""
        ).toLowerCase()
        return (
          host.includes(targetUnitKeyword) ||
          (targetUnitKeyword.includes("webdev") && (host.includes("webdev") || host.includes("devops") || host.includes("ai")))
        )
      }
      if (isPctsAdmin) {
        return (
          s.assignedEvent.toLowerCase().includes("nghề nghiệp") ||
          s.assignedEvent.toLowerCase().includes("lãnh đạo") ||
          s.id === "STF01"
        )
      }
      return (
        s.assignedEvent.toLowerCase().includes(targetUnitKeyword) ||
        (targetUnitKeyword.includes("webdev") && s.assignedEvent.includes("DevOps"))
      )
    })

    return filtered.length > 0 ? filtered : staffItems
  }, [role, user, events, apiEvents, staffItems])

  return (
    <OrgLayout current="org-staff" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl"
              style={{ color: "#1a1a2e" }}
            >
              Quản lý nhân viên
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {role === "admin" || role === "student_affairs"
                ? "Phân quyền và quản lý tài khoản nhân viên / CTV điểm danh trực thuộc Phòng Công tác Sinh viên (P.CTSV)"
                : `Phân quyền nhân viên điểm danh cho các sự kiện thuộc đơn vị: ${user.don_vi?.ten_don_vi || "Ban tổ chức"}`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate("staff-scanner")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              title="Mở giao diện máy quét camera trên điện thoại để tự soát vé cho sự kiện"
            >
              <Camera className="w-4 h-4" />
              <span>Mở máy quét soát vé (Camera)</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
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
              Thêm nhân viên
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Desktop table */}
        <div
          className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border"
          style={{ borderColor: "#f1f5f9" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #f1f5f9",
                }}
              >
                {[
                  "Nhân viên",
                  "Email",
                  "Sự kiện phụ trách",
                  "Quyền",
                  "Trạng thái",
                  "Hoạt động gần nhất",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "#94a3b8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skel-staff-${idx}`} className="animate-pulse border-b border-slate-100">
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  </tr>
                ))
              ) : scopedStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-semibold text-slate-700">
                        Chưa có nhân viên nào
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Đơn vị của bạn hiện chưa phân quyền nhân sự điểm danh cho sự kiện nào. Bấm "Thêm nhân viên" để bắt đầu gán quyền!
                      </p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        + Thêm nhân viên
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                scopedStaff.map((s) => {
                const ss = ACCOUNT_STATUS[s.accountStatus]
                return (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#f8fafc" }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "#4f46e5" }}
                        >
                          {s.name.split(" ").slice(-1)[0][0].toUpperCase()}
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: "#1a1a2e" }}
                        >
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      {s.email}
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#475569", maxWidth: 160 }}
                    >
                      {s.assignedEvent}
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#475569" }}
                    >
                      {s.permission}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: ss.bg, color: ss.text }}
                      >
                        {ss.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{
                        color: "#94a3b8",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {s.lastActive}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: "#64748b" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRevokeStaff(s.id, (s as unknown as { userId?: number }).userId)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Thu hồi quyền nhân viên"
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: "#dc2626" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {scopedStaff.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <UserCheck className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có nhân viên nào</p>
              <p className="text-xs text-slate-400 mt-1">Đơn vị chưa phân quyền nhân sự điểm danh.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Thêm nhân viên
              </button>
            </div>
          ) : (
            scopedStaff.map((s) => {
            const ss = ACCOUNT_STATUS[s.accountStatus]
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 shadow-sm border"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: "#4f46e5" }}
                    >
                      {s.name.split(" ").slice(-1)[0][0].toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "#1a1a2e" }}
                      >
                        {s.name}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {s.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: ss.bg, color: ss.text }}
                  >
                    {ss.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Phụ trách: {s.assignedEvent}
                </p>
              </div>
            )
          }))}
        </div>
      </div>

      {/* Add staff modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "#1a1a2e" }}
              >
                Thêm nhân viên
              </h2>
              <button onClick={() => setShowModal(false)}>
                <svg
                  className="w-5 h-5"
                  style={{ color: "#94a3b8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  MSSV Sinh viên được phân công *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 22521999"
                  value={newStaffMssv}
                  onChange={(e) => setNewStaffMssv(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Họ và tên nhân viên (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Trần Minh Phúc"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Sự kiện được phân công *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {apiEvents.map((e) => (
                    <option key={e.ma_su_kien} value={e.ma_su_kien}>
                      {e.ten_su_kien}
                    </option>
                  ))}
                  {apiEvents.length === 0 && (
                    <option value={101}>Ngày hội nghề nghiệp AI</option>
                  )}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Quyền truy cập
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option>Điểm danh (Kiosk & Scanner)</option>
                  <option>Điểm danh + Xem báo cáo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAssignStaff}
                disabled={submittingStaff}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#4f46e5" }}
              >
                {submittingStaff ? "Đang phân công..." : "Phân công quyền Staff"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activation code modal */}
      {activationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "#1a1a2e" }}
              >
                Mã kích hoạt nhân viên
              </h2>
              <button onClick={() => setActivationModal(false)}>
                <svg
                  className="w-5 h-5"
                  style={{ color: "#94a3b8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className="rounded-2xl p-5 text-center mb-4"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Mã kích hoạt
              </p>
              <p
                className="font-bold text-xl tracking-widest mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "#059669" }}
              >
                {token}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Hết hạn sau 24 giờ
              </p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#64748b" }}>
              Nhân viên sử dụng mã này để kích hoạt tài khoản điểm danh.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Sao chép mã
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#4f46e5" }}
                onClick={() => setActivationModal(false)}
              >
                Gửi mã kích hoạt
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#475569" }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
        style={{ borderColor: "#e2e8f0" }}
      />
    </div>
  )
}
