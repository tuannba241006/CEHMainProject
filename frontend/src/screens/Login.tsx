import { useState } from "react"
import type { Role } from "../App"
import { useUser, type UserData } from "../context/UserContext"
import { getApiErrorMessage } from "../api/errors"
import { authService } from "../api/services/auth.service"
import uitCampusImg from "../assets/uit-campus.jpg"

interface Props {
  onLogin: (role: Role, email: string, user?: UserData) => void
  onVerify: () => void
  onBack?: () => void
  initialRegister?: boolean
}

type Portal = "student" | "organizer" | "officer"
interface DemoAccount {
  role: Role
  roles?: Role[]
  label: string
  email: string
  password: string
  desc: string
  initials: string
}

const ACCOUNTS: DemoAccount[] = [
  // --- SINH VIÊN / CTV ---
  {
    role: "student",
    label: "Sinh viên mẫu (22520001)",
    email: "22520001@gm.uit.edu.vn",
    password: "Student@123",
    desc: "Tài khoản sinh viên UIT · Khám phá sự kiện, đăng ký vé, DRL",
    initials: "SV",
  },
  {
    role: "student",
    label: "Sinh viên · CTV soát vé (22521999)",
    email: "22521999@gm.uit.edu.vn",
    password: "Checkin@123",
    desc: "Tài khoản CTV có quyền soát vé và điểm danh qua QR Scanner",
    initials: "CTV",
  },

  // --- BAN TỔ CHỨC ---
  {
    role: "organizer",
    label: "CLB WebDev UIT (webdev@uit.edu.vn)",
    email: "webdev@uit.edu.vn",
    password: "Organizer@123",
    desc: "Ban Chủ nhiệm CLB WebDev UIT · Quản lý sự kiện, vé, kiosk điểm danh",
    initials: "WD",
  },
  {
    role: "faculty_manager",
    label: "Khoa Hệ thống Thông tin (httt@uit.edu.vn)",
    email: "httt@uit.edu.vn",
    password: "Organizer@123",
    desc: "Ban Tổ chức cấp Khoa · Thẩm định bước 1 sự kiện CLB & tổ chức cấp Khoa",
    initials: "HT",
  },

  // --- QUẢN TRỊ VIÊN ---
  {
    role: "admin",
    label: "Quản trị viên Hệ thống (admin@uit.edu.vn)",
    email: "admin@uit.edu.vn",
    password: "Admin@123",
    desc: "Quản trị viên cấp Trường (P.CTSV / BGH) · Toàn quyền quản trị hệ thống",
    initials: "AD",
  },
  {
    role: "admin",
    label: "Cán bộ P.CTSV (pctsv@uit.edu.vn)",
    email: "pctsv@uit.edu.vn",
    password: "Admin@123",
    desc: "Cán bộ Phòng Công tác Sinh viên UIT · Phê duyệt sự kiện & ĐRL",
    initials: "CT",
  },
]

const portalAccounts = (portal: Portal) =>
  ACCOUNTS.filter((account) =>
    portal === "student"
      ? account.role === "student"
      : portal === "organizer"
        ? account.role === "organizer" || account.role === "faculty_manager"
        : account.role === "admin" || account.role === "student_affairs",
  )

