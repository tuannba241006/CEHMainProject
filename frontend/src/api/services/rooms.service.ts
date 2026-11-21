import { api } from "../client"
import type { RoomPublic, RoomScheduleEntry, RoomAvailabilityCheck } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const roomsService = {
  list: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<RoomPublic[]>>("/rooms", { query }),
  create: (payload: Partial<RoomPublic>) =>
    api.post<ApiEnvelope<RoomPublic>>("/rooms", payload),
  detail: (id: number | string) =>
    api.get<ApiEnvelope<RoomPublic>>(`/rooms/${id}`),
  update: (id: number | string, payload: Partial<RoomPublic>) =>
    api.put<ApiEnvelope<RoomPublic>>(`/rooms/${id}`, payload),
  remove: (id: number | string) =>
    api.delete<ApiEnvelope<null>>(`/rooms/${id}`),
  schedule: (id: number | string, query?: Record<string, string | undefined>) =>
    api.get<ApiEnvelope<RoomScheduleEntry[]>>(`/rooms/${id}/schedule`, { query }),
  availability: (id: number | string, query: Record<string, string | number>) =>
    api.get<ApiEnvelope<RoomAvailabilityCheck>>(`/rooms/${id}/availability`, { query }),
}
