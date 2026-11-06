import { describe, it, expect, beforeEach, vi } from "vitest"
import { authService } from "../api/services/auth.service"
import { api } from "../api/client"
import { tokenStore } from "../api/config"

describe("AuthService Unit Tests (frontend/src/api/services/auth.service.ts)", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-AUTH-01 (Student / Staff Login & Token Storage)
   * Course: Normal Flow
   * Expected: POST /auth/login, sets token into tokenStore on success
   */
  it("should authenticate and store JWT bearer token on login", async () => {
    const mockUser = {
      ma_tai_khoan: 1001,
      ho_ten: "Nguyễn Văn An",
      email: "22520001@gm.uit.edu.vn",
      mssv: "22520001",
      loai_tai_khoan: "SinhVien" as const,
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: mockUser,
      token: "jwt-token-campus-event-hub-2026",
    })

    const result = await authService.login("22520001@gm.uit.edu.vn", "Secret@123")

    expect(spy).toHaveBeenCalledWith("/auth/login", {
      ten_dang_nhap: "22520001@gm.uit.edu.vn",
      mat_khau: "Secret@123",
    })
    expect(result.success).toBe(true)
    expect(tokenStore.get()).toBe("jwt-token-campus-event-hub-2026")
  })

  /**
   * @test
   * Target: UC-AUTH-02 (User Logout & Token Invalidation)
   * Course: Normal Flow
   * Expected: POST /auth/logout, clears tokenStore
   */
  it("should clear tokenStore upon logout", async () => {
    tokenStore.set("existing-token-abc")
    expect(tokenStore.get()).toBe("existing-token-abc")

    vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: null,
      message: "Đăng xuất thành công",
    })

    const result = await authService.logout()

    expect(result.success).toBe(true)
    expect(tokenStore.get()).toBeNull()
  })

  /**
   * @test
   * Target: UC-AUTH-03 (Fetch Current User Profile - Auth Me)
   * Course: Normal Flow
   * Expected: GET /auth/me returns authenticated user details
   */
  it("should fetch current user profile via auth me", async () => {
    const mockUser = {
      ma_tai_khoan: 1001,
      ho_ten: "Nguyễn Văn An",
      email: "22520001@gm.uit.edu.vn",
      mssv: "22520001",
      loai_tai_khoan: "SinhVien" as const,
    }

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockUser,
    })

    const result = await authService.me()

    expect(spy).toHaveBeenCalledWith("/auth/me")
    expect(result.success).toBe(true)
    expect(result.data.ho_ten).toBe("Nguyễn Văn An")
  })
})

