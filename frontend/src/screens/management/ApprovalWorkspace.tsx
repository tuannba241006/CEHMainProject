import { useMemo, useState } from "react"
import type { Role } from "../../App"
import {
  useApp,
  type ApprovalCase,
  type ApprovalStatus,
} from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { ManagementLayout } from "./ManagementLayout"
import { useUser } from "../../context/UserContext"
import { formatCalendarDate, inDateRange } from "../../utils/date"
import { isApiMode } from "../../api/config"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage } from "../../api/errors"
import { ROOMS } from "../../data/mock"

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
  const { approvalCases } = useApp()
  const { user, role: activeRole } = useUser()
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
  const detail = selectedId
    ? approvalCases.find((item) => item.id === selectedId && canView(item))
    : undefined
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
      {selectedId && !detail ? (
        <div className="p-8 max-w-xl">
          <h2 className="text-xl font-semibold text-navy">
            Hồ sơ không tồn tại hoặc ngoài phạm vi quản lý
          </h2>
          <p className="text-slate-600 mt-2">
            Chỉ những hồ sơ thuộc đơn vị được phân quyền mới có thể truy cập.
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
          role={role}
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
}: {
  role: Props["role"]
  cases: ApprovalCase[]
  onSelect: (id: string) => void
  faculty: string
  isAdmin: boolean
}) {
  const [search, setSearch] = useState("")
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
      {filtered.length === 0 ? (
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
                    "Đơn vị / người gửi",
                    "Ngày gửi",
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
                      <p className="text-xs text-slate-400">{item.submitter}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {item.submittedAt}
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
                    Người gửi
                    <br />
                    <b className="text-slate-700">{item.submitter}</b>
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
  role,
  onBack,
}: {
  item: ApprovalCase
  role: Props["role"]
  onBack: () => void
}) {
  const { updateApproval } = useApp()
  const { showToast } = useToast()
  const [dialog, setDialog] =
    useState<"revision" | "reject" | "emergency_room" | "emergency_cancel" | null>(
      null,
    )
  const [reason, setReason] = useState("")
  const [newRoomId, setNewRoomId] = useState("")
  const [documentNotice, setDocumentNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] =
    useState<"overview" | "documents" | "points" | "history">("overview")
  const canProcess =
    role === "faculty_manager"
      ? item.status === "faculty_pending"
      : item.status === "affairs_pending"

  async function act(
    action: "faculty_approve" | "affairs_approve" | "request_revision" | "reject",
  ) {
    if (busy) return
    setBusy(true)
    try {
      if (isApiMode()) {
        const hanh_dong =
          action === "faculty_approve"
            ? "APPROVE_FACULTY"
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
        showToast(
          "Backend đã tiếp nhận quyết định. Vui lòng tải lại danh sách.",
          "success",
        )
      } else {
        const result = updateApproval(item.id, action, reason)
        if (!result.success)
          throw new Error(result.error || "Không thể xử lý hồ sơ.")
        showToast(
          action.includes("approve")
            ? "Đã duyệt hồ sơ."
            : "Đã cập nhật trạng thái hồ sơ.",
          "success",
        )
      }
      setDialog(null)
      setReason("")
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
            {item.unit} · Gửi bởi {item.submitter}
          </p>
        </div>
        {canProcess && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDialog("reject")}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold"
            >
              Từ chối
            </button>
            <button
              onClick={() => setDialog("revision")}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-amber-200 text-amber-700 text-sm font-semibold"
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
              className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer"
            >
              {role === "faculty_manager"
                ? "Duyệt & chuyển CTSV"
                : "Duyệt sự kiện & quy tắc điểm"}
            </button>
          </div>
        )}

        {/* UC-EVT-03: Emergency Actions for Approved Events */}
        {item.status === "approved" && (
          <div className="flex gap-2">
            <button
              onClick={() => setDialog("emergency_room")}
              className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold cursor-pointer hover:bg-amber-100"
            >
              🔄 Đổi phòng khẩn cấp
            </button>
            <button
              onClick={() => setDialog("emergency_cancel")}
              className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer hover:bg-rose-100"
            >
              ⚠️ Hủy sự kiện khẩn cấp
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 overflow-x-auto no-scrollbar mb-5">
        {([
          ["overview", "Thông tin"],
          ["documents", "Kế hoạch & tài liệu"],
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
      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card title="Thông tin sự kiện" className="lg:col-span-2">
            <InfoGrid
              values={[
                ["Ngày tổ chức", formatCalendarDate(item.eventDate)],
                ["Đơn vị", item.unit],
                ["Người gửi", item.submitter],
                ["Khoa quản lý", item.faculty],
              ]}
            />
            <p className="text-sm text-slate-600 leading-relaxed mt-4 pt-4 border-t border-slate-100">
              {item.description}
            </p>
          </Card>
          <Card title="Tiến trình phê duyệt">
            <Progress status={item.status} />
          </Card>
          {item.facultyDecision && (
            <Card title="Quyết định của khoa" className="lg:col-span-3">
              <p className="text-sm text-slate-600">{item.facultyDecision}</p>
            </Card>
          )}
        </div>
      )}
      {tab === "documents" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Kế hoạch tổ chức">
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.plan}
            </p>
          </Card>
          <Card title="Tài liệu đính kèm">
            <div className="space-y-2">
              {documentNotice && (
                <div
                  role="status"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
                >
                  {documentNotice}: đây mới là tên tài liệu minh họa; bản PDF
                  thực tế sẽ được lấy từ backend khi tích hợp.
                  <button
                    className="ml-2 font-bold underline"
                    onClick={() => setDocumentNotice(null)}
                  >
                    Đóng
                  </button>
                </div>
              )}
              {item.documents.map((doc) => (
                <div
                  key={doc}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50"
                >
                  <span className="text-sm text-slate-700">{doc}</span>
                  <button
                    onClick={() => setDocumentNotice(doc)}
                    className="text-xs font-semibold text-indigo"
                  >
                    Xem
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {tab === "points" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-indigo-light border border-indigo-100 p-4">
            <p className="text-sm font-semibold text-indigo">
              Đây là quy tắc điểm dự kiến.
            </p>
            <p className="text-sm text-indigo/80 mt-1">
              Điểm thực tế được công nhận sau khi đối soát và phê duyệt kết quả
              tham gia.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Cấu hình quy tắc">
              <InfoGrid
                values={[
                  ["Học kỳ", item.semester],
                  ["Nhóm / mã tiêu chí", item.criteriaCode],
                  ["Điểm tối đa", `${item.maxPoints} điểm`],
                  ["Thời lượng hợp lệ", `${item.validMinutes} phút`],
                  [
                    "Phiên bắt buộc",
                    item.requiredSessions.join(", ") || "Không có",
                  ],
                ]}
              />
            </Card>
            <Card title="Ngưỡng tham gia minh họa">
              <div className="space-y-2">
                {item.thresholds.map((row) => (
                  <div
                    key={row.ratio}
                    className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm"
                  >
                    <span>Từ {row.ratio}% thời lượng</span>
                    <b className="text-indigo">{row.points} điểm</b>
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-3">
                  Các ngưỡng có thể cấu hình và không phải quy định chính thức
                  của trường.
                </p>
              </div>
            </Card>
            <Card title="Điều kiện chứng nhận">
              <p className="text-sm text-slate-600">
                {item.certificateCondition}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Điều kiện chứng nhận được xét riêng với điều kiện điểm.
              </p>
            </Card>
            <Card title="Căn cứ & phiên bản">
              <InfoGrid
                values={[
                  ["Căn cứ", item.ruleBasis],
                  ["Phiên bản quy tắc", item.ruleVersion],
                ]}
              />
            </Card>
          </div>
        </div>
      )}
      {tab === "history" && (
        <Card title="Nhật ký không thể xóa">
          <div className="space-y-4">
            {[...item.history].reverse().map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-light text-indigo flex items-center justify-center text-xs font-bold">
                  {item.history.length - index}
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
        </Card>
      )}
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
                    : "Hủy sự kiện khẩn cấp"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {dialog === "emergency_room"
                ? "Chọn phòng mới khả dụng và nhập lý do sự cố kỹ thuật:"
                : dialog === "emergency_cancel"
                  ? "Cảnh báo: Toàn bộ vé sinh viên đã nhận sẽ tự động bị thu hồi kèm email thông báo xin lỗi."
                  : "Lý do là bắt buộc và sẽ được lưu trong lịch sử xử lý."}
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
                  <option value="">-- Chọn phòng trống --</option>
                  <option value="Hội trường A">
                    Hội trường A (Sức chứa 400 - Cơ sở 1)
                  </option>
                  <option value="Hội trường B">
                    Hội trường B (Sức chứa 250 - Cơ sở 1)
                  </option>
                  <option value="Phòng Hội thảo E">
                    Phòng Hội thảo E (Sức chứa 150 - Cơ sở 2)
                  </option>
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
                  : "Nhập lý do cụ thể..."
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
                    showToast(
                      "Đã điều chuyển phòng khẩn cấp thành công. Toàn bộ sinh viên đã nhận được thông báo in-app.",
                      "success",
                    )
                    setDialog(null)
                    setReason("")
                  } else if (dialog === "emergency_cancel") {
                    showToast(
                      "Đã hủy sự kiện khẩn cấp (POST /events/{id}/emergency-cancel). Đã phát lệnh thu hồi vé.",
                      "warning",
                    )
                    setDialog(null)
                    setReason("")
                  } else {
                    act(dialog === "revision" ? "request_revision" : "reject")
                  }
                }}
                disabled={
                  !reason.trim() || (dialog === "emergency_room" && !newRoomId)
                }
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer disabled:opacity-50 ${
                  dialog === "reject" || dialog === "emergency_cancel"
                    ? "bg-red-600"
                    : "bg-amber-600"
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
            {i < index ? "✓" : i + 1}
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
