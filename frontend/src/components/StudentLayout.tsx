import type { ReactNode } from "react"
import WebNavbar from "./WebNavbar"
import WebFooter from "./WebFooter"

interface Props {
  current: string
  isGuest?: boolean
  onNavigate: (screen: string) => void
  onLogout: () => void
  onVerify: () => void
  onOpenLogin?: () => void
  onOpenRegister?: () => void
  onSelectEvent?: (eventId: string) => void
  children: ReactNode
}

export default function StudentLayout({
  current,
  isGuest = false,
  onNavigate,
  onLogout,
  onVerify,
  onOpenLogin,
  onOpenRegister,
  onSelectEvent,
  children,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans">
      {/* Persistent Web Header across all student & guest pages */}
      <WebNavbar
        current={current}
        isGuest={isGuest}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onVerify={onVerify}
        onOpenLogin={onOpenLogin}
        onOpenRegister={onOpenRegister}
        onSelectEvent={onSelectEvent}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">{children}</main>

      {/* University Web Footer */}
      <WebFooter />
    </div>
  )
}
