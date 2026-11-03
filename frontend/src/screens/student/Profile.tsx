import { useState } from "react"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"
import { isApiMode } from "../../api/config"
import { authService } from "../../api/services/auth.service"
import { getApiErrorMessage } from "../../api/errors"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export default function Profile({ onNavigate, onLogout }: Props) {
  const { showToast } = useToast()
  const { user, updateUser } = useUser()
  const [editMode, setEditMode] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [draft, setDraft] = useState({ name: user.name, phone: user.phone })

  const [saving, setSaving] = useState(false)

  // Password change state (UC-AUTH-03.AC.1)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPass, setChangingPass] = useState(false)
  const [passError, setPassError] = useState("")

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPassError("")
    if (!currentPassword)
      return setPassError("Vui lòng nhập mật khẩu hiện tại.")
    if (newPassword.length < 8)
      return setPassError("Mật khẩu mới phải có tối thiểu 8 ký tự.")
    if (newPassword !== confirmPassword)
      return setPassError("Mật khẩu xác nhận không khớp.")

    setChangingPass(true)
    try {
      if (isApiMode()) {
        await authService.changePassword({
          mat_khau_hien_tai: currentPassword,
          mat_khau_moi: newPassword,
          xac_nhan_mat_khau: confirmPassword,
        })
      }
      showToast(
        "Đã đổi mật khẩu thành công. Các phiên làm việc khác đã được thu hồi bảo mật.",
        "success",
      )
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPassError(getApiErrorMessage(err))
    } finally {
      setChangingPass(false)
    }
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      if (isApiMode()) {
        await authService.updateProfile({
          so_dien_thoai: draft.phone,
          avatar_url: user.avatar_url,
        })
      }
      updateUser({ phone: draft.phone })
      setEditMode(false)
      showToast("Đã cập nhật thông tin hồ sơ thành công.", "success")
    } catch (error) {
      showToast(getApiErrorMessage(error), "error")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDraft({ name: user.name, phone: user.phone })
    setEditMode(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Web Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium mb-6">
        <button
          onClick={() => onNavigate("home")}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Hồ sơ cá nhân</span>
      </nav>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs mb-8">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 relative px-6 sm:px-8 flex items-end">
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs font-semibold text-white border border-white/20">
            Tài khoản Sinh viên chính thức
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            {/* Avatar with edit badge */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-md bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-display font-bold text-3xl sm:text-4xl text-white">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </div>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="font-display font-bold text-2xl text-slate-900">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-mono">
                MSSV: {user.studentId} · {user.faculty}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">
                  Tài khoản đang hoạt động bình thường
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center sm:justify-end">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                  />
                </svg>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2/3 width): Student Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-6">
              Thông tin học vụ & Liên hệ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Họ và tên sinh viên
                </label>
                <p className="text-sm font-semibold text-slate-800 py-1.5">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Đồng bộ từ hệ thống đào tạo, không thể chỉnh sửa tại đây.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Mã số sinh viên (MSSV)
                </label>
                <p className="text-sm font-mono font-semibold text-slate-800 py-1.5">
                  {user.studentId}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Khoa / Viện đào tạo
                </label>
                <p className="text-sm font-semibold text-slate-800 py-1.5">
                  {user.faculty}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Email sinh viên (Trường cấp)
                </label>
                <p className="text-sm font-mono text-slate-800 py-1.5 truncate">
                  {user.email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Số điện thoại liên hệ
                </label>
                {editMode ? (
                  <input
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-400 text-sm font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800 py-1.5">
                    {user.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Vai trò phân hệ
                </label>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Dữ liệu học vụ được đồng bộ trực tiếp từ Cổng đào tạo Đại học
                (MSSV & Email bất biến).
              </span>
              <span className="text-indigo-600 font-semibold cursor-pointer">
                Báo sai thông tin
              </span>
            </div>
          </div>

          {/* UC-AUTH-03.AC.1: Change Password Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Bảo mật & Đổi mật khẩu
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đổi mật khẩu định kỳ để bảo vệ tài khoản sinh viên. Sau khi
                  đổi mật khẩu, hệ thống sẽ tự động thu hồi các phiên đăng nhập
                  khác.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                Bcrypt (cost 12)
              </span>
            </div>

            <form
              onSubmit={handlePasswordChange}
              className="space-y-4 max-w-lg"
            >
              {passError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 font-medium">
                  ⚠️ {passError}
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mật khẩu mới (≥ 8 ký tự)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mật khẩu mới"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {changingPass ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1/3 width): Stats & Quick Links */}
        <div className="lg:col-span-1 space-y-6">
          {/* Activity summary statistics */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-display font-bold text-base text-slate-900 mb-4">
              Thống kê hoạt động
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="text-xl font-display font-bold text-indigo-600">
                  3
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Vé đã đặt
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="text-xl font-display font-bold text-emerald-600">
                  1
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Đã tham gia
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="text-xl font-display font-bold text-cyan-600">
                  25
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Điểm tích lũy
                </div>
              </div>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 mb-2">
              Liên kết nhanh
            </h3>

            <button
              onClick={() => onNavigate("achievements")}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/50 transition-all text-left cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Điểm & Chứng nhận cá nhân
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tra cứu điểm rèn luyện và chứng nhận số đã cấp
                </p>
              </div>
              <span className="text-indigo-600 font-bold">→</span>
            </button>

            <button
              onClick={() => onNavigate("tickets")}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/50 transition-all text-left cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Vé sự kiện đã đăng ký
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Xuất trình mã QR check-in tại hội trường
                </p>
              </div>
              <span className="text-indigo-600 font-bold">→</span>
            </button>
          </div>

          {/* Logout Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-center">
            <button
              onClick={onLogout}
              className="w-full py-3 rounded-2xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Đăng xuất khỏi hệ thống
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Phiên đăng nhập an toàn kết thúc khi đăng xuất.
            </p>
          </div>
        </div>
      </div>

      {/* Centered Web Avatar Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-slate-900">
                Thay đổi ảnh đại diện
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-md bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-display font-bold text-3xl text-white">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <button
                onClick={() => {
                  updateUser({
                    avatar:
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
                  })
                  setShowAvatarModal(false)
                  showToast("Đã cập nhật ảnh đại diện mẫu.", "success")
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left flex items-center justify-between cursor-pointer"
              >
                <span>Chọn ảnh mẫu chân dung sinh viên</span>
                <span>📸</span>
              </button>

              <button
                onClick={() => {
                  updateUser({ avatar: null })
                  setShowAvatarModal(false)
                  showToast("Đã xóa ảnh đại diện.", "info")
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-100 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left flex items-center justify-between cursor-pointer"
              >
                <span>Xóa ảnh đại diện (sử dụng chữ cái đầu)</span>
                <span>🗑️</span>
              </button>
            </div>

            <button
              onClick={() => setShowAvatarModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
