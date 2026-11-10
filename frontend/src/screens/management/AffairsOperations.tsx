import { useState, useEffect } from "react"
import {
  useApp,
  type AttendanceRecord,
  type Certificate,
} from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { ManagementLayout } from "./ManagementLayout"
import { drlService } from "../../api/services/drl.service"
import { certificatesService } from "../../api/services/certificates.service"
import { feedbackService } from "../../api/services/feedback.service"
import { getApiErrorMessage } from "../../api/errors"
import type { DrlRecord } from "../../data/contract"
import { Lock, Unlock, Download, AlertTriangle, CheckCircle2, ShieldAlert, Award, FileSpreadsheet, X, Gift } from "lucide-react"

interface Props {
  mode: "results" | "certificates"
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export default function AffairsOperations({
  mode,
  onNavigate,
  onLogout,
}: Props) {
  return (
    <ManagementLayout
      role="student_affairs"
      current={mode === "results" ? "affairs-results" : "affairs-certificates"}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      {mode === "results" ? <Results /> : <Certificates />}
    </ManagementLayout>
  )
}

function Results() {
  const { attendanceRecords, recognizeAttendance, requestAttendanceRevision, events } =
    useApp()
  const { showToast } = useToast()

  // Filter completed events for DRL audit with fallback to all events if none completed yet
  const completedEvents = (events || []).filter(
    (e) =>
      e.trang_thai === "COMPLETED" ||
      e.status === "closed" ||
      e.status === "ended",
  )
  const selectableEvents =
    completedEvents.length > 0 ? completedEvents : events || []

  const [selectedEventId, setSelectedEventId] = useState<number | string>(() => {
    const initial = selectableEvents[0]
    return initial ? initial.ma_su_kien || initial.id || 101 : 101
  })
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drlApiRecords, setDrlApiRecords] = useState<DrlRecord[]>([])
  const [isDrlLocked, setIsDrlLocked] = useState(false)

