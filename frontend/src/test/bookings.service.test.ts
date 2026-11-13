import { describe, it, expect, beforeEach, vi } from "vitest"
import { bookingsService } from "../api/services/bookings.service"
import { api } from "../api/client"

describe("BookingsService Unit Tests (frontend/src/api/services/bookings.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-BOOK-01 (Precheck Booking Eligibility)
   * Course: Normal Flow
   * Expected: GET /events/{id}/booking-check, returns eligibility check
   */
  it("should perform precheck booking eligibility", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: { du_dieu_kien: true },
    })

    const res = await bookingsService.precheck(101)

    expect(spy).toHaveBeenCalledWith("/events/101/booking-check")
    expect(res.success).toBe(true)
    expect(res.data.du_dieu_kien).toBe(true)
  })

  /**
   * @test
   * Target: UC-BOOK-02 (Book Event Ticket with Idempotency Key)
   * Course: Normal Flow
   * Expected: POST /events/{id}/book with Idempotency-Key header, returns ticket detail
   */
  it("should book ticket with idempotency key", async () => {
    const mockTicket = {
      ma_dang_ky: 501,
      ma_su_kien: 101,
      ma_ve_uuid: "550e8400-e29b-41d4-a716-446655440000",
      ten_su_kien: "Hội thảo UIT AI",
      thoi_gian_bat_dau: "2026-11-20T08:00:00Z",
      thoi_gian_ket_thuc: "2026-11-20T11:00:00Z",
      ten_phong: "Hội trường A",
      co_so: "CoSo1" as const,
      trang_thai: "HOP_LE" as const,
      thoi_gian_dang_ky: "2026-11-20T08:00:00Z",
      han_chot_huy: "2026-11-20T04:00:00Z",
      cho_phep_huy: true,
      ti_le_drl: 1.0,
      diem_drl_du_kien: 5,
      da_feedback: false,
      co_the_feedback: false,
      du_dieu_kien_drl: true,
      co_the_nhan_chung_nhan: true,
      vi_pham_no_show: false,
      nghi_van_gian_lan: false,
      chu_ky_hmac: "abc",
      payload_qr: "qr",
      yeu_cau_wake_lock: true,
      trang_thai_su_kien: "PUBLISHED" as const,
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: mockTicket,
    })

    const uuid = "550e8400-e29b-41d4-a716-446655440000"
    const res = await bookingsService.book(101, uuid)

    expect(spy).toHaveBeenCalledWith("/events/101/book", undefined, {
      idempotencyKey: uuid,
    })
    expect(res.success).toBe(true)
    expect(res.data.ma_dang_ky).toBe(501)
  })
})
