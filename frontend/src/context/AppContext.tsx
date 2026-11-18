import React, { createContext, useContext } from "react"

// ─── 4 Domain Context Providers & Hooks ─────────────────────────────────────
import {
  EventDataProvider,
  useEventData,
  type LiveEvent,
  type EventStatus,
  computeEventStatus,
  EVENT_STATUS_LABELS,
  INITIAL_LIVE_EVENTS,
  type EventDataContextType,
} from "./EventDataContext"

import {
  TicketDataProvider,
  useTicketData,
  type CheckInPermission,
  type PermissionStatus,
  type GrantPermissionResult,
  type RevokePermissionResult,
  type RegisterResult,
  type CancelResult,
  type CheckInResult,
  type ReconciliationStatus,
  type AttendanceRecord,
  type TicketDataContextType,
  type ManualOverrideInput,
  type ManualOverrideResult,
} from "./TicketDataContext"

import {
  ApprovalDataProvider,
  useApprovalData,
  type ApprovalStatus,
  type ApprovalHistory,
  type ApprovalCase,
  type SurveyResponse,
  type CertificateStatus,
  type Certificate,
  type ApprovalDataContextType,
} from "./ApprovalDataContext"

import {
  NotificationDataProvider,
  useNotificationData,
  type NotificationDataContextType,
} from "./NotificationDataContext"

import type { Ticket, WaitlistEntry } from "../data/mock"
import type { Notification } from "../data/notifications"
import type { UserData } from "./UserContext"

// ─── Re-export all domain types for backward compatibility ──────────────────
export type {
  LiveEvent,
  EventStatus,
  CheckInPermission,
  PermissionStatus,
  GrantPermissionResult,
  RevokePermissionResult,
  RegisterResult,
  CancelResult,
  CheckInResult,
  ApprovalStatus,
  ApprovalHistory,
  ApprovalCase,
  ReconciliationStatus,
  AttendanceRecord,
  SurveyResponse,
  CertificateStatus,
  Certificate,
  ManualOverrideInput,
  ManualOverrideResult,
}
export { computeEventStatus, EVENT_STATUS_LABELS, INITIAL_LIVE_EVENTS }

// ─── Unified AppContext Facade Interface ────────────────────────────────────
export interface AppContextType
  extends EventDataContextType,
    TicketDataContextType,
    ApprovalDataContextType,
    NotificationDataContextType {
  // Aliases for unified access
  refetch: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

function AppContextBridge({ children }: { children: React.ReactNode }) {
  const eventData = useEventData()
  const ticketData = useTicketData()
  const approvalData = useApprovalData()
  const notificationData = useNotificationData()

  const value: AppContextType = {
    ...eventData,
    ...ticketData,
    ...approvalData,
    ...notificationData,
    refetch: eventData.refetch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <NotificationDataProvider>
      <EventDataProvider>
        <TicketDataProvider>
          <ApprovalDataProvider>
            <AppContextBridge>{children}</AppContextBridge>
          </ApprovalDataProvider>
        </TicketDataProvider>
      </EventDataProvider>
    </NotificationDataProvider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be inside AppProvider")
  return ctx
}
