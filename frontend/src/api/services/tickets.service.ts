import { api } from "../client"
import type { Ticket, TicketDetail } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const ticketsService = {
  mine: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<Ticket[]>>("/tickets/my-tickets", { query }),
  detail: (id: number | string) =>
    api.get<ApiEnvelope<TicketDetail>>(`/tickets/${id}`),
  cancel: (id: number | string, ly_do_huy: string, idempotencyKey: string) =>
    api.post<ApiEnvelope<Ticket>>(`/tickets/${id}/cancel`, { ly_do_huy }, {
      idempotencyKey,
    }),
}
