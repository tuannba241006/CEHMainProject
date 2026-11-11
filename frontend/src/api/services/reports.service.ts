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
}
