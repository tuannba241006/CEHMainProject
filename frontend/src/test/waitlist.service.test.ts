import { describe, it, expect, beforeEach, vi } from "vitest"
import { waitlistService } from "../api/services/waitlist.service"
import { api } from "../api/client"

describe("WaitlistService Unit Tests (frontend/src/api/services/waitlist.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-WAIT-01 (Join Event Waitlist with Idempotency Key)
   * Course: Normal Flow
   * Expected: POST /events/{id}/waitlist
   */
  it("should join waitlist with idempotency key", async () => {
    const mockEntry = {
      id: 88,
      ma_su_kien: 101,
      so_thu_tu: 5,
      trang_thai: "WAITING" as const,
      thoi_gian_dang_ky: "2026-11-20T08:00:00Z",
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: mockEntry,
    })

    const uuid = "550e8400-e29b-41d4-a716-446655440001"
    const res = await waitlistService.join(101, uuid)

    expect(spy).toHaveBeenCalledWith("/events/101/waitlist", undefined, {
      idempotencyKey: uuid,
    })
    expect(res.success).toBe(true)
    expect(res.data.id).toBe(88)
    expect(res.data.so_thu_tu).toBe(5)
  })

  /**
   * @test
   * Target: UC-WAIT-02 (Claim Waitlist Offer with 45m Expiry)
   * Course: Normal Flow
   * Expected: POST /waitlist/{id}/claim
   */
  it("should claim offered waitlist slot", async () => {
    const mockTicket = {
      ma_dang_ky: 502,
      ma_su_kien: 101,
      ma_ve_uuid: "550e8400-e29b-41d4-a716-446655440002",
      ten_su_kien: "Hội thảo UIT AI",
      thoi_gian_bat_dau: "2026-11-20T08:00:00Z",
      thoi_gian_ket_thuc: "2026-11-20T11:00:00Z",
      ten_phong: "Hội trường A",
      co_so: "CoSo1" as const,
      trang_thai: "HOP_LE" as const,
      thoi_gian_dang_ky: "2026-11-20T08:15:00Z",
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

    const uuid = "550e8400-e29b-41d4-a716-446655440002"
    const res = await waitlistService.claim(88, uuid)

    expect(spy).toHaveBeenCalledWith("/waitlist/88/claim", undefined, {
      idempotencyKey: uuid,
    })
    expect(res.success).toBe(true)
    expect(res.data.ma_dang_ky).toBe(502)
  })

  /**
   * @test
   * Target: UC-WAIT-03 (Decline Waitlist Offer)
   * Course: Normal Flow
   * Expected: POST /waitlist/{id}/decline
   */
  it("should decline offered waitlist slot", async () => {
    const mockEntry = {
      id: 88,
      ma_su_kien: 101,
      so_thu_tu: 5,
      trang_thai: "DECLINED" as const,
      thoi_gian_dang_ky: "2026-11-20T08:00:00Z",
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: mockEntry,
    })

    const uuid = "550e8400-e29b-41d4-a716-446655440003"
    const res = await waitlistService.decline(88, uuid)

    expect(spy).toHaveBeenCalledWith("/waitlist/88/decline", undefined, {
      idempotencyKey: uuid,
    })
    expect(res.success).toBe(true)
    expect(res.data.trang_thai).toBe("DECLINED")
  })
})
