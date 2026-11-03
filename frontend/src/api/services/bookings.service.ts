import { api } from "../client"
import type { TicketDetail } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const bookingsService = {
  precheck: (eventId: number | string) =>
    api.get<ApiEnvelope<unknown>>(`/events/${eventId}/booking-check`),
  book: (eventId: number | string, idempotencyKey: string) =>
    api.post<ApiEnvelope<TicketDetail>>(`/events/${eventId}/book`, undefined, {
      idempotencyKey,
    }),
}