export default function Login({
  onLogin,
  onVerify,
  onBack,
  initialRegister = false,
}: Props) {
  const { loginApi } = useUser()
  const [portal, setPortal] = useState<Portal>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [forgot, setForgot] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(initialRegister)
  const [registerData, setRegisterData] = useState({
    name: "",
    studentId: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    className: "",
    facultyId: "1",
    consent: false,
  })
  const [roleChoices, setRoleChoices] = useState<{
    roles: Role[]
    email: string
  } | null>(null)

  function fill(account: DemoAccount) {
    setEmail(account.email)
    setPassword(account.password)
    setError("")
  }

  async function quickLogin(account: DemoAccount) {
    setEmail(account.email)
    setPassword(account.password)
    setError("")
    setLoading(true)
    try {
      const user = await loginApi(account.email, account.password)
      const role: Role =
        user.loai_tai_khoan === "Admin"
          ? "admin"
          : user.loai_tai_khoan === "SinhVien"
            ? "student"
            : user.don_vi?.loai_don_vi === "Khoa" &&
                user.don_vi.ma_don_vi_cha == null
              ? "faculty_manager"
              : "organizer"
      onLogin(role, user.email, user)
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const user = await loginApi(email, password)
      const role: Role =
        user.loai_tai_khoan === "Admin"
          ? "admin"
          : user.loai_tai_khoan === "SinhVien"
            ? "student"
            : user.don_vi?.loai_don_vi === "Khoa" &&
                user.don_vi.ma_don_vi_cha == null
              ? "faculty_manager"
              : "organizer"
      onLogin(role, user.email, user)
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  async function submitRegistration() {
    setError("")
    if (!/^\d{8}$/.test(registerData.studentId)) {
      setError("MSSV phải gồm đúng 8 chữ số.")
      return
    }
    if (
      registerData.email.toLowerCase() !==
      `${registerData.studentId}@gm.uit.edu.vn`
    ) {
      setError("Email phải đúng định dạng {mssv}@gm.uit.edu.vn.")
      return
    }
    if (registerData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.")
      return
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.")
      return
    }
    if (!registerData.consent) {
      setError("Bạn phải đồng ý xử lý dữ liệu theo Nghị định 13.")
      return
    }
    if (!registerData.className.trim()) {
      setError("Vui lòng nhập lớp sinh hoạt.")
      return
    }
    setLoading(true)
    try {
      await authService.register({
        ho_ten: registerData.name,
        mssv: registerData.studentId,
        email: registerData.email,
        so_dien_thoai: registerData.phone || undefined,
        lop_sinh_hoat: registerData.className,
        ma_khoa: Number(registerData.facultyId),
        mat_khau: registerData.password,
        xac_nhan_mat_khau: registerData.confirmPassword,
        dong_y_nghi_dinh_13: true,
      })
      window.location.assign(
        `/verify-otp?email=${encodeURIComponent(registerData.email)}`,
      )
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:flex w-[48%] bg-navy text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="font-display font-bold text-lg">Campus Event Hub</p>
              <p className="text-xs text-slate-400">
                Nền tảng sự kiện sinh viên
              </p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              ← Xem sự kiện
            </button>
          )}
        </div>
        <div className="relative my-auto py-4 w-full">
          <div className="w-full overflow-hidden rounded-2xl xl:rounded-3xl shadow-2xl border border-white/20 bg-slate-900/40 mb-8">
            <img
              src={uitCampusImg}
              alt="Khuôn viên Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM (UIT)"
              className="w-full h-auto object-cover block"
            />
          </div>
          <h1 className="font-display font-bold text-3xl xl:text-4xl 2xl:text-5xl leading-tight">
            Kết nối sinh viên
            <br />
            <span className="text-indigo-300">Khám phá sự kiện</span>
            <br />
            Tạo dấu ấn
          </h1>
          <p className="text-sm xl:text-base text-slate-300 leading-relaxed mt-4 max-w-xl">
            Một quy trình thống nhất từ đề xuất, phê duyệt, tổ chức đến công
            nhận kết quả và phát hành chứng nhận.
          </p>
        </div>
        <p className="relative text-xs text-slate-600">
          © 2026 Campus Event Hub · Prototype tương tác
        </p>
      </aside>
      <main className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md py-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              ← Quay lại xem sự kiện (Khách vãng lai)
            </button>
          )}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Logo />
            <div>
              <p className="font-display font-bold text-navy">
                Campus Event Hub
              </p>
              <p className="text-xs text-slate-400">
                Nền tảng sự kiện sinh viên
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo">
                Đăng nhập hệ thống
              </p>
              <h2 className="font-display font-bold text-2xl text-navy mt-1">
                Chào mừng trở lại
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Vai trò được xác định từ tài khoản, không phải lựa chọn giao
                diện.
              </p>
            </div>
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-5">
              {([
                ["student", "Sinh viên / CTV"],
                ["organizer", "Ban tổ chức"],
                ["officer", "Quản trị viên"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => {
                    setPortal(value)
                    setError("")
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    portal === value
                      ? "bg-white text-navy shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {portal === "organizer" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-2.5">
                  <p className="text-xs font-semibold text-indigo">
                    CLB / Đoàn - Hội
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Tổ chức sự kiện, vé, TOTP kiosk & phân công CTV
                  </p>
                </div>
                <div className="rounded-xl bg-sky-50 border border-sky-100 p-2.5">
                  <p className="text-xs font-semibold text-sky-800">
                    Ban Quản lý Khoa
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Tổ chức sự kiện Khoa & Thẩm định bước 1 CLB
                  </p>
                </div>
              </div>
            )}
            {portal === "officer" && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/80 p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-emerald-950">
                    Quản trị viên (Admin - P.CTSV / Ban Giám hiệu)
                  </p>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Toàn quyền quản trị hệ thống, phê duyệt sự kiện &amp; hội trường,
                  quản lý điểm rèn luyện, xử lý vắng mặt và quản trị người dùng toàn trường.
                </p>
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <Field
                label="Tài khoản"
                value={email}
                onChange={setEmail}
                placeholder="Email / MSSV"
              />
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-3 py-2.5 pr-16 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-indigo"
                  />{" "}
                  Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  onClick={() => window.location.assign("/forgot-password")}
                  className="text-sm font-semibold text-indigo"
                >
                  Quên mật khẩu?
                </button>
              </div>
              {error && (
                <p className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  {error}
                </p>
              )}
              <button
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl bg-indigo text-white font-display font-semibold disabled:opacity-50"
              >
                {loading ? "Đang xác thực..." : "Đăng nhập"}
              </button>
            </form>
            {portal === "student" && (
              <p className="text-sm text-center text-slate-400 mt-4">
                Chưa có tài khoản?{" "}
                <button
                  onClick={() => setRegisterOpen(true)}
                  className="font-semibold text-indigo"
                >
                  Đăng ký ngay
                </button>
              </p>
            )}
            <button
              onClick={onVerify}
              className="w-full mt-4 py-2 text-sm font-semibold text-slate-500 hover:text-indigo"
            >
              Xác thực chứng nhận công khai →
            </button>
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400">
                Tài khoản trải nghiệm nhanh
              </span>
              <span className="h-px bg-slate-200 flex-1" />
            </div>
            <div className="space-y-2">
              {portalAccounts(portal).map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => void quickLogin(account)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-left hover:border-indigo/40 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-light text-indigo flex items-center justify-center text-xs font-bold shrink-0">
                      {account.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">
                        {account.label}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {account.email} · {account.desc}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0 opacity-80 group-hover:opacity-100">
                    Đăng nhập →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      {forgot && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-display font-bold text-lg text-navy">
              Quên mật khẩu
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Prototype chưa gửi email thật. Trong sản phẩm thực tế, hướng dẫn
              đặt lại mật khẩu sẽ được gửi đến email đã xác minh.
            </p>
            <button
              onClick={() => setForgot(false)}
              className="w-full mt-5 py-3 rounded-xl bg-indigo text-white font-semibold"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
      {registerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full my-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg text-navy">
                  Đăng ký tài khoản sinh viên
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Biểu mẫu prototype, chưa tạo tài khoản backend thật.
                </p>
              </div>
              <button
                onClick={() => setRegisterOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <Field
                label="Họ và tên"
                value={registerData.name}
                onChange={(name) =>
                  setRegisterData((data) => ({ ...data, name }))
                }
                placeholder="Nguyễn Văn A"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="MSSV"
                  value={registerData.studentId}
                  onChange={(studentId) =>
                    setRegisterData((data) => ({ ...data, studentId }))
                  }
                  placeholder="2252xxxx"
                />
                <Field
                  label="Số điện thoại"
                  value={registerData.phone}
                  onChange={(phone) =>
                    setRegisterData((data) => ({ ...data, phone }))
                  }
                  placeholder="09xx xxx xxx"
                />
              </div>
              <Field
                label="Email sinh viên"
                value={registerData.email}
                onChange={(email) =>
                  setRegisterData((data) => ({ ...data, email }))
                }
                placeholder="mssv@gm.uit.edu.vn"
              />
              <Field
                label="Lớp sinh hoạt"
                value={registerData.className}
                onChange={(className) =>
                  setRegisterData((data) => ({ ...data, className }))
                }
                placeholder="HTTT2022"
              />
              <label className="block">
                <span className="block text-sm font-medium text-slate-600 mb-1.5">
                  Khoa / Viện
                </span>
                <select
                  value={registerData.facultyId}
                  onChange={(event) =>
                    setRegisterData((data) => ({
                      ...data,
                      facultyId: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="1">Hệ thống Thông tin</option>
                  <option value="2">Công nghệ Phần mềm</option>
                  <option value="3">Khoa học Máy tính</option>
                </select>
              </label>
              <Field
                label="Mật khẩu"
                value={registerData.password}
                onChange={(password) =>
                  setRegisterData((data) => ({ ...data, password }))
                }
                placeholder="Tối thiểu 8 ký tự"
              />
              <Field
                label="Xác nhận mật khẩu"
                value={registerData.confirmPassword}
                onChange={(confirmPassword) =>
                  setRegisterData((data) => ({ ...data, confirmPassword }))
                }
                placeholder="Nhập lại mật khẩu"
              />
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={registerData.consent}
                  onChange={(event) =>
                    setRegisterData((data) => ({
                      ...data,
                      consent: event.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />
                Tôi đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.
              </label>
              {error && (
                <p className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  {error}
                </p>
              )}
            </div>
            <button
              onClick={() => void submitRegistration()}
              disabled={loading}
              className="w-full mt-5 py-3 rounded-xl bg-indigo text-white font-semibold"
            >
              Đăng ký tài khoản
            </button>
          </div>
        </div>
      )}
      {roleChoices && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-display font-bold text-lg text-navy">
              Chọn vai trò truy cập
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Tài khoản này được phân quyền nhiều vai trò. Vui lòng chọn phân hệ muốn truy cập:
            </p>
            <div className="space-y-2">
              {roleChoices.roles.map((role) => (
                <button
                  key={role}
                  onClick={() => onLogin(role, roleChoices.email)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-left font-semibold text-sm text-navy hover:bg-indigo-light"
                >
                  {role === "faculty_manager"
                    ? "Ban quản lý khoa"
                    : "Phòng Công tác sinh viên"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Logo() {
  return (
    <div className="w-10 h-10 rounded-xl bg-indigo text-white flex items-center justify-center font-display font-bold text-xs">
      CEH
    </div>
  )
}
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
      />
    </label>
  )
}
