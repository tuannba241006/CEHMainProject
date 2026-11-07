import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  EVENTS,
  type Topic,
  type AgendaItem,
  type EventStatus as ContractEventStatus,
} from "../data/mock"
import type { OrganizationSummary } from "../data/contract"
import { eventsService } from "../api/services/events.service"
import { getApiErrorMessage } from "../api/errors"

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
  if (e.isCancelled) return "closed"
  if (!e.registrationOpen) return "closed"
  if (e.registered >= e.capacity) return "full"
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
  const [events, setEvents] = useState<LiveEvent[]>(INITIAL_LIVE_EVENTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refetch() {
    setLoading(true)
    setError(null)
    try {
      const res = await eventsService.listPublic()
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        // mapped from API
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
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
