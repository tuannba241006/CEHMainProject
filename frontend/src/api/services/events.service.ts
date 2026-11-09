import { api } from "../client"
import type {
  EventCard,
  EventPublicDetail,
  CohostInvitationStatus,
  EventCreateDraftPayload,
  EventUpdateDraftPayload,
  EventReviewPayload,
  EventChangeRoomPayload,
} from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const eventsService = {
  listPublic: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/events", { query }),
  getEvents: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/events", { query }),
  publicDetail: (id: number | string) =>
    api.get<ApiEnvelope<EventPublicDetail>>(`/events/${id}`),
  organizerList: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/organizer/events", { query }),
  getOrganizerEvents: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/organizer/events", { query }),
  organizerDetail: (id: number | string) =>
    api.get<ApiEnvelope<EventPublicDetail>>(`/organizer/events/${id}`),
  createDraft: (payload: EventCreateDraftPayload) =>
    api.post<ApiEnvelope<EventPublicDetail>>("/events", payload),
  updateDraft: (id: number | string, payload: EventUpdateDraftPayload) =>
    api.put<ApiEnvelope<EventPublicDetail>>(`/events/${id}`, payload),
  cohostInvitations: () =>
    api.get<ApiEnvelope<CohostInvitationStatus[]>>("/organizer/cohost-invitations"),
  getCohostInvitations: () =>
    api.get<ApiEnvelope<CohostInvitationStatus[]>>("/organizer/cohost-invitations"),
  reviewQueue: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<EventCard[]>>("/events/review-queue", { query }),
  reopen: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/reopen`, { ly_do }),
  submitApproval: (id: number | string) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/submit-approval`),
  cohostRespond: (
    id: number | string,
    payload: {
      dong_y?: boolean
      trang_thai_xac_nhan?: "DONG_Y" | "TU_CHOI" | string
      ghi_chu_tu_choi?: string
      ly_do_tu_choi?: string
      [key: string]: unknown
    },
  ) =>
    api.post<ApiEnvelope<CohostInvitationStatus>>(
      `/events/${id}/co-host-respond`,
      payload,
    ),
  withdraw: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/withdraw`, { ly_do }),
  review: (id: number | string, payload: EventReviewPayload) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/review`, payload),
  changeRoom: (id: number | string, payload: EventChangeRoomPayload) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/change-room`, payload),
  emergencyCancel: (id: number | string, ly_do: string) =>
    api.post<ApiEnvelope<EventCard>>(`/events/${id}/emergency-cancel`, { ly_do }),
  share: (id: number | string) => api.get<string>(`/events/${id}/share`),
}
