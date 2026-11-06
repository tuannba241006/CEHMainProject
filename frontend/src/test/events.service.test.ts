import { describe, it, expect, beforeEach, vi } from "vitest"
import { eventsService } from "../api/services/events.service"
import { api } from "../api/client"
import type { EventCreateDraftPayload, EventReviewPayload } from "../data/contract"

describe("EventsService Unit Tests (frontend/src/api/services/events.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-EVT-01 (Public Events Listing & Discovery)
   * Course: Normal Flow
   * Expected: GET /events with query parameters, returns ApiEnvelope<EventCard[]>
   */
  it("should fetch public events list with pagination query", async () => {
    const mockEvents = [
      {
        ma_su_kien: 101,
        ten_su_kien: "Hội thảo UIT AI",
        thoi_gian_bat_dau: "2026-11-20T08:00:00",
        thoi_gian_ket_thuc: "2026-11-20T11:00:00",
        dia_diem: "Hội trường A",
        trang_thai: "MO_DANG_KY",
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockEvents,
      meta: { trang_hien_tai: 1, tong_so_trang: 1, tong_so_ban_ghi: 1 },
    })

    const result = await eventsService.listPublic({ page: 1, limit: 10 })

    expect(spy).toHaveBeenCalledWith("/events", { query: { page: 1, limit: 10 } })
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].ten_su_kien).toBe("Hội thảo UIT AI")
  })

  /**
   * @test
   * Target: UC-EVT-02 (Public Event Detail)
   * Course: Normal Flow
   * Expected: GET /events/{id}, returns event detail
   */
  it("should fetch event detail by id", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: {
        ma_su_kien: 101,
        ten_su_kien: "Hội thảo UIT AI",
        mo_ta: "Nội dung chi tiết",
        trang_thai: "MO_DANG_KY",
      },
    })

    const result = await eventsService.publicDetail(101)

    expect(spy).toHaveBeenCalledWith("/events/101")
    expect(result.success).toBe(true)
    expect(result.data.ma_su_kien).toBe(101)
  })

  /**
   * @test
   * Target: UC-EVT-03 (Create Draft Event Proposal)
   * Course: Normal Flow
   * Expected: POST /events with draft payload, returns created event envelope
   */
  it("should post create draft proposal with correct payload", async () => {
    const payload: EventCreateDraftPayload = {
      ten_su_kien: "Ngày hội Tân sinh viên 2026",
      mo_ta: "Chương trình chào đón tân sinh viên khóa 2026",
      ma_chuyen_de: 1,
      ma_phong: 2,
      ngay_cong_bo: "2026-11-10",
      thoi_gian_bat_dau: "2026-11-20T08:00:00",
      thoi_gian_ket_thuc: "2026-11-20T11:30:00",
      khong_gioi_han_slot: false,
      so_luong_toi_da: 200,
      dieu_khoan_drl: "QUY_TAC_1",
      diem_drl_du_kien: 5,
      gio_tinh_nguyen: 0,
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ...payload, ma_su_kien: 999, trang_thai: "NHAP" },
    })

    const result = await eventsService.createDraft(payload)

    expect(spy).toHaveBeenCalledWith("/events", payload)
    expect(result.success).toBe(true)
    expect(result.data.ma_su_kien).toBe(999)
  })

  /**
   * @test
   * Target: UC-EVT-04 (Submit Proposal for Multi-Level Review)
   * Course: Normal Flow
   * Expected: POST /events/{id}/submit-approval
   */
  it("should submit event proposal for review", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_su_kien: 101, trang_thai: "CHO_DUYET" },
    })

    const result = await eventsService.submitApproval(101)

    expect(spy).toHaveBeenCalledWith("/events/101/submit-approval")
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-EVT-05 (Reopen / Withdraw Event Proposal)
   * Course: Reopen Flow
   * Expected: POST /events/{id}/reopen with reason
   */
  it("should reopen an event with reason", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_su_kien: 101, trang_thai: "NHAP" },
    })

    const result = await eventsService.reopen(101, "Cập nhật lại thời lượng chương trình")

    expect(spy).toHaveBeenCalledWith("/events/101/reopen", {
      ly_do: "Cập nhật lại thời lượng chương trình",
    })
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-EVT-06 (Multi-Level Approval / Rejection by Faculty / Admin)
   * Course: Review Decision
   * Expected: POST /events/{id}/review with review payload
   */
  it("should review event proposal with approve/reject decision", async () => {
    const payload: EventReviewPayload = {
      hanh_dong: "PHE_DUYET",
      ghi_chu: "Đã rà soát đủ điều kiện",
      cap_duyet: "KHOA",
    }

    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_su_kien: 101, trang_thai: "CHO_CTSV_DUYET" },
    })

    const result = await eventsService.review(101, payload)

    expect(spy).toHaveBeenCalledWith("/events/101/review", payload)
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-ROOM-01 (Emergency Change Room)
   * Course: Change Room Assignment
   * Expected: POST /events/{id}/change-room with new room id and reason
   */
  it("should post room change with reason", async () => {
    const payload = { ma_phong_moi: 3, ly_do: "Sự cố kỹ thuật âm thanh phòng A" }
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { ma_su_kien: 101, ma_phong: 3 },
    })

    const result = await eventsService.changeRoom(101, payload)

    expect(spy).toHaveBeenCalledWith("/events/101/change-room", payload)
    expect(result.success).toBe(true)
  })
})
