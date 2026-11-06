import { useState, type FormEvent } from "react"
import Modal, { Field, inputCls } from "../../components/Modal"
import { getApiErrorMessage } from "../../api/errors"

export interface FieldSpec {
  name: string
  label: string
  type?: "text" | "number" | "email" | "select" | "checkbox"
  options?: { value: string; label: string }[]
  required?: boolean
  min?: number
}

type Values = Record<string, string | number | boolean | null | undefined>

interface Props {
  key?: React.Key
  open: boolean
  title: string
  description?: string
  fields: FieldSpec[]
  initial: Values
  submitLabel?: string
  onClose: () => void
  onSubmit: (values: Values) => Promise<void>
}

export default function FormDialog({
  open,
  title,
  description,
  fields,
  initial,
  submitLabel = "Lưu",
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const next: Record<string, string> = {}
    fields.forEach((f) => {
      const v = values[f.name]
      if (
        f.required &&
        (v === undefined || v === null || String(v).trim() === "")
      )
        next[f.name] = "Trường bắt buộc"
      else if (f.type === "email" && v && !/^\S+@\S+\.\S+$/.test(String(v)))
        next[f.name] = "Email không hợp lệ"
      else if (f.type === "number" && f.min !== undefined && Number(v) < f.min)
        next[f.name] = `Giá trị tối thiểu ${f.min}`
    })
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    setFormError("")
    try {
      await onSubmit(values)
      onClose()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        {fields.map((f) => (
          <Field
            key={f.name}
            label={f.label + (f.required ? " *" : "")}
            error={errors[f.name]}
          >
            {f.type === "select" ? (
              <select
                className={inputCls}
                disabled={busy}
                value={String(values[f.name] ?? "")}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.value })
                }
              >
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "checkbox" ? (
              <input
                type="checkbox"
                disabled={busy}
                checked={Boolean(values[f.name])}
                onChange={(e) =>
                  setValues({ ...values, [f.name]: e.target.checked })
                }
              />
            ) : (
              <input
                className={inputCls}
                type={f.type ?? "text"}
                disabled={busy}
                value={String(values[f.name] ?? "")}
                onChange={(e) =>
                  setValues({
                    ...values,
                    [f.name]:
                      f.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}
          </Field>
        ))}
        {formError && (
          <p role="alert" className="text-sm text-red-600 mb-3">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Đang lưu..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  async function go() {
    if (busy) return
    setBusy(true)
    setErr("")
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setErr(getApiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      {err && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
        >
          Hủy
        </button>
        <button
          onClick={go}
          disabled={busy}
          className={`px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 ${
            danger ? "bg-red-600" : "bg-indigo"
          }`}
        >
          {busy ? "Đang xử lý..." : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
