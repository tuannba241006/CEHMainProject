import { useMemo, useState, useEffect, useCallback } from "react"
import type { Role } from "../../App"
import {
  useApp,
  type ApprovalCase,
  type ApprovalStatus,
} from "../../context/AppContext"
import { resolveFacultyFromUnit } from "../../context/ApprovalDataContext"
import { useToast } from "../../components/Toast"
import { ManagementLayout } from "./ManagementLayout"
import { useUser } from "../../context/UserContext"
import { formatCalendarDate, inDateRange } from "../../utils/date"
import { eventsService } from "../../api/services/events.service"
import { roomsService } from "../../api/services/rooms.service"
import { getApiErrorMessage, isAuthError } from "../../api/errors"
import type { EventManageDetail, RoomPublic } from "../../data/contract"
import { AlertTriangle, Zap, RotateCcw, RefreshCw, Building2, Check } from "lucide-react"

const AUDIT_ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Gửi đề xuất phê duyệt",
  WITHDRAW_PROPOSAL: "Rút đề xuất về bản nháp",
  COHOST_ACCEPT: "Đồng tổ chức xác nhận tham gia",
  COHOST_REJECT: "Đồng tổ chức từ chối lời mời",
  EXPIRE_COHOST_HOLD: "Hết hạn giữ chỗ 48h (Tự động)",
  APPROVE_FACULTY: "Khoa phê duyệt & chuyển P.CTSV",
  APPROVE_FACULTY_BY_ADMIN: "Admin P.CTSV duyệt thay cấp Khoa",
  REJECT_FACULTY: "Khoa từ chối hồ sơ",
  APPROVE_ADMIN: "P.CTSV phê duyệt chính thức",
  REJECT_ADMIN: "P.CTSV từ chối hồ sơ",
  AUTO_REJECT_EXPIRED: "Tự động từ chối do quá hạn",
  REQUEST_EDIT: "Yêu cầu chỉnh sửa bổ sung",
  CHANGE_ROOM: "Điều chuyển phòng khẩn cấp",
  CANCEL_EVENT: "Hủy sự kiện khẩn cấp",
}

const COHOST_STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  CHO_XAC_NHAN: { label: "Chờ xác nhận", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  DONG_Y: { label: "Đã đồng ý", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  TU_CHOI: { label: "Đã từ chối", tone: "bg-rose-50 text-rose-700 border-rose-200" },
}

function formatTimeHm(iso?: string | null): string {
  if (!iso) return ""
  const m = String(iso).match(/T(\d{2}:\d{2})/)
  if (m) return m[1]
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })
}

function formatDateTimeVi(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  })
}

function mapDetailStatusToApproval(rawStatus: string): ApprovalStatus {
  const s = String(rawStatus || "").toUpperCase()
  if (s === "PENDING_FACULTY" || s === "WAITING_COHOST_CONFIRM") return "faculty_pending"
  if (s === "PENDING_ADMIN") return "affairs_pending"
  if (s === "APPROVED" || s === "PUBLISHED" || s === "HAPPENING" || s === "COMPLETED") return "approved"
  if (s === "REJECTED" || s === "COHOST_REJECTED") return "faculty_rejected"
  return "draft"
}

function mapDetailToApprovalCase(d: EventManageDetail): ApprovalCase {
  const unitName = d.don_vi_host?.ten_don_vi || d.ten_don_vi_host || "Ban tổ chức"
  return {
    id: `HS-${d.ma_su_kien}`,
    eventId: String(d.ma_su_kien),
    title: d.ten_su_kien,
    unit: unitName,
    faculty: resolveFacultyFromUnit(unitName),
    submitter: unitName,
    speaker: d.dien_gia || "",
    topicName: d.chuyen_de?.ten_chuyen_de || d.ten_chuyen_de || "",
    roomName: d.phong?.ten_phong || d.ten_phong || "",
    campus: (d.phong?.co_so ?? d.co_so) === "CoSo2" ? "Cơ sở 2" : "Cơ sở 1",
    startTime: d.thoi_gian_bat_dau,
    endTime: d.thoi_gian_ket_thuc,
    submittedAt: formatCalendarDate(d.thoi_gian_tao || d.thoi_gian_bat_dau),
    eventDate: (d.thoi_gian_bat_dau || "").slice(0, 10),
    status: mapDetailStatusToApproval(d.trang_thai),
    lifecycle: "scheduled",
    description: d.mo_ta || "",
    plan: "",
    documents: [],
    proposedPoints: d.diem_drl_du_kien ?? 0,
    semester: "",
    criteriaCode:
      d.dieu_khoan_drl === "Dieu4"
        ? "Điều 4"
        : d.dieu_khoan_drl === "Dieu3"
          ? "Điều 3"
          : "Không có",
    maxPoints: d.diem_drl_du_kien ?? 0,
    validMinutes: 0,
    thresholds: [],
    requiredSessions: [],
    certificateCondition: "",
    ruleBasis: "",
    ruleVersion: "",
    history: [],
  }
}

