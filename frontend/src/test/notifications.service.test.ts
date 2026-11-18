import { describe, it, expect, beforeEach, vi } from "vitest"
import { notificationsService } from "../api/services/notifications.service"
import { api } from "../api/client"

describe("NotificationsService Unit Tests (frontend/src/api/services/notifications.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-NTF-01 (List Notifications)
   * Course: Normal Flow
   * Expected: GET /notifications with query, returns notification list
   */
  it("should list notifications with query filters", async () => {
    const mockNotifs = [
      {
        id: 1,
        tieu_de: "Nhắc nhở sự kiện",
        noi_dung: "Sự kiện sắp diễn ra trong 2 giờ nữa",
        da_doc: false,
        thoi_gian_tao: "2026-11-20T06:00:00Z",
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockNotifs,
      meta: { so_luong_chua_doc: 1 },
    })

    const res = await notificationsService.list({ unread_only: 1 })

    expect(spy).toHaveBeenCalledWith("/notifications", { query: { unread_only: 1 } })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.meta?.so_luong_chua_doc).toBe(1)
  })

  /**
   * @test
   * Target: UC-NTF-02 (Mark Notification as Read)
   * Course: Normal Flow
   * Expected: PUT /notifications/{id}/read
   */
  it("should mark a specific notification as read", async () => {
    const spy = vi.spyOn(api, "put").mockResolvedValue({
      success: true,
      data: { id: 1, da_doc: true },
    })

    const res = await notificationsService.read(1)

    expect(spy).toHaveBeenCalledWith("/notifications/1/read")
    expect(res.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-NTF-03 (Mark All Notifications Read)
   * Course: Normal Flow
   * Expected: PUT /notifications/read-all
   */
  it("should mark all notifications as read", async () => {
    const spy = vi.spyOn(api, "put").mockResolvedValue({
      success: true,
      data: null,
    })

    const res = await notificationsService.readAll()

    expect(spy).toHaveBeenCalledWith("/notifications/read-all")
    expect(res.success).toBe(true)
  })
})
