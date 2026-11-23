import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { OrgLayout } from "./OrgLayout"
import { useApp } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"
import type { RoomPublic, Topic, OrganizationSummary, AgendaItem } from "../../data/contract"
import { formatCalendarDate, parseCalendarDate } from "../../utils/date"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage, getValidationErrors } from "../../api/errors"
import { organizationsService } from "../../api/services/organizations.service"
import { roomsService } from "../../api/services/rooms.service"
import { reportsService } from "../../api/services/reports.service"
import { api } from "../../api/client"
import { Sparkles, Calendar, MapPin, Users, X, Image as ImageIcon, Trash2 } from "lucide-react"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export function parseAgendaText(text: string): AgendaItem[] | null {
  if (!text || !text.trim()) return null
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return lines.map((line) => {
    const timeRangeMatch = line.match(
      /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})[:\s-]+(.+)$/,
    )
    if (timeRangeMatch) {
      return {
        gio_bat_dau: timeRangeMatch[1],
        gio_ket_thuc: timeRangeMatch[2],
        thoi_gian_bat_dau: timeRangeMatch[1],
        thoi_gian_ket_thuc: timeRangeMatch[2],
        tieu_de: timeRangeMatch[3].trim(),
      }
    }
    const singleTimeMatch = line.match(/^(\d{1,2}:\d{2})[:\s-]+(.+)$/)
    if (singleTimeMatch) {
      return {
        gio_bat_dau: singleTimeMatch[1],
        gio_ket_thuc: singleTimeMatch[1],
        thoi_gian_bat_dau: singleTimeMatch[1],
        thoi_gian_ket_thuc: singleTimeMatch[1],
        tieu_de: singleTimeMatch[2].trim(),
      }
    }
    return {
      gio_bat_dau: "00:00",
      gio_ket_thuc: "00:00",
      thoi_gian_bat_dau: "00:00",
      thoi_gian_ket_thuc: "00:00",
      tieu_de: line,
    }
  })
}

export function formatAgendaItems(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return ""
  return items
    .map((item: any) => {
      const start = item.gio_bat_dau || item.thoi_gian_bat_dau || item.time || ""
      const end = item.gio_ket_thuc || item.thoi_gian_ket_thuc || ""
      const title = item.tieu_de || item.title || ""
      const speaker = item.dien_gia ? ` (Diễn giả: ${item.dien_gia})` : ""
      if (start && end) return `${start} - ${end}: ${title}${speaker}`
      if (start) return `${start}: ${title}${speaker}`
      return `${title}${speaker}`
    })
    .join("\n")
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1
  const parts = timeStr.split(":").map(Number)
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return -1
  return parts[0] * 60 + parts[1]
}

function getRoomMaintenanceInfo(
  room: RoomPublic,
  eventDate?: string,
  startTime?: string,
  endTime?: string,
): { isConflict: boolean; suffix: string; detail?: string } {
  if (room.trang_thai !== "BaoTri") {
    return { isConflict: false, suffix: "" }
  }

  // Nếu bảo trì nhưng không có ngày bắt đầu / kết thúc cụ thể
  if (!room.bao_tri_tu_ngay || !room.bao_tri_den_ngay) {
    return {
      isConflict: true,
      suffix: " [ĐANG BẢO TRÌ]",
      detail: "Phòng đang bảo trì vô thời hạn",
    }
  }

  const maintFrom = parseCalendarDate(room.bao_tri_tu_ngay)
  const maintTo = parseCalendarDate(room.bao_tri_den_ngay)

  if (!maintFrom || !maintTo) {
    return {
      isConflict: true,
      suffix: " [ĐANG BẢO TRÌ]",
      detail: "Phòng đang trong trạng thái bảo trì",
    }
  }

  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  const rangeStr = `${fmt(maintFrom)} - ${fmt(maintTo)}`

  // Nếu người dùng đã chọn ngày tổ chức và giờ bắt đầu/kết thúc sự kiện
  if (eventDate && startTime && endTime) {
    const sTime = startTime.length === 5 ? `${startTime}:00` : startTime
    const eTime = endTime.length === 5 ? `${endTime}:00` : endTime
    const eventStart = new Date(`${eventDate}T${sTime}`)
    const eventEnd = new Date(`${eventDate}T${eTime}`)

    if (!Number.isNaN(eventStart.getTime()) && !Number.isNaN(eventEnd.getTime())) {
      // Overlap: maintFrom < eventEnd && maintTo > eventStart (SRS v3.1.3 & UC-ROOM-02)
      const isOverlap = maintFrom < eventEnd && maintTo > eventStart
      if (isOverlap) {
        return {
          isConflict: true,
          suffix: ` [TRÙNG LỊCH BẢO TRÌ: ${rangeStr}]`,
          detail: `Từ ${rangeStr}`,
        }
      }

      // Khung giờ sự kiện nằm ngoài khoảng bảo trì -> Khả dụng bình thường!
      return { isConflict: false, suffix: "" }
    }
  }

  // Chưa chọn đủ ngày giờ sự kiện -> hiển thị thông báo khoảng bảo trì nhưng không vô hiệu hóa
  return {
    isConflict: false,
    suffix: ` (Lịch bảo trì: ${rangeStr})`,
  }
}

