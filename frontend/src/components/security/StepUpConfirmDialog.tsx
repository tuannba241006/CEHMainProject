import { useEffect, useRef, useState, type FormEvent } from "react"
import { api } from "../../api/client"
import { isApiError } from "../../api/errors"

type Resolver = (confirmed: boolean) => void

/** Global prompt for HTTP 428. Never stores the password in local/sessionStorage. */
export function StepUpConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const requests = useRef<Resolver[]>([])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ resolve: Resolver }>).detail
      if (typeof detail?.resolve !== "function") return
      if (requests.current.length > 0) {
        // A password confirmation must not silently replay multiple writes.
        detail.resolve(false)
        return
      }
      event.preventDefault() // Handshake: tells client.ts that the listener exists.
      requests.current.push(detail.resolve)
      setOpen(true)
    }
    const expired = (event: Event) => {
      const resolver = (event as CustomEvent<{ resolve: Resolver }>).detail?.resolve
      const index = requests.current.indexOf(resolver)
      if (index < 0) return
      requests.current.splice(index, 1)
      setOpen(false)
      setPassword("")
      setError("")
      setBusy(false)
    }
    window.addEventListener("ceh:stepup_required", handler)
    window.addEventListener("ceh:stepup_expired", expired)
    return () => {
      window.removeEventListener("ceh:stepup_required", handler)
      window.removeEventListener("ceh:stepup_expired", expired)
      for (const resolve of requests.current.splice(0)) resolve(false)
    }
  }, [])

  const finish = (success: boolean) => {
    for (const resolve of requests.current.splice(0)) resolve(success)
    setOpen(false)
    setPassword("")
    setError("")
    setBusy(false)
  }

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password || busy) return
    const activeResolver = requests.current[0]
    if (!activeResolver) return
    setBusy(true)
    setError("")
    try {
      await api.post("/auth/confirm-sensitive-action", { mat_khau: password })
      if (requests.current[0] === activeResolver) finish(true)
    } catch (error) {
      if (requests.current[0] !== activeResolver) return
      setError(isApiError(error) && error.status === 429
        ? "Bạn đã thử quá nhiều lần. Vui lòng đợi trước khi xác thực lại."
        : isApiError(error) && error.status === 403
          ? "Phiên làm việc không hợp lệ. Vui lòng đăng nhập lại."
          : "Mật khẩu chưa đúng hoặc phiên đã hết hạn. Vui lòng thử lại.")
    } finally {
      if (requests.current[0] === activeResolver) setBusy(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const input = document.getElementById("ceh-stepup-password")
    input?.focus()
    return () => previousFocus?.focus()
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div onKeyDown={(event) => { if (event.key === "Escape" && !busy) { event.preventDefault(); finish(false) } }} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="ceh-stepup-title">
        <h2 id="ceh-stepup-title" className="mb-3 text-lg font-semibold text-gray-900">Xác thực lại để tiếp tục</h2>
        <p className="mb-4 text-sm text-gray-600">Thao tác này có thể thay đổi dữ liệu quan trọng. Vui lòng nhập lại mật khẩu tài khoản.</p>
        <form onSubmit={confirm}>
          <label htmlFor="ceh-stepup-password" className="block text-sm font-medium text-gray-900">Mật khẩu</label>
          <input id="ceh-stepup-password" type="password" autoComplete="current-password"
            value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900" />
          {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => finish(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-900">Hủy</button>
            <button type="submit" disabled={busy} className="rounded-md bg-blue-700 px-4 py-2 text-white disabled:opacity-60">
              {busy ? "Đang xác thực..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
