import { api } from "../client"
import type { TicketDetail, WaitlistEntry } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const waitlistService = {
  join: (eventId: number | string, idempotencyKey: string) =>
    api.post<ApiEnvelope<WaitlistEntry>>(
      `/events/${eventId}/waitlist`,
      undefined,
      {
        idempotencyKey,
      },
    ),
  mine: (query?: { tab?: "active" | "history"; trang_thai?: string }) =>
    api.get<ApiEnvelope<WaitlistEntry[]>>("/waitlist/my-entries", { query }),
  claim: (id: number, idempotencyKey: string) =>
    api.post<ApiEnvelope<TicketDetail>>(`/waitlist/${id}/claim`, undefined, {
      idempotencyKey,
    }),
  decline: (id: number, idempotencyKey: string) =>
    api.post<ApiEnvelope<WaitlistEntry>>(`/waitlist/${id}/decline`, undefined, {
      idempotencyKey,
    }),
}
