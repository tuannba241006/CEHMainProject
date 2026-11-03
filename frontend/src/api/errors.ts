export interface ApiErrorPayload {
  success?: false
  error?: string
  message?: string
  trace_id?: string
  errors?: Record<string, string[]>
  chi_tiet?: unknown
}

const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_LOCKED: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
  PASSWORD_CHANGE_REQUIRED: "Bạn phải đổi mật khẩu trước khi tiếp tục.",
  SLOT_SOLD_OUT: "Sự kiện vừa hết vé.",
  SCHEDULE_CONFLICT_HARD:
    "Bạn đang giữ vé của một sự kiện giới hạn chỗ bị trùng lịch.",
  ALREADY_REGISTERED: "Bạn đã có vé hợp lệ cho sự kiện này.",
  REGISTRATION_CLOSED: "Đăng ký sự kiện đã đóng.",
  WAITLIST_CLOSED: "Hàng đợi đã đóng vì còn dưới 2 giờ trước sự kiện.",
  TICKETS_AVAILABLE: "Sự kiện vừa có vé trống. Vui lòng đặt vé trực tiếp.",
  OFFER_EXPIRED: "Suất giữ chỗ đã hết hạn và được chuyển cho người kế tiếp.",
  OFFER_SKIPPED_CONFLICT:
    "Không thể nhận vé vì bạn đang giữ vé khác trùng lịch.",
  CANNOT_CANCEL_WITHIN_4_HOURS:
    "Không thể hủy vé trong vòng 4 giờ trước sự kiện.",
  STAFF_NOT_ASSIGNED: "Bạn không được phân công soát vé cho sự kiện này.",
  DEVICE_ALREADY_USED: "Thiết bị này đã được dùng cho một tài khoản khác.",
  DRL_LOCKED: "Bảng điểm rèn luyện đã khóa chốt.",
  INVALID_STATE_TRANSITION: "Không thể chuyển sang trạng thái yêu cầu.",
  NOT_ELIGIBLE: "Bạn chưa đủ điều kiện nhận chứng nhận.",
  CERT_REVOKED: "Chứng nhận đã bị thu hồi.",
  OTP_INVALID: "Mã OTP không chính xác.",
  OTP_EXPIRED: "Mã OTP đã hết hạn.",
  OTP_ATTEMPTS_EXCEEDED: "Bạn đã nhập sai OTP quá số lần cho phép.",
}

export class ApiError extends Error {
  status: number
  code?: string
  traceId?: string
  validationErrors?: Record<string, string[]>
  details?: unknown

  constructor(status: number, payload: ApiErrorPayload = {}) {
    const fallback =
      status === 401
        ? "Phiên đăng nhập đã hết hạn."
        : status === 403
          ? "Bạn không có quyền thực hiện thao tác này."
          : status === 404
            ? "Không tìm thấy dữ liệu yêu cầu."
            : status === 422
              ? "Dữ liệu chưa hợp lệ."
              : status === 429
                ? "Bạn thao tác quá nhanh. Vui lòng thử lại sau."
                : status >= 500
                  ? "Máy chủ đang gặp sự cố. Vui lòng thử lại."
                  : "Yêu cầu không thành công."
    super(
      payload.message ||
        (payload.error && ERROR_MESSAGES[payload.error]) ||
        fallback,
    )
    this.name = "ApiError"
    this.status = status
    this.code = payload.error
    this.traceId = payload.trace_id
    this.validationErrors = payload.errors
    this.details = payload.chi_tiet
  }
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi không xác định."
}
