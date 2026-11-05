import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useApp, type LiveEvent } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { getApiErrorMessage } from "../../api/errors"
import { isApiMode } from "../../api/config"
import { eventsService } from "../../api/services/events.service"
import { ROOMS, EVENTS } from "../../data/mock"
import type { OrganizationSummary, Topic } from "../../data/contract"

interface Props {
  initialMode?: "list" | "create" | "edit"
  orgs: OrganizationSummary[]
  topics: Topic[]
  onOpenReconciliation: (evt: any) => void
}

const SEED_ADMIN_EVENTS: any[] = [
  {
    id: 991,
    ma_su_kien: 991,
    title: "Ngày hội Khởi nghiệp & Đổi mới Sáng tạo UIT 2026",
    ten_su_kien: "Ngày hội Khởi nghiệp & Đổi mới Sáng tạo UIT 2026",
    organizer: "Phòng Công tác Sinh viên (P.CTSV)",
    ten_don_vi_host: "Phòng Công tác Sinh viên (P.CTSV)",
    topic: "Kỹ năng mềm & Công nghệ",
    ten_chuyen_de: "Kỹ năng mềm & Công nghệ",
    room: "Hội trường A",
    ten_phong: "Hội trường A",
    capacity: 350,
    so_luong_toi_da: 350,
    registered: 0,
    so_luong_da_dang_ky: 0,
    points: 5,
    speaker: "Shark Nguyễn Thanh Hùng - Chủ tịch Quỹ Khởi nghiệp",
    dien_gia: "Shark Nguyễn Thanh Hùng - Chủ tịch Quỹ Khởi nghiệp",
    date: "25/11/2026",
    time: "08:00 - 11:30",
    status: "draft",
    trang_thai: "DRAFT",
    description: "Sự kiện cấp trường kết nối các dự án khởi nghiệp công nghệ sinh viên với các nhà đầu tư mạo hiểm.",
    mo_ta: "Sự kiện cấp trường kết nối các dự án khởi nghiệp công nghệ sinh viên với các nhà đầu tư mạo hiểm.",
    coHosts: ["CLB WebDev UIT", "Khoa Kỹ thuật Phần mềm"],
    danh_sach_ten_dong_to_chuc: ["CLB WebDev UIT", "Khoa Kỹ thuật Phần mềm"],
  },
  {
    id: 992,
    ma_su_kien: 992,
    title: "Hội thảo An toàn Mạng & Kỹ thuật SOC Phòng thủ",
    ten_su_kien: "Hội thảo An toàn Mạng & Kỹ thuật SOC Phòng thủ",
    organizer: "Khoa Hệ thống Thông tin",
    ten_don_vi_host: "Khoa Hệ thống Thông tin",
    topic: "Học thuật & Trí tuệ nhân tạo",
    ten_chuyen_de: "Học thuật & Trí tuệ nhân tạo",
    room: "Phòng Hội thảo E",
    ten_phong: "Phòng Hội thảo E",
    capacity: 150,
    so_luong_toi_da: 150,
    registered: 0,
    so_luong_da_dang_ky: 0,
    points: 4,
    speaker: "TS. Lê Hoàng Long - Chuyên gia An ninh mạng Viettel",
    dien_gia: "TS. Lê Hoàng Long - Chuyên gia An ninh mạng Viettel",
    date: "28/11/2026",
    time: "13:30 - 16:30",
    status: "draft",
    trang_thai: "DRAFT",
    description: "Nháp ủy quyền do Admin tạo hộ cho Khoa Hệ thống Thông tin để Khoa phân công diễn giả và cấu hình chi tiết.",
    mo_ta: "Nháp ủy quyền do Admin tạo hộ cho Khoa Hệ thống Thông tin để Khoa phân công diễn giả và cấu hình chi tiết.",
    coHosts: [],
    danh_sach_ten_dong_to_chuc: [],
  },
  ...EVENTS,
]

