import { api } from "../client"
import type { FeedbackPayload } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const feedbackService = {
  submit: (eventId: number | string, payload: FeedbackPayload) =>
    api.post<ApiEnvelope<{ thanh_cong: boolean }>>(`/events/${eventId}/feedback`, payload),
  grantGrace: (ticketId: number | string, ly_do: string) =>
    api.post<ApiEnvelope<{ han_chot_khao_sat_moi?: string }>>(
      `/admin/tickets/${ticketId}/feedback-grace`,
      {
        ly_do,
      },
    ),
}
