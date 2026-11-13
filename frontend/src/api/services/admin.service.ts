import { api } from "../client"
import type { Organization, Topic, User } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export interface CreateInternalUserPayload {
  ho_ten: string
  email: string
  ten_dang_nhap?: string
  mat_khau?: string
  loai_tai_khoan: "SinhVien" | "ToChuc" | "Admin"
  mssv?: string
  ma_khoa?: number
  ma_don_vi_to_chuc?: number
  [key: string]: unknown
}

export const adminService = {
  organizations: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<Organization[]>>("/admin/organizations", { query }),
  createOrganization: (payload: Partial<Organization>) =>
    api.post<ApiEnvelope<Organization>>("/admin/organizations", payload),
  updateOrganization: (id: number, payload: Partial<Organization>) =>
    api.put<ApiEnvelope<Organization>>(`/admin/organizations/${id}`, payload),
  users: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<User[]>>("/admin/users", { query }),
  createInternalUser: (payload: CreateInternalUserPayload) =>
    api.post<ApiEnvelope<User>>("/admin/users", payload),
  assignOrganizer: (id: number, payload: { ma_don_vi_to_chuc: number }) =>
    api.put<ApiEnvelope<User>>(
      `/admin/users/${id}/assign-organizer`,
      payload,
    ),
  updateUserStatus: (id: number, payload: { hoat_dong: boolean; ly_do?: string }) =>
    api.put<ApiEnvelope<User>>(`/admin/users/${id}/status`, payload),
  topics: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<Topic[]>>("/topics", { query }),
  createTopic: (payload: { ten_chuyen_de: string; mo_ta?: string | null }) =>
    api.post<ApiEnvelope<Topic>>("/admin/topics", payload),
  updateTopic: (id: number, payload: { ten_chuyen_de?: string; mo_ta?: string | null }) =>
    api.put<ApiEnvelope<Topic>>(`/admin/topics/${id}`, payload),
  deleteTopic: (id: number) =>
    api.delete<ApiEnvelope<null>>(`/admin/topics/${id}`),
}
