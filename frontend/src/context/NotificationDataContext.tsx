import { createContext, useContext, useState, type ReactNode } from "react"
import {
  INITIAL_NOTIFICATIONS,
  type Notification,
} from "../data/notifications"
import { notificationsService } from "../api/services/notifications.service"

export interface NotificationDataContextType {
  notifications: Notification[]
  markNotificationRead: (id: string) => void
  markAllRead: () => void
}

const NotificationDataContext = createContext<NotificationDataContextType | null>(null)

export function NotificationDataProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)

  function markNotificationRead(id: string) {
    const numId = Number(id)
    if (!isNaN(numId)) {
      notificationsService.read(numId).catch(() => {})
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  function markAllRead() {
    notificationsService.readAll().catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <NotificationDataContext.Provider
      value={{
        notifications,
        markNotificationRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationDataContext.Provider>
  )
}

export function useNotificationData(): NotificationDataContextType {
  const ctx = useContext(NotificationDataContext)
  if (!ctx) {
    throw new Error("useNotificationData must be used within a NotificationDataProvider")
  }
  return ctx
}
