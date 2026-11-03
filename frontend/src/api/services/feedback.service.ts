import { api } from "../client"
import type { ApiEnvelope } from "./auth.service"

export const feedbackService = {
  submit: (eventId: number | string, payload: unknown) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/feedback`, payload),
  grantGrace: (ticketId: number | string, ly_do: string) =>
    api.post<ApiEnvelope<unknown>>(
      `/admin/tickets/${ticketId}/feedback-grace`,
      {
        ly_do,
      },
    ),
}
