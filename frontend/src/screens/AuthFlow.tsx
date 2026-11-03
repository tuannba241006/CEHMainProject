import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { authService } from "../api/services/auth.service"
import { getApiErrorMessage } from "../api/errors"
import { isApiMode } from "../api/config"

export default function AuthFlow({
  mode,
}: {
  mode: "otp" | "forgot" | "reset" | "change"
}) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [seconds, setSeconds] = useState(600)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (mode !== "otp") return
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [mode])

  async function submit() {
    setBusy(true)
    setError("")
    try {
      if (!isApiMode()) {
        if (mode === "otp" && !/^\d{6}$/.test(otp))
          throw new Error("OTP phải gồm đúng 6 chữ số.")
        if ((mode === "reset" || mode === "change") && password !== confirm)
          throw new Error("Mật khẩu xác nhận không khớp.")
        setMessage("Demo Mode: thao tác đã được mô phỏng thành công.")
        return
      }
      if (mode === "otp") await authService.verifyRegistrationOtp(email, otp)
      if (mode === "forgot") await authService.forgotPassword(email)
      if (mode === "reset")
        await authService.resetPassword({
          email,
          otp,
          mat_khau: password,
          xac_nhan_mat_khau: confirm,
        })
      if (mode === "change")
        await authService.changePassword({
          mat_khau_moi: password,
          xac_nhan_mat_khau: confirm,
        })
      setMessage("Thao tác thành công.")
    } catch (caught) {
      setError(getApiErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === "otp"
      ? "Xác thực email bằng OTP"
      : mode === "forgot"
        ? "Khôi phục mật khẩu"
        : mode === "change"
          ? "Đổi mật khẩu bắt buộc"
          : "Đặt lại mật khẩu"
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
        <button
          onClick={() => navigate("/login")}
          className="text-xs font-semibold text-slate-500"
        >
          ← Đăng nhập
        </button>
        <h1 className="font-display font-bold text-2xl text-navy mt-5">
          {title}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === "otp"
            ? `Mã có 6 chữ số, hết hạn sau ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.`
            : "Thông tin được truyền an toàn tới REST API (JWT Bearer)."}
        </p>
        <div className="space-y-4 mt-6">
          {mode !== "change" && (
            <Field
              label="Email trường"
              value={email}
              onChange={setEmail}
              placeholder="22520001@gm.uit.edu.vn"
            />
          )}
          {(mode === "otp" || mode === "reset") && (
            <Field
              label="Mã OTP"
              value={otp}
              onChange={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
          )}
          {(mode === "reset" || mode === "change") && (
            <>
              <Field
                label="Mật khẩu mới"
                value={password}
                onChange={setPassword}
                placeholder="Tối thiểu 8 ký tự"
                type="password"
              />
              <Field
                label="Xác nhận mật khẩu"
                value={confirm}
                onChange={setConfirm}
                placeholder="Nhập lại mật khẩu"
                type="password"
              />
            </>
          )}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl">
              {message}
            </p>
          )}
          <button
            disabled={busy}
            onClick={submit}
            className="w-full py-3 rounded-xl bg-indigo text-white font-semibold disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : "Xác nhận"}
          </button>
          {mode === "otp" && (
            <button
              disabled={seconds > 540}
              onClick={() =>
                void authService
                  .resendRegistrationOtp(email)
                  .then(() => setSeconds(600))
              }
              className="w-full text-sm font-semibold text-indigo disabled:text-slate-300"
            >
              Gửi lại OTP
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-600 mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo"
      />
    </label>
  )
}
