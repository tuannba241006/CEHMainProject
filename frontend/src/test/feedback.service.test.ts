import { describe, it, expect, beforeEach, vi } from "vitest"
import { feedbackService } from "../api/services/feedback.service"
import { api } from "../api/client"
import type { FeedbackPayload } from "../data/contract"

describe("FeedbackService Unit Tests (frontend/src/api/services/feedback.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-FDB-01 (Submit Event Feedback Survey)
   * Course: Normal Flow
   * Expected: POST /events/{id}/feedback with evaluation metrics
   */
  it("should submit survey feedback payload", async () => {
    const payload: FeedbackPayload = {
      diem_noi_dung: 5,
      diem_to_chuc: 4,
      gop_y: "Hội thảo rất bổ ích và chuẩn bị chu đáo.",
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { thanh_cong: true },
    })

    const res = await feedbackService.submit(101, payload)

    expect(spy).toHaveBeenCalledWith("/events/101/feedback", payload)
    expect(res.success).toBe(true)
    expect(res.data.thanh_cong).toBe(true)
  })

  /**
   * @test
   * Target: UC-FDB-02 (Grant 24h Survey Grace Period)
   * Course: Normal Flow
   * Expected: POST /admin/tickets/{id}/feedback-grace with reason
   */
  it("should grant feedback survey grace period with reason", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { han_chot_khao_sat_moi: "2026-11-22T23:59:59Z" },
    })

    const res = await feedbackService.grantGrace(501, "Sinh viên bị sự cố mạng trong 48h đầu")

    expect(spy).toHaveBeenCalledWith("/admin/tickets/501/feedback-grace", {
      ly_do: "Sinh viên bị sự cố mạng trong 48h đầu",
    })
    expect(res.success).toBe(true)
    expect(res.data.han_chot_khao_sat_moi).toBeDefined()
  })
})
