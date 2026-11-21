import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  EVENTS,
  type Topic,
  type AgendaItem,
  type EventStatus as ContractEventStatus,
} from "../data/mock"
import type { OrganizationSummary, EventCard, EventPublicDetail, SmartActionButton } from "../data/contract"
import { eventsService } from "../api/services/events.service"
import { getApiErrorMessage, isAuthError } from "../api/errors"

export type EventStatus = "open" | "nearly_full" | "full" | "draft" | "closed" | "ended"

export interface LiveEvent {
  ma_su_kien: number
  ten_su_kien: string
  anh_bia?: string | null
  dien_gia?: string | null
  ten_chuyen_de: string
  ten_don_vi_host: string
  danh_sach_ten_dong_to_chuc: string[]
  ten_phong: string
  co_so: "CoSo1" | "CoSo2"
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  khong_gioi_han_slot: boolean
  so_ve_con_lai?: number | null
  so_luong_toi_da?: number | null
  trang_thai: ContractEventStatus
  dieu_khoan_drl: "KhongCo" | "Dieu3" | "Dieu4"
  diem_drl_du_kien: number
  gio_tinh_nguyen: number
  mo_ta: string
  lo_trinh: AgendaItem[]
  doi_tuong_tham_gia?: string | null
  da_chot_drl?: boolean
  nut_bam_dieu_huong?: SmartActionButton

  id: string
  title: string
  speaker: string
  topic: Topic | string
  description: string
  date: string
  time: string
  endTime: string
  location: string
  room: string
  capacity: number
  registered: number
  registrationOpen: boolean
  isCancelled: boolean
  banner: string
  organizer: string
  benefits: string[]
  schedule: { time: string; title: string }[]
  don_vi_host?: OrganizationSummary
  ma_don_vi_to_chuc?: number
  coHosts?: string[]
  status?: string
  so_luong_da_dang_ky?: number
  ly_do_tu_choi?: string | null
  points?: number
}

export function computeEventStatus(e: LiveEvent): EventStatus {
  if (e.isCancelled || e.trang_thai === "CANCELLED") return "closed"
  const endMs = e.thoi_gian_ket_thuc
    ? new Date(e.thoi_gian_ket_thuc).getTime()
    : 0
  if (e.trang_thai === "COMPLETED" || (endMs > 0 && endMs <= Date.now())) {
    return "ended"
  }
  if (!e.registrationOpen) return "closed"
  if (e.khong_gioi_han_slot) return "open"
  if (
    e.registered >= e.capacity ||
    (typeof e.so_ve_con_lai === "number" && e.so_ve_con_lai <= 0)
  ) {
    return "full"
  }
  const ratio = (e.capacity - e.registered) / e.capacity
  if (ratio <= 0.2) return "nearly_full"
  return "open"
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  open: "Còn chỗ",
  nearly_full: "Sắp hết",
  full: "Hết chỗ",
  draft: "Bản nháp",
  closed: "Đã đóng",
  ended: "Đã kết thúc",
}

export const INITIAL_LIVE_EVENTS: LiveEvent[] = EVENTS.map((e) => ({
  ...e,
  ma_su_kien: e.ma_su_kien || 101,
  ten_su_kien: e.ten_su_kien || e.title,
  anh_bia: e.anh_bia || e.banner,
  dien_gia: e.dien_gia || e.speaker,
  ten_chuyen_de: e.ten_chuyen_de || "Công nghệ Thông tin",
  ten_don_vi_host: e.ten_don_vi_host || e.organizer,
  danh_sach_ten_dong_to_chuc: e.danh_sach_ten_dong_to_chuc || [],
  ten_phong: e.ten_phong || e.room,
  co_so: e.co_so || "CoSo1",
  thoi_gian_bat_dau: e.thoi_gian_bat_dau || e.date + "T" + e.time + ":00+07:00",
  thoi_gian_ket_thuc:
    e.thoi_gian_ket_thuc || e.date + "T" + e.endTime + ":00+07:00",
  khong_gioi_han_slot: false,
  so_ve_con_lai: e.capacity - e.registered,
  so_luong_toi_da: e.capacity,
  trang_thai: (e.status === "full"
    ? "PUBLISHED"
    : e.status === "nearly_full"
      ? "PUBLISHED"
      : e.status === "closed"
        ? "COMPLETED"
        : "PUBLISHED") as ContractEventStatus,
  dieu_khoan_drl: "Dieu3",
  diem_drl_du_kien: e.points || 5,
  gio_tinh_nguyen: 0,
  mo_ta: e.description || "",
  lo_trinh: e.lo_trinh || [],
  doi_tuong_tham_gia: "Sinh viên toàn trường",
  da_chot_drl: false,
  registrationOpen: e.status !== "closed",
  isCancelled: e.status === "closed",
  points: e.points,
  coHosts: e.coHosts,
  status: e.status,
  so_luong_da_dang_ky: e.registered,
  ly_do_tu_choi: null,
}))

