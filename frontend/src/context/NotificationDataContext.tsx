import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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

  useEffect(() => {
    let cancelled = false
    notificationsService
      .list()
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: Notification[] = res.data.map((n, idx) => ({
            id: n.id ?? idx + 1,
            tieu_de: n.tieu_de,
            noi_dung: n.noi_dung,
            loai_thong_bao: n.loai_thong_bao,
            lien_ket: n.lien_ket,
            da_doc: n.da_doc,
            thoi_gian_gui: n.thoi_gian_gui || new Date().toISOString(),
            title: n.tieu_de,
            description: n.noi_dung,
            type: n.loai_thong_bao,
            time: "Vừa xong",
            read: n.da_doc,
            action: "event-detail",
            audience: "student",
          }))
          setNotifications(mapped)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
