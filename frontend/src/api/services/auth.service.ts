import { api } from "../client"
import { tokenStore } from "../config"
import type { User } from "../../data/contract"

export interface PaginationMeta {
  trang_hien_tai?: number
  tong_so_trang?: number
  tong_so_ban_ghi?: number
  kich_thuoc_trang?: number
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  from?: number | null
  to?: number | null
  so_luong_chua_doc?: number
  [key: string]: unknown
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
  server_time?: string
  meta?: PaginationMeta
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export const authService = {
  register: (payload: unknown) =>
    api.post<ApiEnvelope<{ email: string }>>("/auth/register", payload),
  resendRegistrationOtp: (email: string) =>
    api.post<ApiEnvelope<null>>("/auth/resend-registration-otp", { email }),
  verifyRegistrationOtp: (email: string, otp: string) =>
    api.post<ApiEnvelope<User>>("/auth/verify-registration-otp", {
      email,
      otp,
    }),
  async login(ten_dang_nhap: string, mat_khau: string) {
    const res = await api.post<ApiEnvelope<User> & { token?: string }>(
      "/auth/login",
      { ten_dang_nhap, mat_khau },
    )
    const token = res.token ?? (res.data as { token?: string } | undefined)?.token
    if (token) tokenStore.set(token)
    return res
  },
  async logout() {
    try {
      return await api.post<ApiEnvelope<null>>("/auth/logout")
    } catch {
      // Even if server session was already invalidated or returns 401, treat as success on client
      return { success: true, data: null, message: "Đăng xuất thành công." }
    } finally {
      tokenStore.clear()
    }
  },
  me: () => api.get<ApiEnvelope<User>>("/auth/me"),
  updateProfile: (payload: Pick<User, "so_dien_thoai" | "avatar_url">) =>
    api.put<ApiEnvelope<User>>("/auth/profile", payload),
  changePassword: (payload: unknown) =>
    api.post<ApiEnvelope<null>>("/auth/change-password", payload),
  forgotPassword: (email: string) =>
    api.post<ApiEnvelope<null>>("/auth/forgot-password", { email }),
  resetPassword: (payload: unknown) =>
    api.post<ApiEnvelope<null>>("/auth/reset-password", payload),
}
