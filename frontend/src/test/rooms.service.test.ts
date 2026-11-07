import { describe, it, expect, beforeEach, vi } from "vitest"
import { roomsService } from "../api/services/rooms.service"
import { api } from "../api/client"

describe("RoomsService Unit Tests (frontend/src/api/services/rooms.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-ROOM-01 (List Auditorium Rooms)
   * Course: Normal Flow
   * Expected: GET /rooms, returns rooms list
   */
  it("should fetch list of rooms", async () => {
    const mockRooms = [
      {
        ma_phong: 1,
        ten_phong: "Hội trường E",
        suc_chua: 300,
        co_so: "CoSo1" as const,
        trang_thai: "HOAT_DONG" as const,
      },
    ]

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockRooms,
    })

    const res = await roomsService.list({ co_so: "CoSo1" })

    expect(spy).toHaveBeenCalledWith("/rooms", { query: { co_so: "CoSo1" } })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].ten_phong).toBe("Hội trường E")
  })

  /**
   * @test
   * Target: UC-ROOM-02 (Check Room Availability)
   * Course: Normal Flow
   * Expected: GET /rooms/{id}/availability with date & time range
   */
  it("should check room availability for time slot", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: {
        ma_phong: 1,
        trong_lich: true,
      },
    })

    const query = {
      ngay: "2026-11-20",
      gio_bat_dau: "08:00",
      gio_ket_thuc: "11:30",
    }
    const res = await roomsService.availability(1, query)

    expect(spy).toHaveBeenCalledWith("/rooms/1/availability", { query })
    expect(res.success).toBe(true)
    expect(res.data.trong_lich).toBe(true)
  })

  /**
   * @test
   * Target: UC-ROOM-03 (Get Room Schedule)
   * Course: Normal Flow
   * Expected: GET /rooms/{id}/schedule
   */
  it("should fetch room schedule", async () => {
    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: [],
    })

    const res = await roomsService.schedule(1, { from: "2026-11-01" })

    expect(spy).toHaveBeenCalledWith("/rooms/1/schedule", { query: { from: "2026-11-01" } })
    expect(res.success).toBe(true)
  })
})
