import { api } from "../client"
import type { Participant, StaffAssignment } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

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
  selfCheckin: (payload: { ma_su_kien: number; dynamic_totp_code: string }, deviceId: string) =>
    api.post<ApiEnvelope<{ status: string; thoi_gian_checkin?: string }>>("/attendance/self-check-in", payload, {
      headers: { "X-Device-Id": deviceId },
    }),
  selfCheckout: (payload: { ma_su_kien: number; dynamic_totp_code: string }, deviceId: string) =>
    api.post<ApiEnvelope<{ status: string; thoi_luong_tham_du_phut?: number; ti_le_drl?: number }>>("/attendance/self-check-out", payload, {
      headers: { "X-Device-Id": deviceId },
    }),
  participants: (
    eventId: number | string,
    query?: Record<string, string | number>,
  ) =>
    api.get<ApiEnvelope<Participant[]>>(`/events/${eventId}/participants`, {
      query,
    }),
  manualOverride: (payload: {
    ma_dang_ky?: number
    ticketId?: string
    trang_thai_moi: "DaCheckIn" | "DaCheckOut"
    ti_le_drl_moi?: number
    ly_do: string
    da_doi_soat_the?: boolean
  }) =>
    api.post<ApiEnvelope<{ thanh_cong: boolean }>>("/attendance/manual-override", payload),
  staff: (eventId: number | string) =>
    api.get<ApiEnvelope<StaffAssignment[]>>(`/events/${eventId}/staff`),
  assignStaff: (eventId: number | string, danh_sach_mssv: string[]) =>
    api.post<ApiEnvelope<StaffAssignment[]>>(`/events/${eventId}/staff`, {
      danh_sach_mssv,
    }),
  revokeStaff: (eventId: number | string, userId: number | string) =>
    api.delete<ApiEnvelope<null>>(`/events/${eventId}/staff/${userId}`),
}
