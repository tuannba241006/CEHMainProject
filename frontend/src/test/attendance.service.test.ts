import { describe, it, expect, beforeEach, vi } from "vitest"
import { attendanceService } from "../api/services/attendance.service"
import { api } from "../api/client"

describe("AttendanceService Unit Tests (frontend/src/api/services/attendance.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-ATD-01 (Kiosk Dynamic TOTP Stream)
   * Course: Normal Flow
   * Expected: GET /kiosk/totp-stream with kioskToken option
   */
  it("should stream dynamic TOTP code for active kiosk session", async () => {
    const mockTotp = {
      ma_su_kien: 101,
      ten_su_kien: "Hội thảo UIT AI",
      che_do_hien_tai: "CHECK_IN" as const,
      cong_check_in_mo: true,
      cong_check_out_mo: false,
      totp_code: "123456",
      qr_payload: "CEH1.KIOSK.101.123456",
      chu_ky_giay: 30,
      het_han_luc: "2026-11-20T09:00:30Z",
      expires_in_seconds: 30,
    }

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockTotp,
    })

    const result = await attendanceService.totpStream("token-kiosk-xyz")

    expect(spy).toHaveBeenCalledWith("/kiosk/totp-stream", { kioskToken: "token-kiosk-xyz" })
    expect(result.success).toBe(true)
    expect(result.data.totp_code).toBe("123456")
  })

  /**
   * @test
   * Target: UC-ATD-02 (Staff Assisted QR Scan)
   * Course: Normal Flow
   * Expected: POST /attendance/staff-scan with event id, mode, and qr string
   */
  it("should post staff scan payload and receive participant details", async () => {
    const payload = {
      ma_su_kien: 101,
      che_do_quet: "CHECK_IN" as const,
      chuoi_qr_ve: "CEH1.TKT.101.hmac",
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: {
        ma_dang_ky: 301,
        sinh_vien: {
          ho_ten: "Trần Minh Quân",
          mssv: "22521199",
          khoa: "Khoa Mạng máy tính",
          lop_sinh_hoat: "MMT2022",
        },
        canh_bao_doi_soat_the_sv: false,
        trang_thai_ve: "DaCheckIn",
        thoi_gian_quet: "2026-11-20T08:30:00Z",
        thoi_luong_tham_du_phut: null,
        ti_le_drl: null,
      },
    })

    const result = await attendanceService.staffScan(payload)

    expect(spy).toHaveBeenCalledWith("/attendance/staff-scan", payload)
    expect(result.success).toBe(true)
    expect(result.data.sinh_vien.mssv).toBe("22521199")
  })

  /**
   * @test
   * Target: UC-ATD-03 (Student Self-Checkin with Device ID Binding)
   * Course: Normal Flow & Header X-Device-Id
   * Expected: POST /attendance/self-check-in with X-Device-Id header
   */
  it("should send device ID in headers during self-checkin", async () => {
    const payload = { ma_su_kien: 101, dynamic_totp_code: "123456" }
    const deviceId = "device-uuid-987654"

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { status: "checked_in" },
    })

    const result = await attendanceService.selfCheckin(payload, deviceId)

    expect(spy).toHaveBeenCalledWith("/attendance/self-check-in", payload, {
      headers: { "X-Device-Id": deviceId },
    })
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-ATD-04 (Assigned Staff Events for Scanner)
   * Course: Normal Flow
   * Expected: GET /staff/my-events
   */
  it("should fetch staff assigned events", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: [{ ma_su_kien: 101, ten_su_kien: "Hội thảo UIT AI" }],
    })

    const result = await attendanceService.myStaffEvents()

    expect(spy).toHaveBeenCalledWith("/staff/my-events")
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
  })
})