interface Props {
  role: Extract<Role, "faculty_manager" | "student_affairs">
  selectedId: string | null
  onSelect: (id: string) => void
  onNavigate: (screen: string) => void
  onLogout: () => void
}

const STATUS: Record<ApprovalStatus, { label: string; tone: string }> = {
  draft: { label: "Bản nháp", tone: "bg-slate-100 text-slate-600" },
  faculty_pending: {
    label: "Chờ khoa duyệt",
    tone: "bg-amber-50 text-amber-700",
  },
  faculty_revision: {
    label: "Khoa yêu cầu bổ sung",
    tone: "bg-orange-50 text-orange-700",
  },
  faculty_rejected: { label: "Khoa từ chối", tone: "bg-red-50 text-red-700" },
  faculty_approved: { label: "Khoa đã duyệt", tone: "bg-sky-50 text-sky-700" },
  affairs_pending: {
    label: "Chờ CTSV duyệt",
    tone: "bg-indigo-50 text-indigo-700",
  },
  affairs_revision: {
    label: "CTSV yêu cầu bổ sung",
    tone: "bg-orange-50 text-orange-700",
  },
  affairs_rejected: { label: "CTSV từ chối", tone: "bg-red-50 text-red-700" },
  approved: {
    label: "Đủ điều kiện công bố",
    tone: "bg-emerald-50 text-emerald-700",
  },
}

