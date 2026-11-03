import { useState } from "react"
import { STAFF_LIST } from "../../data/mock"
import { OrgLayout } from "./OrgLayout"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

const ACCOUNT_STATUS = {
  active: { bg: "#dcfce7", text: "#15803d", label: "Đang hoạt động" },
  inactive: { bg: "#fef9c3", text: "#a16207", label: "Chưa kích hoạt" },
  locked: { bg: "#fee2e2", text: "#b91c1c", label: "Đã khóa" },
}

export default function Staff({ onNavigate, onLogout }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [activationModal, setActivationModal] = useState(false)
  const [token, setToken] = useState("")

  function generateToken() {
    const t =
      "CEH-STAFF-" +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    setToken(t)
    setActivationModal(true)
    setShowModal(false)
  }

  return (
    <OrgLayout current="org-staff" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl"
              style={{ color: "#1a1a2e" }}
            >
              Quản lý nhân viên
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Phân quyền tài khoản nhân viên điểm danh
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate("staff-scanner")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              title="Mở giao diện máy quét camera trên điện thoại để tự soát vé cho sự kiện"
            >
              <span>📷</span>
              <span>Mở máy quét soát vé (Camera)</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: "#4f46e5" }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Thêm nhân viên
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div
          className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden border"
          style={{ borderColor: "#f1f5f9" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #f1f5f9",
                }}
              >
                {[
                  "Nhân viên",
                  "Email",
                  "Sự kiện phụ trách",
                  "Quyền",
                  "Trạng thái",
                  "Hoạt động gần nhất",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "#94a3b8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAFF_LIST.map((s) => {
                const ss = ACCOUNT_STATUS[s.accountStatus]
                return (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#f8fafc" }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "#4f46e5" }}
                        >
                          {s.name.split(" ").slice(-1)[0][0].toUpperCase()}
                        </div>
                        <span
                          className="font-medium"
                          style={{ color: "#1a1a2e" }}
                        >
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      {s.email}
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#475569", maxWidth: 160 }}
                    >
                      {s.assignedEvent}
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "#475569" }}
                    >
                      {s.permission}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{ background: ss.bg, color: ss.text }}
                      >
                        {ss.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 text-xs"
                      style={{
                        color: "#94a3b8",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {s.lastActive}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: "#64748b" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                            />
                          </svg>
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Khóa tài khoản"
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: "#dc2626" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {STAFF_LIST.map((s) => {
            const ss = ACCOUNT_STATUS[s.accountStatus]
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 shadow-sm border"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: "#4f46e5" }}
                    >
                      {s.name.split(" ").slice(-1)[0][0].toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "#1a1a2e" }}
                      >
                        {s.name}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {s.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: ss.bg, color: ss.text }}
                  >
                    {ss.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Phụ trách: {s.assignedEvent}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add staff modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "#1a1a2e" }}
              >
                Thêm nhân viên
              </h2>
              <button onClick={() => setShowModal(false)}>
                <svg
                  className="w-5 h-5"
                  style={{ color: "#94a3b8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Họ và tên" placeholder="Nguyễn Văn A" />
              <Field
                label="Email"
                type="email"
                placeholder="nhanvien@campus.edu.vn"
              />
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Sự kiện được phân công
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option>Ngày hội nghề nghiệp AI</option>
                  <option>Hội thảo Điện toán đám mây</option>
                  <option>Ngày hội Đổi mới sáng tạo</option>
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569" }}
                >
                  Quyền truy cập
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <option>Điểm danh</option>
                  <option>Điểm danh + Xem báo cáo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={generateToken}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#4f46e5" }}
              >
                Tạo mã kích hoạt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activation code modal */}
      {activationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "#1a1a2e" }}
              >
                Mã kích hoạt nhân viên
              </h2>
              <button onClick={() => setActivationModal(false)}>
                <svg
                  className="w-5 h-5"
                  style={{ color: "#94a3b8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className="rounded-2xl p-5 text-center mb-4"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <p className="text-xs mb-2" style={{ color: "#64748b" }}>
                Mã kích hoạt
              </p>
              <p
                className="font-bold text-xl tracking-widest mb-2"
                style={{ fontFamily: "var(--font-mono)", color: "#059669" }}
              >
                {token}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Hết hạn sau 24 giờ
              </p>
            </div>
            <p className="text-sm mb-5" style={{ color: "#64748b" }}>
              Nhân viên sử dụng mã này để kích hoạt tài khoản điểm danh.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Sao chép mã
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#4f46e5" }}
                onClick={() => setActivationModal(false)}
              >
                Gửi mã kích hoạt
              </button>
            </div>
          </div>
        </div>
      )}
    </OrgLayout>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#475569" }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
        style={{ borderColor: "#e2e8f0" }}
      />
    </div>
  )
}