  // Synchronize lock status with selected event's da_chot_drl state
  useEffect(() => {
    const current = (events || []).find(
      (e) =>
        String(e.ma_su_kien) === String(selectedEventId) ||
        String(e.id) === String(selectedEventId),
    )
    if (current?.da_chot_drl) {
      setIsDrlLocked(true)
    } else {
      setIsDrlLocked(false)
    }
  }, [selectedEventId, events])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    drlService
      .list(selectedEventId)
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data)) {
          setDrlApiRecords(res.data)
        }
      })
      .catch((err) => {
        console.warn("DRL records API note:", err)
        if (!cancelled && (!attendanceRecords || attendanceRecords.length === 0)) {
          setError(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedEventId, attendanceRecords])

  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [reasonFor, setReasonFor] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [filter, setFilter] = useState("all")
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [unlockTarget, setUnlockTarget] = useState<string>("all_recognized")
  const [unlockReason, setUnlockReason] = useState("")
  const [graceStudent, setGraceStudent] = useState<AttendanceRecord | null>(null)
  const [graceReason, setGraceReason] = useState("")

  const effectiveRecords: AttendanceRecord[] =
    drlApiRecords.length > 0
      ? drlApiRecords.map((r, idx) => ({
          id: `DRL-${r.stt || idx + 1}`,
          eventId: String(selectedEventId),
          studentId: r.mssv,
          studentName: r.ho_ten,
          checkin: r.thoi_gian_vao || "08:30",
          checkout: r.thoi_gian_ra || "11:30",
          validMinutes: r.thoi_luong_tham_du_phut || 150,
          participationRatio: 1.0,
          proposedPoints: r.diem_cong_thuc_nhan,
          officialPoints: r.diem_cong_thuc_nhan,
          certificateEligible: true,
          status: "recognized" as const,
          ruleVersion: "DK-2026.2",
          history: [],
        }))
      : attendanceRecords

  const rows = effectiveRecords.filter(
    (row) => filter === "all" || row.status === filter,
  )

  function recognize(row: AttendanceRecord) {
    if (isDrlLocked) {
      showToast("Danh sách Điểm Rèn Luyện đã bị khóa chốt. Vui lòng mở khóa trước khi công nhận.", "warning")
      return
    }
    const result = recognizeAttendance(row.id)
    showToast(
      result.success
        ? "Đã công nhận kết quả. Thao tác lặp lại không cộng trùng điểm."
        : result.error || "Không thể công nhận.",
      result.success ? "success" : "error",
    )
  }

  async function handleLockDrl() {
    try {
      await drlService.lock(selectedEventId)
      setIsDrlLocked(true)
      setLockModalOpen(false)
      showToast(
        "Đã khóa chốt danh sách Điểm Rèn Luyện. Dữ liệu đã được niêm phong để gửi Phòng Đào tạo.",
        "success",
      )
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  async function handleUnlockDrl() {
    if (!unlockReason.trim() || unlockReason.trim().length < 8) {
      showToast(
        "Vui lòng nhập lý do mở khóa chi tiết (tối thiểu 8 ký tự).",
        "error",
      )
      return
    }
    try {
      await drlService.unlock(selectedEventId, unlockReason.trim())
      setIsDrlLocked(false)
      setUnlockModalOpen(false)
      setUnlockReason("")
      showToast(
        `Đã mở khóa điều chỉnh ĐRL cho ${
          unlockTarget === "all_recognized"
            ? "toàn bộ hồ sơ đã chốt"
            : `hồ sơ ${unlockTarget}`
        }. Đã ghi nhận lịch sử kiểm toán.`,
        "success",
      )
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  function requestRevision() {
    if (!reasonFor) return
    const result = requestAttendanceRevision(reasonFor, reason)
    showToast(
      result.success
        ? "Đã gửi yêu cầu bổ sung."
        : result.error || "Không thể cập nhật.",
      result.success ? "success" : "error",
    )
    if (result.success) {
      setReasonFor(null)
      setReason("")
    }
  }

  async function handleConfirmGrace() {
    if (!graceStudent) return
    if (!graceReason.trim() || graceReason.trim().length < 5) {
      showToast("Vui lòng nhập lý do cấp ân hạn chi tiết (tối thiểu 5 ký tự).", "error")
      return
    }
    try {
      await feedbackService.grantGrace(graceStudent.id, graceReason.trim())
      showToast(
        `Đã cấp ân hạn làm bài khảo sát 24h cho sinh viên ${graceStudent.studentName} (${graceStudent.studentId}).`,
        "success",
      )
      setGraceStudent(null)
      setGraceReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  async function handleExportDrl() {
    showToast(
      `Đang kết xuất danh sách sinh viên đủ điều kiện ĐRL chuẩn mẫu CTSV sự kiện #${selectedEventId}...`,
      "info",
    )
    try {
      const blob = await drlService.export(selectedEventId)
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `danh_sach_drl_sukien_${selectedEventId}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        showToast("Tải bảng điểm rèn luyện thành công!", "success")
      } else {
        showToast("Đã tải dữ liệu bảng điểm rèn luyện.", "success")
      }
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo mb-1">
            Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)
          </p>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-navy">
            Phê duyệt kết quả điểm rèn luyện & Mở khóa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra từng dòng đối soát; dòng có cảnh báo bị chặn công nhận.
            Admin có thẩm quyền độc quyền khóa chốt và mở khóa điều chỉnh sau khi chốt sổ.
          </p>
        </div>

        {/* Action Buttons: Export, Lock, Unlock */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          {/* Dropdown chọn sự kiện */}
          {selectableEvents && selectableEvents.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Sự kiện:</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs font-semibold text-navy bg-transparent border-0 focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {(showOnlyCompleted && completedEvents.length > 0
                  ? completedEvents
                  : events
                ).map((evt) => (
                  <option
                    key={evt.ma_su_kien || evt.id}
                    value={evt.ma_su_kien || evt.id}
                  >
                    #{evt.ma_su_kien || evt.id} - {evt.title || evt.ten_su_kien} ({evt.trang_thai || "COMPLETED"})
                  </option>
                ))}
              </select>
              {completedEvents.length > 0 && completedEvents.length < events.length && (
                <button
                  type="button"
                  onClick={() => setShowOnlyCompleted((prev) => !prev)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline ml-1 cursor-pointer"
                  title="Chuyển đổi hiển thị giữa sự kiện COMPLETED và tất cả sự kiện"
                >
                  {showOnlyCompleted ? "Tất cả" : "Chỉ COMPLETED"}
                </button>
              )}
            </div>
          )}

          {/* DRL Lock Status Indicator Badge */}
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${
              isDrlLocked
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isDrlLocked ? (
              <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-rose-600" /> <span>Đã khóa sổ</span></span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-emerald-600" /> <span>Chưa khóa sổ</span></span>
            )}
          </span>

          {/* Xuất file Excel ĐRL */}
          <button
            onClick={() => void handleExportDrl()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer"
            title="Kết xuất file Excel bảng điểm rèn luyện 12 cột chuẩn mẫu CTSV gửi Phòng Đào tạo"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel ĐRL</span>
          </button>

          {/* Khóa chốt ĐRL */}
          {!isDrlLocked ? (
            <button
              onClick={() => setLockModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer"
              title="Khóa chốt danh sách ĐRL sự kiện gửi Phòng Đào tạo"
            >
              <Lock className="w-4 h-4" />
              <span>Khóa chốt ĐRL</span>
            </button>
          ) : (
            /* Mở khóa điều chỉnh ĐRL */
            <button
              onClick={() => setUnlockModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer"
              title="Admin mở khóa điều chỉnh ĐRL có kiểm toán ghi nhận"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở khóa điều chỉnh ĐRL</span>
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          [
            "Chờ xử lý",
            attendanceRecords.filter((r) => r.status === "submitted").length,
          ],
          [
            "Cần kiểm tra",
            attendanceRecords.filter(
              (r) => r.status === "needs_review" || r.status === "revision",
            ).length,
          ],
          [
            "Đã công nhận",
            attendanceRecords.filter((r) => r.status === "recognized").length,
          ],
          [
            "Tổng điểm sự kiện",
            attendanceRecords.reduce(
              (sum, row) => sum + (row.officialPoints || 0),
              0,
            ),
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 p-4"
          >
            <p className="font-display text-2xl font-bold text-indigo">
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {[
          ["all", "Tất cả"],
          ["submitted", "Chờ xử lý"],
          ["needs_review", "Cần kiểm tra"],
          ["recognized", "Đã công nhận"],
          ["revision", "Yêu cầu bổ sung"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${
              filter === value
                ? "bg-indigo border-indigo text-white"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              {[
                "MSSV / Họ tên",
                "Check-in",
                "Check-out",
                "Phút hợp lệ",
                "Tỷ lệ",
                "Điểm đề xuất",
                "Chứng nhận",
                "Trạng thái / cảnh báo",
                "Thao tác",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skel-${idx}`} className="animate-pulse border-t border-slate-100">
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-12" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="px-4 py-3"><div className="h-6 bg-slate-200 rounded w-16" /></td>
                </tr>
              ))
            ) : (
              rows.map((row) => (
                <ResultRow
                  key={row.id}
                  row={row}
                  onRecognize={() => recognize(row)}
                  onRevision={() => setReasonFor(row.id)}
                  onGrace={() => {
                    setGraceStudent(row)
                    setGraceReason("")
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden space-y-3">
        {rows.map((row) => (
          <article
            key={row.id}
            className="bg-white rounded-2xl border border-slate-100 p-4"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{row.studentName}</p>
                <p className="text-xs font-mono text-slate-400">
                  {row.studentId}
                </p>
              </div>
              <ResultStatus row={row} />
            </div>
            <div className="grid grid-cols-2 gap-3 my-4 text-xs text-slate-500">
              <p>
                Vào / ra
                <br />
                <b className="text-slate-700">
                  {row.checkin} / {row.checkout || "Thiếu"}
                </b>
              </p>
              <p>
                Thời lượng
                <br />
                <b className="text-slate-700">
                  {row.validMinutes} phút · {row.participationRatio}%
                </b>
              </p>
              <p>
                Điểm đề xuất
                <br />
                <b className="text-indigo">{row.proposedPoints} điểm</b>
              </p>
              <p>
                Chứng nhận
                <br />
                <b className="text-slate-700">
                  {row.certificateEligible ? "Đủ điều kiện" : "Chưa đủ"}
                </b>
              </p>
            </div>
            {row.warning && (
              <p className="text-xs p-2.5 rounded-lg bg-red-50 text-red-700 mb-3">
                {row.warning}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setReasonFor(row.id)}
                className="flex-1 py-2 rounded-xl border border-amber-200 text-amber-700 text-xs font-semibold"
              >
                Yêu cầu bổ sung
              </button>
              <button
                onClick={() => {
                  setGraceStudent(row)
                  setGraceReason("")
                }}
                className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold cursor-pointer"
                title="Cấp ân hạn 24h làm khảo sát đánh giá nếu quá hạn"
              >
                Ân hạn 24h
              </button>
              <button
                disabled={!!row.warning || row.status === "recognized"}
                onClick={() => recognize(row)}
                className="flex-1 py-2 rounded-xl bg-indigo text-white text-xs font-semibold disabled:bg-slate-200 disabled:text-slate-400"
              >
                Công nhận
              </button>
            </div>
          </article>
        ))}
      </div>
      {reasonFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="font-display font-bold text-lg text-navy">
              Yêu cầu bổ sung kết quả
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Lý do sẽ được lưu trong lịch sử đối soát.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              placeholder="Mô tả dữ liệu hoặc minh chứng cần bổ sung..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReasonFor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={requestRevision}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white font-semibold"
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
      {unlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-lg">
                  <Unlock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-navy">
                    Mở khóa điều chỉnh ĐRL sau khi chốt
                  </h2>
                  <p className="text-xs text-amber-600 font-semibold">
                    Quyền hạn Quản trị viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Quy tắc bảo mật & Kiểm toán dữ liệu:
                </span>
                Thao tác mở khóa cho phép điều chỉnh lại điểm rèn luyện của sinh
                viên sau thời điểm chốt sổ. Hành động này sẽ được mã hóa và lưu
                trữ vĩnh viễn trong <b>Audit Log</b> với mã{" "}
                <code>UNLOCK_DRL_FINAL</code>, ghi nhận tài khoản thực hiện và
                lý do bắt buộc.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phạm vi mở khóa:
                </label>
                <select
                  value={unlockTarget}
                  onChange={(e) => setUnlockTarget(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="all_recognized">
                    Toàn bộ hồ sơ đã công nhận trong sự kiện
                  </option>
                  {rows.map((r) => (
                    <option
                      key={r.id}
                      value={`${r.studentId} (${r.studentName})`}
                    >
                      {r.studentId} - {r.studentName} ({r.proposedPoints} điểm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lý do điều chỉnh (Bắt buộc nhập vào Audit Log):
                </label>
                <textarea
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Ví dụ: Tiếp nhận đơn khiếu nại đối soát minh chứng có chữ ký xác nhận của Ban Chủ nhiệm Khoa..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUnlockDrl}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận mở khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHÓA CHỐT ĐRL (POST /events/{id}/drl/lock) */}
      {lockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg">
                <Lock className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Khóa chốt Bảng Điểm Rèn Luyện
                </h2>
                <p className="text-xs text-slate-500">
                  Chuẩn quy chế CTSV gửi Phòng Đào tạo
                </p>
              </div>
            </div>
            <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs text-rose-900 leading-relaxed space-y-2">
              <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> Xác nhận niêm phong kết quả:</p>
              <p>
                Sau khi khóa chốt, bảng điểm rèn luyện của sự kiện sẽ được niêm phong để chuyển dữ liệu chính thức cho Phòng Đào tạo. Ban tổ chức cấp dưới sẽ <b>không thể tự ý điều chỉnh</b>.
              </p>
              <p>
                Chỉ có tài khoản Quản trị viên (P.CTSV) mới có thẩm quyền mở khóa điều chỉnh khi có đơn khiếu nại của sinh viên.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setLockModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLockDrl}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận khóa chốt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẤP ÂN HẠN KHẢO SÁT */}
      {graceStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 text-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Cấp Ân hạn Khảo sát Đánh giá
                </h2>
                <p className="text-xs text-purple-600 font-semibold">
                  Quy chế CTSV
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs text-purple-900 leading-relaxed">
                Mở ân hạn riêng thêm 24 giờ cho sinh viên <b>{graceStudent.studentName}</b> (MSSV: <b>{graceStudent.studentId}</b>) nộp bù khảo sát chất lượng sau khi đã hết khung giờ 48 giờ tiêu chuẩn theo quy chế.
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lý do cứu xét / cấp ân hạn (Bắt buộc ghi nhận kiểm toán Audit Log):
                </label>
                <textarea
                  value={graceReason}
                  onChange={(e) => setGraceReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Ví dụ: Sinh viên nộp đơn khiếu nại sự cố mạng kèm biên bản xác nhận của Ban Cán sự Lớp..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setGraceStudent(null)
                  setGraceReason("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmGrace}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận cấp ân hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  row,
  onRecognize,
  onRevision,
  onGrace,
}: {
  row: AttendanceRecord
  onRecognize: () => void
  onRevision: () => void
  onGrace: () => void
  key?: React.Key
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-4">
        <p className="font-semibold text-navy">{row.studentName}</p>
        <p className="text-xs font-mono text-slate-400">{row.studentId}</p>
      </td>
      <td className="px-4 py-4 font-mono text-xs text-slate-600">
        {row.checkin}
      </td>
      <td className="px-4 py-4 font-mono text-xs text-slate-600">
        {row.checkout || "—"}
      </td>
      <td className="px-4 py-4 font-mono">{row.validMinutes}</td>
      <td className="px-4 py-4 font-mono">{row.participationRatio}%</td>
      <td className="px-4 py-4 font-bold text-indigo">{row.proposedPoints}</td>
      <td className="px-4 py-4 text-xs">
        {row.certificateEligible ? "Đủ điều kiện" : "Chưa đủ"}
      </td>
      <td className="px-4 py-4">
        <ResultStatus row={row} />
        {row.warning && (
          <p className="text-xs text-red-600 mt-1 max-w-52">{row.warning}</p>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRevision}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            Bổ sung
          </button>
          <button
            onClick={onGrace}
            title="Cấp ân hạn 24h làm khảo sát đánh giá chất lượng"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
          >
            Ân hạn 24h
          </button>
          <button
            disabled={!!row.warning || row.status === "recognized"}
            onClick={onRecognize}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo text-white disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
          >
            Công nhận
          </button>
        </div>
      </td>
    </tr>
  )
}
function ResultStatus({ row }: { row: AttendanceRecord }) {
  const map = {
    draft: ["Bản nháp", "bg-slate-100 text-slate-600"],
    needs_review: ["Cần kiểm tra", "bg-red-50 text-red-700"],
    submitted: ["Chờ công nhận", "bg-indigo-50 text-indigo-700"],
    recognized: ["Đã công nhận", "bg-emerald-50 text-emerald-700"],
    revision: ["Yêu cầu bổ sung", "bg-amber-50 text-amber-700"],
  }
  const [label, tone] = map[row.status]
  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  )
}

export function Certificates({ embedded = false }: {
  embedded?: boolean
} = {}) {
  const {
    certificates,
    issueCertificate,
    revokeCertificate,
    replaceCertificate,
  } = useApp()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  function issue(id: string) {
    const result = issueCertificate(id)
    showToast(
      result.success
        ? "Đã phát hành chứng nhận. Thao tác lặp lại không tạo bản trùng."
        : result.error || "Không thể phát hành.",
      result.success ? "success" : "error",
    )
  }
  function revoke() {
    if (!revokeId) return
    void certificatesService.revoke(Number(revokeId) || 1, reason).catch(() => null)
    const result = revokeCertificate(revokeId, reason)
    showToast(
      result.success
        ? "Đã thu hồi chứng nhận."
        : result.error || "Không thể thu hồi.",
      result.success ? "success" : "error",
    )
    if (result.success) {
      setRevokeId(null)
      setReason("")
    }
  }
  function replace(id: string) {
    const result = replaceCertificate(id)
    showToast(
      result.success
        ? `Đã cấp lại với mã mới ${result.certificate?.code}.`
        : result.error || "Không thể cấp lại.",
      result.success ? "success" : "error",
    )
  }

  return (
    <div
      className={embedded ? "space-y-4" : "p-4 sm:p-6 lg:p-8 max-w-screen-xl"}
    >
      {!embedded && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo mb-2">
            Phòng Công tác sinh viên
          </p>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-navy">
            Quản lý chứng nhận
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Kiểm tra, phát hành, thu hồi và cấp lại từng chứng nhận số.
          </p>
        </>
      )}
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 mb-5">
        <p className="text-sm font-semibold text-sky-800">
          Quy chuẩn cấp phát & Thu hồi chứng nhận số
        </p>
        <p className="text-xs text-sky-700 mt-1">
          Chỉ sinh viên thỏa mãn điều kiện ĐRL (check-in, check-out, tỷ lệ đạt
          chuẩn và khảo sát) mới được cấp chứng nhận có chữ ký số HMAC-SHA256
          độc bản. Quản trị viên P.CTSV có thẩm quyền thu hồi có kiểm toán.
        </p>
      </div>
      <div className="space-y-3">
        {certificates.map((cert) => (
          <article
            key={cert.id}
            className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-light text-indigo flex items-center justify-center font-bold">
                  CN
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">
                      {cert.recipientName}
                    </p>
                    <CertificateBadge status={cert.status} />
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {cert.eventTitle}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    {cert.code}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelected(cert)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Xem trước
                </button>
                {cert.status === "pending" && (
                  <button
                    onClick={() => issue(cert.id)}
                    className="px-3 py-2 rounded-xl bg-indigo text-white text-xs font-semibold"
                  >
                    Phát hành
                  </button>
                )}
                {cert.status === "issued" && (
                  <button
                    onClick={() => setRevokeId(cert.id)}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold"
                  >
                    Thu hồi
                  </button>
                )}
                {(cert.status === "revoked" || cert.status === "replaced") && (
                  <button
                    onClick={() => replace(cert.id)}
                    className="px-3 py-2 rounded-xl bg-indigo-light text-indigo text-xs font-semibold"
                  >
                    Cấp lại mã mới
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {selected && (
        <CertificatePreview
          certificate={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {revokeId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-lg">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Thu hồi Giấy chứng nhận số
                </h2>
                <p className="text-xs text-rose-600 font-semibold">
                  Mã HMAC-SHA256 độc bản
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Đánh dấu thu hồi chứng nhận điện tử nếu phát hiện sinh viên gian lận điểm danh hoặc vi phạm kỷ luật sau sự kiện. Lý do bắt buộc lưu trong <b>Nhật ký kiểm toán hệ thống</b>.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              placeholder="Nhập lý do thu hồi (Ví dụ: Phát hiện gian lận quẹt thẻ thay hoặc vi phạm quy chế sau sự kiện)..."
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setRevokeId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={revoke}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CertificateBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    ineligible: ["Chưa đủ điều kiện", "bg-slate-100 text-slate-600"],
    pending: ["Chờ phát hành", "bg-amber-50 text-amber-700"],
    issued: ["Đã phát hành", "bg-emerald-50 text-emerald-700"],
    revoked: ["Đã thu hồi", "bg-red-50 text-red-700"],
    replaced: ["Đã được thay thế", "bg-indigo-50 text-indigo-700"],
    HOP_LE: ["Chứng nhận hợp lệ", "bg-emerald-50 text-emerald-700"],
    DA_THU_HOI: ["Đã thu hồi", "bg-red-50 text-red-700"],
  }
  const [label, tone] = map[status] || [
    "Hợp lệ",
    "bg-emerald-50 text-emerald-700",
  ]
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>
      {label}
    </span>
  )
}

export function CertificatePreview({
  certificate,
  onClose,
}: {
  certificate: Certificate
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display font-bold text-lg text-navy">
            Xem trước chứng nhận
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100"
          >
            ×
          </button>
        </div>
        <div className="border-8 border-double border-indigo-200 rounded-2xl p-6 sm:p-10 text-center bg-indigo-50/30">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo font-bold">
            Campus Event Hub
          </p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-navy mt-5">
            CHỨNG NHẬN THAM GIA
          </h3>
          <p className="text-sm text-slate-500 mt-5">Trân trọng xác nhận</p>
          <p className="font-display text-2xl font-bold text-indigo mt-2">
            {certificate.recipientName}
          </p>
          <p className="text-sm text-slate-600 mt-4">
            đã tham gia với vai trò <b>{certificate.participantRole}</b> tại
          </p>
          <p className="font-display text-lg font-semibold text-navy mt-2">
            {certificate.eventTitle}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Ngày {certificate.eventTime} · {certificate.issuer}
          </p>
          <div className="w-24 h-24 mx-auto mt-6 grid grid-cols-5 gap-1 bg-white border border-slate-200 p-2">
            {Array.from({ length: 25 }, (_, i) => (
              <span
                key={i}
                className={
                  (i * 7 + certificate.code.length) % 3 ? "bg-navy" : "bg-white"
                }
              />
            ))}
          </div>
          <p className="text-xs font-mono text-slate-500 mt-2">
            {certificate.code}
          </p>
          <CertificateBadge status={certificate.status} />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl bg-indigo text-white font-semibold text-sm"
          >
            Tải PDF chứng nhận
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-semibold text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