export default function ApprovalWorkspace({
  role,
  selectedId,
  onSelect,
  onNavigate,
  onLogout,
}: Props) {
  const { approvalCases, refreshReviewQueue } = useApp()
  const { user, role: activeRole } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<EventManageDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const numericSelectedId = useMemo(() => {
    if (!selectedId) return null
    const parsed = Number(selectedId.replace(/\D/g, ""))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [selectedId])

  const loadDetailRecord = useCallback(async () => {
    if (!numericSelectedId) {
      setDetailRecord(null)
      setDetailError(null)
      return
    }
    setDetailLoading(true)
    setDetailError(null)
    try {
      const res = await eventsService.organizerDetail(numericSelectedId)
      if (res.data) {
        setDetailRecord(res.data)
      }
    } catch (err: unknown) {
      setDetailRecord(null)
      setDetailError(getApiErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }, [numericSelectedId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    if (refreshReviewQueue) {
      void refreshReviewQueue()
        .catch((err: unknown) => {
          console.warn("Review queue API note:", err)
          if (!cancelled && !isAuthError(err) && (!approvalCases || approvalCases.length === 0)) {
            setError(getApiErrorMessage(err))
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      setLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadDetailRecord()
  }, [loadDetailRecord])

  const faculty = user.faculty || user.khoa || ""
  const canView = (item: ApprovalCase) =>
    role !== "faculty_manager" ||
    activeRole === "admin" ||
    faculty
      .replace(/^Khoa\s+/i, "")
      .trim()
      .toLocaleLowerCase("vi") ===
      item.faculty
        .replace(/^Khoa\s+/i, "")
        .trim()
        .toLocaleLowerCase("vi")

  const queueMatch = selectedId
    ? approvalCases.find(
        (item) =>
          (item.id === selectedId || item.eventId === String(numericSelectedId ?? "")) &&
          canView(item),
      )
    : undefined

  const detail: ApprovalCase | undefined = useMemo(() => {
    if (!selectedId) return undefined
    if (detailRecord && detailRecord.ma_su_kien === numericSelectedId) {
      const mapped = mapDetailToApprovalCase(detailRecord)
      return canView(mapped) ? mapped : undefined
    }
    return queueMatch
  }, [selectedId, detailRecord, numericSelectedId, queueMatch])

  const current =
    role === "faculty_manager"
      ? detail
        ? "faculty-detail"
        : "faculty-inbox"
      : detail
        ? "affairs-detail"
        : "affairs-inbox"
  return (
    <ManagementLayout
      role={role}
      current={current}
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      {selectedId && detailLoading && !detail ? (
        <div className="p-8 max-w-2xl space-y-4 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-100 rounded-2xl w-full" />
        </div>
      ) : selectedId && !detail ? (
        <div className="p-8 max-w-xl">
          <h2 className="text-xl font-semibold text-navy">
            Hồ sơ không tồn tại hoặc ngoài phạm vi quản lý
          </h2>
          <p className="text-slate-600 mt-2">
            {detailError || "Chỉ những hồ sơ thuộc đơn vị được phân quyền mới có thể truy cập."}
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-xl bg-indigo text-white"
            onClick={() =>
              onNavigate(
                role === "faculty_manager" ? "faculty-inbox" : "affairs-inbox",
              )
            }
          >
            Quay lại danh sách
          </button>
        </div>
      ) : detail ? (
        <ApprovalDetail
          item={detail}
          detailRecord={detailRecord}
          role={role}
          onRefreshDetail={async () => {
            await loadDetailRecord()
            if (refreshReviewQueue) await refreshReviewQueue()
          }}
          onBack={() =>
            onNavigate(
              role === "faculty_manager" ? "faculty-inbox" : "affairs-inbox",
            )
          }
        />
      ) : (
        <ApprovalList
          role={role}
          cases={approvalCases}
          onSelect={onSelect}
          faculty={faculty}
          isAdmin={activeRole === "admin"}
          loading={loading}
          error={error}
        />
      )}
    </ManagementLayout>
  )
}

function ApprovalList({
  role,
  cases,
  onSelect,
  faculty,
  isAdmin,
  loading,
  error,
}: {
  role: Props["role"]
  cases: ApprovalCase[]
  onSelect: (id: string) => void
  faculty: string
  isAdmin: boolean
  loading?: boolean
  error?: string | null
}) {
  const [search, setSearch] = useState("")
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [status, setStatus] = useState("all")
  const [unit, setUnit] = useState("all")
  const [term, setTerm] = useState("semester")
  const activeFaculty = faculty
    .replace(/^Khoa\s+/i, "")
    .trim()
    .toLocaleLowerCase("vi")
  const scoped = cases.filter((item) =>
    role === "faculty_manager"
      ? (isAdmin ||
          item.faculty
            .replace(/^Khoa\s+/i, "")
            .trim()
            .toLocaleLowerCase("vi") === activeFaculty) &&
        ["faculty_pending", "faculty_revision", "faculty_rejected"].includes(
          item.status,
        )
      : [
          "affairs_pending",
          "affairs_revision",
          "approved",
          "affairs_rejected",
        ].includes(item.status),
  )
  const filtered = scoped.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (unit === "all" || item.unit === unit) &&
      (term === "all" ||
        inDateRange(item.eventDate, "2026-09-01", "2026-12-31")) &&
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.submitter.toLowerCase().includes(search.toLowerCase())),
  )
  const units = [...new Set(scoped.map((item) => item.unit))]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo mb-2">
          {role === "faculty_manager"
            ? `Phạm vi: ${faculty || "Khoa chưa xác định"}`
            : "Thẩm định cấp trường"}
        </p>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-navy">
          {role === "faculty_manager"
            ? "Sự kiện chờ khoa duyệt"
            : "Sự kiện chờ CTSV duyệt"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {role === "faculty_manager"
            ? "Duyệt hồ sơ thuộc khoa và chuyển Phòng CTSV."
            : "Thẩm định sự kiện và quy tắc điểm dự kiến."}
        </p>
      </div>

      {error && !errorDismissed && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-2.5 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorDismissed(true)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          ["Tổng hồ sơ", scoped.length],
          [
            "Chờ xử lý",
            scoped.filter((item) => item.status.endsWith("pending")).length,
          ],
          [
            "Cần bổ sung",
            scoped.filter((item) => item.status.endsWith("revision")).length,
          ],
          [
            "Đã xử lý",
            scoped.filter(
              (item) =>
                item.status === "approved" || item.status.endsWith("rejected"),
            ).length,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <p className="font-display font-bold text-2xl text-indigo">
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 shadow-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên sự kiện, người gửi..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS).map(([value, item]) => (
              <option key={value} value={value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="all">Tất cả đơn vị</option>
            {units.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <label className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-3">
          <span>Thời gian tổ chức:</span>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-white"
            aria-label="Lọc thời gian tổ chức"
          >
            <option value="semester">Học kỳ 1 · 01/09/2026 – 31/12/2026</option>
            <option value="all">Toàn bộ thời gian</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/4 mb-2" />
          <div className="h-10 bg-slate-100 rounded w-full" />
          <div className="h-10 bg-slate-100 rounded w-full" />
          <div className="h-10 bg-slate-100 rounded w-full" />
          <div className="h-10 bg-slate-100 rounded w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="font-medium text-slate-500">Không có hồ sơ phù hợp</p>
          <p className="text-sm text-slate-400 mt-1">
            Hãy thử thay đổi bộ lọc.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  {[
                    "Tên sự kiện",
                    "Đơn vị chủ trì",
                    "Ngày tạo",
                    "Ngày tổ chức",
                    "Điểm đề xuất",
                    "Trạng thái",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy max-w-xs">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{item.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-600">{item.unit}</p>
                      <p className="text-xs text-slate-400">
                        {item.topicName || "Sự kiện UIT"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatCalendarDate(item.submittedAt)}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatCalendarDate(item.eventDate)}
                    </td>
                    <td className="px-4 py-4 font-mono text-indigo">
                      {item.proposedPoints}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => onSelect(item.id)}
                        className="px-3 py-2 rounded-xl bg-indigo-light text-indigo text-xs font-semibold whitespace-nowrap"
                      >
                        Xem hồ sơ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-navy">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.id} · {item.unit}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 my-4">
                  <p>
                    Chuyên đề
                    <br />
                    <b className="text-slate-700">{item.topicName || "Sự kiện UIT"}</b>
                  </p>
                  <p>
                    Ngày tổ chức
                    <br />
                    <b className="text-slate-700">
                      {formatCalendarDate(item.eventDate)}
                    </b>
                  </p>
                </div>
                <button
                  onClick={() => onSelect(item.id)}
                  className="w-full py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold"
                >
                  Xem hồ sơ
                </button>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
            <span>
              Hiển thị 1–{filtered.length} / {filtered.length} hồ sơ
            </span>
            <span>Trang 1 / 1</span>
          </div>
        </>
      )}
    </div>
  )
}

function ApprovalDetail({
  item,
  detailRecord,
  role,
  onRefreshDetail,
  onBack,
}: {
  item: ApprovalCase
  detailRecord: EventManageDetail | null
  role: Props["role"]
  onRefreshDetail: () => Promise<void>
  onBack: () => void
}) {
  const { updateApproval } = useApp()
  const { role: activeRole } = useUser()
  const { showToast } = useToast()
  const [dialog, setDialog] =
    useState<
      | "revision"
      | "reject"
      | "emergency_room"
      | "emergency_cancel"
      | "withdraw"
      | "reopen"
      | "faculty_approve_by_admin"
      | null
    >(null)
  const [reason, setReason] = useState("")
  const [newRoomId, setNewRoomId] = useState("")
  const [rooms, setRooms] = useState<RoomPublic[]>([])
  const [busy, setBusy] = useState(false)
  const [tab, setTab] =
    useState<"overview" | "documents" | "points" | "history">("overview")

  useEffect(() => {
    if (dialog !== "emergency_room" || rooms.length > 0) return
    let active = true
    roomsService
      .list()
      .then((res) => {
        if (active && Array.isArray(res.data)) {
          const mapped: RoomPublic[] = (res.data as Array<Partial<RoomPublic> & { suc_chua_toi_da?: number }>).map(
            (r) => ({
              ma_phong: Number(r.ma_phong),
              ten_phong: r.ten_phong || "Hội trường",
              suc_chua: Number(r.suc_chua_toi_da ?? r.suc_chua ?? 100),
              co_so: (r.co_so === "CoSo2" ? "CoSo2" : "CoSo1") as RoomPublic["co_so"],
              toa_nha: r.toa_nha || "",
              vi_tri_tang: Number(r.vi_tri_tang ?? 1),
              thiet_bi: r.thiet_bi || { may_chieu: true, am_thanh: true, wifi: true },
              trang_thai: r.trang_thai,
            }),
          )
          setRooms(mapped)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [dialog, rooms.length])

  const isAdminOrAffairs = role === "student_affairs" || activeRole === "admin"
  const canProcess =
    role === "faculty_manager"
      ? item.status === "faculty_pending"
      : item.status === "affairs_pending"

  const canAdminOverrideFaculty =
    isAdminOrAffairs && item.status === "faculty_pending"
  const canWithdrawProposal =
    isAdminOrAffairs &&
    (item.status === "faculty_pending" || item.status === "affairs_pending")
  const canReopenRejected =
    isAdminOrAffairs &&
    (item.status === "faculty_rejected" || item.status === "affairs_rejected")

  async function act(
    action:
      | "faculty_approve"
      | "faculty_approve_by_admin"
      | "affairs_approve"
      | "request_revision"
      | "reject"
      | "withdraw"
      | "reopen"
      | "emergency_cancel"
      | "emergency_room",
  ) {
    if (busy) return
    setBusy(true)
    try {
      if (action === "emergency_cancel") {
        await eventsService.emergencyCancel(item.eventId, reason.trim())
      } else if (action === "emergency_room") {
        const roomId = Number(newRoomId)
        await eventsService.changeRoom(item.eventId, {
          ma_phong_moi: roomId,
          ly_do: reason.trim(),
        })
      } else if (action === "withdraw") {
        await eventsService.withdraw(item.eventId, reason.trim())
      } else if (action === "reopen") {
        await eventsService.reopen(item.eventId, reason.trim())
      } else {
        const hanh_dong =
          action === "faculty_approve"
            ? "APPROVE_FACULTY"
            : action === "faculty_approve_by_admin"
              ? "APPROVE_FACULTY_BY_ADMIN"
              : action === "affairs_approve"
                ? "APPROVE_ADMIN"
                : action === "request_revision"
                  ? "REQUEST_EDIT"
                  : role === "faculty_manager"
                    ? "REJECT_FACULTY"
                    : "REJECT_ADMIN"
        await eventsService.review(item.eventId, {
          hanh_dong,
          ...(reason.trim() ? { ly_do: reason.trim() } : {}),
        })
      }
      const result = await updateApproval(item.id, action, reason, true)
      if (!result.success)
        throw new Error(result.error || "Không thể xử lý hồ sơ.")
      await onRefreshDetail()
      showToast(
        action.includes("approve")
          ? "Đã duyệt hồ sơ thành công."
          : action === "emergency_cancel"
            ? "Đã hủy sự kiện khẩn cấp và gửi thông báo thu hồi vé."
            : action === "emergency_room"
              ? "Đã điều chuyển phòng khẩn cấp và thông báo cho sinh viên."
              : action === "withdraw"
                ? "Đã rút đề xuất cưỡng chế về bản nháp (giải phóng phòng)."
                : action === "reopen"
                  ? "Đã tái mở bản nháp để chỉnh sửa."
                  : "Đã cập nhật trạng thái hồ sơ.",
        action === "emergency_cancel" ? "warning" : "success",
      )
      setDialog(null)
      setReason("")
      setNewRoomId("")
    } catch (error) {
      showToast(getApiErrorMessage(error), "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl">
      <button
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-indigo mb-4"
      >
        ← Quay lại danh sách
      </button>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-slate-400">{item.id}</span>
            <StatusBadge status={item.status} />
          </div>
          <h1 className="font-display font-bold text-2xl text-navy">
            {item.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {item.unit}
            {detailRecord?.chuyen_de?.ten_chuyen_de || item.topicName
              ? ` · ${detailRecord?.chuyen_de?.ten_chuyen_de || item.topicName}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAdminOverrideFaculty && (
            <button
              onClick={() => setDialog("faculty_approve_by_admin")}
              disabled={busy}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              title="Admin/CTSV can thiệp duyệt thay cấp Khoa khi Khoa chậm trễ hoặc gặp sự cố"
            >
              <Zap className="w-4 h-4" />
              <span>Duyệt thay cấp Khoa (Sự cố)</span>
            </button>
          )}

          {canWithdrawProposal && (
            <button
              onClick={() => setDialog("withdraw")}
              disabled={busy}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              title="Can thiệp rút hồ sơ đang thẩm định về bản nháp và tự động giải phóng phòng đã giữ chỗ"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rút đề xuất cưỡng chế</span>
            </button>
          )}

          {canReopenRejected && (
            <button
              onClick={() => setDialog("reopen")}
              disabled={busy}
              className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              title="Khôi phục sự kiện bị từ chối về bản nháp để chỉnh sửa"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tái mở bản nháp</span>
            </button>
          )}

          {canProcess && (
            <>
              <button
                onClick={() => setDialog("reject")}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 cursor-pointer transition-colors"
              >
                Từ chối
              </button>
              <button
                onClick={() => setDialog("revision")}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-50 cursor-pointer transition-colors"
              >
                Yêu cầu bổ sung
              </button>
              <button
                onClick={() =>
                  act(
                    role === "faculty_manager"
                      ? "faculty_approve"
                      : "affairs_approve",
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition-colors"
              >
                {role === "faculty_manager"
                  ? "Duyệt & chuyển CTSV"
                  : "Duyệt sự kiện & quy tắc điểm"}
              </button>
            </>
          )}

          {/* UC-EVT-03: Emergency Actions for Approved Events */}
          {item.status === "approved" && (
            <>
              <button
                onClick={() => setDialog("emergency_room")}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold cursor-pointer hover:bg-amber-100 flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Đổi phòng khẩn cấp</span>
              </button>
              <button
                onClick={() => setDialog("emergency_cancel")}
                className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer hover:bg-rose-100 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Hủy sự kiện khẩn cấp</span>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 overflow-x-auto no-scrollbar mb-5">
        {([
          ["overview", "Thông tin"],
          ["documents", "Kế hoạch & Lịch trình"],
          ["points", "Đề xuất điểm"],
          ["history", "Lịch sử xử lý"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              tab === value
                ? "bg-white text-indigo shadow-sm"
                : "text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && (() => {
        const startIso = detailRecord?.thoi_gian_bat_dau || item.startTime || item.eventDate
        const endIso = detailRecord?.thoi_gian_ket_thuc || item.endTime || ""
        const startHm = formatTimeHm(startIso)
        const endHm = formatTimeHm(endIso)
        const roomName = detailRecord?.phong?.ten_phong || detailRecord?.ten_phong || item.roomName || "Chưa cập nhật"
        const campusLabel =
          (detailRecord?.phong?.co_so ?? detailRecord?.co_so) === "CoSo2"
            ? "Cơ sở 2"
            : "Cơ sở 1"
        const roomCap = detailRecord?.phong?.suc_chua_toi_da
        const roomText = roomCap
          ? `${roomName} · ${campusLabel} · ${roomCap} chỗ`
          : roomName
        const isUnlimited = detailRecord?.khong_gioi_han_slot ?? false
        const ticketScale = isUnlimited
          ? "Mở tự do (không giới hạn)"
          : detailRecord?.so_luong_toi_da != null
            ? `${detailRecord.so_luong_toi_da} vé`
            : "Chưa cập nhật"
        const topicText = detailRecord?.chuyen_de?.ten_chuyen_de || detailRecord?.ten_chuyen_de || item.topicName || "Chưa cập nhật"
        const speakerText = detailRecord?.dien_gia || item.speaker || "Chưa cập nhật"
        const targetAudience = detailRecord?.doi_tuong_tham_gia || "Toàn thể sinh viên UIT"
        const descriptionText = detailRecord?.mo_ta || item.description || "Chưa có mô tả chi tiết."

        return (
          <div className="grid lg:grid-cols-3 gap-4">
            <Card title="Thông tin sự kiện" className="lg:col-span-2">
              <InfoGrid
                values={[
                  ["Ngày tổ chức", formatCalendarDate(startIso)],
                  ["Khung giờ", startHm && endHm ? `${startHm} – ${endHm}` : "Chưa cập nhật"],
                  ["Phòng / Hội trường", roomText],
                  ["Quy mô vé", ticketScale],
                  ["Đơn vị chủ trì", item.unit],
                  ["Khoa quản lý", item.faculty],
                  ["Chuyên đề", topicText],
                  ["Diễn giả / Khách mời", speakerText],
                  ["Đối tượng tham gia", targetAudience],
                ]}
              />
              <p className="text-sm text-slate-600 leading-relaxed mt-4 pt-4 border-t border-slate-100 whitespace-pre-line">
                {descriptionText}
              </p>
            </Card>
            <Card title="Tiến trình phê duyệt">
              <Progress status={item.status} />
            </Card>
          </div>
        )
      })()}
      {tab === "documents" && (() => {
        const agenda = Array.isArray(detailRecord?.lo_trinh) ? detailRecord.lo_trinh : []
        const cohosts = Array.isArray(detailRecord?.danh_sach_dong_to_chuc)
          ? detailRecord.danh_sach_dong_to_chuc
          : []
        return (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Lịch trình chi tiết (Agenda)">
              {agenda.length > 0 ? (
                <div className="space-y-2.5">
                  {agenda.map((slot, idx) => {
                    const raw = slot as unknown as {
                      time?: string
                      title?: string
                      thoi_gian?: string
                      thoi_gian_bat_dau?: string
                      thoi_gian_ket_thuc?: string
                      tieu_de?: string
                      dien_gia?: string | null
                    }
                    const slotTime =
                      raw.time ||
                      raw.thoi_gian ||
                      (raw.thoi_gian_bat_dau && raw.thoi_gian_ket_thuc
                        ? `${raw.thoi_gian_bat_dau} – ${raw.thoi_gian_ket_thuc}`
                        : raw.thoi_gian_bat_dau) ||
                      "—"
                    const slotTitle = raw.title || raw.tieu_de || "Hoạt động sự kiện"
                    return (
                      <div
                        key={`${slotTime}-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="font-mono text-xs font-bold text-indigo bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0">
                          {slotTime}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700 font-medium">
                            {slotTitle}
                          </p>
                          {raw.dien_gia && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              Phụ trách: {raw.dien_gia}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Chưa có lịch trình chi tiết được đính kèm.
                </p>
              )}
            </Card>
            <Card title="Đơn vị đồng tổ chức">
              {cohosts.length > 0 ? (
                <div className="space-y-2.5">
                  {cohosts.map((ch, idx) => {
                    const obj = ch as {
                      ma_don_vi_to_chuc?: number
                      ten_don_vi?: string
                      trang_thai_xac_nhan?: string
                      ghi_chu_tu_choi?: string | null
                      don_vi?: { ma_don_vi?: number; ten_don_vi?: string }
                    }
                    const name = obj.ten_don_vi || obj.don_vi?.ten_don_vi || "Đơn vị đồng tổ chức"
                    const st = obj.trang_thai_xac_nhan || "CHO_XAC_NHAN"
                    const badge = COHOST_STATUS_LABELS[st] || COHOST_STATUS_LABELS.CHO_XAC_NHAN
                    return (
                      <div
                        key={obj.ma_don_vi_to_chuc || obj.don_vi?.ma_don_vi || idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-700">{name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.tone}`}>
                            {badge.label}
                          </span>
                        </div>
                        {obj.ghi_chu_tu_choi && (
                          <p className="text-xs text-rose-600 mt-1.5">
                            Lý do: {obj.ghi_chu_tu_choi}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Sự kiện không có đơn vị đồng tổ chức.
                </p>
              )}
            </Card>
          </div>
        )
      })()}
      {tab === "points" && (() => {
        const drlRule = detailRecord?.dieu_khoan_drl
        const drlLabel =
          drlRule === "Dieu4"
            ? "Điều 4 — Tham gia hoạt động chính trị, xã hội, văn hóa, thể thao"
            : drlRule === "Dieu3"
              ? "Điều 3 — Ý thức và kết quả học tập, nghiên cứu khoa học"
              : drlRule === "KhongCo"
                ? "Không cộng điểm rèn luyện"
                : item.criteriaCode || "Chưa cập nhật"
        const drlPoints = detailRecord?.diem_drl_du_kien ?? item.proposedPoints ?? 0
        const volunteerHours = detailRecord?.gio_tinh_nguyen ?? 0
        const durationMinutes = (() => {
          if (!detailRecord?.thoi_gian_bat_dau || !detailRecord?.thoi_gian_ket_thuc) return null
          const diff = Math.round(
            (new Date(detailRecord.thoi_gian_ket_thuc).getTime() -
              new Date(detailRecord.thoi_gian_bat_dau).getTime()) /
              60000,
          )
          return Number.isFinite(diff) && diff > 0 ? diff : null
        })()
        return (
          <div className="space-y-4">
            <div className="rounded-2xl bg-indigo-light border border-indigo-100 p-4">
              <p className="text-sm font-semibold text-indigo">
                Đây là mức điểm rèn luyện và giờ tình nguyện dự kiến.
              </p>
              <p className="text-sm text-indigo/80 mt-1">
                Điểm thực tế được chốt sau khi đối soát dữ liệu điểm danh và khảo sát phản hồi của sinh viên.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Cấu hình điểm rèn luyện (Từ dữ liệu sự kiện)">
                <InfoGrid
                  values={[
                    ["Điều khoản ĐRL", drlLabel],
                    ["Điểm ĐRL dự kiến", `${drlPoints} điểm`],
                    ["Giờ tình nguyện", `${volunteerHours} giờ`],
                    ["Thời lượng dự kiến", durationMinutes ? `${durationMinutes} phút` : "Chưa xác định"],
                  ]}
                />
              </Card>
              <Card title="Quy tắc công nhận theo tỷ lệ tham dự">
                <div className="space-y-2">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm">
                    <span>Tham dự từ 80% thời lượng trở lên</span>
                    <b className="text-indigo">{drlPoints} điểm (100%)</b>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm">
                    <span>Tham dự từ 50% đến dưới 80% thời lượng</span>
                    <b className="text-slate-700">{(drlPoints * 0.5).toFixed(1).replace(/\.0$/, "")} điểm (50%)</b>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Sinh viên cần hoàn tất điểm danh vào/ra và gửi khảo sát đánh giá để đủ điều kiện nhận điểm rèn luyện và chứng nhận.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )
      })()}
      {tab === "history" && (() => {
        const dbLogs = Array.isArray(detailRecord?.lich_su_kiem_duyet)
          ? [...detailRecord.lich_su_kiem_duyet].reverse()
          : []
        const entries =
          dbLogs.length > 0
            ? dbLogs.map((log) => ({
                id: String(log.id),
                action: AUDIT_ACTION_LABELS[log.hanh_dong] || log.hanh_dong,
                actor: log.nguoi_thuc_hien?.ho_ten || "Hệ thống tự động",
                at: formatDateTimeVi(log.thoi_gian_tao),
                note: log.ly_do || undefined,
              }))
            : [...item.history].reverse()
        return (
          <Card title="Nhật ký kiểm duyệt">
            {entries.length === 0 ? (
              <p className="text-sm text-slate-400">
                Chưa có lịch sử xử lý nào được ghi nhận cho hồ sơ này.
              </p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-light text-indigo flex items-center justify-center text-xs font-bold shrink-0">
                      {entries.length - index}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {entry.action}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.actor} · {entry.at}
                      </p>
                      {entry.note && (
                        <p className="text-sm text-slate-600 mt-1 p-2.5 bg-slate-50 rounded-lg">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}
      {dialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-display font-bold text-lg text-navy">
              {dialog === "revision"
                ? "Yêu cầu bổ sung hồ sơ"
                : dialog === "reject"
                  ? "Từ chối hồ sơ"
                  : dialog === "emergency_room"
                    ? "Điều chuyển phòng khẩn cấp"
                    : dialog === "emergency_cancel"
                      ? "Hủy sự kiện khẩn cấp"
                      : dialog === "withdraw"
                        ? "Rút đề xuất cưỡng chế (Về bản nháp)"
                        : dialog === "faculty_approve_by_admin"
                          ? "Duyệt thay cấp Khoa (P.CTSV can thiệp)"
                          : "Tái mở bản nháp để chỉnh sửa"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {dialog === "emergency_room"
                ? "Chọn phòng mới khả dụng và nhập lý do sự cố kỹ thuật:"
                : dialog === "emergency_cancel"
                  ? "Cảnh báo: Toàn bộ vé sinh viên đã nhận sẽ tự động bị thu hồi kèm email thông báo xin lỗi."
                  : dialog === "withdraw"
                    ? "Admin can thiệp rút hồ sơ đang thẩm định về bản nháp. Phòng hội trường đang giữ chỗ sẽ được tự động giải phóng. Yêu cầu nhập lý do kiểm toán (tối thiểu 10 ký tự):"
                    : dialog === "reopen"
                      ? "Khôi phục hồ sơ đã bị từ chối quay về bản nháp để Ban tổ chức có thể hoàn thiện lại. Yêu cầu nhập lý do kiểm toán (tối thiểu 10 ký tự):"
                      : dialog === "faculty_approve_by_admin"
                        ? "Admin can thiệp phê duyệt thay cấp Khoa khi Khoa chậm trễ hoặc gặp sự cố kỹ thuật. Yêu cầu nhập lý do kiểm toán (tối thiểu 5 ký tự):"
                        : "Lý do là bắt buộc (tối thiểu 10 ký tự) và sẽ được lưu trong lịch sử kiểm toán."}
            </p>

            {dialog === "emergency_room" && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn phòng hội trường thay thế:
                </label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                >
                  <option value="">-- Chọn phòng từ danh mục --</option>
                  {rooms.map((r) => (
                    <option
                      key={r.ma_phong}
                      value={String(r.ma_phong)}
                      disabled={r.trang_thai === "BaoTri"}
                    >
                      {r.ten_phong} (Sức chứa {r.suc_chua} chỗ · {r.co_so === "CoSo2" ? "Cơ sở 2" : "Cơ sở 1"})
                      {r.trang_thai === "BaoTri" ? " [ĐANG BẢO TRÌ]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                dialog === "emergency_room"
                  ? "Lý do đổi phòng (VD: Hệ thống máy chiếu Hội trường A gặp sự cố)..."
                  : dialog === "withdraw"
                    ? "Lý do rút đề xuất cưỡng chế (tối thiểu 10 ký tự)..."
                    : dialog === "reopen"
                      ? "Lý do tái mở bản nháp để Ban tổ chức chỉnh sửa (tối thiểu 10 ký tự)..."
                      : dialog === "faculty_approve_by_admin"
                        ? "Lý do Admin duyệt thay cấp Khoa (tối thiểu 5 ký tự)..."
                        : "Nhập lý do cụ thể (tối thiểu 10 ký tự)..."
              }
              className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setDialog(null)
                  setReason("")
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (dialog === "emergency_room") {
                    act("emergency_room")
                  } else if (dialog === "emergency_cancel") {
                    act("emergency_cancel")
                  } else if (dialog === "withdraw") {
                    act("withdraw")
                  } else if (dialog === "reopen") {
                    act("reopen")
                  } else if (dialog === "faculty_approve_by_admin") {
                    act("faculty_approve_by_admin")
                  } else {
                    act(dialog === "revision" ? "request_revision" : "reject")
                  }
                }}
                disabled={
                  busy ||
                  !reason.trim() ||
                  ((dialog === "reject" ||
                    dialog === "revision" ||
                    dialog === "withdraw" ||
                    dialog === "reopen") &&
                    reason.trim().length < 10) ||
                  ((dialog === "faculty_approve_by_admin" ||
                    dialog === "emergency_room" ||
                    dialog === "emergency_cancel") &&
                    reason.trim().length < 5) ||
                  (dialog === "emergency_room" && !newRoomId)
                }
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer disabled:opacity-50 ${
                  dialog === "reject" ||
                  dialog === "emergency_cancel" ||
                  dialog === "withdraw"
                    ? "bg-red-600 hover:bg-red-700"
                    : dialog === "reopen"
                      ? "bg-indigo hover:bg-indigo-700"
                      : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const item = STATUS[status]
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${item.tone}`}
    >
      {item.label}
    </span>
  )
}
function Card({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}
    >
      <h2 className="font-display font-semibold text-base text-navy mb-4">
        {title}
      </h2>
      {children}
    </section>
  )
}
function InfoGrid({ values }: { values: Array<[string, string]> }) {
  return (
    <dl className="grid sm:grid-cols-2 gap-4">
      {values.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-slate-400 mb-1">{label}</dt>
          <dd className="text-sm font-medium text-slate-700">
            {value || "Chưa cập nhật"}
          </dd>
        </div>
      ))}
    </dl>
  )
}
function Progress({ status }: { status: ApprovalStatus }) {
  const steps = [
    "Ban tổ chức gửi",
    "Khoa duyệt",
    "CTSV duyệt",
    "Đủ điều kiện công bố",
  ]
  const index =
    status === "approved"
      ? 3
      : status.startsWith("affairs")
        ? 2
        : status.startsWith("faculty")
          ? 1
          : 0
  return (
    <div className="space-y-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= index
                ? "bg-indigo text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            {i < index ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span
            className={`text-sm ${
              i <= index ? "font-medium text-navy" : "text-slate-400"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
