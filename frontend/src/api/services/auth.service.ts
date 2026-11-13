import { api, ensureCsrfToken } from "../client"
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

export interface RegisterPayload {
  ho_ten: string
  mssv: string
  email: string
  so_dien_thoai?: string
  lop_sinh_hoat: string
  ma_khoa: number
  mat_khau: string
  xac_nhan_mat_khau: string
  dong_y_nghi_dinh_13: boolean
}

export interface ChangePasswordPayload {
  mat_khau_hien_tai: string
  mat_khau_moi: string
  xac_nhan_mat_khau_moi: string
  // Compatibility aliases
  mat_khau_cu?: string
  xac_nhan_mat_khau?: string
}

export interface ResetPasswordPayload {
  email: string
  reset_token: string
  mat_khau_moi: string
  xac_nhan_mat_khau_moi: string
  // Compatibility aliases
  otp?: string
  mat_khau?: string
  xac_nhan_mat_khau?: string
}

export const authService = {
  csrfCookie: () => api.get<void>("/sanctum/csrf-cookie"),
  register: async (payload: RegisterPayload) => {
    await ensureCsrfToken(true)
    return api.post<ApiEnvelope<{ email: string }>>("/auth/register", payload)
  },
  resendRegistrationOtp: (email: string) =>
    api.post<ApiEnvelope<null>>("/auth/resend-registration-otp", { email }),
  verifyRegistrationOtp: (email: string, otp: string) =>
    api.post<ApiEnvelope<User>>("/auth/verify-registration-otp", {
      email,
      otp,
      ma_otp: otp,
    }),
  async login(ten_dang_nhap: string, mat_khau: string) {
    await ensureCsrfToken(true)
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
  changePassword: (payload: ChangePasswordPayload) => {
    const currentPass = payload.mat_khau_hien_tai ?? payload.mat_khau_cu ?? ""
    const confirmPass =
      payload.xac_nhan_mat_khau_moi ?? payload.xac_nhan_mat_khau ?? ""
    return api.post<ApiEnvelope<null>>("/auth/change-password", {
      mat_khau_hien_tai: currentPass,
      mat_khau_cu: currentPass,
      mat_khau_moi: payload.mat_khau_moi,
      xac_nhan_mat_khau_moi: confirmPass,
    })
  },
  forgotPassword: (email: string) =>
    api.post<ApiEnvelope<null>>("/auth/forgot-password", { email }),
  verifyForgotPasswordOtp: (email: string, otp: string) =>
    api.post<ApiEnvelope<{ reset_token: string }>>(
      "/auth/verify-forgot-password-otp",
      {
        email,
        ma_otp: otp,
        otp,
      },
    ),
  resetPassword: (payload: ResetPasswordPayload) => {
    const token = payload.reset_token || payload.otp || ""
    const newPass = payload.mat_khau_moi ?? payload.mat_khau ?? ""
    const confirmPass =
      payload.xac_nhan_mat_khau_moi ?? payload.xac_nhan_mat_khau ?? ""
    return api.post<ApiEnvelope<null>>("/auth/reset-password", {
      email: payload.email,
      reset_token: token,
      mat_khau_moi: newPass,
      xac_nhan_mat_khau_moi: confirmPass,
    })
  },
}
