import { describe, it, expect } from "vitest"
import { ApiError, getApiErrorMessage } from "../api/errors"

describe("API Error Class & Helper (frontend/src/api/errors.ts)", () => {
  it("should create ApiError with specific error code message", () => {
    const error = new ApiError(400, { error: "SLOT_SOLD_OUT" })
    expect(error.status).toBe(400)
    expect(error.code).toBe("SLOT_SOLD_OUT")
    expect(error.message).toBe("Sự kiện vừa hết vé.")
  })

  it("should prioritize custom payload message over code message", () => {
    const error = new ApiError(409, {
      error: "ALREADY_REGISTERED",
      message: "Bạn đã đăng ký sự kiện này rồi!",
    })
    expect(error.status).toBe(409)
    expect(error.message).toBe("Bạn đã đăng ký sự kiện này rồi!")
  })

  it("should use appropriate fallback message when no code or message is provided", () => {
    const err401 = new ApiError(401)
    expect(err401.message).toBe("Phiên đăng nhập đã hết hạn.")

    const err403 = new ApiError(403)
    expect(err403.message).toBe("Bạn không có quyền thực hiện thao tác này.")

    const err404 = new ApiError(404)
    expect(err404.message).toBe("Không tìm thấy dữ liệu yêu cầu.")

    const err422 = new ApiError(422)
    expect(err422.message).toBe("Dữ liệu chưa hợp lệ.")

    const err500 = new ApiError(500)
    expect(err500.message).toBe("Máy chủ đang gặp sự cố. Vui lòng thử lại.")
  })

  it("should extract validationErrors and traceId", () => {
    const error = new ApiError(422, {
      trace_id: "trace-xyz-123",
      errors: {
        email: ["Email không đúng định dạng."],
      },
    })
    expect(error.traceId).toBe("trace-xyz-123")
    expect(error.validationErrors?.email).toContain("Email không đúng định dạng.")
  })

  it("getApiErrorMessage should format known and unknown errors cleanly", () => {
    expect(getApiErrorMessage(new Error("Lỗi kết nối"))).toBe("Lỗi kết nối")
    expect(getApiErrorMessage("random string")).toBe("Đã xảy ra lỗi không xác định.")
    expect(getApiErrorMessage(null)).toBe("Đã xảy ra lỗi không xác định.")
  })
})

