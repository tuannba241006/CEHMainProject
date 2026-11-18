import { useEffect, useRef, type ReactNode } from "react"

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    ref.current
      ?.querySelector<HTMLElement>("input,select,textarea,button")
      ?.focus()
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-navy/50 p-0 sm:p-4"
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <h2 className="font-display font-bold text-lg text-navy">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
  key?: React.Key
}) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

export const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo/30 focus:border-indigo disabled:bg-slate-50"
