import { describe, it, expect, beforeEach, vi } from "vitest"
import { reportsService } from "../api/services/reports.service"
import { api } from "../api/client"

describe("ReportsService Unit Tests (frontend/src/api/services/reports.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-RPT-01 (Organizer Event Analytics)
   * Course: Normal Flow
   * Expected: GET /organizer/events/{id}/analytics, returns dashboard analytics
   */
  it("should fetch organizer event analytics", async () => {
    const mockDashboard = {
      ma_su_kien: 101,
      khong_gioi_han_slot: false,
      tong_ve_dang_ky: 150,
      so_luong_check_in: 140,
      so_luong_check_out: 135,
      ty_le_show_up_pct: 93.3,
    }

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockDashboard,
    })

    const res = await reportsService.organizer(101)

    expect(spy).toHaveBeenCalledWith("/organizer/events/101/analytics")
    expect(res.success).toBe(true)
    expect(res.data.tong_ve_dang_ky).toBe(150)
  })

  /**
   * @test
   * Target: UC-RPT-02 (Admin Macro Analytics)
   * Course: Normal Flow
   * Expected: GET /admin/analytics/macro with query
   */
  it("should fetch admin macro analytics with filters", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: {
        tong_so_su_kien: 25,
        tong_luot_dang_ky: 3200,
      },
    })

    const res = await reportsService.adminMacro({ hoc_ky: "HK1" })

    expect(spy).toHaveBeenCalledWith("/admin/analytics/macro", { query: { hoc_ky: "HK1" } })
    expect(res.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-RPT-03 (No-show Violations List)
   * Course: Normal Flow
   * Expected: GET /admin/analytics/no-show-violations
   */
  it("should fetch no-show violations list", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: [
        {
          ma_tai_khoan: 10,
          mssv: "22520001",
          ho_ten: "Trần B",
          so_lan_vi_pham: 3,
        },
      ],
    })

    const res = await reportsService.noShow()

    expect(spy).toHaveBeenCalledWith("/admin/analytics/no-show-violations", { query: undefined })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
  })
})
