import { describe, it, expect, beforeEach, vi } from "vitest"
import { organizationsService } from "../api/services/organizations.service"
import { api } from "../api/client"

describe("OrganizationsService Unit Tests (frontend/src/api/services/organizations.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-ORG-01 (List Organizations)
   * Course: Normal Flow
   * Expected: GET /organizations, returns organization list
   */
  it("should fetch public organizations list", async () => {
    const mockOrgs = [
      {
        ma_don_vi: 1,
        ten_don_vi: "CLB WebDev UIT",
        loai_don_vi: "CLB",
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockOrgs,
    })

    const res = await organizationsService.publicList()

    expect(spy).toHaveBeenCalledWith("/organizations")
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].ten_don_vi).toBe("CLB WebDev UIT")
  })

  /**
   * @test
   * Target: UC-ORG-02 (List Topics)
   * Course: Normal Flow
   * Expected: GET /topics, returns list of topics
   */
  it("should fetch topics list", async () => {
    const mockTopics = [
      {
        ma_chuyen_de: 1,
        ten_chuyen_de: "Học thuật & Trí tuệ Nhân tạo",
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockTopics,
    })

    const res = await organizationsService.topics()

    expect(spy).toHaveBeenCalledWith("/topics")
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
  })

  /**
   * @test
   * Target: UC-ORG-03 (Upload Banner / Image)
   * Course: Normal Flow
   * Expected: POST /uploads/images with FormData, returns url
   */
  it("should upload image using FormData", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { url: "https://ceh.uit.edu.vn/uploads/banner.jpg" },
    })

    const file = new File(["dummy content"], "banner.jpg", { type: "image/jpeg" })
    const res = await organizationsService.uploadImage(file)

    expect(spy).toHaveBeenCalled()
    expect(res.success).toBe(true)
    expect(res.data.url).toContain("banner.jpg")
  })
})
