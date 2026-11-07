import { api } from "../client"
import type { OrganizerDashboard, MacroAnalytics, NoShowViolationItem } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const reportsService = {
  organizer: (eventId: number | string) =>
    api.get<ApiEnvelope<OrganizerDashboard>>(
      `/organizer/events/${eventId}/analytics`,
    ),
  adminMacro: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<MacroAnalytics>>("/admin/analytics/macro", { query }),
  noShow: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<NoShowViolationItem[]>>("/admin/analytics/no-show-violations", {
      query,
    }),
  exportMacro: (query?: Record<string, string | number>) =>
    api.get<Blob>("/admin/analytics/macro/export", { query }),
}
