import { api } from "../client"
import type { DrlRecord } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const drlService = {
  list: (eventId: number | string, query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<DrlRecord[]>>(`/events/${eventId}/drl`, { query }),
  lock: (eventId: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/drl/lock`),
  unlock: (eventId: number | string, ly_do: string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${eventId}/drl/unlock`, { ly_do }),
  export: (eventId: number | string) =>
    api.get<Blob>(`/events/${eventId}/drl/export`),
}
