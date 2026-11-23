import { api } from "../client"
import type { TicketDetail } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export interface BookingConflictEvent {
  ma_su_kien: number
  ten_su_kien: string
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  khong_gioi_han_slot: boolean
  ten_phong?: string
}

export interface BookingPrecheckData {
  co_the_dat?: boolean
  du_dieu_kien?: boolean
  khong_gioi_han_slot?: boolean
  ly_do_chan?:
    | "SLOT_SOLD_OUT"
    | "REGISTRATION_CLOSED"
    | "SCHEDULE_CONFLICT_HARD"
    | "ALREADY_REGISTERED"
    | null
  ly_do?: string
  canh_bao_trung_lich_mem?: string | null
  su_kien_trung?: BookingConflictEvent[]
}

export const bookingsService = {
  precheck: (eventId: number | string) =>
    api.get<ApiEnvelope<BookingPrecheckData>>(`/events/${eventId}/booking-check`),
  book: (eventId: number | string, idempotencyKey: string) =>
    api.post<ApiEnvelope<TicketDetail>>(`/events/${eventId}/book`, undefined, {
      idempotencyKey,
    }),
}
