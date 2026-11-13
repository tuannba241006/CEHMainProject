import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { useApp, type LiveEvent } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { getApiErrorMessage } from "../../api/errors"
import { eventsService } from "../../api/services/events.service"
import { ROOMS, EVENTS, type Event } from "../../data/mock"
import type { DrlRule, EventStatus, OrganizationSummary, Topic } from "../../data/contract"
import {
  FileText,
  MapPin,
  Users,
  Eye,
  Plus,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Monitor,
  X,
  RotateCcw,
} from "lucide-react"

export interface AdminEventItem extends Partial<Event>, Partial<LiveEvent> {
  id: string
  ma_su_kien: number
  ten_su_kien: string
  title?: string
  ten_don_vi_host?: string
  organizer?: string
  ten_chuyen_de?: string
  topic?: string
  ten_phong?: string
  room?: string
  capacity?: number
  so_luong_toi_da?: number
  registered?: number
  so_luong_da_dang_ky?: number
  date?: string
  time?: string
  status?: string
  trang_thai?: EventStatus
  description?: string
  mo_ta?: string
  coHosts?: string[]
  danh_sach_ten_dong_to_chuc?: string[]
  banner?: string
  points?: number
  speaker?: string
  dien_gia?: string
  ly_do_tu_choi?: string | null
}

export type AdminManageEvent = Event | LiveEvent | AdminEventItem

interface Props {
  initialMode?: "list" | "create" | "edit"
  orgs: OrganizationSummary[]
  topics: Topic[]
  onOpenReconciliation: (evt: AdminManageEvent) => void
}

