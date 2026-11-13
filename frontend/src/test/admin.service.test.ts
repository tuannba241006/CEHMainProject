import { describe, it, expect, beforeEach, vi } from "vitest"
import { adminService, type CreateInternalUserPayload } from "../api/services/admin.service"
import { api } from "../api/client"

describe("AdminService Unit Tests (frontend/src/api/services/admin.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-ADM-01 (Admin Internal User Management)
   * Course: Create Internal Account
   * Expected: POST /admin/users with payload
   */
  it("should post create internal user with organization assignment", async () => {
    const payload: CreateInternalUserPayload = {
      ho_ten: "Ban Quản lý Khoa HTTT",
      email: "bql.is@uit.edu.vn",
      loai_tai_khoan: "ToChuc",
      ma_don_vi_to_chuc: 3,
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: {
        ma_tai_khoan: 105,
        ho_ten: payload.ho_ten,
        email: payload.email,
        loai_tai_khoan: payload.loai_tai_khoan,
      },
    })

    const result = await adminService.createInternalUser(payload)

    expect(spy).toHaveBeenCalledWith("/admin/users", payload)
    expect(result.success).toBe(true)
    expect(result.data.ma_tai_khoan).toBe(105)
  })

  /**
   * @test
   * Target: UC-ADM-02 (Topic / Category Management)
   * Course: Create and Delete Topics
   * Expected: POST /admin/topics and DELETE /admin/topics/{id}
   */
  it("should create topic and delete topic", async () => {
    const createSpy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_chuyen_de: 10, ten_chuyen_de: "Khởi nghiệp sáng tạo" },
    })

    const createResult = await adminService.createTopic({
      ten_chuyen_de: "Khởi nghiệp sáng tạo",
      mo_ta: "Chuyên đề khởi nghiệp",
    })

    expect(createSpy).toHaveBeenCalledWith("/admin/topics", {
      ten_chuyen_de: "Khởi nghiệp sáng tạo",
      mo_ta: "Chuyên đề khởi nghiệp",
    })
    expect(createResult.success).toBe(true)

    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValue({
      success: true,
      data: null,
      message: "Xóa chuyên đề thành công",
    })

    const deleteResult = await adminService.deleteTopic(10)

    expect(deleteSpy).toHaveBeenCalledWith("/admin/topics/10")
    expect(deleteResult.success).toBe(true)
  })
})