export function mapContractEventToLiveEvent(
  card: EventCard | EventPublicDetail,
): LiveEvent {
  const startDateStr = card.thoi_gian_bat_dau || ""
  const endDateStr = card.thoi_gian_ket_thuc || ""
  const date = startDateStr.includes("T")
    ? startDateStr.split("T")[0]
    : startDateStr.slice(0, 10)
  const time = startDateStr.includes("T")
    ? startDateStr.split("T")[1].slice(0, 5)
    : "08:30"
  const endTime = endDateStr.includes("T")
    ? endDateStr.split("T")[1].slice(0, 5)
    : "11:30"
  const capacity = card.so_luong_toi_da ?? 100
  const remaining = card.so_ve_con_lai ?? capacity
  const registered = Math.max(0, capacity - remaining)

  const detail = card as any
  const description = detail.mo_ta || card.ten_su_kien
  const rawAgenda = Array.isArray(detail.lo_trinh)
    ? detail.lo_trinh
    : typeof detail.lo_trinh === "string"
      ? (() => {
          try {
            return JSON.parse(detail.lo_trinh)
          } catch {
            return []
          }
        })()
      : []

  const mappedSchedule = rawAgenda.map((item: any) => {
    const itemTime =
      item.time ||
      (item.thoi_gian_bat_dau
        ? `${item.thoi_gian_bat_dau} - ${item.thoi_gian_ket_thuc || ""}`
        : "")
    const itemTitle = item.title || item.tieu_de || ""
    const itemSpeaker = item.dien_gia ? ` (${item.dien_gia})` : ""
    return {
      time: itemTime,
      title: itemTitle + itemSpeaker,
    }
  })

  const topicName = detail.chuyen_de?.ten_chuyen_de || card.ten_chuyen_de || "Chung"
  const hostOrgName =
    detail.don_vi_host?.ten_don_vi || card.ten_don_vi_host || "Trường ĐH CNTT"
  const coHostNames = Array.isArray(detail.danh_sach_dong_to_chuc)
    ? detail.danh_sach_dong_to_chuc
        .map((u: any) => (typeof u === "string" ? u : u.ten_don_vi))
        .filter(Boolean)
    : card.danh_sach_ten_dong_to_chuc || []
  const roomName = detail.phong?.ten_phong || card.ten_phong || "Hội trường"
  const campus = detail.phong?.co_so || card.co_so || "CoSo1"

  const existingInitial = INITIAL_LIVE_EVENTS.find(
    (e) => e.ma_su_kien === card.ma_su_kien,
  )
  const id = String(card.ma_su_kien)

  const isClosed =
    card.trang_thai === "CANCELLED" || card.trang_thai === "COMPLETED"
  const isFull = !card.khong_gioi_han_slot && remaining <= 0
  const isNearlyFull =
    !card.khong_gioi_han_slot && remaining > 0 && remaining <= capacity * 0.2
  const legacyStatus = isClosed
    ? "closed"
    : isFull
      ? "full"
      : isNearlyFull
        ? "nearly_full"
        : "open"
  const nowMs = Date.now()
  const startMs = card.thoi_gian_bat_dau
    ? new Date(card.thoi_gian_bat_dau).getTime()
    : 0
  const endMs = card.thoi_gian_ket_thuc
    ? new Date(card.thoi_gian_ket_thuc).getTime()
    : 0
  const publishMs = detail.ngay_cong_bo
    ? new Date(detail.ngay_cong_bo).getTime()
    : 0
  const isPublishedNow = !publishMs || publishMs <= nowMs
  const isRegistrationOpen = isPublishedNow && (card.khong_gioi_han_slot
    ? (card.trang_thai === "PUBLISHED" || card.trang_thai === "HAPPENING") &&
      (!endMs || endMs > nowMs)
    : card.trang_thai === "PUBLISHED" &&
      (!startMs || startMs - nowMs > 2 * 3600 * 1000) &&
      (!endMs || endMs > nowMs))

  const drlRule = (card.dieu_khoan_drl || "Dieu3") as
    | "KhongCo"
    | "Dieu3"
    | "Dieu4"
  const drlPoints = drlRule === "KhongCo" ? 0 : (card.diem_drl_du_kien ?? 5)
  const volunteerHours =
    (card as unknown as { gio_tinh_nguyen?: number }).gio_tinh_nguyen ?? 0
  const benefits: string[] = []
  if (drlRule !== "KhongCo") {
    benefits.push(
      `Cộng ${drlPoints} điểm ĐRL (${drlRule === "Dieu4" ? "Điều 4" : "Điều 3"})`,
    )
    benefits.push("Chứng nhận tham gia hội thảo / hoạt động chính quy")
  } else {
    benefits.push("Hoạt động ngoại khóa / giao lưu (Không cộng điểm rèn luyện)")
  }
  if (volunteerHours > 0) {
    benefits.push(`Cộng ${volunteerHours} giờ tình nguyện xã hội`)
  }
  benefits.push("Cơ hội mở rộng kiến thức và giao lưu chuyên gia")

  return {
    ma_su_kien: card.ma_su_kien,
    ten_su_kien: card.ten_su_kien,
    anh_bia:
      card.anh_bia ||
      existingInitial?.anh_bia ||
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
    dien_gia: card.dien_gia || existingInitial?.dien_gia || "Ban tổ chức",
    ten_chuyen_de: topicName,
    ten_don_vi_host: hostOrgName,
    danh_sach_ten_dong_to_chuc: coHostNames,
    ten_phong: roomName,
    co_so: campus,
    thoi_gian_bat_dau: card.thoi_gian_bat_dau,
    thoi_gian_ket_thuc: card.thoi_gian_ket_thuc,
    khong_gioi_han_slot: Boolean(card.khong_gioi_han_slot),
    so_ve_con_lai: remaining,
    so_luong_toi_da: capacity,
    trang_thai: (card.trang_thai || "PUBLISHED") as ContractEventStatus,
    dieu_khoan_drl: drlRule,
    diem_drl_du_kien: drlPoints,
    gio_tinh_nguyen: volunteerHours,
    mo_ta: description,
    lo_trinh: rawAgenda,
    doi_tuong_tham_gia: detail.doi_tuong_tham_gia || "Sinh viên toàn trường",
    da_chot_drl: false,

    id,
    title: card.ten_su_kien,
    speaker: card.dien_gia || existingInitial?.speaker || "Ban tổ chức",
    topic: topicName,
    description,
    date,
    time: time,
    endTime,
    location: `${roomName}, ${campus === "CoSo2" ? "Cơ sở 2" : "Cơ sở 1"}`,
    room: roomName,
    capacity,
    registered,
    registrationOpen: isRegistrationOpen,
    isCancelled: card.trang_thai === "CANCELLED",
    banner:
      card.anh_bia ||
      existingInitial?.banner ||
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
    organizer: hostOrgName,
    benefits,
    schedule:
      mappedSchedule.length > 0
        ? mappedSchedule
        : [
            { time, title: "Khai mạc & Điểm danh" },
            { time: `${time} - ${endTime}`, title: card.ten_su_kien },
            { time: endTime, title: "Bế mạc & Hoàn tất DRL" },
          ],
    points: card.diem_drl_du_kien,
    coHosts: coHostNames,
    status: legacyStatus,
    so_luong_da_dang_ky: registered,
    ly_do_tu_choi: null,
    nut_bam_dieu_huong: detail.nut_bam_dieu_huong,
  }
}