export default function AdminEventsManagement({
  initialMode = "list",
  orgs,
  topics,
  onOpenReconciliation,
}: Props) {
  const navigate = useNavigate()
  const { events: appEvents, approvalCases } = useApp()
  const { showToast } = useToast()

  // Merged events list
  const [localEvents, setLocalEvents] = useState<any[]>(() => {
    return SEED_ADMIN_EVENTS
  })

  // Filter & Search states
  const [search, setSearch] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal dialog states
  type ActionModal =
    | { kind: "form"; event?: any; isDelegated?: boolean }
    | { kind: "changeRoom"; event: any }
    | { kind: "cancel"; event: any }
    | { kind: "withdraw"; event: any }
    | { kind: "reopen"; event: any }
    | null

  const [modal, setModal] = useState<ActionModal>(() => {
    if (initialMode === "create") return { kind: "form", isDelegated: false }
    return null
  })

  // Sub-dialog form states
  const [submitting, setSubmitting] = useState(false)
  const [actionReason, setActionReason] = useState("")
  const [newRoom, setNewRoom] = useState("")

  // Form field states for create/edit
  const [formTitle, setFormTitle] = useState("")
  const [formUnitId, setFormUnitId] = useState<number>(4) // Default P.CTSV
  const [formTopic, setFormTopic] = useState("")
  const [formDate, setFormDate] = useState("2026-11-15")
  const [formStartTime, setFormStartTime] = useState("08:30")
  const [formEndTime, setFormEndTime] = useState("11:30")
  const [formRoom, setFormRoom] = useState("Hội trường A")
  const [formCapacity, setFormCapacity] = useState(250)
  const [formDrlRule, setFormDrlRule] = useState<"Dieu3" | "Dieu4">("Dieu3")
  const [formDrlPoints, setFormDrlPoints] = useState<number>(5)
  const [formSpeaker, setFormSpeaker] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCoHosts, setFormCoHosts] = useState<string[]>([])

  // Init form when editing
  function openForm(event?: any, isDelegated = false) {
    if (event) {
      setFormTitle(event.title || event.ten_su_kien || "")
      setFormUnitId(
        event.organizer?.includes("Khoa") || event.ten_don_vi_host?.includes("Khoa") ? 1 : 4,
      )
      setFormTopic(event.topic || event.ten_chuyen_de || "")
      setFormDate("2026-11-15")
      setFormStartTime("08:30")
      setFormEndTime("11:30")
      setFormRoom(event.room || event.ten_phong || "Hội trường A")
      setFormCapacity(event.capacity || event.so_luong_toi_da || 200)
      setFormDrlRule("Dieu3")
      setFormDrlPoints(event.points || event.diem_drl_du_kien || 5)
      setFormSpeaker(event.speaker || event.dien_gia || "")
      setFormDescription(event.description || event.mo_ta || "")
      setFormCoHosts(event.coHosts || event.danh_sach_ten_dong_to_chuc || [])
    } else {
      setFormTitle("")
      setFormUnitId(isDelegated ? 1 : 4) // 4 = P.CTSV, 1 = Khoa
      setFormTopic(topics[0]?.ten_chuyen_de || "Trí tuệ Nhân tạo & Khoa học Dữ liệu")
      setFormDate("2026-11-20")
      setFormStartTime("08:30")
      setFormEndTime("11:30")
      setFormRoom("Hội trường A")
      setFormCapacity(250)
      setFormDrlRule("Dieu3")
      setFormDrlPoints(5)
      setFormSpeaker("")
      setFormDescription("")
      setFormCoHosts([])
    }
    setModal({ kind: "form", event, isDelegated })
  }

  // Filtered events
  const filteredEvents = useMemo(() => {
    return localEvents.filter((evt) => {
      const matchSearch =
        !search.trim() ||
        (evt.title || evt.ten_su_kien)
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (evt.speaker || evt.dien_gia || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (evt.room || evt.ten_phong || "")
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchUnit =
        unitFilter === "all" ||
        (evt.organizer || evt.ten_don_vi_host || "").includes(unitFilter)

      const status = (evt.status || "").toLowerCase()
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && (status === "open" || status === "published")) ||
        (statusFilter === "draft" && status === "draft") ||
        (statusFilter === "pending" && status.includes("pending")) ||
        (statusFilter === "ended" && status === "ended") ||
        (statusFilter === "cancelled" && status === "cancelled") ||
        (statusFilter === "rejected" && status.includes("rejected"))

      return matchSearch && matchUnit && matchStatus
    })
  }, [localEvents, search, unitFilter, statusFilter])

  // KPI Metrics
  const totalEvents = localEvents.length
  const univEvents = localEvents.filter((e) =>
    (e.organizer || e.ten_don_vi_host || "").includes("Sinh viên"),
  ).length
  const openCount = localEvents.filter(
    (e) => e.status === "open" || e.status === "published",
  ).length
  const pendingCount = approvalCases.filter((c) =>
    c.status.includes("pending"),
  ).length
  const draftCount = localEvents.filter((e) => e.status === "draft").length

  // Handlers
  async function handleSaveEvent(asSubmit = false) {
    if (!formTitle.trim()) {
      showToast("Vui lòng nhập tên sự kiện.", "error")
      return
    }
    setSubmitting(true)
    try {
      const isEdit = Boolean(modal?.kind === "form" && modal.event)
      const targetUnit = orgs.find((o) => o.ma_don_vi === formUnitId)
      const payload = {
        ten_su_kien: formTitle.trim(),
        ma_don_vi_to_chuc: formUnitId,
        ten_don_vi_host: targetUnit?.ten_don_vi || "Phòng Công tác Sinh viên (P.CTSV)",
        ten_chuyen_de: formTopic,
        thoi_gian_bat_dau: `${formDate}T${formStartTime}:00+07:00`,
        thoi_gian_ket_thuc: `${formDate}T${formEndTime}:00+07:00`,
        ten_phong: formRoom,
        so_luong_toi_da: Number(formCapacity),
        dieu_khoan_drl: formDrlRule,
        diem_drl_du_kien: Number(formDrlPoints),
        dien_gia: formSpeaker.trim(),
        mo_ta: formDescription.trim(),
        danh_sach_ten_dong_to_chuc: formCoHosts,
      }

      if (isApiMode()) {
        if (isEdit && modal?.kind === "form" && modal.event) {
          await eventsService.updateDraft(modal.event.id || modal.event.ma_su_kien, payload)
        } else {
          await eventsService.createDraft(payload)
        }
        if (asSubmit && modal?.kind === "form" && modal.event) {
          await eventsService.submitApproval(modal.event.id || modal.event.ma_su_kien)
        }
      }

      // Update local state
      if (isEdit && modal?.kind === "form" && modal.event) {
        setLocalEvents((prev) =>
          prev.map((e) =>
            (e.id === modal.event?.id || e.ma_su_kien === modal.event?.ma_su_kien)
              ? {
                  ...e,
                  title: formTitle.trim(),
                  ten_su_kien: formTitle.trim(),
                  topic: formTopic,
                  ten_chuyen_de: formTopic,
                  room: formRoom,
                  ten_phong: formRoom,
                  capacity: Number(formCapacity),
                  so_luong_toi_da: Number(formCapacity),
                  speaker: formSpeaker.trim(),
                  dien_gia: formSpeaker.trim(),
                  description: formDescription.trim(),
                  mo_ta: formDescription.trim(),
                  coHosts: formCoHosts,
                  danh_sach_ten_dong_to_chuc: formCoHosts,
                  status: asSubmit ? "pending" : e.status,
                }
              : e,
          ),
        )
      } else {
        const newEvt: any = {
          id: Date.now(),
          ma_su_kien: Date.now(),
          title: formTitle.trim(),
          ten_su_kien: formTitle.trim(),
          organizer: targetUnit?.ten_don_vi || "Phòng Công tác Sinh viên (P.CTSV)",
          ten_don_vi_host: targetUnit?.ten_don_vi || "Phòng Công tác Sinh viên (P.CTSV)",
          topic: formTopic,
          ten_chuyen_de: formTopic,
          room: formRoom,
          ten_phong: formRoom,
          capacity: Number(formCapacity),
          so_luong_toi_da: Number(formCapacity),
          registered: 0,
          so_luong_da_dang_ky: 0,
          points: Number(formDrlPoints),
          speaker: formSpeaker.trim(),
          dien_gia: formSpeaker.trim(),
          date: formDate.split("-").reverse().join("/"),
          time: `${formStartTime} - ${formEndTime}`,
          status: asSubmit ? "pending" : "draft",
          description: formDescription.trim(),
          mo_ta: formDescription.trim(),
          coHosts: formCoHosts,
          danh_sach_ten_dong_to_chuc: formCoHosts,
          banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
        }
        setLocalEvents((prev) => [newEvt, ...prev])
      }

      showToast(
        asSubmit
          ? "Đã lưu bản nháp và gửi hồ sơ phê duyệt thành công."
          : isEdit
            ? "Đã cập nhật nội dung sự kiện thành công."
            : "Đã tạo bản nháp sự kiện mới thành công.",
        "success",
      )
      setModal(null)
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmergencyChangeRoom() {
    if (!modal || modal.kind !== "changeRoom" || !newRoom) return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do đổi phòng chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      if (isApiMode()) {
        await eventsService.changeRoom(modal.event.id || modal.event.ma_su_kien, {
          ma_phong_moi: newRoom,
          ly_do: actionReason.trim(),
        })
      }
      setLocalEvents((prev) =>
        prev.map((e) =>
          (e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien)
            ? { ...e, room: newRoom, ten_phong: newRoom }
            : e,
        ),
      )
      showToast(
        `Đã điều chuyển phòng sang "${newRoom}" thành công. Toàn bộ sinh viên đã nhận thông báo khẩn cấp (In-app & Email).`,
        "success",
      )
      setModal(null)
      setActionReason("")
      setNewRoom("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmergencyCancel() {
    if (!modal || modal.kind !== "cancel") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do hủy sự kiện chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      if (isApiMode()) {
        await eventsService.emergencyCancel(
          modal.event.id || modal.event.ma_su_kien,
          actionReason.trim(),
        )
      }
      setLocalEvents((prev) =>
        prev.map((e) =>
          (e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien)
            ? { ...e, status: "cancelled", trang_thai: "CANCELLED" }
            : e,
        ),
      )
      showToast(
        "Đã hủy sự kiện khẩn cấp. Hội trường đã được giải phóng; toàn bộ vé sinh viên đã được hủy an toàn không phạt No-show.",
        "warning",
      )
      setModal(null)
      setActionReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWithdraw() {
    if (!modal || modal.kind !== "withdraw") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do rút đề xuất chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      if (isApiMode()) {
        await eventsService.withdraw(
          modal.event.id || modal.event.ma_su_kien,
          actionReason.trim(),
        )
      }
      setLocalEvents((prev) =>
        prev.map((e) =>
          (e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien)
            ? { ...e, status: "draft", trang_thai: "DRAFT" }
            : e,
        ),
      )
      showToast(
        "Đã rút đề xuất cưỡng chế về DRAFT. Phòng giữ chỗ tạm thời đã được tự động giải phóng.",
        "success",
      )
      setModal(null)
      setActionReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReopen() {
    if (!modal || modal.kind !== "reopen") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do tái mở bản nháp chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      if (isApiMode()) {
        await eventsService.reopen(
          modal.event.id || modal.event.ma_su_kien,
          actionReason.trim(),
        )
      }
      setLocalEvents((prev) =>
        prev.map((e) =>
          (e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien)
            ? { ...e, status: "draft", trang_thai: "DRAFT" }
            : e,
        ),
      )
      showToast(
        "Đã khôi phục bản nháp về trạng thái DRAFT thành công để chỉnh sửa lại.",
        "success",
      )
      setModal(null)
      setActionReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Creation & Action Banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
              Toàn quyền Quản trị & Soạn thảo Sự kiện Toàn trường
            </span>
          </div>
          <h2 className="font-display font-bold text-lg text-navy mt-1">
            Khởi tạo & Điều phối Sự kiện Toàn trường
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Quản trị viên P.CTSV có thẩm quyền tạo sự kiện cấp Trường trực tiếp, tạo nháp ủy quyền cho Khoa/CLB, chỉnh sửa bản nháp, điều chuyển phòng và xử lý khẩn cấp.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="admin-create-univ-evt-btn"
            onClick={() => openForm(undefined, false)}
            className="px-4 py-2.5 rounded-xl bg-indigo text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-indigo-700 shadow-xs flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            title="Khởi tạo sự kiện cấp Trường trực tiếp cho Phòng Công tác Sinh viên (P.CTSV)"
          >
            <span className="text-base">➕</span>
            <span>Tạo sự kiện cấp Trường (P.CTSV)</span>
          </button>
          <button
            id="admin-create-delegated-evt-btn"
            onClick={() => openForm(undefined, true)}
            className="px-4 py-2.5 rounded-xl border border-indigo-300 bg-white text-indigo-700 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-indigo-50 shadow-2xs flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            title="Tạo bản nháp ủy quyền / tạo hộ cho bất kỳ Khoa/CLB cấp dưới nào bằng cách truyền tham số ma_don_vi_to_chuc"
          >
            <span className="text-base">📋</span>
            <span>Tạo nháp ủy quyền (Tạo hộ)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">Tổng số sự kiện</p>
          <p className="font-display font-bold text-2xl text-navy mt-1.5">{totalEvents}</p>
          <span className="text-[11px] text-slate-500">Toàn hệ thống</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-indigo-600 font-medium">Cấp Trường (P.CTSV)</p>
          <p className="font-display font-bold text-2xl text-indigo-700 mt-1.5">{univEvents}</p>
          <span className="text-[11px] text-indigo-500">Đơn vị chủ trì</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-emerald-600 font-medium">Đang mở đăng ký</p>
          <p className="font-display font-bold text-2xl text-emerald-700 mt-1.5">{openCount}</p>
          <span className="text-[11px] text-emerald-500">Sẵn sàng nhận vé</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-amber-600 font-medium">Chờ thẩm định</p>
          <p className="font-display font-bold text-2xl text-amber-700 mt-1.5">{pendingCount}</p>
          <span className="text-[11px] text-amber-500">Khoa / CTSV duyệt</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Bản nháp</p>
          <p className="font-display font-bold text-2xl text-slate-700 mt-1.5">{draftCount}</p>
          <span className="text-[11px] text-slate-400">Đang chuẩn bị</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sự kiện, diễn giả, phòng..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo/20 focus:border-indigo"
            />
          </div>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo"
          >
            <option value="all">Tất cả đơn vị tổ chức</option>
            <option value="Sinh viên">Phòng Công tác Sinh viên (P.CTSV)</option>
            {orgs.map((o) => (
              <option key={o.ma_don_vi} value={o.ten_don_vi}>
                {o.ten_don_vi}
              </option>
            ))}
          </select>
        </div>

        {/* Status Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
          {[
            ["all", "Tất cả"],
            ["open", "Đang mở"],
            ["pending", "Chờ duyệt"],
            ["draft", "Bản nháp"],
            ["ended", "Đã kết thúc"],
            ["cancelled", "Đã hủy"],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === val
                  ? "bg-white text-indigo font-bold shadow-2xs"
                  : "text-slate-600 hover:text-navy"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* University Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
              <tr>
                <th className="p-3.5 text-left font-semibold">Tên sự kiện & Chuyên đề</th>
                <th className="p-3.5 text-left font-semibold">Đơn vị chủ trì</th>
                <th className="p-3.5 text-left font-semibold">Thời gian & Địa điểm</th>
                <th className="p-3.5 text-left font-semibold">Sức chứa / Đăng ký</th>
                <th className="p-3.5 text-left font-semibold">Trạng thái</th>
                <th className="p-3.5 text-right font-semibold">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((evt) => {
                const title = evt.title || evt.ten_su_kien
                const organizer = evt.organizer || evt.ten_don_vi_host
                const room = evt.room || evt.ten_phong
                const topic = evt.topic || evt.ten_chuyen_de
                const capacity = evt.capacity || evt.so_luong_toi_da || 200
                const registered = evt.registered || evt.so_luong_da_dang_ky || 0
                const pct = Math.min(100, Math.round((registered / capacity) * 100))
                const status = (evt.status || "").toLowerCase()
                const isDraft = status === "draft"
                const isPending = status.includes("pending")
                const isRejected = status.includes("rejected")
                const isLiveOrApproved =
                  status === "open" || status === "published" || status === "approved"

                return (
                  <tr key={evt.id || evt.ma_su_kien} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 max-w-sm">
                      <div className="font-semibold text-navy hover:text-indigo transition-colors line-clamp-1">
                        {title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {topic && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {topic}
                          </span>
                        )}
                        {organizer?.includes("Sinh viên") ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            🏛️ Cấp Trường
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                            Khoa / CLB
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{organizer}</div>
                      {(evt.coHosts || evt.danh_sach_ten_dong_to_chuc)?.length ? (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          + {(evt.coHosts || evt.danh_sach_ten_dong_to_chuc).length} đồng tổ chức
                        </div>
                      ) : null}
                    </td>

                    <td className="p-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>📍 {room}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Đã bảo toàn khoảng đệm 15 phút chống xung đột">
                          Buffer 15m
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {evt.date || "15/10/2026"} · {evt.time || "08:30 - 11:30"}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-navy">{registered}/{capacity}</span>
                        <span className="text-slate-400 text-[11px]">{pct}%</span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          status === "open" || status === "published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPending
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isDraft
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : isRejected
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {status === "open" || status === "published"
                          ? "Đang mở"
                          : isPending
                            ? "Chờ duyệt"
                            : isDraft
                              ? "Bản nháp"
                              : isRejected
                                ? "Bị từ chối"
                                : status === "cancelled"
                                  ? "Đã hủy"
                                  : "Đã kết thúc"}
                      </span>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Draft / Edit action */}
                        {isDraft ? (
                          <>
                            <button
                              onClick={() => openForm(evt)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer border border-indigo-200 shadow-2xs transition-colors"
                              title="Chỉnh sửa nội dung bản nháp (tiêu đề, chuyên đề, slot, ĐRL)"
                            >
                              ✏️ Sửa nháp
                            </button>
                            <button
                              onClick={() => {
                                showToast(
                                  `Đã gửi hồ sơ "${evt.title || evt.ten_su_kien}" lên hội đồng thẩm định phê duyệt.`,
                                  "success",
                                )
                                setLocalEvents((prev) =>
                                  prev.map((e) =>
                                    (e.id === evt.id || e.ma_su_kien === evt.ma_su_kien)
                                      ? { ...e, status: "pending", trang_thai: "PENDING_ADMIN" }
                                      : e,
                                  ),
                                )
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer border border-emerald-200 shadow-2xs transition-colors"
                              title="Gửi hồ sơ bản nháp đi phê duyệt"
                            >
                              📤 Gửi duyệt
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openForm(evt)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer border border-slate-200"
                            title="Chỉnh sửa thông tin sự kiện (Admin can thiệp)"
                          >
                            ✏️ Sửa
                          </button>
                        )}

                        {/* Withdraw Proposal */}
                        {isPending && (
                          <button
                            onClick={() => setModal({ kind: "withdraw", event: evt })}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                            title="Rút đề xuất cưỡng chế về DRAFT & giải phóng phòng đã giữ chỗ"
                          >
                            ↩️ Rút đề xuất
                          </button>
                        )}

                        {/* Reopen Rejected */}
                        {isRejected && (
                          <button
                            onClick={() => setModal({ kind: "reopen", event: evt })}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold cursor-pointer border border-amber-200"
                            title="Tái mở bản nháp bị từ chối về DRAFT để chỉnh sửa lại"
                          >
                            🔄 Tái mở nháp
                          </button>
                        )}

                        {/* Emergency Change Room */}
                        {isLiveOrApproved && (
                          <button
                            onClick={() => {
                              setNewRoom("")
                              setActionReason("")
                              setModal({ kind: "changeRoom", event: evt })
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold cursor-pointer border border-amber-200 shadow-2xs"
                            title="Điều chuyển phòng khẩn cấp khi gặp sự cố bất khả kháng"
                          >
                            🔄 Đổi phòng
                          </button>
                        )}

                        {/* Emergency Cancel */}
                        {isLiveOrApproved && (
                          <button
                            onClick={() => {
                              setActionReason("")
                              setModal({ kind: "cancel", event: evt })
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer border border-rose-200 shadow-2xs"
                            title="Hủy sự kiện khẩn cấp và giải phóng phòng, hủy vé không phạt No-show"
                          >
                            ⚠️ Hủy khẩn cấp
                          </button>
                        )}

                        {/* Open Kiosk */}
                        <button
                          onClick={() => navigate(`/kiosk/${evt.id || evt.ma_su_kien}`)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 text-xs font-semibold cursor-pointer border border-cyan-200"
                          title="Mở phiên Kiosk trình chiếu mã QR TOTP xoay vòng 30s"
                        >
                          🖥️ Kiosk
                        </button>

                        {/* Reconciliation & Manual Override */}
                        <button
                          onClick={() => onOpenReconciliation(evt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                          title="Đối soát người tham dự & can thiệp thủ công giải tỏa nghi vấn"
                        >
                          👥 Đối soát
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    Không có sự kiện nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {modal?.kind === "form" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  {modal.event
                    ? "Chỉnh sửa sự kiện"
                    : modal.isDelegated
                      ? "Tạo nháp ủy quyền (Tạo hộ cấp dưới)"
                      : "Khởi tạo sự kiện cấp Trường (P.CTSV)"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modal.isDelegated
                    ? "Tạo nháp và truyền tham số ma_don_vi_to_chuc cho Khoa/CLB cấp dưới hoàn thiện."
                    : "Khởi tạo sự kiện cấp toàn trường thuộc phạm vi chủ trì của Phòng Công tác Sinh viên."}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên sự kiện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Hội thảo Hướng nghiệp và Công nghệ AI 2026..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị chủ trì (ma_don_vi_to_chuc) *
                  </label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(Number(e.target.value))}
                    disabled={!modal.isDelegated && !modal.event}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo disabled:bg-slate-50"
                  >
                    <option value={4}>Phòng Công tác Sinh viên (P.CTSV)</option>
                    {orgs.map((o) => (
                      <option key={o.ma_don_vi} value={o.ma_don_vi}>
                        {o.ten_don_vi} ({o.loai_don_vi})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chuyên đề sự kiện *
                  </label>
                  <select
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    {topics.map((t) => (
                      <option key={t.ma_chuyen_de} value={t.ten_chuyen_de}>
                        {t.ten_chuyen_de}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày tổ chức *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giờ kết thúc *</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hội trường & Khoảng đệm 15m *
                  </label>
                  <select
                    value={formRoom}
                    onChange={(e) => {
                      setFormRoom(e.target.value)
                      const target = ROOMS.find((r) => r.ten_phong === e.target.value)
                      if (target) setFormCapacity(target.suc_chua)
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    {ROOMS.map((r) => (
                      <option key={r.ma_phong} value={r.ten_phong}>
                        {r.ten_phong} (Sức chứa {r.suc_chua} - {r.toa_nha})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng sinh viên tối đa *
                  </label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    min={10}
                    max={1000}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quy chuẩn Điểm rèn luyện *
                  </label>
                  <select
                    value={formDrlRule}
                    onChange={(e) => setFormDrlRule(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    <option value="Dieu3">Điều 3: Hoạt động học thuật, NCKH</option>
                    <option value="Dieu4">Điều 4: Phẩm chất công dân & Xã hội</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức điểm cộng (+3 đến +5 điểm) *
                  </label>
                  <select
                    value={formDrlPoints}
                    onChange={(e) => setFormDrlPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    <option value={3}>+3 Điểm rèn luyện</option>
                    <option value={4}>+4 Điểm rèn luyện</option>
                    <option value={5}>+5 Điểm rèn luyện</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diễn giả / Khách mời</label>
                <input
                  type="text"
                  value={formSpeaker}
                  onChange={(e) => setFormSpeaker(e.target.value)}
                  placeholder="Ví dụ: TS. Nguyễn Minh Anh - Trưởng ban Kỹ thuật AI..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả sự kiện</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mục tiêu, nội dung chính và quyền lợi sinh viên tham gia..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveEvent(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                {submitting ? "Đang lưu..." : "Lưu bản nháp (DRAFT)"}
              </button>
              <button
                type="button"
                onClick={() => handleSaveEvent(true)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-indigo hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                {submitting ? "Đang xử lý..." : "Lưu & Gửi phê duyệt ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CHANGE ROOM MODAL */}
      {modal?.kind === "changeRoom" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <span>🔄</span> Điều chuyển phòng khẩn cấp
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Quyền hạn độc quyền của Admin khi sự kiện đã APPROVED hoặc PUBLISHED gặp sự cố bất khả kháng. Hệ thống tự động kiểm tra sức chứa phòng mới và bảo toàn đệm 15 phút.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 mb-4">
              <div>Sự kiện: <b className="text-navy">{modal.event.title || modal.event.ten_su_kien}</b></div>
              <div>Phòng hiện tại: <b className="text-amber-700">{modal.event.room || modal.event.ten_phong}</b></div>
              <div>Số vé đã phát hành: <b className="text-indigo-700">{modal.event.registered || modal.event.so_luong_da_dang_ky || 0} vé</b></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn phòng hội trường thay thế *
                </label>
                <select
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium focus:outline-none focus:border-indigo"
                >
                  <option value="">-- Chọn phòng trống đủ sức chứa --</option>
                  {ROOMS.filter((r) => r.ten_phong !== (modal.event.room || modal.event.ten_phong)).map((r) => (
                    <option key={r.ma_phong} value={r.ten_phong}>
                      {r.ten_phong} (Sức chứa {r.suc_chua} chỗ - {r.toa_nha})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do sự cố kỹ thuật (Bắt buộc nhập ≥ 10 ký tự) *
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ví dụ: Sự cố hỏng hệ thống máy chiếu và mất điện đột xuất tại Hội trường A..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEmergencyChangeRoom}
                disabled={submitting || !newRoom || actionReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? "Đang điều chuyển..." : "Xác nhận đổi phòng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CANCEL MODAL */}
      {modal?.kind === "cancel" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100">
            <h2 className="font-display font-bold text-lg text-rose-700 flex items-center gap-2">
              <span>⚠️</span> Hủy sự kiện khẩn cấp
            </h2>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 my-3 leading-relaxed">
              <b>Cảnh báo nghiêm trọng:</b> Sự kiện sẽ chuyển sang CANCELLED, giải phóng hội trường, hủy toàn bộ vé sinh viên đã đăng ký (trạng thái DaHuy mà <u>không bị tính vi phạm No-show</u>) và xóa hàng đợi Waitlist.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do dừng tổ chức sự kiện (Bắt buộc nhập ≥ 10 ký tự) *
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ví dụ: Diễn giả chính gặp vấn đề sức khỏe đột xuất, Ban tổ chức xin hoãn sang học kỳ tới..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Quay lại
              </button>
              <button
                onClick={handleEmergencyCancel}
                disabled={submitting || actionReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? "Đang hủy..." : "Xác nhận hủy khẩn cấp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW PROPOSAL MODAL */}
      {modal?.kind === "withdraw" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <span>↩️</span> Rút đề xuất cưỡng chế
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Admin can thiệp rút hồ sơ đang thẩm định về DRAFT. Phòng hội trường đang giữ chỗ (Soft Hold) sẽ được tự động giải phóng ngay lập tức.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do rút hồ sơ (Bắt buộc nhập ≥ 10 ký tự) *
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ví dụ: Hồ sơ thiếu kế hoạch an toàn chi tiết, trả về để đơn vị bổ sung..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
              />
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting || actionReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? "Đang rút..." : "Xác nhận rút đề xuất"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN REJECTED MODAL */}
      {modal?.kind === "reopen" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <span>🔄</span> Tái mở bản nháp bị từ chối
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Khôi phục sự kiện bị từ chối quay trở lại DRAFT để đơn vị tổ chức có thể tiếp tục chỉnh sửa và đề xuất lại.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do tái mở bản nháp (Bắt buộc nhập ≥ 10 ký tự) *
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ví dụ: Ban tổ chức đã liên hệ giải trình và cam kết điều chỉnh nội dung theo chỉ đạo..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
              />
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReopen}
                disabled={submitting || actionReason.trim().length < 10}
                className="flex-1 py-2.5 rounded-xl bg-indigo hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? "Đang khôi phục..." : "Xác nhận tái mở"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