const SEED_ADMIN_EVENTS: AdminManageEvent[] = [
  {
    id: "991",
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
    banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
  },
  {
    id: "992",
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
    coHosts: ["CLB WebDev UIT"],
    danh_sach_ten_dong_to_chuc: ["CLB WebDev UIT"],
    banner: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  },
  {
    id: "993",
    ma_su_kien: 993,
    title: "Hội thảo Chuyển đổi số & Điện toán đám mây UIT",
    ten_su_kien: "Hội thảo Chuyển đổi số & Điện toán đám mây UIT",
    organizer: "CLB WebDev UIT",
    ten_don_vi_host: "CLB WebDev UIT",
    topic: "Kỹ năng mềm & Công nghệ",
    ten_chuyen_de: "Kỹ năng mềm & Công nghệ",
    room: "Hội trường B",
    ten_phong: "Hội trường B",
    capacity: 250,
    so_luong_toi_da: 250,
    registered: 0,
    so_luong_da_dang_ky: 0,
    points: 4,
    speaker: "ThS. Hoàng Văn Nam - Solutions Architect AWS",
    dien_gia: "ThS. Hoàng Văn Nam - Solutions Architect AWS",
    date: "10/11/2026",
    time: "14:00 - 17:00",
    status: "rejected",
    trang_thai: "REJECTED",
    description: "Hội thảo thực chiến về kiến trúc Microservices và Serverless trên AWS dành cho sinh viên.",
    mo_ta: "Hội thảo thực chiến về kiến trúc Microservices và Serverless trên AWS dành cho sinh viên.",
    ly_do_tu_choi: "Trùng khung giờ với Lễ Khai giảng năm học mới tại Hội trường B và chưa có phương án an ninh đảm bảo.",
    coHosts: [],
    danh_sach_ten_dong_to_chuc: [],
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop",
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

  // View mode: list table or full-page creation/edit page
  const [viewMode, setViewMode] = useState<"list" | "create" | "create-delegated" | "edit">(
    initialMode === "create" ? "create" : initialMode === "edit" ? "edit" : "list",
  )

  // Merged events list: include appEvents and ensure SEED_ADMIN_EVENTS (with cohosts & drafts) are prepended
  const [localEvents, setLocalEvents] = useState<AdminManageEvent[]>(() => {
    const list: AdminManageEvent[] = [...(appEvents && appEvents.length > 0 ? appEvents : EVENTS)]
    for (const seed of SEED_ADMIN_EVENTS) {
      if (!list.some((e) => e.id === seed.id || e.ma_su_kien === seed.ma_su_kien)) {
        list.unshift(seed)
      }
    }
    return list
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadEvents() {
      try {
        setLoading(true)
        setError(null)
        const res = await eventsService.getEvents()
        if (!cancelled && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setLocalEvents((prev) => {
            const apiItems: AdminManageEvent[] = res.data.map((item) => ({
              ...item,
              id: String(item.ma_su_kien),
              title: item.ten_su_kien,
              date: item.thoi_gian_bat_dau ? item.thoi_gian_bat_dau.slice(0, 10) : "",
              time: item.thoi_gian_bat_dau ? item.thoi_gian_bat_dau.slice(11, 16) : "",
              status: item.trang_thai,
              registered:
                item.so_luong_toi_da && item.so_ve_con_lai != null
                  ? Math.max(0, item.so_luong_toi_da - item.so_ve_con_lai)
                  : 0,
              capacity: item.so_luong_toi_da || 100,
            }))
            const merged = [...apiItems]
            for (const p of prev) {
              if (!merged.some((m) => m.ma_su_kien === p.ma_su_kien || m.id === p.id)) {
                merged.push(p)
              }
            }
            return merged
          })
        }
      } catch (err) {
        console.warn("Admin events load note:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadEvents()
    return () => {
      cancelled = true
    }
  }, [])

  // Filter & Search states
  const [search, setSearch] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Target event being edited
  const [editingEvent, setEditingEvent] = useState<AdminManageEvent | null>(null)

  // Action Modals (Emergency Room, Cancel, Withdraw, Reopen)
  type ActionModal =
    | { kind: "changeRoom"; event: AdminManageEvent }
    | { kind: "cancel"; event: AdminManageEvent }
    | { kind: "withdraw"; event: AdminManageEvent }
    | { kind: "reopen"; event: AdminManageEvent }
    | null

  const [modal, setModal] = useState<ActionModal>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionReason, setActionReason] = useState("")
  const [newRoom, setNewRoom] = useState("")

  // Form field states for full creation/edit page
  const [formTitle, setFormTitle] = useState("")
  const [formUnitId, setFormUnitId] = useState<number>(4) // Default P.CTSV
  const [formTopic, setFormTopic] = useState("")
  const [formDate, setFormDate] = useState("2026-11-20")
  const [formStartTime, setFormStartTime] = useState("08:30")
  const [formEndTime, setFormEndTime] = useState("11:30")
  const [formRoom, setFormRoom] = useState("Hội trường A")
  const [formCapacity, setFormCapacity] = useState(250)
  const [formDrlRule, setFormDrlRule] = useState<"Dieu3" | "Dieu4">("Dieu3")
  const [formDrlPoints, setFormDrlPoints] = useState<number>(5)
  const [formSpeaker, setFormSpeaker] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCoHosts, setFormCoHosts] = useState<string[]>([])
  const [selectedCoHostToAdd, setSelectedCoHostToAdd] = useState<string>("")

  // AI Content Copilot (UC-AI-01)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)

  // Initialize form state
  function openCreatePage(isDelegated: boolean) {
    setEditingEvent(null)
    setFormTitle("")
    setFormUnitId(isDelegated ? 1 : 4) // 4 = P.CTSV, 1 = Khoa
    setFormTopic(topics[0]?.ten_chuyen_de || "Trí tuệ Nhân tạo & Khoa học Dữ liệu")
    setFormDate("2026-11-25")
    setFormStartTime("08:30")
    setFormEndTime("11:30")
    setFormRoom("Hội trường A")
    setFormCapacity(250)
    setFormDrlRule("Dieu3")
    setFormDrlPoints(5)
    setFormSpeaker("")
    setFormDescription("")
    setFormCoHosts([])
    setSelectedCoHostToAdd("")
    setViewMode(isDelegated ? "create-delegated" : "create")
  }

  function openEditPage(evt: AdminManageEvent) {
    setEditingEvent(evt)
    setFormTitle(evt.title || evt.ten_su_kien || "")
    setFormUnitId(
      evt.organizer?.includes("Sinh viên") || evt.ten_don_vi_host?.includes("Sinh viên") ? 4 : 1,
    )
    setFormTopic(evt.topic || evt.ten_chuyen_de || topics[0]?.ten_chuyen_de || "")
    setFormDate(evt.date ? evt.date.split("/").reverse().join("-") : "2026-11-20")
    setFormStartTime(evt.time ? evt.time.split(" - ")[0] : "08:30")
    setFormEndTime(evt.time ? evt.time.split(" - ")[1] : "11:30")
    setFormRoom(evt.room || evt.ten_phong || "Hội trường A")
    setFormCapacity(evt.capacity || evt.so_luong_toi_da || 200)
    setFormDrlRule("Dieu3")
    setFormDrlPoints(evt.points || evt.diem_drl_du_kien || 5)
    setFormSpeaker(evt.speaker || evt.dien_gia || "")
    setFormDescription(evt.description || evt.mo_ta || "")
    setFormCoHosts(evt.coHosts || evt.danh_sach_ten_dong_to_chuc || [])
    setSelectedCoHostToAdd("")
    setViewMode("edit")
  }

  // Co-hosts add & remove
  function handleAddCoHost() {
    if (!selectedCoHostToAdd.trim()) return
    if (formCoHosts.includes(selectedCoHostToAdd.trim())) {
      showToast("Đơn vị này đã có trong danh sách đồng tổ chức.", "warning")
      return
    }
    setFormCoHosts((prev) => [...prev, selectedCoHostToAdd.trim()])
    setSelectedCoHostToAdd("")
    showToast(`Đã thêm "${selectedCoHostToAdd.trim()}" vào danh sách đồng tổ chức.`, "success")
  }

  function handleRemoveCoHost(name: string) {
    setFormCoHosts((prev) => prev.filter((item) => item !== name))
    showToast(`Đã xóa "${name}" khỏi danh sách đồng tổ chức.`, "info")
  }

  // AI Generator
  function handleGenerateAi() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    setTimeout(() => {
      setFormTitle(`Hội thảo Toàn trường: ${aiPrompt.trim()} — Đổi mới Sáng tạo 2026`)
      setFormDescription(
        `Chương trình chuyên đề cấp toàn trường về ${aiPrompt.trim()} do Phòng Công tác Sinh viên (P.CTSV) phối hợp tổ chức, cung cấp kiến thức thực tiễn và định hướng nghề nghiệp cho sinh viên UIT.\n\n[LỊCH TRÌNH AGENDA]\n1. 08:30 - 09:00: Đón tiếp đại biểu và Quét mã Kiosk TOTP\n2. 09:00 - 10:30: Tham luận của các chuyên gia đầu ngành\n3. 10:30 - 11:15: Phiên thảo luận, Q&A và kết nối doanh nghiệp\n4. 11:15 - 11:30: Check-out và phát hành khảo sát ĐRL.`,
      )
      setAiGenerating(false)
      setShowAiModal(false)
      showToast("Đã tạo tự động tiêu đề, mô tả và agenda từ AI Copilot!", "success")
    }, 650)
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

      const status = (evt.status || evt.trang_thai || "").toLowerCase()
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
    (e) => (e.status as string) === "open" || (e.status as string) === "published",
  ).length
  const pendingCount = approvalCases.filter((c) =>
    c.status.includes("pending"),
  ).length
  const draftCount = localEvents.filter(
    (e) => (e.status || e.trang_thai || "").toLowerCase() === "draft",
  ).length
  const rejectedCount = localEvents.filter(
    (e) => (e.status || e.trang_thai || "").toLowerCase().includes("rejected"),
  ).length

  // Save or submit event
  async function handleSaveEvent(asSubmit = false) {
    if (!formTitle.trim()) {
      showToast("Vui lòng nhập tên sự kiện.", "error")
      return
    }
    setSubmitting(true)
    try {
      const isEdit = viewMode === "edit"
      const targetUnit = orgs.find((o) => o.ma_don_vi === formUnitId)
      const targetTopic = topics.find((t) => t.ten_chuyen_de === formTopic) || topics[0]
      const targetRoom = ROOMS.find((r) => r.ten_phong === formRoom) || ROOMS[0]
      const coHostIds = orgs
        .filter((o) => formCoHosts.includes(o.ten_don_vi))
        .map((o) => o.ma_don_vi)

      const payload = {
        ten_su_kien: formTitle.trim(),
        ma_don_vi_to_chuc: formUnitId,
        ma_chuyen_de: targetTopic?.ma_chuyen_de ?? 1,
        ma_phong: targetRoom?.ma_phong ?? 1,
        ngay_cong_bo: `${formDate}T00:00:00+07:00`,
        thoi_gian_bat_dau: `${formDate}T${formStartTime}:00+07:00`,
        thoi_gian_ket_thuc: `${formDate}T${formEndTime}:00+07:00`,
        khong_gioi_han_slot: false,
        so_luong_toi_da: Number(formCapacity),
        dieu_khoan_drl: formDrlRule,
        diem_drl_du_kien: Number(formDrlPoints),
        dien_gia: formSpeaker.trim() || null,
        mo_ta: formDescription.trim() || "Mô tả chi tiết nội dung sự kiện cấp trường.",
        danh_sach_co_host_ids: coHostIds,
      }

      if (isEdit && editingEvent) {
        await eventsService.updateDraft(editingEvent.id || editingEvent.ma_su_kien, payload)
      } else {
        await eventsService.createDraft(payload)
      }
      if (asSubmit && editingEvent) {
        await eventsService.submitApproval(editingEvent.id || editingEvent.ma_su_kien)
      }

      // Update local state
      if (isEdit && editingEvent) {
        setLocalEvents((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id || e.ma_su_kien === editingEvent.ma_su_kien
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
                  status: asSubmit ? "pending" : "draft",
                  trang_thai: asSubmit ? "PENDING_ADMIN" : "DRAFT",
                }
              : e,
          ),
        )
      } else {
        const newEvt = {
          id: String(Date.now()),
          ma_su_kien: Date.now(),
          title: formTitle.trim(),
          ten_su_kien: formTitle.trim(),
          organizer: targetUnit?.ten_don_vi || "Phòng Công tác Sinh viên (P.CTSV)",
          ten_don_vi_host: targetUnit?.ten_don_vi || "Phòng Công tác Sinh viên (P.CTSV)",
          topic: formTopic as Event["topic"],
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
          status: (asSubmit ? "pending" : "draft") as Event["status"],
          trang_thai: (asSubmit ? "PENDING_ADMIN" : "DRAFT") as Event["trang_thai"],
          description: formDescription.trim(),
          mo_ta: formDescription.trim(),
          coHosts: formCoHosts,
          danh_sach_ten_dong_to_chuc: formCoHosts,
          banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
        } as unknown as Event
        setLocalEvents((prev) => [newEvt, ...prev])
      }

      showToast(
        asSubmit
          ? "Đã lưu bản nháp và gửi hồ sơ phê duyệt thành công."
          : isEdit
            ? "Đã cập nhật bản nháp sự kiện thành công."
            : "Đã tạo bản nháp sự kiện mới thành công.",
        "success",
      )
      setViewMode("list")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  // Emergency room change
  async function handleEmergencyChangeRoom() {
    if (!modal || modal.kind !== "changeRoom" || !newRoom) return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do đổi phòng chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.changeRoom(modal.event.id || modal.event.ma_su_kien, {
        ma_phong_moi: newRoom,
        ly_do: actionReason.trim(),
      })
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien
            ? { ...e, room: newRoom, ten_phong: newRoom }
            : e,
        ),
      )
      showToast(
        `Đã điều chuyển phòng sang "${newRoom}" thành công. Toàn bộ sinh viên đã nhận thông báo khẩn cấp.`,
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

  // Emergency cancel
  async function handleEmergencyCancel() {
    if (!modal || modal.kind !== "cancel") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do hủy sự kiện chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.emergencyCancel(
        modal.event.id || modal.event.ma_su_kien,
        actionReason.trim(),
      )
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien
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

  // Reopen rejected draft
  async function handleReopen() {
    if (!modal || modal.kind !== "reopen") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do tái mở bản nháp chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.reopen(
        modal.event.id || modal.event.ma_su_kien,
        actionReason.trim(),
      )
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien
            ? { ...e, status: "draft", trang_thai: "DRAFT" }
            : e,
        ),
      )
      showToast(
        "Đã khôi phục sự kiện bị từ chối về trạng thái DRAFT thành công để tiếp tục chỉnh sửa.",
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

  // Withdraw proposal
  async function handleWithdraw() {
    if (!modal || modal.kind !== "withdraw") return
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      showToast("Vui lòng nhập lý do rút đề xuất chi tiết (tối thiểu 10 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.withdraw(
        modal.event.id || modal.event.ma_su_kien,
        actionReason.trim(),
      )
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === modal.event.id || e.ma_su_kien === modal.event.ma_su_kien
            ? { ...e, status: "draft", trang_thai: "DRAFT" }
            : e,
        ),
      )
      showToast(
        "Đã rút đề xuất cưỡng chế về DRAFT. Phòng hội trường giữ chỗ đã được giải phóng.",
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


  // RENDER FULL EVENT FORM (WHEN CREATING OR EDITING)
  if (viewMode !== "list") {
    const isDelegated = viewMode === "create-delegated"
    const isEdit = viewMode === "edit"
    const targetRoomObj = ROOMS.find((r) => r.ten_phong === formRoom)

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo transition-colors cursor-pointer"
          >
            <span>← Quay lại danh sách sự kiện</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {isEdit ? "Chỉnh sửa bản nháp" : isDelegated ? "Tạo nháp ủy quyền" : "Sự kiện cấp Trường"}
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-navy">
              {isEdit
                ? `Chỉnh sửa bản nháp: ${formTitle || "Sự kiện chưa đặt tên"}`
                : isDelegated
                  ? "Tạo bản nháp sự kiện ủy quyền (Tạo hộ Khoa / CLB)"
                  : "Khởi tạo sự kiện mới cấp Trường (P.CTSV)"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isDelegated
                ? "Tạo khung bản nháp và chỉ định đơn vị chủ trì cấp dưới hoàn thiện trước khi gửi duyệt."
                : "Soạn thảo hồ sơ sự kiện quy mô toàn trường trực tiếp cho Phòng Công tác Sinh viên."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Trợ lý AI gợi ý nội dung</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout: Form (2/3) + Preview Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warning Banner Soft Hold 48h */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quy chế bảo toàn phòng Soft Hold 48h & Đệm Buffer 15m:</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Khi gửi duyệt, phòng hội trường sẽ được tạm giữ (Soft Hold) 48h. Hệ thống tự động kích hoạt khoảng đệm 15 phút trước và sau ca để bảo đảm không có sự cố trùng lịch.
                </p>
              </div>
            </div>

            {/* SECTION 1: THÔNG TIN CHUNG */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="font-display font-bold text-sm text-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> 1. Thông tin sự kiện
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên sự kiện <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Ngày hội Khởi nghiệp & Đổi mới Sáng tạo UIT 2026..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị chủ trì (ma_don_vi_to_chuc) *
                  </label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    <option value={4}>Phòng Công tác Sinh viên (P.CTSV) — Cấp Trường</option>
                    {orgs.filter((o) => o.ma_don_vi !== 4).map((o) => (
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diễn giả / Khách mời</label>
                <input
                  type="text"
                  value={formSpeaker}
                  onChange={(e) => setFormSpeaker(e.target.value)}
                  placeholder="Ví dụ: TS. Nguyễn Minh Anh - Giám đốc Trung tâm AI Viettel..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>
            </div>

            {/* SECTION 2: THỜI GIAN & PHÒNG HỘI TRƯỜNG */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="font-display font-bold text-sm text-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> 2. Thời gian & Phòng hội trường
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn phòng hội trường *
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
                        {r.ten_phong} (Sức chứa {r.suc_chua} chỗ - {r.toa_nha})
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
                    max={targetRoomObj?.suc_chua || 1000}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Giới hạn theo sức chứa phòng: tối đa {targetRoomObj?.suc_chua || 500} sinh viên.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: ĐƠN VỊ ĐỒNG TỔ CHỨC (CO-HOSTS) - ADDRESSING POINT 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="font-display font-bold text-sm text-navy uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> 3. Quản lý Đơn vị Đồng tổ chức (Co-hosts)
                </h2>
                <span className="text-xs font-medium text-slate-400">
                  {formCoHosts.length} đơn vị đã chọn
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Thêm hoặc bớt các đơn vị phối hợp (Khoa, CLB, Đoàn Hội). Khi gửi duyệt, hệ thống sẽ tự động phát lời mời xác nhận phối hợp tới người quản lý của các đơn vị này.
              </p>

              {/* Selector toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={selectedCoHostToAdd}
                  onChange={(e) => setSelectedCoHostToAdd(e.target.value)}
                  className="flex-1 min-w-[200px] p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                >
                  <option value="">-- Chọn đơn vị phối hợp để thêm --</option>
                  {orgs
                    .filter((o) => o.ma_don_vi !== formUnitId && !formCoHosts.includes(o.ten_don_vi))
                    .map((o) => (
                      <option key={o.ma_don_vi} value={o.ten_don_vi}>
                        {o.ten_don_vi} ({o.loai_don_vi})
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddCoHost}
                  disabled={!selectedCoHostToAdd}
                  className="px-4 py-2.5 rounded-xl bg-indigo text-white text-xs font-semibold cursor-pointer hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm đồng tổ chức</span>
                </button>
              </div>

              {/* Selected Co-Hosts Tag List with Remove Button */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Danh sách đơn vị đồng tổ chức trong bản nháp:
                </label>
                {formCoHosts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formCoHosts.map((coHostName) => (
                      <span
                        key={coHostName}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium shadow-2xs"
                      >
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-indigo-600" /> {coHostName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoHost(coHostName)}
                          className="w-4 h-4 rounded-full bg-indigo-200 hover:bg-rose-200 hover:text-rose-700 flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                          title={`Xóa ${coHostName}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                    Chưa có đơn vị đồng tổ chức nào được chọn (tùy chọn).
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: ĐIỂM RÈN LUYỆN */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="font-display font-bold text-sm text-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <span>⭐</span> 4. Quy chuẩn Điểm rèn luyện (ĐRL)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Căn cứ Điều khoản ĐRL *
                  </label>
                  <select
                    value={formDrlRule}
                    onChange={(e) => setFormDrlRule(e.target.value as "Dieu3" | "Dieu4")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-indigo"
                  >
                    <option value="Dieu3">Điều 3: Hoạt động học thuật, NCKH & Kỹ năng</option>
                    <option value="Dieu4">Điều 4: Phẩm chất công dân, Văn hóa, Tình nguyện</option>
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
                    <option value={5}>+5 Điểm rèn luyện (Mức cao nhất)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 5: MÔ TẢ CHI TIẾT & AGENDA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="font-display font-bold text-sm text-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> 5. Mô tả & Kế hoạch Agenda
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả chi tiết và lộ trình chương trình *
                </label>
                <textarea
                  rows={5}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mục tiêu sự kiện, nội dung chính và các mốc thời gian trình bày của diễn giả..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Event Summary Preview & Action Buttons */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs sticky top-4">
              <h3 className="font-display font-bold text-sm text-navy uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" /> Xem trước thẻ sự kiện
              </h3>

              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"
                  alt="Preview banner"
                  className="w-full h-32 object-cover"
                />
                <div className="p-3.5 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    {formTopic || "Chuyên đề"}
                  </span>
                  <p className="font-bold text-sm text-navy line-clamp-2">
                    {formTitle || "Tên sự kiện chưa đặt"}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{orgs.find((o) => o.ma_don_vi === formUnitId)?.ten_don_vi || "P.CTSV"}</span>
                  </p>
                  <div className="text-xs text-slate-600 pt-1 border-t border-slate-200 space-y-1">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {formRoom}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {formDate} · {formStartTime} - {formEndTime}</div>
                    <div className="flex justify-between font-semibold">
                      <span>Sức chứa: {formCapacity}</span>
                      <span className="text-indigo-600">+{formDrlPoints} ĐRL</span>
                    </div>
                  </div>
                  {formCoHosts.length > 0 && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      + {formCoHosts.length} đơn vị đồng tổ chức
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveEvent(true)}
                  disabled={submitting || !formTitle.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Đang xử lý..." : "Lưu & Gửi phê duyệt ngay"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveEvent(false)}
                  disabled={submitting || !formTitle.trim()}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Đang lưu..." : "Lưu bản nháp (DRAFT)"}
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Hủy bỏ & Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI CONTENT COPILOT MODAL */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100">
              <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Trợ lý AI gợi ý nội dung
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                Nhập từ khóa hoặc chủ đề sự kiện, AI Copilot sẽ tự động phác thảo tiêu đề, mô tả và khung lộ trình Agenda chuyên nghiệp chuẩn quy chế CTSV.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chủ đề hoặc mục tiêu sự kiện *
                </label>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: AI & Big Data ứng dụng trong Tài chính Ngân hàng..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
                />
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  {aiGenerating ? "Đang tạo..." : "Áp dụng nội dung AI"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // RENDER EVENTS LIST TABLE (DEFAULT VIEW)
  return (
    <div className="space-y-6">
      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <p className="text-xs text-rose-600 font-medium">Bị từ chối</p>
          <p className="font-display font-bold text-2xl text-rose-700 mt-1.5">{rejectedCount}</p>
          <span className="text-[11px] text-rose-400">Cần tái mở</span>
        </div>
      </div>

      {/* Action Header & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-display font-bold text-base text-navy">
              Danh sách Sự kiện & Quản trị Toàn trường
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu, sửa bản nháp, tái mở hồ sơ bị từ chối và xử lý điều chuyển khẩn cấp.
            </p>
          </div>

          {/* Creation Button Pair - SINGLE CLEAN LOCATION (ADDRESSING POINT 2) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openCreatePage(false)}
              className="px-3.5 py-2 rounded-xl bg-indigo text-white text-xs sm:text-sm font-semibold cursor-pointer hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-colors"
              title="Khởi tạo sự kiện cấp Trường trực tiếp cho Phòng Công tác Sinh viên"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo sự kiện cấp Trường (P.CTSV)</span>
            </button>
            <button
              onClick={() => openCreatePage(true)}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-indigo-100 shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Tạo bản nháp ủy quyền / tạo hộ cho bất kỳ Khoa/CLB cấp dưới nào (truyền tham số ma_don_vi_to_chuc)"
            >
              <FileText className="w-4 h-4" />
              <span>Tạo nháp ủy quyền (Tạo hộ)</span>
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sự kiện, diễn giả, phòng..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo"
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

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
            {[
              ["all", "Tất cả"],
              ["draft", "Bản nháp"],
              ["pending", "Chờ duyệt"],
              ["open", "Đang mở"],
              ["rejected", "Bị từ chối"],
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="p-3.5">
                      <div className="h-4 bg-slate-200 rounded w-48 mb-1.5" />
                      <div className="h-3 bg-slate-100 rounded w-24" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-4 bg-slate-200 rounded w-36" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-4 bg-slate-200 rounded w-20" />
                    </td>
                    <td className="p-3.5">
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="h-8 bg-slate-200 rounded-lg w-28 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                filteredEvents.map((evt) => {
                const title = evt.title || evt.ten_su_kien
                const organizer = evt.organizer || evt.ten_don_vi_host
                const room = evt.room || evt.ten_phong
                const topic = evt.topic || evt.ten_chuyen_de
                const capacity = evt.capacity || evt.so_luong_toi_da || 200
                const registered = evt.registered || evt.so_luong_da_dang_ky || 0
                const pct = Math.min(100, Math.round((registered / capacity) * 100))
                const status = (evt.status || evt.trang_thai || "").toLowerCase()

                // ADDRESSING POINT 1: ONLY DRAFT EVENTS CAN BE EDITED!
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
                            Cấp Trường
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
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{room}</span>
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
                                ? "bg-slate-100 text-slate-700 border border-slate-200 font-bold"
                                : isRejected
                                  ? "bg-rose-100 text-rose-700 border border-rose-200 font-bold"
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
                        {/* ONLY DRAFT EVENTS HAVE "SỬA NHÁP" (ADDRESSING POINT 1 & POINT 4) */}
                        {isDraft && (
                          <>
                            <button
                              onClick={() => openEditPage(evt)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold cursor-pointer border border-indigo-200 shadow-2xs transition-colors"
                              title="Chỉnh sửa toàn diện nội dung bản nháp (mở cả trang tạo sự kiện)"
                            >
                              Sửa nháp
                            </button>
                            <button
                              onClick={() => {
                                showToast(
                                  `Đã gửi hồ sơ "${evt.title || evt.ten_su_kien}" lên hội đồng thẩm định phê duyệt.`,
                                  "success",
                                )
                                setLocalEvents((prev) =>
                                  prev.map((e) =>
                                    e.id === evt.id || e.ma_su_kien === evt.ma_su_kien
                                      ? { ...e, status: "pending", trang_thai: "PENDING_ADMIN" }
                                      : e,
                                  ),
                                )
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold cursor-pointer border border-emerald-200 shadow-2xs transition-colors"
                              title="Gửi hồ sơ bản nháp đi phê duyệt"
                            >
                              Gửi duyệt
                            </button>
                          </>
                        )}

                        {/* REOPEN REJECTED EVENTS (ADDRESSING POINT 3) */}
                        {isRejected && (
                          <button
                            onClick={() => {
                              setActionReason("")
                              setModal({ kind: "reopen", event: evt })
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold cursor-pointer border border-amber-300 shadow-2xs transition-colors"
                            title="Khôi phục sự kiện bị từ chối quay trở lại DRAFT để chỉnh sửa"
                          >
                            Tái mở bản nháp
                          </button>
                        )}

                        {/* WITHDRAW PROPOSAL */}
                        {isPending && (
                          <button
                            onClick={() => {
                              setActionReason("")
                              setModal({ kind: "withdraw", event: evt })
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                            title="Rút đề xuất cưỡng chế về DRAFT & giải phóng phòng đã giữ chỗ"
                          >
                            Rút đề xuất
                          </button>
                        )}


                        {/* EMERGENCY ACTIONS FOR APPROVED/PUBLISHED (NO SỬA BUTTON!) */}
                        {isLiveOrApproved && (
                          <>
                            <button
                              onClick={() => {
                                setNewRoom("")
                                setActionReason("")
                                setModal({ kind: "changeRoom", event: evt })
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold cursor-pointer border border-amber-200 shadow-2xs flex items-center gap-1"
                              title="Điều chuyển phòng khẩn cấp khi gặp sự cố bất khả kháng"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Đổi phòng</span>
                            </button>
                            <button
                              onClick={() => {
                                setActionReason("")
                                setModal({ kind: "cancel", event: evt })
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer border border-rose-200 shadow-2xs flex items-center gap-1"
                              title="Hủy sự kiện khẩn cấp và giải phóng phòng, hủy vé không phạt No-show"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Hủy khẩn cấp</span>
                            </button>
                          </>
                        )}

                        {/* Open Kiosk */}
                        <button
                          onClick={() => navigate(`/kiosk/${evt.id || evt.ma_su_kien}`)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 text-xs font-semibold cursor-pointer border border-cyan-200 flex items-center gap-1"
                          title="Mở phiên Kiosk trình chiếu mã QR TOTP xoay vòng 30s"
                        >
                          <Monitor className="w-3 h-3" />
                          <span>Kiosk</span>
                        </button>

                        {/* Reconciliation */}
                        <button
                          onClick={() => onOpenReconciliation(evt)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
                          title="Đối soát người tham dự & can thiệp thủ công giải tỏa nghi vấn"
                        >
                          <Users className="w-3 h-3" />
                          <span>Đối soát</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }))}

              {!loading && filteredEvents.length === 0 && (
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

      {/* EMERGENCY CHANGE ROOM MODAL */}
      {modal?.kind === "changeRoom" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Điều chuyển phòng khẩn cấp</span>
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
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Hủy sự kiện khẩn cấp</span>
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
              <RotateCcw className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Rút đề xuất cưỡng chế</span>
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

      {/* REOPEN REJECTED DRAFT MODAL (ADDRESSING POINT 3) */}
      {modal?.kind === "reopen" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h2 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Tái mở bản nháp bị từ chối</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-3 leading-relaxed">
              Khôi phục sự kiện bị từ chối (REJECTED) quay trở lại trạng thái DRAFT để đơn vị tổ chức có thể tiếp tục chỉnh sửa và đề xuất lại.
            </p>

            {modal.event.ly_do_tu_choi && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-3 leading-relaxed">
                <b>Lý do đã bị từ chối trước đây:</b> {modal.event.ly_do_tu_choi}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lý do tái mở bản nháp (Bắt buộc nhập ≥ 10 ký tự) *
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Ví dụ: Ban tổ chức đã liên hệ giải trình và cam kết điều chỉnh khung giờ theo chỉ đạo..."
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
