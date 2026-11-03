import { api } from "../client"
import type { RoomPublic } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const roomsService = {
  list: (query?: Record<string, string | number | undefined>) =>
    api.get<ApiEnvelope<RoomPublic[]>>("/rooms", { query }),
  create: (payload: unknown) =>
    api.post<ApiEnvelope<RoomPublic>>("/rooms", payload),
  detail: (id: number | string) =>
    api.get<ApiEnvelope<RoomPublic>>(`/rooms/${id}`),
  update: (id: number | string, payload: unknown) =>
    api.put<ApiEnvelope<RoomPublic>>(`/rooms/${id}`, payload),
  remove: (id: number | string) =>
    api.delete<ApiEnvelope<null>>(`/rooms/${id}`),
  schedule: (id: number | string, query?: Record<string, string | undefined>) =>
    api.get<ApiEnvelope<unknown[]>>(`/rooms/${id}/schedule`, { query }),
  availability: (id: number | string, query: Record<string, string | number>) =>
    api.get<ApiEnvelope<unknown>>(`/rooms/${id}/availability`, { query }),
}
