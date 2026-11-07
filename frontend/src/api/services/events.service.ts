import { api } from "../client"
import type { EventCard, EventPublicDetail } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const eventsService = {
  listPublic: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/events", { query }),
  publicDetail: (id: number | string) =>
    api.get<ApiEnvelope<EventPublicDetail>>(`/events/${id}`),
  organizerList: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]> & { meta: { last_page: number } }>("/organizer/events", { query }),
  organizerDetail: (id: number | string) =>
    api.get<ApiEnvelope<Pick<EventCard, "trang_thai"> & { da_chot_drl: boolean }>>(`/organizer/events/${id}`),
  createDraft: (payload: unknown) =>
    api.post<ApiEnvelope<unknown>>("/events", payload),
  updateDraft: (id: number | string, payload: unknown) =>
    api.put<ApiEnvelope<unknown>>(`/events/${id}`, payload),
  cohostInvitations: () =>
    api.get<ApiEnvelope<unknown[]>>("/organizer/cohost-invitations"),
  reviewQueue: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<unknown[]>>("/events/review-queue", { query }),
  reopen: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/reopen`, { ly_do }),
  submitApproval: (id: number | string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/submit-approval`),
  cohostRespond: (id: number | string, payload: unknown) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/co-host-respond`, payload),
  withdraw: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/withdraw`, { ly_do }),
  review: (id: number | string, payload: unknown) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/review`, payload),
  changeRoom: (id: number | string, payload: unknown) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/change-room`, payload),
  emergencyCancel: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<unknown>>(`/events/${id}/emergency-cancel`, { ly_do }),
  share: (id: number | string) => api.get<string>(`/events/${id}/share`),
}
