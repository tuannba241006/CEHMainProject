import { describe, it, expect, beforeEach, vi } from "vitest"
import { drlService } from "../api/services/drl.service"
import { api } from "../api/client"

describe("DrlService Unit Tests (frontend/src/api/services/drl.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-DRL-01 (Lock DRL Records for Event)
   * Course: Normal Flow (da_chot_drl = 1)
   * Expected: POST /events/{id}/drl/lock
   */
  it("should lock DRL records for specified event", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { da_chot_drl: 1 },
      message: "Đã khóa chốt điểm rèn luyện thành công",
    })

    const result = await drlService.lock(101)

    expect(spy).toHaveBeenCalledWith("/events/101/drl/lock")
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-DRL-02 (Unlock DRL Records with Audit Reason)
   * Course: Normal Flow (da_chot_drl = 0)
   * Expected: POST /events/{id}/drl/unlock with audit reason
   */
  it("should unlock DRL records with mandatory audit reason", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: { da_chot_drl: 0 },
      message: "Đã mở khóa điều chỉnh điểm rèn luyện",
    })

    const result = await drlService.unlock(101, "Cứu xét phúc khảo điểm danh cho sinh viên vắng có phép")

    expect(spy).toHaveBeenCalledWith("/events/101/drl/unlock", {
      ly_do: "Cứu xét phúc khảo điểm danh cho sinh viên vắng có phép",
    })
    expect(result.success).toBe(true)
  })

  /**
   * @test
   * Target: UC-DRL-03 (Export DRL Excel 12 Columns)
   * Course: Normal Flow
   * Expected: GET /events/{id}/drl/export
   */
  it("should request binary blob export for 12-column DRL", async () => {
    const mockBlob = new Blob(["test-data"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const spy = vi.spyOn(api, "get").mockResolvedValue(mockBlob)

    const result = await drlService.export(101)

    expect(spy).toHaveBeenCalledWith("/events/101/drl/export")
    expect(result).toBe(mockBlob)
  })
})