export default function EventForm({ onNavigate, onLogout }: Props) {
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)
  const { user } = useUser()
  const { saveApprovalDraft } = useApp()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orgList, setOrgList] = useState<OrganizationSummary[]>([])
  const [roomList, setRoomList] = useState<RoomPublic[]>([])
  const [topicList, setTopicList] = useState<Topic[]>([])

  const [form, setForm] = useState({
    title: "",
    topic: "",
    description: "",
    publishDate: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    room: "",
    capacity: "",
    unlimited: "false",
    drlRule: "Dieu3",
    proposedPoints: "5",
    volunteerHours: "0",
    cohostIds: "",
    banner: "",
    speaker: "",
    targetAudience: "",
    agenda: "",
  })

  useEffect(() => {
    let cancelled = false
    organizationsService
      .publicList()
      .then((res) => {
        if (!cancelled && res.data) {
          const raw = res.data as Array<
            OrganizationSummary & { ma_don_vi_to_chuc?: number }
          >
          const mapped: OrganizationSummary[] = raw.map((o) => ({
            ...o,
            ma_don_vi: Number(o.ma_don_vi ?? o.ma_don_vi_to_chuc),
          }))
          setOrgList(mapped)
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch organizations:", err)
      })

    roomsService
      .list()
      .then((res) => {
        if (!cancelled && res.data) {
          const rawList = res.data as Array<
            Partial<RoomPublic> & {
              suc_chua_toi_da?: number
              trang_thiet_bi?: {
                may_chieu?: boolean
                am_thanh?: boolean
                wifi?: boolean
              }
            }
          >
          const mapped: RoomPublic[] = rawList.map((r) => ({
            ma_phong: Number(r.ma_phong),
            ten_phong: r.ten_phong || "Hội trường",
            suc_chua: Number(r.suc_chua_toi_da ?? r.suc_chua ?? 100),
            co_so: (r.co_so === "CoSo2" ? "CoSo2" : "CoSo1") as RoomPublic["co_so"],
            toa_nha: r.toa_nha || (r.co_so === "CoSo2" ? "Tòa B" : "Tòa A"),
            vi_tri_tang: Number(r.vi_tri_tang ?? 1),
            thiet_bi: {
              may_chieu: Boolean(
                r.trang_thiet_bi?.may_chieu ?? r.thiet_bi?.may_chieu ?? true,
              ),
              am_thanh: Boolean(
                r.trang_thiet_bi?.am_thanh ?? r.thiet_bi?.am_thanh ?? true,
              ),
              wifi: Boolean(r.trang_thiet_bi?.wifi ?? r.thiet_bi?.wifi ?? true),
            },
            trang_thai: r.trang_thai,
            bao_tri_tu_ngay: r.bao_tri_tu_ngay,
            bao_tri_den_ngay: r.bao_tri_den_ngay,
          }))
          setRoomList(mapped)
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch rooms:", err)
      })

    api
      .get<{ data: Topic[] }>("/topics")
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data)) {
          setTopicList(res.data)
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch topics:", err)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    eventsService
      .organizerDetail(id)
      .then((res) => {
        if (cancelled || !res.data) return
        const ev: any = res.data
        const start = ev.thoi_gian_bat_dau ? new Date(ev.thoi_gian_bat_dau) : null
        const end = ev.thoi_gian_ket_thuc ? new Date(ev.thoi_gian_ket_thuc) : null
        const dateStr = start ? start.toISOString().slice(0, 10) : ""
        const startTimeStr = start ? start.toTimeString().slice(0, 5) : ""
        const endTimeStr = end ? end.toTimeString().slice(0, 5) : ""

        const topicId = ev.chuyen_de?.ma_chuyen_de ?? ev.ma_chuyen_de
        const roomId = ev.phong?.ma_phong ?? ev.ma_phong
        const cohostList = Array.isArray(ev.danh_sach_dong_to_chuc)
          ? ev.danh_sach_dong_to_chuc
              .map(
                (c: any) =>
                  c.don_vi_dong_to_chuc?.ma_don_vi_to_chuc ??
                  c.don_vi?.ma_don_vi_to_chuc ??
                  c.ma_don_vi_to_chuc ??
                  c.ma_don_vi,
              )
              .filter(Boolean)
              .join(",")
          : ""

        const pubDateStr = ev.ngay_cong_bo
          ? typeof ev.ngay_cong_bo === "string" && ev.ngay_cong_bo.includes("T")
            ? ev.ngay_cong_bo.split("T")[0]
            : String(ev.ngay_cong_bo).slice(0, 10)
          : ""

        setForm((prev) => ({
          ...prev,
          title: ev.ten_su_kien || ev.title || prev.title,
          topic: topicId ? String(topicId) : prev.topic,
          description: ev.mo_ta || prev.description,
          publishDate: pubDateStr || prev.publishDate,
          eventDate: dateStr || prev.eventDate,
          startTime: startTimeStr || prev.startTime,
          endTime: endTimeStr || prev.endTime,
          room: roomId ? String(roomId) : prev.room,
          cohostIds: cohostList || prev.cohostIds,
          location: ev.dia_diem || ev.ten_phong || prev.location,
          capacity:
            ev.so_luong_toi_da != null ? String(ev.so_luong_toi_da) : "",
          unlimited: ev.khong_gioi_han_slot ? "true" : "false",
          drlRule: ev.dieu_khoan_drl || prev.drlRule,
          proposedPoints:
            ev.diem_drl_du_kien != null
              ? String(ev.diem_drl_du_kien)
              : prev.proposedPoints,
          volunteerHours:
            ev.gio_tinh_nguyen != null
              ? String(ev.gio_tinh_nguyen)
              : prev.volunteerHours,
          banner: ev.anh_bia || prev.banner,
          speaker: ev.dien_gia || prev.speaker,
          targetAudience: ev.doi_tuong_tham_gia || prev.targetAudience,
          agenda: formatAgendaItems(ev.lo_trinh) || prev.agenda,
        }))
      })
      .catch((err) => {
        showToast(
          "Không thể tải thông tin sự kiện: " + getApiErrorMessage(err),
          "error",
        )
      })
    return () => {
      cancelled = true
    }
  }, [id, showToast])

  // AI Content Copilot state (UC-AI-01)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{
    title: string
    description: string
    agenda: string
  } | null>(null)

  async function handleGenerateAi() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    try {
      const res = await reportsService.generateEventContent({
        chu_de: aiPrompt.trim(),
        doi_tuong_muc_tieu: "Sinh viên Đại học Công nghệ Thông tin (UIT)",
        thoi_luong_phut: 120,
        muc_tieu: `Trang bị kiến thức và kỹ năng thực tế về ${aiPrompt.trim()} cho sinh viên`,
        phong_cach: "HaoHuc",
      })

      if (res && res.data) {
        const title =
          res.data.tieu_de_goi_y?.[0] ||
          `Hội thảo Chuyên đề: ${aiPrompt.trim()} — Ứng dụng & Xu hướng 2026`
        const description = res.data.mo_ta_de_xuat || ""
        const agenda = Array.isArray(res.data.lo_trinh_de_xuat)
          ? res.data.lo_trinh_de_xuat
              .map(
                (item, idx) =>
                  `${idx + 1}. ${item.thoi_gian_bat_dau} - ${item.thoi_gian_ket_thuc}: ${item.tieu_de}${item.dien_gia ? ` (Diễn giả: ${item.dien_gia})` : ""}`,
              )
              .join("\n")
          : ""

        setAiResult({
          title,
          description,
          agenda,
        })
      }
    } catch {
      // Graceful fallback when backend AI service is offline
      setAiResult({
        title: `Hội thảo Chuyên đề: ${aiPrompt.trim()} — Ứng dụng & Xu hướng 2026`,
        description: `Chương trình hội thảo chuyên sâu về ${aiPrompt.trim()} nhằm trang bị cho sinh viên UIT các kiến thức thực chiến, phương pháp tiếp cận mới nhất cùng sự tham gia của các chuyên gia đầu ngành. Sinh viên tham dự đầy đủ sẽ được cấp Giấy chứng nhận điện tử và cộng Điểm rèn luyện.`,
        agenda: `08:00 - 08:30: Đón tiếp đại biểu & Check-in qua mã Dynamic Kiosk\n08:30 - 10:00: Diễn giả trình bày chuyên đề ${aiPrompt.trim()}\n10:00 - 11:00: Thảo luận, Q&A và kết nối doanh nghiệp\n11:00 - 11:30: Check-out và hướng dẫn làm bài khảo sát nhận chứng nhận.`,
      })
    } finally {
      setAiGenerating(false)
    }
  }

  function applyAiResult() {
    if (!aiResult) return
    setForm((f) => ({
      ...f,
      title: aiResult.title,
      description: aiResult.description,
      agenda: aiResult.agenda,
    }))
    setShowAiModal(false)
    showToast(
      "Đã áp dụng nội dung do AI gợi ý vào biểu mẫu sự kiện!",
      "success",
    )
  }

  function set(k: string, v: string) {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === "drlRule" && v === "KhongCo") {
        next.proposedPoints = "0"
      } else if (k === "drlRule" && v !== "KhongCo" && f.proposedPoints === "0") {
        next.proposedPoints = "5"
      }
      return next
    })
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast("Dung lượng ảnh banner không được vượt quá 5MB.", "error")
      return
    }
    setBannerUploading(true)
    try {
      const res = await organizationsService.uploadImage(file, "banner")
      if (res && res.data && res.data.url) {
        set("banner", res.data.url)
        showToast("Tải ảnh banner thành công!", "success")
      }
    } catch (err) {
      showToast("Lỗi khi tải ảnh banner: " + getApiErrorMessage(err), "error")
    } finally {
      setBannerUploading(false)
    }
  }

  const selectedRoom = roomList.find((item) => String(item.ma_phong) === form.room)

  function validate(submitForApproval: boolean) {
    const e: Record<string, string> = {}
    if (!form.title.trim()) {
      e.title = "Vui lòng nhập tên sự kiện."
    } else if (form.title.trim().length < 5) {
      e.title = "Tên sự kiện phải có ít nhất 5 ký tự."
    }

    if (!form.topic) e.topic = "Vui lòng chọn chủ đề."
    if (!form.description.trim()) {
      e.description = "Vui lòng nhập mô tả sự kiện."
    } else if (form.description.trim().length < 10) {
      e.description = "Mô tả sự kiện phải có ít nhất 10 ký tự."
    }

    if (!form.room) e.room = "Vui lòng chọn phòng từ danh mục."
    if (selectedRoom) {
      const maint = getRoomMaintenanceInfo(
        selectedRoom,
        form.eventDate,
        form.startTime,
        form.endTime,
      )
      if (maint.isConflict) {
        e.room = `Phòng đang trong lịch bảo trì tại khung giờ này${maint.detail ? ` (${maint.detail})` : ""}. Vui lòng chọn phòng hoặc thời gian khác.`
      }
    }

    if (form.unlimited === "false") {
      if (
        !form.capacity ||
        isNaN(Number(form.capacity)) ||
        Number(form.capacity) <= 0
      ) {
        e.capacity = "Sức chứa phải là số nguyên dương."
      } else if (selectedRoom && Number(form.capacity) > selectedRoom.suc_chua) {
        e.capacity = `Vượt sức chứa tối đa của phòng (${selectedRoom.suc_chua} chỗ).`
      }
    }

    if (form.drlRule === "KhongCo") {
      if (Number(form.proposedPoints) !== 0) {
        e.proposedPoints = "Điểm ĐRL phải bằng 0 khi chọn điều khoản Không có."
      }
    } else {
      const pts = Number(form.proposedPoints)
      if (isNaN(pts) || pts < 1 || pts > 5) {
        e.proposedPoints = "Điểm ĐRL phải từ 1 đến 5 khi chọn Điều 3 hoặc Điều 4."
      }
    }

    // UC-EVT-01.EX.2: Co-host cannot be host unit
    const hostUnitId = user?.ma_don_vi_to_chuc ?? user?.don_vi?.ma_don_vi
    const hostUnitName = user?.don_vi?.ten_don_vi?.toLowerCase().trim()
    if (form.cohostIds) {
      const selectedCohostIds = form.cohostIds.split(",").map((s) => s.trim())
      const isSelectingOwnUnit = orgList.some((org) => {
        if (!selectedCohostIds.includes(String(org.ma_don_vi))) return false
        if (
          hostUnitId &&
          (org.ma_don_vi === hostUnitId || org.ma_don_vi === Number(hostUnitId))
        )
          return true
        if (
          hostUnitName &&
          org.ten_don_vi.toLowerCase().trim() === hostUnitName
        )
          return true
        return false
      })
      if (isSelectingOwnUnit) {
        e.cohost = "Đơn vị đồng tổ chức không được trùng với đơn vị chủ trì."
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    if (!form.eventDate) {
      if (submitForApproval) e.eventDate = "Vui lòng chọn ngày tổ chức."
    } else if (form.eventDate < today) {
      e.eventDate = "Thời gian tổ chức không được nằm trong quá khứ."
    }

    if (!form.publishDate) {
      e.publishDate = "Vui lòng chọn ngày công bố sự kiện."
    } else if (form.eventDate && form.publishDate > form.eventDate) {
      e.publishDate = "Ngày công bố phải trước hoặc bằng ngày diễn ra sự kiện."
    }

    if (!form.startTime || !form.endTime) {
      if (submitForApproval) e.endTime = "Vui lòng chọn giờ bắt đầu và kết thúc."
    } else {
      const startMin = parseTimeToMinutes(form.startTime)
      const endMin = parseTimeToMinutes(form.endTime)
      if (startMin >= 0 && endMin >= 0 && endMin <= startMin) {
        e.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu."
      }
    }

    return e
  }

  async function handleSubmit(submitForApproval: boolean) {
    if (saving) return
    const clientErrors = validate(submitForApproval)
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      showToast(Object.values(clientErrors)[0], "error")
      return
    }
    setSaving(true)
    try {
      const title = form.title.trim() || "Bản nháp chưa đặt tên"
      let eventTargetId = id ? Number(id) : undefined

      const payload: any = {
        ten_su_kien: title,
        mo_ta: form.description.trim(),
        ma_chuyen_de: Number(form.topic),
        ma_phong: Number(form.room),
        ngay_cong_bo: `${form.publishDate}T08:00:00`,
        thoi_gian_bat_dau: `${form.eventDate}T${form.startTime}:00`,
        thoi_gian_ket_thuc: `${form.eventDate}T${form.endTime}:00`,
        khong_gioi_han_slot: form.unlimited === "true",
        so_luong_toi_da:
          form.unlimited === "true" ? null : Number(form.capacity),
        dieu_khoan_drl: form.drlRule,
        diem_drl_du_kien:
          form.drlRule === "KhongCo" ? 0 : Number(form.proposedPoints),
        gio_tinh_nguyen: Number(form.volunteerHours) || 0,
        anh_bia: form.banner || null,
        dien_gia: form.speaker.trim() || null,
        doi_tuong_tham_gia: form.targetAudience.trim() || null,
        lo_trinh: parseAgendaText(form.agenda),
        ...(form.cohostIds.trim()
          ? {
              danh_sach_co_host_ids: form.cohostIds
                .split(",")
                .map(Number)
                .filter(Number.isFinite),
            }
          : {}),
      }

      if (id) {
        const updated = await eventsService.updateDraft(id, payload)
        if (!updated.success)
          throw new Error(updated.message || "Không thể cập nhật bản nháp")
      } else {
        const created = await eventsService.createDraft(payload)
        if (!created.success)
          throw new Error(created.message || "Không thể tạo bản nháp")
        const event = (created.data ?? {}) as {
          ma_su_kien?: number
          id?: number
        }
        eventTargetId = event.ma_su_kien ?? event.id
      }

      if (submitForApproval && eventTargetId) {
        await eventsService.submitApproval(eventTargetId)
      }

      saveApprovalDraft(
        {
          eventId: eventTargetId ? String(eventTargetId) : undefined,
          title,
          eventDate: form.eventDate,
          description: form.description,
          plan: form.agenda || "Nội dung chương trình được lưu từ biểu mẫu sự kiện.",
          proposedPoints:
            form.drlRule === "KhongCo" ? 0 : Number(form.proposedPoints) || 0,
          maxPoints:
            form.drlRule === "KhongCo" ? 0 : Number(form.proposedPoints) || 0,
          thresholds: [
            {
              ratio: 70,
              points: Math.max(
                1,
                (form.drlRule === "KhongCo" ? 0 : Number(form.proposedPoints) || 0) - 2,
              ),
            },
            {
              ratio: 90,
              points:
                form.drlRule === "KhongCo" ? 0 : Number(form.proposedPoints) || 0,
            },
          ],
        },
        submitForApproval,
      )

      showToast(
        submitForApproval
          ? "Đã gửi duyệt sự kiện thành công."
          : "Đã lưu bản nháp sự kiện thành công.",
        "success",
      )
      onNavigate("org-events")
    } catch (error) {
      const vErrors = getValidationErrors(error)
      if (vErrors && Object.keys(vErrors).length > 0) {
        const mappedErrors: Record<string, string> = {}
        const fieldMapping: Record<string, string> = {
          ten_su_kien: "title",
          mo_ta: "description",
          ma_chuyen_de: "topic",
          ma_phong: "room",
          ngay_cong_bo: "publishDate",
          thoi_gian_bat_dau: "startTime",
          thoi_gian_ket_thuc: "endTime",
          so_luong_toi_da: "capacity",
          khong_gioi_han_slot: "capacity",
          dieu_khoan_drl: "drlRule",
          diem_drl_du_kien: "proposedPoints",
          gio_tinh_nguyen: "volunteerHours",
          anh_bia: "banner",
          dien_gia: "speaker",
          doi_tuong_tham_gia: "targetAudience",
          lo_trinh: "agenda",
          danh_sach_co_host_ids: "cohost",
        }
        for (const [backendField, msgs] of Object.entries(vErrors)) {
          const formField = fieldMapping[backendField] || backendField
          mappedErrors[formField] = Array.isArray(msgs) ? msgs[0] : String(msgs)
        }
        setErrors(mappedErrors)
        const firstMsg = Object.values(mappedErrors)[0]
        showToast(firstMsg || "Dữ liệu cung cấp không hợp lệ.", "error")
      } else {
        showToast(getApiErrorMessage(error), "error")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <OrgLayout current="org-events" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 text-sm mb-2"
          style={{ color: "#94a3b8" }}
        >
          <button
            onClick={() => onNavigate("org-events")}
            className="hover:underline"
          >
            Quản lý sự kiện
          </button>
          <span>/</span>
          <span style={{ color: "#1a1a2e" }}>
            {isEditMode ? "Chỉnh sửa sự kiện nháp" : "Tạo sự kiện mới"}
          </span>
        </div>

        <h1
          className="font-display font-bold text-2xl mb-6"
          style={{ color: "#1a1a2e" }}
        >
          {isEditMode ? "Chỉnh sửa sự kiện nháp" : "Tạo sự kiện mới"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">
            {/* Soft Hold 48h Warning Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <span className="text-base">⏳</span>
              <div>
                <p className="font-bold">
                  Chính sách giữ chỗ phòng Soft Hold 48h:
                </p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Khi bạn nhấn "Gửi phê duyệt", phòng hội trường được chọn sẽ
                  được hệ thống giữ tạm thời (Soft Hold) tối đa 48 giờ để chờ
                  Khoa và CTSV thẩm định. Slot sẽ tự giải phóng nếu không được
                  duyệt trước thời hạn.
                </p>
              </div>
            </div>

            {/* Section 1: Thông tin chung */}
            <Section title="Thông tin chung">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">
                  Nhập tiêu đề hoặc dùng trợ lý AI:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trợ lý gợi ý nội dung & Agenda</span>
                </button>
              </div>
              <FormField label="Tên sự kiện" required error={errors.title}>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="VD: Hội thảo Trí tuệ nhân tạo 2026"
                  className={inputClass(!!errors.title)}
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Chủ đề" required error={errors.topic}>
                  <select
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    className={inputClass(!!errors.topic)}
                  >
                    <option value="">Chọn chủ đề</option>
                    {topicList.map((topic) => (
                      <option
                        key={topic.ma_chuyen_de}
                        value={topic.ma_chuyen_de}
                      >
                        {topic.ten_chuyen_de}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Ảnh banner" error={errors.banner}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="banner-upload"
                        onChange={handleBannerUpload}
                        disabled={bannerUploading}
                      />
                      <label
                        htmlFor="banner-upload"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                        style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>
                          {bannerUploading
                            ? "Đang tải ảnh lên..."
                            : form.banner
                              ? "Thay đổi banner"
                              : "Tải lên banner"}
                        </span>
                      </label>
                      {form.banner && (
                        <button
                          type="button"
                          onClick={() => set("banner", "")}
                          className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                          title="Xóa banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {form.banner && (
                      <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={form.banner}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Diễn giả / Khách mời"
                  error={errors.speaker}
                >
                  <input
                    value={form.speaker}
                    onChange={(e) => set("speaker", e.target.value)}
                    placeholder="VD: TS. Nguyễn Văn A (Trưởng khoa HTTT)"
                    className={inputClass(!!errors.speaker)}
                  />
                </FormField>

                <FormField
                  label="Đối tượng tham gia"
                  error={errors.targetAudience}
                >
                  <input
                    value={form.targetAudience}
                    onChange={(e) => set("targetAudience", e.target.value)}
                    placeholder="VD: Toàn thể sinh viên UIT"
                    className={inputClass(!!errors.targetAudience)}
                  />
                </FormField>
              </div>

              <FormField
                label="Mô tả sự kiện"
                required
                error={errors.description}
              >
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Mô tả chi tiết về sự kiện, mục tiêu và quyền lợi tham gia (tối thiểu 10 ký tự)..."
                  className={inputClass(!!errors.description)}
                  style={{ resize: "vertical" }}
                />
              </FormField>
            </Section>

            {/* Co-host selection */}
            <Section title="Đơn vị Đồng tổ chức (Co-hosts)">
              <p className="text-xs text-slate-500 mb-3">
                Chọn các Câu lạc bộ, Khoa hoặc Phòng ban phối hợp tổ chức. Khi
                gửi duyệt, hệ thống sẽ chuyển sự kiện sang trạng thái{" "}
                <strong>WAITING_COHOST_CONFIRM</strong> để các đơn vị đồng tổ
                chức xác nhận.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {orgList.map((org) => {
                  const selectedIds = form.cohostIds
                    ? form.cohostIds.split(",").map((s) => s.trim())
                    : []
                  const isChecked = selectedIds.includes(String(org.ma_don_vi))
                  return (
                    <label
                      key={org.ma_don_vi}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const nextIds = e.target.checked
                            ? [...selectedIds, String(org.ma_don_vi)]
                            : selectedIds.filter(
                                (id) => id !== String(org.ma_don_vi),
                              )
                          set("cohostIds", nextIds.join(","))
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-slate-800">
                        {org.ten_don_vi}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({org.loai_don_vi})
                      </span>
                    </label>
                  )
                })}
              </div>
              {errors.cohost && (
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  {errors.cohost}
                </p>
              )}
            </Section>

            {/* Section 2: Thời gian đăng ký (Ngày công bố) */}
            <Section title="Thời gian đăng ký & Công bố">
              <p className="text-xs text-slate-500 mb-3">
                Sinh viên có thể đăng ký vé từ Ngày công bố cho đến khi hệ
                thống tự động đóng đăng ký tại thời điểm <strong>T-2h</strong>{" "}
                trước khi sự kiện bắt đầu.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Ngày công bố (Bắt đầu mở đăng ký)"
                  required
                  error={errors.publishDate}
                >
                  <input
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => set("publishDate", e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    max={form.eventDate || undefined}
                    className={inputClass(!!errors.publishDate)}
                  />
                </FormField>
              </div>
            </Section>

            {/* Section 3: Thời gian tổ chức */}
            <Section title="Thời gian tổ chức">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Ngày tổ chức"
                  required
                  error={errors.eventDate}
                >
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className={inputClass(!!errors.eventDate)}
                  />
                </FormField>
                <FormField label="Giờ bắt đầu" required error={errors.startTime}>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    className={inputClass(!!errors.startTime)}
                  />
                </FormField>
                <FormField label="Giờ kết thúc" required error={errors.endTime}>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={inputClass(!!errors.endTime)}
                  />
                </FormField>
              </div>
            </Section>

            {/* Section 4: Địa điểm & Phòng */}
            <Section title="Địa điểm & Phòng hội trường">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tên địa điểm / Cơ sở">
                  <input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="VD: Trường ĐH Công nghệ Thông tin"
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField
                  label="Phòng / Hội trường"
                  required
                  error={errors.room}
                >
                  <select
                    value={form.room}
                    onChange={(e) => set("room", e.target.value)}
                    className={inputClass(!!errors.room)}
                  >
                    <option value="">Chọn phòng từ danh mục</option>
                    {roomList.map((room) => {
                      const maint = getRoomMaintenanceInfo(
                        room,
                        form.eventDate,
                        form.startTime,
                        form.endTime,
                      )
                      return (
                        <option
                          key={room.ma_phong}
                          value={room.ma_phong}
                          disabled={maint.isConflict}
                        >
                          {room.ten_phong} · {room.co_so} · {room.suc_chua} chỗ
                          {maint.suffix}
                        </option>
                      )
                    })}
                  </select>
                  {(() => {
                    const selectedRoom = roomList.find(
                      (item) => String(item.ma_phong) === form.room,
                    )
                    if (!selectedRoom) return null
                    const maint = getRoomMaintenanceInfo(
                      selectedRoom,
                      form.eventDate,
                      form.startTime,
                      form.endTime,
                    )
                    if (!maint.isConflict) return null
                    return (
                      <p className="mt-1 text-xs text-rose-600 font-medium">
                        ⚠️ {selectedRoom.ten_phong} đang có lịch bảo trì tại khung giờ đã chọn ({maint.detail}). Vui lòng chọn phòng hoặc khung giờ khác.
                      </p>
                    )
                  })()}
                </FormField>
              </div>
            </Section>

            {/* Section 5: Sức chứa */}
            <Section title="Sức chứa & Slot tham gia">
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.unlimited === "true"}
                  onChange={(event) => {
                    const isUnl = event.target.checked
                    set("unlimited", isUnl ? "true" : "false")
                    if (isUnl) set("capacity", "")
                  }}
                />
                <span>Sự kiện mở tự do, không giới hạn slot vé</span>
              </label>

              {form.unlimited === "false" && (
                <FormField
                  label="Số lượng tham gia tối đa (Slot vé)"
                  required
                  error={errors.capacity}
                >
                  <input
                    type="number"
                    min={1}
                    max={selectedRoom ? selectedRoom.suc_chua : undefined}
                    value={form.capacity}
                    onChange={(e) => set("capacity", e.target.value)}
                    placeholder={
                      selectedRoom
                        ? `Tối đa ${selectedRoom.suc_chua} chỗ theo sức chứa phòng`
                        : "VD: 100"
                    }
                    className={`${inputClass(!!errors.capacity)} max-w-xs`}
                  />
                </FormField>
              )}
              <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                {form.unlimited === "true"
                  ? "Sự kiện mở tự do cho phép sinh viên tham gia không cần xếp hàng slot."
                  : selectedRoom
                    ? `Phòng ${selectedRoom.ten_phong} có sức chứa tối đa ${selectedRoom.suc_chua} chỗ. Hệ thống sẽ đóng đăng ký khi hết slot.`
                    : "Sau khi đạt giới hạn, hệ thống sẽ tự động đóng đăng ký và kích hoạt hàng đợi Waitlist."}
              </p>
            </Section>

            {/* Section 6: Nội dung chương trình (lo_trinh) */}
            <Section title="Nội dung chương trình (Lộ trình sự kiện)">
              <FormField
                label="Lịch trình chi tiết (Lộ trình JSON Array - Mỗi mốc một dòng)"
                error={errors.agenda}
              >
                <textarea
                  value={form.agenda}
                  onChange={(e) => set("agenda", e.target.value)}
                  rows={5}
                  placeholder="08:00 - 08:30: Khai mạc và đón tiếp đại biểu&#10;08:30 - 10:00: Diễn giả thuyết trình chuyên đề&#10;10:00 - 11:00: Thảo luận, Q&A và giải đáp thắc mắc&#10;11:00 - 11:30: Bế mạc và check-out nhận DRL"
                  className={inputClass(!!errors.agenda)}
                  style={{ resize: "vertical" }}
                />
              </FormField>
              <p className="text-xs text-slate-400">
                Hệ thống sẽ tự động chuyển đổi các dòng lịch trình thành danh
                sách Agenda chuẩn OpenAPI để hiển thị cho sinh viên.
              </p>
            </Section>

            {/* Section 7: Đề xuất điểm rèn luyện */}
            <Section title="Đề xuất Điểm rèn luyện (ĐRL)">
              <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  Đây là quy tắc điểm dự kiến theo SRS v3.1.3. Điểm thực tế chỉ
                  được công nhận sau khi đối soát và Phòng CTSV phê duyệt.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Điều khoản ĐRL" required error={errors.drlRule}>
                  <select
                    value={form.drlRule}
                    onChange={(event) => set("drlRule", event.target.value)}
                    className={inputClass(!!errors.drlRule)}
                  >
                    <option value="KhongCo">Không có</option>
                    <option value="Dieu3">Điều 3</option>
                    <option value="Dieu4">Điều 4</option>
                  </select>
                </FormField>
                <FormField
                  label="Điểm ĐRL đề xuất (0 - 5)"
                  required
                  error={errors.proposedPoints}
                >
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={form.proposedPoints}
                    onChange={(e) => set("proposedPoints", e.target.value)}
                    disabled={form.drlRule === "KhongCo"}
                    className={inputClass(!!errors.proposedPoints)}
                  />
                </FormField>
                <FormField
                  label="Giờ tình nguyện"
                  error={errors.volunteerHours}
                >
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    value={form.volunteerHours}
                    onChange={(e) => set("volunteerHours", e.target.value)}
                    className={inputClass(!!errors.volunteerHours)}
                  />
                </FormField>
              </div>
            </Section>
          </div>

          {/* Preview sidebar — desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <div
                className="bg-white rounded-2xl p-5 shadow-sm border"
                style={{ borderColor: "#f1f5f9" }}
              >
                <h3
                  className="font-display font-semibold text-sm mb-3"
                  style={{ color: "#1a1a2e" }}
                >
                  Xem trước thẻ sự kiện
                </h3>
                <div
                  className="rounded-xl overflow-hidden mb-3 bg-slate-100"
                  style={{ height: 130 }}
                >
                  {form.banner ? (
                    <img
                      src={form.banner}
                      alt={form.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "#cbd5e1" }}
                    >
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>
                <h4
                  className="font-display font-semibold text-sm leading-snug mb-2"
                  style={{ color: form.title ? "#1a1a2e" : "#cbd5e1" }}
                >
                  {form.title || "Tên sự kiện sẽ hiển thị ở đây"}
                </h4>
                <div className="space-y-1.5">
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {form.eventDate
                        ? formatCalendarDate(form.eventDate)
                        : "Chưa chọn ngày"}
                    </span>
                  </p>
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {selectedRoom?.ten_phong ||
                        form.location ||
                        "Chưa có địa điểm"}
                    </span>
                  </p>
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {form.unlimited === "true"
                        ? "Không giới hạn slot"
                        : form.capacity
                          ? `0/${form.capacity} chỗ`
                          : "Chưa có sức chứa"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap gap-3 mt-6 pt-6 border-t"
          style={{ borderColor: "#e2e8f0" }}
        >
          <button
            type="button"
            onClick={() => onNavigate("org-events")}
            className="px-6 py-2.5 rounded-xl text-sm font-medium border"
            style={{
              borderColor: "#e2e8f0",
              color: "#475569",
              background: "white",
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border disabled:opacity-50"
            style={{
              borderColor: "#e2e8f0",
              color: "#4f46e5",
              background: "#eef2ff",
            }}
          >
            {saving ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#4f46e5" }}
          >
            {saving ? "Đang xử lý..." : "Gửi khoa duyệt"}
          </button>
          <p className="w-full text-xs text-slate-400">
            Gửi duyệt không đồng nghĩa công bố. Sự kiện chỉ đủ điều kiện công bố
            sau khi Khoa và Phòng CTSV phê duyệt.
          </p>
        </div>

        {/* UC-AI-01: AI Content Copilot Modal */}
        {showAiModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAiModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">
                      Gợi ý Nội dung & Timeline Sự kiện
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ soạn thảo khung chương trình chuẩn CTSV
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Nhập từ khóa hoặc ý tưởng chủ đề sự kiện của bạn (ví dụ:{" "}
                <em>"Workshop AI Agent & React cho sinh viên UIT"</em>,{" "}
                <em>"Giải bóng đá tân sinh viên 2026"</em>). Hệ thống sẽ tự động sinh
                tiêu đề thu hút, mô tả chi tiết và khung timeline chương trình.
              </p>

              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Nhập ý tưởng chủ đề sự kiện..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-600 font-medium"
                />
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo nội dung đề xuất...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo nội dung & Agenda ngay</span>
                    </>
                  )}
                </button>
              </div>

              {aiResult && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3 mb-5 max-h-60 overflow-y-auto text-xs">
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Tiêu đề gợi ý:
                    </p>
                    <p className="font-semibold text-slate-900 bg-white p-2.5 rounded-xl border border-purple-200">
                      {aiResult.title}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Mô tả chương trình:
                    </p>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200 leading-relaxed">
                      {aiResult.description}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Lịch trình Agenda:
                    </p>
                    <pre className="text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200 font-sans whitespace-pre-wrap leading-relaxed">
                      {aiResult.agenda}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                {aiResult && (
                  <button
                    type="button"
                    onClick={applyAiResult}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                  >
                    Áp dụng vào form
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border"
      style={{ borderColor: "#f1f5f9" }}
    >
      <h2
        className="font-display font-semibold text-base mb-4 pb-3 border-b"
        style={{ color: "#1a1a2e", borderColor: "#f1f5f9" }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#475569" }}
      >
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "#dc2626" }}>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1 font-medium" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    hasError
      ? "border-red-400 bg-red-50 text-red-900"
      : "border-slate-200 focus:border-indigo-500"
  }`
}
