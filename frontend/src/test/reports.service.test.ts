import { describe, it, expect, beforeEach, vi } from "vitest"
import { reportsService } from "../api/services/reports.service"
import { api } from "../api/client"

describe("ReportsService Unit Tests (frontend/src/api/services/reports.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-REP-01 (Organizer Event Analytics - OpenAPI v3.2.3 getOrganizerEventAnalytics)
   * Course: Normal Flow
   * Expected: GET /organizer/events/{id}/analytics, returns OrganizerDashboard DTO with charts
   */
  it("should fetch organizer event analytics with full schema (OpenAPI v3.2.3)", async () => {
    const mockDashboard = {
      ma_su_kien: 101,
      khong_gioi_han_slot: false,
      so_luong_toi_da: 150,
      tong_ve_dang_ky: 150,
      so_luong_check_in: 140,
      so_luong_check_out: 135,
      ty_le_lap_day_pct: 100.0,
      ty_le_show_up_pct: 93.3,
      so_luong_no_show: 10,
      ty_le_no_show_pct: 6.7,
      diem_noi_dung_tb: 4.8,
      diem_dien_gia_tb: 4.7,
      diem_to_chuc_tb: 4.6,
      phan_bo_theo_khoa: [
        {
          ma_khoa: 1,
          ten_khoa: "Khoa Hệ thống Thông tin",
          so_luong_dang_ky: 80,
          so_luong_tham_du: 75,
        },
        {
          ma_khoa: 2,
          ten_khoa: "Khoa Khoa học Máy tính",
          so_luong_dang_ky: 70,
          so_luong_tham_du: 65,
        },
      ],
      luu_luong_theo_khung_gio: [
        {
          khung_gio: "07:30 - 07:45",
          so_luot_check_in: 45,
          so_luot_check_out: 0,
        },
        {
          khung_gio: "11:15 - 11:30",
          so_luot_check_in: 0,
          so_luot_check_out: 135,
        },
      ],
    }

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockDashboard,
    })

    // 1. Kiểm tra method chuẩn hóa: organizerAnalytics
    const res = await reportsService.organizerAnalytics(101)

    expect(spy).toHaveBeenCalledWith("/organizer/events/101/analytics")
    expect(res.success).toBe(true)
    expect(res.data.tong_ve_dang_ky).toBe(150)
    expect(res.data.phan_bo_theo_khoa).toHaveLength(2)
    expect(res.data.luu_luong_theo_khung_gio).toHaveLength(2)

    // 2. Kiểm tra tính tương thích ngược của alias: organizer
    const resLegacy = await reportsService.organizer(101)
    expect(resLegacy.data.ma_su_kien).toBe(101)
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
