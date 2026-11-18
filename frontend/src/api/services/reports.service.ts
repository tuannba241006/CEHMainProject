import { api } from "../client"
import type {
  OrganizerDashboard,
  MacroAnalytics,
  NoShowViolationItem,
  AdminMacroDashboard,
} from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const reportsService = {
  organizer: (eventId: number | string) =>
    api.get<ApiEnvelope<OrganizerDashboard>>(
      `/organizer/events/${eventId}/analytics`,
    ),
  adminMacro: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<AdminMacroDashboard>>("/admin/analytics/macro", { query }),
  noShow: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<NoShowViolationItem[]>>("/admin/analytics/no-show-violations", {
      query,
    }),
  exportMacro: (query?: Record<string, string | number>) =>
    api.get<Blob>("/admin/analytics/macro/export", { query }),
  textToInsight: (cauHoi: string) =>
    api.post<
      ApiEnvelope<{
        cau_tra_loi_tom_tat: string
        nhan_dinh_chien_luoc: string[]
        bang_du_lieu?: Array<Record<string, unknown>>
        bieu_do_goi_y?: "BarChart" | "LineChart" | "PieChart" | "Table"
      }>
    >("/ai/admin/text-to-insight", { cau_hoi_tu_nhien: cauHoi, prompt: cauHoi }),
  generateEventContent: (payload: {
    chu_de: string
    doi_tuong_muc_tieu?: string
    thoi_luong_phut?: number
    muc_tieu?: string
    phong_cach?: "HaoHuc" | "ChuyenNghiep" | "GanGui"
  }) =>
    api.post<
      ApiEnvelope<{
        tieu_de_goi_y: string[]
        mo_ta_de_xuat: string
        lo_trinh_de_xuat: Array<{
          thoi_gian_bat_dau: string
          thoi_gian_ket_thuc: string
          tieu_de: string
          dien_gia?: string | null
          mo_ta?: string | null
        }>
        bai_viet_truyen_thong: string
      }>
    >("/ai/organizer/generate-content", payload),
}
