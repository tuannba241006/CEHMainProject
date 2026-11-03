import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500,
      )
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 360 }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }: { toast: Toast; key?: any }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const configs = {
    success: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      icon: "#059669",
      text: "#166534",
      emoji: "✓",
    },
    error: {
      bg: "#fef2f2",
      border: "#fecaca",
      icon: "#dc2626",
      text: "#991b1b",
      emoji: "✕",
    },
    warning: {
      bg: "#fffbeb",
      border: "#fde68a",
      icon: "#d97706",
      text: "#92400e",
      emoji: "!",
    },
    info: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: "#2563eb",
      text: "#1e40af",
      emoji: "ℹ",
    },
  }

  const c = configs[toast.type]

  return (
    <div
      className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300"
      style={{
        background: c.bg,
        borderColor: c.border,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
        style={{ background: c.icon, color: "white" }}
      >
        {c.emoji}
      </div>
      <p className="text-sm font-medium" style={{ color: c.text }}>
        {toast.message}
      </p>
    </div>
  )
}
