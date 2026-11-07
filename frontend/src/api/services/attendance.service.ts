import { api } from "../client"
import type { Participant, StaffAssignment, TicketStatus } from "../../data/contract"
import type { ApiEnvelope, PaginationMeta } from "./auth.service"

export interface KioskTotpData {
  ma_su_kien: number
  ten_su_kien: string
  che_do_hien_tai: "DONG" | "CHECK_IN" | "CHECK_OUT"
  cong_check_in_mo: boolean
  cong_check_out_mo: boolean
  totp_code: string
  qr_payload: string
  chu_ky_giay: number
  het_han_luc: string
  expires_in_seconds: number
}

export interface StaffScanData {
  ma_dang_ky: number
  sinh_vien: {
    ho_ten: string
    mssv: string
    khoa: string
    lop_sinh_hoat: string | null
  }
  canh_bao_doi_soat_the_sv: boolean
  trang_thai_ve: "DaCheckIn" | "DaCheckOut"
  thoi_gian_quet: string
  thoi_luong_tham_du_phut: number | null
  ti_le_drl: number | null
}

export interface StaffEventOption {
  ma_su_kien: number
  ten_su_kien: string
}

export interface SelfAttendancePayload {
  ma_su_kien: number
  totp_code?: string
  dynamic_totp_code?: string
}

export interface SelfCheckInData {
  ma_dang_ky: number
  trang_thai: "DaCheckIn"
  thoi_gian_check_in: string
}

export interface SelfCheckOutData {
  ma_dang_ky: number
  trang_thai: "DaCheckOut"
  thoi_gian_check_out: string
  thoi_luong_tham_du_phut: number
  ty_le_tham_du_pct: number
  ti_le_drl: 0 | 0.5 | 1
}

export interface ParticipantAttendanceData {
  ma_dang_ky: number
  ma_tai_khoan: number
  mssv: string | null
  ho_ten: string
  lop_sinh_hoat: string | null
  khoa: string | null
  trang_thai: TicketStatus
  da_check_in: boolean
  da_check_out: boolean
  thoi_gian_dang_ky: string | null
  thoi_gian_check_in: string | null
  thoi_gian_check_out: string | null
  thoi_luong_tham_du_phut: number | null
  ty_le_tham_du_pct: number | null
  ti_le_drl: number
  da_feedback: boolean
  han_an_han_feedback: string | null
  du_dieu_kien_drl: boolean
  nghi_van_gian_lan: boolean
  ma_thiet_bi_nghi_van: string | null
  vi_pham_no_show: boolean
  ghi_chu: string | null
}

export interface ManualOverridePayload {
  ma_dang_ky: number
  trang_thai_moi: "DaCheckIn" | "DaCheckOut"
  ti_le_drl_moi: number
  ly_do: string
  ticketId?: string
  da_doi_soat_the?: boolean
}

export type ManualOverrideData = Pick<
  Participant,
  | "ma_dang_ky"
  | "trang_thai"
  | "thoi_gian_check_in"
  | "thoi_gian_check_out"
  | "ti_le_drl"
  | "nghi_van_gian_lan"
  | "vi_pham_no_show"
  | "du_dieu_kien_drl"
> & { ma_thiet_bi_nghi_van: string | null }

export const attendanceService = {
  startKiosk: (eventId: number | string) =>
    api.post<ApiEnvelope<{ kiosk_token: string }>>(
      `/events/${eventId}/kiosk/start`,
    ),
  totpStream: (kioskToken: string) =>
    api.get<ApiEnvelope<KioskTotpData>>("/kiosk/totp-stream", { kioskToken }),
  openCheckin: (eventId: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/kiosk/open-checkin`),
  openCheckout: (eventId: number | string, payload?: unknown) =>
    api.post<ApiEnvelope<unknown>>(
      `/events/${eventId}/kiosk/open-checkout`,
      payload,
    ),
  closeGates: (eventId: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/kiosk/close-gates`),
  myStaffEvents: () =>
    api.get<ApiEnvelope<StaffEventOption[]>>("/staff/my-events"),
  staffScan: (payload: {
    ma_su_kien: number
    che_do_quet: "CHECK_IN" | "CHECK_OUT"
    chuoi_qr_ve: string
  }) => api.post<ApiEnvelope<StaffScanData>>("/attendance/staff-scan", payload),
  selfCheckin: (payload: SelfAttendancePayload, deviceId: string) =>
    api.post<ApiEnvelope<SelfCheckInData>>(
      "/attendance/self-check-in",
      payload,
      {
        headers: { "X-Device-Id": deviceId },
      },
    ),
  selfCheckout: (payload: SelfAttendancePayload, deviceId: string) =>
    api.post<ApiEnvelope<SelfCheckOutData>>(
      "/attendance/self-check-out",
      payload,
      {
        headers: { "X-Device-Id": deviceId },
      },
    ),
  participants: (
    eventId: number | string,
    query?: Record<string, string | number>,
  ) =>
    api.get<
      ApiEnvelope<ParticipantAttendanceData[]> & { meta?: PaginationMeta }
    >(`/events/${eventId}/participants`, {
      query,
    }),
  manualOverride: (payload: ManualOverridePayload) =>
    api.post<ApiEnvelope<ManualOverrideData>>(
      "/attendance/manual-override",
      payload,
    ),
  staff: (eventId: number | string) =>
    api.get<ApiEnvelope<StaffAssignment[]>>(`/events/${eventId}/staff`),
  assignStaff: (eventId: number | string, danh_sach_mssv: string[]) =>
    api.post<ApiEnvelope<StaffAssignment[]>>(`/events/${eventId}/staff`, {
      danh_sach_mssv,
    }),
  revokeStaff: (eventId: number | string, userId: number | string) =>
    api.delete<ApiEnvelope<null>>(`/events/${eventId}/staff/${userId}`),
}
