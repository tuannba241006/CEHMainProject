import { api } from "../client"
import type { Certificate, CertificatePublic } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const certificatesService = {
  issue: (ticketId: number | string) =>
    api.post<ApiEnvelope<Certificate>>(`/tickets/${ticketId}/certificate`),
  mine: () =>
    api.get<ApiEnvelope<Certificate[]>>("/certificates/my-certificates"),
  download: (id: number | string) =>
    api.get<Blob>(`/certificates/${id}/download`),
  verify: (hash: string) =>
    api.get<ApiEnvelope<CertificatePublic>>(
      `/certificates/verify/${encodeURIComponent(hash)}`,
    ),
  adminList: (query?: Record<string, string | number>) =>
    api.get<ApiEnvelope<Certificate[]>>("/admin/certificates", { query }),
  revoke: (id: number, ly_do: string) =>
    api.post<ApiEnvelope<Certificate>>(`/admin/certificates/${id}/revoke`, {
      ly_do,
      ly_do_thu_hoi: ly_do,
    }),
}
