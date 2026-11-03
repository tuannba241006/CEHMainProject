import { api } from "../client"
import type { Notification } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const notificationsService = {
  list: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<Notification[]>>("/notifications", { query }),
  read: (id: number) =>
    api.put<ApiEnvelope<Notification>>(`/notifications/${id}/read`),
  readAll: () => api.put<ApiEnvelope<null>>("/notifications/read-all"),
}
