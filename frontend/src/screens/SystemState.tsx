import { useNavigate } from "react-router"

interface Props {
  kind: "loading" | "forbidden" | "session" | "not-found" | "info"
  title?: string
  message?: string
}

export default function SystemState({ kind, title, message }: Props) {
  const navigate = useNavigate()
  const content = {
    loading: [
      "Đang tải dữ liệu",
      "Hệ thống đang xác minh phiên và quyền truy cập.",
    ],
    forbidden: [
      "Không có quyền truy cập",
      "Tài khoản không thuộc phạm vi quyền của trang này.",
    ],
    session: [
      "Phiên đăng nhập đã hết hạn",
      "Vui lòng đăng nhập lại để tiếp tục.",
    ],
    "not-found": [
      "Không tìm thấy trang",
      "Đường dẫn không tồn tại hoặc nội dung đã được di chuyển.",
    ],
    info: [title || "Thông tin", message || ""],
  }[kind]
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-light text-indigo flex items-center justify-center font-display font-bold">
          {kind === "loading"
            ? "…"
            : kind === "forbidden"
              ? "403"
              : kind === "not-found"
                ? "404"
                : "CEH"}
        </div>
        <h1 className="font-display font-bold text-2xl text-navy mt-5">
          {content[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-2">{content[1]}</p>
        {kind !== "loading" && (
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
            >
              Quay lại
            </button>
            <button
              onClick={() => navigate("/events")}
              className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold"
            >
              Trang sự kiện
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
