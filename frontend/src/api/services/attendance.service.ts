import { api } from "../client"
import type { ApiEnvelope } from "./auth.service"

export const attendanceService = {
  startKiosk: (eventId: number | string) =>
    api.post<ApiEnvelope<{ kiosk_token: string }>>(
      `/events/${eventId}/kiosk/start`,
    ),
  totpStream: (kioskToken: string) =>
    api.get<ApiEnvelope<unknown>>("/kiosk/totp-stream", { kioskToken }),
  openCheckin: (eventId: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/kiosk/open-checkin`),
  openCheckout: (eventId: number | string, payload?: unknown) =>
    api.post<ApiEnvelope<unknown>>(
      `/events/${eventId}/kiosk/open-checkout`,
      payload,
    ),
  closeGates: (eventId: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/kiosk/close-gates`),
  myStaffEvents: () => api.get<ApiEnvelope<unknown[]>>("/staff/my-events"),
  staffScan: (payload: {
    ma_su_kien: number
    che_do_quet: "CHECK_IN" | "CHECK_OUT"
    chuoi_qr_ve: string
  }) => api.post<ApiEnvelope<unknown>>("/attendance/staff-scan", payload),
  selfCheckin: (payload: unknown, deviceId: string) =>
    api.post<ApiEnvelope<unknown>>("/attendance/self-check-in", payload, {
      headers: { "X-Device-Id": deviceId },
    }),
  selfCheckout: (payload: unknown, deviceId: string) =>
    api.post<ApiEnvelope<unknown>>("/attendance/self-check-out", payload, {
      headers: { "X-Device-Id": deviceId },
    }),
  participants: (
    eventId: number | string,
    query?: Record<string, string | number>,
  ) =>
    api.get<ApiEnvelope<unknown[]>>(`/events/${eventId}/participants`, {
      query,
    }),
  manualOverride: (payload: unknown) =>
    api.post<ApiEnvelope<unknown>>("/attendance/manual-override", payload),
  staff: (eventId: number | string) =>
    api.get<ApiEnvelope<unknown[]>>(`/events/${eventId}/staff`),
  assignStaff: (eventId: number | string, danh_sach_mssv: string[]) =>
    api.post<ApiEnvelope<unknown[]>>(`/events/${eventId}/staff`, {
      danh_sach_mssv,
    }),
  revokeStaff: (eventId: number | string, userId: number | string) =>
    api.delete<ApiEnvelope<null>>(`/events/${eventId}/staff/${userId}`),
}
