import { api } from "../client"
import type { ApiEnvelope } from "./auth.service"

export const adminService = {
  organizations: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<unknown[]>>("/admin/organizations", { query }),
  createOrganization: (payload: unknown) =>
    api.post<ApiEnvelope<unknown>>("/admin/organizations", payload),
  updateOrganization: (id: number, payload: unknown) =>
    api.put<ApiEnvelope<unknown>>(`/admin/organizations/${id}`, payload),
  users: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<unknown[]>>("/admin/users", { query }),
  createInternalUser: (payload: unknown) =>
    api.post<ApiEnvelope<unknown>>("/admin/users", payload),
  assignOrganizer: (id: number, payload: unknown) =>
    api.put<ApiEnvelope<unknown>>(
      `/admin/users/${id}/assign-organizer`,
      payload,
    ),
  updateUserStatus: (id: number, payload: unknown) =>
    api.put<ApiEnvelope<unknown>>(`/admin/users/${id}/status`, payload),
  topics: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<unknown[]>>("/admin/topics", { query }),
  createTopic: (payload: unknown) =>
    api.post<ApiEnvelope<unknown>>("/admin/topics", payload),
  updateTopic: (id: number, payload: unknown) =>
    api.put<ApiEnvelope<unknown>>(`/admin/topics/${id}`, payload),
  deleteTopic: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/admin/topics/${id}`),
}
