import { describe, it, expect, beforeEach, vi } from "vitest"
import { ticketsService } from "../api/services/tickets.service"
import { api } from "../api/client"

describe("TicketsService Unit Tests (frontend/src/api/services/tickets.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-TKT-01 (Student My Tickets Listing)
   * Course: Normal Flow
   * Expected: GET /tickets/my-tickets with query parameters
   */
  it("should fetch student tickets with status filter and pagination", async () => {
    const mockTickets = [
      {
        ma_dang_ky: 201,
        ma_su_kien: 101,
        trang_thai: "DaDangKy",
        ten_su_kien: "Hội thảo UIT AI",
        thoi_gian_bat_dau: "2026-11-20T08:00:00",
        ten_phong: "Hội trường A",
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockTickets,
      meta: { trang_hien_tai: 1, tong_so_trang: 1, tong_so_ban_ghi: 1 },
    })

    const result = await ticketsService.mine({ tab: "upcoming", page: 1 })

    expect(spy).toHaveBeenCalledWith("/tickets/my-tickets", {
      query: { tab: "upcoming", page: 1 },
    })
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].ma_dang_ky).toBe(201)
  })

  /**
   * @test
   * Target: UC-TKT-02 (Ticket Detail & Dynamic HMAC Verification)
   * Course: Normal Flow
   * Expected: GET /tickets/{id}, returns ticket detail including chu_ky_hmac
   */
  it("should fetch ticket detail by registration id", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: {
        ma_dang_ky: 201,
        ma_su_kien: 101,
        trang_thai: "DaDangKy",
        chu_ky_hmac: "abc123hmacsignature",
        qr_payload: "CEH1.TKT.201.abc123hmacsignature",
      },
    })

    const result = await ticketsService.detail(201)

    expect(spy).toHaveBeenCalledWith("/tickets/201")
    expect(result.success).toBe(true)
    expect(result.data.chu_ky_hmac).toBe("abc123hmacsignature")
  })

  /**
   * @test
   * Target: UC-TKT-03 (Ticket Cancellation with Idempotency Key)
   * Course: Normal Flow & Idempotency Key Header
   * Expected: POST /tickets/{id}/cancel with idempotencyKey option
   */
  it("should cancel ticket with cancellation reason and idempotency key", async () => {
    const idempotencyKey = "uuid-idempotency-12345"
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_dang_ky: 201, trang_thai: "DaHuy" },
      message: "Hủy vé tham gia thành công",
    })

    const result = await ticketsService.cancel(201, "Bận lịch thi đột xuất", idempotencyKey)

    expect(spy).toHaveBeenCalledWith(
      "/tickets/201/cancel",
      { ly_do_huy: "Bận lịch thi đột xuất" },
      { idempotencyKey },
    )
    expect(result.success).toBe(true)
  })
})