export interface EventDataContextType {
  events: LiveEvent[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getEvent: (id: string) => LiveEvent | undefined
  computeStatus: (e: LiveEvent) => EventStatus
  cancelEvent: (eventId: string, reason: string) => { success: boolean; error?: string }
  setEvents: React.Dispatch<React.SetStateAction<LiveEvent[]>>
}

const EventDataContext = createContext<EventDataContextType | null>(null)

export function EventDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refetch() {
    setLoading(true)
    setError(null)
    try {
      const pubRes = await eventsService.listPublic({ limit: 50 })
      const cards = Array.isArray(pubRes.data) ? pubRes.data : []
      setEvents(cards.map(mapContractEventToLiveEvent))
    } catch (err) {
      if (!isAuthError(err)) setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refetch()
  }, [])

  function getEvent(id: string) {
    return events.find((e) => e.id === id || String(e.ma_su_kien) === id)
  }

  function cancelEvent(eventId: string, reason: string) {
    if (!reason.trim()) {
      return { success: false, error: "Vui lòng nhập lý do hủy sự kiện." }
    }
    const numId = Number(eventId.replace(/\D/g, "")) || eventId
    eventsService.emergencyCancel(numId, reason.trim()).catch(() => {})
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId || String(e.ma_su_kien) === eventId
          ? { ...e, isCancelled: true, registrationOpen: false, trang_thai: "CANCELLED" as ContractEventStatus }
          : e,
      ),
    )
    return { success: true }
  }

  return (
    <EventDataContext.Provider
      value={{
        events,
        loading,
        error,
        refetch,
        getEvent,
        computeStatus: computeEventStatus,
        cancelEvent,
        setEvents,
      }}
    >
      {children}
    </EventDataContext.Provider>
  )
}

export function useEventData(): EventDataContextType {
  const ctx = useContext(EventDataContext)
  if (!ctx) {
    throw new Error("useEventData must be used within an EventDataProvider")
  }
  return ctx
}
