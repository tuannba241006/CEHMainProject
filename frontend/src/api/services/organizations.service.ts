import { api } from "../client"
import type { OrganizationSummary, Topic } from "../../data/contract"
import type { ApiEnvelope } from "./auth.service"

export const organizationsService = {
  publicList: () =>
    api.get<ApiEnvelope<OrganizationSummary[]>>("/organizations"),
  topics: () => api.get<ApiEnvelope<Topic[]>>("/topics"),
  uploadImage: (file: File, loai: "poster" | "logo" | "avatar" = "poster") => {
    const body = new FormData()
    body.append("file", file)
    body.append("loai", loai)
    return api.post<ApiEnvelope<{ url: string }>>("/uploads/images", body)
  },
}
