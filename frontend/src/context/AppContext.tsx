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
  const notifData = useNotificationData()

  const value: AppContextType = {
    ...eventData,
    ...ticketData,
    ...approvalData,
    ...notifData,
    refetch: eventData.refetch,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * AppProvider composes the 4 specialized domain contexts according to FE-PKG-01:
 * - NotificationDataProvider
 * - EventDataProvider
 * - TicketDataProvider
 * - ApprovalDataProvider
 */
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

/**
 * useApp() serves as the backward-compatible facade hook
 * aggregating all 4 domain contexts for existing UI screens.
 */
export function useApp(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return ctx
}
