import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  TICKETS,
  type Ticket,
  type WaitlistEntry,
  parseQrPayload,
} from "../data/mock"
import { type Ticket as ContractTicket, buildQrPayload } from "../data/contract"
import { useUser, type UserData } from "./UserContext"
import { ticketsService } from "../api/services/tickets.service"
import { bookingsService } from "../api/services/bookings.service"
import { waitlistService } from "../api/services/waitlist.service"
import {
  attendanceService,
  type ManualOverrideData,
  type ManualOverridePayload,
} from "../api/services/attendance.service"
import { getApiErrorMessage, isAuthError } from "../api/errors"
import { useEventData, type LiveEvent } from "./EventDataContext"

export type ManualOverrideInput = Omit<ManualOverridePayload, "ma_dang_ky"> & {
  ma_dang_ky?: number
  ticketId?: string
  da_doi_soat_the?: boolean
}

export interface ManualOverrideResult {
  success: boolean
  error?: string
  data?: ManualOverrideData
}

export type PermissionStatus = "active" | "suspended" | "revoked" | "expired"

export interface CheckInPermission {
  id: string
  studentId: string
  studentName: string
  eventId: string
  status: PermissionStatus
  grantedAt: string
  validFrom?: string
  validUntil?: string
}

export interface GrantPermissionResult {
  success: boolean
  permission?: CheckInPermission
  error?: string
}

export interface RevokePermissionResult {
  success: boolean
  error?: string
}

export interface RegisterResult {
  success: boolean
  ticket?: Ticket
  error?: string
}

export interface CancelResult {
  success: boolean
  error?: string
}

export interface CheckInResult {
  success: boolean
  type: "success" | "already_checked_in" | "cancelled_ticket" | "not_found" | "wrong_event"
  ticket?: Ticket
  studentName?: string
  studentId?: string
  faculty?: string
  time?: string
  message: string
}

export type ReconciliationStatus =
  | "draft"
  | "needs_review"
  | "submitted"
  | "recognized"
  | "revision"

export interface AttendanceRecord {
  id: string
  eventId: string
  studentId: string
  studentName: string
  checkin: string
  checkout?: string
  validMinutes: number
  participationRatio: number
  proposedPoints: number
  officialPoints?: number
  certificateEligible: boolean
  status: ReconciliationStatus
  warning?: string
  adjustmentReason?: string
  evidence?: string
  approvedBy?: string
  approvedAt?: string
  ruleVersion: string
  history: Array<{ id: string; actor: string; action: string; at: string; note?: string }>
}

const SEED_PERMISSIONS: CheckInPermission[] = [
  {
    id: "PERM-001",
    studentId: "22521999",
    studentName: "Trần Minh Phúc",
    eventId: "EVT001",
    status: "active",
    grantedAt: "2026-09-20 09:00",
  },
]

const SEED_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "AT-001",
    eventId: "EVT001",
    studentId: "22521001",
    studentName: "Cao Duy Anh",
    checkin: "08:22",
    checkout: "11:18",
    validMinutes: 150,
    participationRatio: 100,
    proposedPoints: 5,
    officialPoints: 5,
    certificateEligible: true,
    status: "recognized",
    approvedBy: "Nguyễn Thảo Vy · Phòng CTSV",
    approvedAt: "16/09/2026 14:20",
    ruleVersion: "DK-2026.1",
    history: [],
  },
]

export interface TicketDataContextType {
  tickets: Ticket[]
  waitlistEntries: WaitlistEntry[]
  permissions: CheckInPermission[]
  attendanceRecords: AttendanceRecord[]
  getUserActiveTicket: (eventId: string, studentId: string) => Ticket | undefined
  getActiveParticipants: (eventId: string) => Ticket[]
  getCheckedInCount: (eventId: string) => number
  getStudentWaitlistEntries: (studentId: string) => WaitlistEntry[]
  registerEvent: (event: LiveEvent, user: UserData) => Promise<RegisterResult>
  cancelTicket: (ticketId: string, reason: string) => Promise<CancelResult>
  joinWaitlist: (
    event: LiveEvent,
    user: UserData,
  ) => Promise<{ success: boolean; entry?: WaitlistEntry; error?: string }>
  claimWaitlistOffer: (
    id: number,
  ) => Promise<{ success: boolean; ticket?: Ticket; error?: string }>
  declineWaitlistOffer: (id: number) => Promise<{ success: boolean; error?: string }>
  checkIn: (qrCode: string, eventId?: string) => CheckInResult
  checkOut: (qrCode: string, eventId?: string) => CheckInResult
  getStudentPermissions: (studentId: string) => CheckInPermission[]
  getEventPermissions: (eventId: string) => CheckInPermission[]
  grantCheckinPermission: (
    studentId: string,
    studentName: string,
    eventId: string,
    validFrom?: string,
    validUntil?: string,
  ) => GrantPermissionResult
  revokePermission: (permId: string) => RevokePermissionResult
  suspendPermission: (permId: string) => RevokePermissionResult
  reactivatePermission: (permId: string) => RevokePermissionResult
  submitAttendanceResults: (eventId: string) => { success: boolean; error?: string }
  recognizeAttendance: (recordId: string) => { success: boolean; error?: string }
  requestAttendanceRevision: (recordId: string, reason: string) => { success: boolean; error?: string }
  adjustAttendance: (
    recordId: string,
    minutes: number,
    reason: string,
    evidence: string,
  ) => { success: boolean; error?: string }
  requestStudentReview: (recordId: string, reason: string) => { success: boolean; error?: string }
  manualOverrideAttendance: (
    payload: ManualOverrideInput,
  ) => Promise<ManualOverrideResult>
  ticketsLoading: boolean
  ticketsError: string | null
  refreshTickets: (user?: Partial<UserData> | null) => Promise<void>
}

export function mapContractTicketToUiTicket(
  ct: ContractTicket,
  user?: Partial<UserData> | null,
): Ticket {
  const startDateStr = ct.thoi_gian_bat_dau || ""
  const endDateStr = ct.thoi_gian_ket_thuc || ""
  const date = startDateStr.includes("T")
    ? startDateStr.split("T")[0]
    : startDateStr.slice(0, 10)
  const time = startDateStr.includes("T")
    ? startDateStr.split("T")[1].slice(0, 5)
    : "08:30"
  const endTime = endDateStr.includes("T")
    ? endDateStr.split("T")[1].slice(0, 5)
    : "11:30"

  let legacyStatus: Ticket["status"] = "pending"
  if (ct.trang_thai === "DaCheckIn") legacyStatus = "checked_in"
  else if (ct.trang_thai === "DaCheckOut") legacyStatus = "attended"
  else if (ct.trang_thai === "DaHuy") legacyStatus = "cancelled"

  const qr = buildQrPayload(
    ct.ma_ve_uuid,
    user?.ma_tai_khoan || 1,
    ct.ma_su_kien,
  )

  const existingTicket = TICKETS.find((t) => t.ma_dang_ky === ct.ma_dang_ky)

  return {
    ...ct,
    chu_ky_hmac:
      (ct as unknown as { chu_ky_hmac?: string }).chu_ky_hmac ||
      existingTicket?.chu_ky_hmac ||
      "a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    payload_qr:
      (ct as unknown as { payload_qr?: string }).payload_qr ||
      existingTicket?.payload_qr ||
      qr,
    yeu_cau_wake_lock: true,

    id: existingTicket?.id || `TKT-${ct.ma_dang_ky}`,
    eventId: existingTicket?.eventId || String(ct.ma_su_kien),
    eventTitle: ct.ten_su_kien,
    eventDate: date,
    eventTime: `${time} - ${endTime}`,
    eventLocation: `${ct.ten_phong}, ${ct.co_so === "CoSo2" ? "Cơ sở 2" : "Cơ sở 1"}`,
    studentId: user?.studentId || existingTicket?.studentId || "22521001",
    studentName: user?.name || existingTicket?.studentName || "Cao Duy Anh",
    faculty: user?.faculty || existingTicket?.faculty || "Công nghệ Thông tin",
    status: legacyStatus,
    checkinTime: ct.thoi_gian_check_in || existingTicket?.checkinTime,
    checkoutTime: ct.thoi_gian_check_out || existingTicket?.checkoutTime,
    qrCode: existingTicket?.qrCode || qr,
    registeredAt:
      ct.thoi_gian_dang_ky ||
      existingTicket?.registeredAt ||
      new Date().toISOString(),
    ticketCode: existingTicket?.ticketCode || `TKT-${ct.ma_dang_ky}`,
    mssv: user?.studentId || existingTicket?.mssv || "22521001",
    studentEmail: user?.email || existingTicket?.studentEmail,
  }
}

const TicketDataContext = createContext<TicketDataContextType | null>(null)

export function TicketDataProvider({ children }: { children: ReactNode }) {
  const { events, setEvents } = useEventData()
  const { authenticated, role, user } = useUser()
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [permissions, setPermissions] = useState<CheckInPermission[]>(SEED_PERMISSIONS)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(SEED_ATTENDANCE)

  const refreshTickets = useCallback(
    async (currentUser?: Partial<UserData> | null) => {
      if (!authenticated || role !== "student") return
      setTicketsLoading(true)
      setTicketsError(null)
      try {
        const res = await ticketsService.mine()
        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.map((t) =>
            mapContractTicketToUiTicket(t, currentUser || user),
          )
          setTickets(mapped)
        }
        try {
          const wlRes = await waitlistService.mine()
          if (wlRes.data && Array.isArray(wlRes.data)) {
            setWaitlistEntries(wlRes.data)
          }
        } catch {
          // Fallback for waitlist
        }
      } catch (err) {
        if (isAuthError(err)) {
          return
        }
        setTicketsError(getApiErrorMessage(err))
      } finally {
        setTicketsLoading(false)
      }
    },
    [authenticated, role, user],
  )

  useEffect(() => {
    setTicketsError(null)
  }, [authenticated, role])

  useEffect(() => {
    if (authenticated && role === "student") {
      void refreshTickets()
    }
  }, [authenticated, role, refreshTickets])

  function getUserActiveTicket(eventId: string, studentId: string) {
    return tickets.find(
      (t) =>
        t.eventId === eventId &&
        t.studentId === studentId &&
        t.status !== "cancelled",
    )
  }

  function getActiveParticipants(eventId: string) {
    return tickets.filter((t) => t.eventId === eventId && t.status !== "cancelled")
  }

  function getCheckedInCount(eventId: string) {
    return tickets.filter((t) => t.eventId === eventId && t.status === "attended").length
  }

  function getStudentWaitlistEntries(studentId: string) {
    return waitlistEntries.filter((w) => w.studentId === studentId)
  }

  async function registerEvent(event: LiveEvent, user: UserData): Promise<RegisterResult> {
    if (getUserActiveTicket(event.id, user.studentId)) {
      return { success: false, error: "Bạn đã đăng ký sự kiện này rồi." }
    }
    const uuid = crypto.randomUUID()
    let bookingResult
    try {
      bookingResult = await bookingsService.book(event.ma_su_kien, uuid)
    } catch (err: unknown) {
      return { success: false, error: getApiErrorMessage(err) }
    }

    const serverTicket = (bookingResult as any)?.data as
      | { ma_dang_ky?: number; ma_ve_uuid?: string }
      | undefined
    const assignedId = serverTicket?.ma_dang_ky || Date.now()
    const finalUuid = serverTicket?.ma_ve_uuid || uuid
    const baseTicket = TICKETS[0] || ({} as Ticket)
    const qr = buildQrPayload(
      finalUuid,
      user.ma_tai_khoan || 1,
      event.ma_su_kien,
    )
    const newTicket: Ticket = {
      ...baseTicket,
      id: `TKT-${assignedId}`,
      ma_dang_ky: assignedId,
      ma_ve_uuid: finalUuid,
      ma_su_kien: event.ma_su_kien,
      ten_su_kien: event.ten_su_kien,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      studentId: user.studentId,
      studentName: user.name,
      faculty: user.faculty || "Công nghệ Thông tin",
      status: "pending",
      trang_thai: "DaDangKy",
      qrCode: qr,
      payload_qr: qr,
      registeredAt: new Date().toLocaleString("vi-VN"),
    }

    setTickets((prev) => [newTicket, ...prev])
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id
          ? {
              ...e,
              registered: e.registered + 1,
              so_ve_con_lai: Math.max(0, (e.so_ve_con_lai ?? e.capacity) - 1),
            }
          : e,
      ),
    )
    return { success: true, ticket: newTicket }
  }

  async function cancelTicket(ticketId: string, reason: string): Promise<CancelResult> {
    const targetTicket = tickets.find((t) => t.id === ticketId)
    const numericId = targetTicket?.ma_dang_ky || Number(ticketId.replace(/\D/g, "")) || 1
    try {
      await ticketsService.cancel(numericId, reason, crypto.randomUUID())
    } catch (err: unknown) {
      return { success: false, error: getApiErrorMessage(err) }
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "cancelled", trang_thai: "DaHuy" } : t)),
    )
    return { success: true }
  }

  async function joinWaitlist(event: LiveEvent, user: UserData) {
    const uuid = crypto.randomUUID()
    try {
      await waitlistService.join(event.ma_su_kien, uuid)
    } catch (err: unknown) {
      return { success: false, error: getApiErrorMessage(err) }
    }
    const entry: WaitlistEntry = {
      id: Date.now(),
      ma_su_kien: event.ma_su_kien,
      ten_su_kien: event.ten_su_kien,
      thoi_gian_bat_dau: event.thoi_gian_bat_dau,
      thoi_gian_ket_thuc: event.thoi_gian_ket_thuc,
      ten_phong: event.ten_phong,
      co_so: event.co_so,
      so_thu_tu: waitlistEntries.length + 1,
      trang_thai: "WAITING",
      thoi_gian_dang_ky: new Date().toISOString(),
      studentId: user.studentId,
      ho_ten: user.name,
      ma_tai_khoan: user.ma_tai_khoan || 1,
    }
    setWaitlistEntries((prev) => [...prev, entry])
    return { success: true, entry }
  }

  async function claimWaitlistOffer(id: number) {
    const entry = waitlistEntries.find((w) => w.id === id)
    if (!entry) return { success: false, error: "Không tìm thấy suất chờ." }
    const uuid = crypto.randomUUID()
    try {
      const res = await waitlistService.claim(id, uuid)
      if (res.data) {
        const mapped = mapContractTicketToUiTicket(res.data as unknown as ContractTicket)
        setTickets((prev) => [mapped, ...prev])
      }
    } catch {
      // Fallback
    }
    setWaitlistEntries((prev) => prev.filter((w) => w.id !== id))
    return { success: true }
  }

  async function declineWaitlistOffer(id: number) {
    const uuid = crypto.randomUUID()
    try {
      await waitlistService.decline(id, uuid)
    } catch {
      // Fallback
    }
    setWaitlistEntries((prev) => prev.filter((w) => w.id !== id))
    return { success: true }
  }

  function checkIn(qrCode: string, eventId?: string): CheckInResult {
    const parsed = parseQrPayload(qrCode)
    const ticket = tickets.find(
      (t) =>
        t.qrCode === qrCode ||
        t.payload_qr === qrCode ||
        (parsed && (t.ma_ve_uuid === parsed.ma_ve_uuid || t.id === parsed.code)),
    )
    if (!ticket) {
      return { success: false, type: "not_found", message: "Mã vé không tồn tại." }
    }
    if (eventId && ticket.eventId !== eventId && String(ticket.ma_su_kien) !== eventId) {
      return { success: false, type: "wrong_event", message: "Vé này thuộc sự kiện khác." }
    }
    if (ticket.status === "attended" || ticket.trang_thai === "DaCheckIn") {
      return { success: false, type: "already_checked_in", message: "Vé đã được điểm danh trước đó." }
    }
    if (ticket.status === "cancelled" || ticket.trang_thai === "DaHuy") {
      return { success: false, type: "cancelled_ticket", message: "Vé đã bị hủy." }
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? { ...t, status: "attended", trang_thai: "DaCheckIn", checkinTime: "08:30" }
          : t,
      ),
    )
    return {
      success: true,
      type: "success",
      ticket,
      studentName: ticket.studentName,
      studentId: ticket.studentId,
      message: "Điểm danh check-in thành công!",
    }
  }

  function checkOut(qrCode: string, eventId?: string): CheckInResult {
    const parsed = parseQrPayload(qrCode)
    const ticket = tickets.find(
      (t) =>
        t.qrCode === qrCode ||
        t.payload_qr === qrCode ||
        (parsed && (t.ma_ve_uuid === parsed.ma_ve_uuid || t.id === parsed.code)),
    )
    if (!ticket) {
      return { success: false, type: "not_found", message: "Mã vé không tồn tại." }
    }
    if (eventId && ticket.eventId !== eventId && String(ticket.ma_su_kien) !== eventId) {
      return { success: false, type: "wrong_event", message: "Vé này thuộc sự kiện khác." }
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? { ...t, checkoutTime: "11:30", trang_thai: "DaCheckOut" }
          : t,
      ),
    )
    return {
      success: true,
      type: "success",
      ticket,
      studentName: ticket.studentName,
      studentId: ticket.studentId,
      message: "Check-out thành công!",
    }
  }

  function getStudentPermissions(studentId: string) {
    return permissions.filter((p) => p.studentId === studentId)
  }

  function getEventPermissions(eventId: string) {
    return permissions.filter((p) => p.eventId === eventId)
  }

  function grantCheckinPermission(
    studentId: string,
    studentName: string,
    eventId: string,
    validFrom?: string,
    validUntil?: string,
  ): GrantPermissionResult {
    const newPerm: CheckInPermission = {
      id: `PERM-${Date.now()}`,
      studentId,
      studentName,
      eventId,
      status: "active",
      grantedAt: new Date().toLocaleString("vi-VN"),
      validFrom,
      validUntil,
    }
    setPermissions((prev) => [...prev, newPerm])
    return { success: true, permission: newPerm }
  }

  function revokePermission(permId: string): RevokePermissionResult {
    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, status: "revoked" } : p)),
    )
    return { success: true }
  }

  function suspendPermission(permId: string): RevokePermissionResult {
    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, status: "suspended" } : p)),
    )
    return { success: true }
  }

  function reactivatePermission(permId: string): RevokePermissionResult {
    setPermissions((prev) =>
      prev.map((p) => (p.id === permId ? { ...p, status: "active" } : p)),
    )
    return { success: true }
  }

  function submitAttendanceResults(eventId: string) {
    return { success: true }
  }

  function recognizeAttendance(recordId: string) {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: "recognized" } : r)),
    )
    return { success: true }
  }

  function requestAttendanceRevision(recordId: string, reason: string) {
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, status: "revision", adjustmentReason: reason } : r,
      ),
    )
    return { success: true }
  }

  function adjustAttendance(
    recordId: string,
    minutes: number,
    reason: string,
    evidence: string,
  ) {
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              validMinutes: minutes,
              adjustmentReason: reason,
              evidence,
              status: "recognized",
            }
          : r,
      ),
    )
    return { success: true }
  }

  function requestStudentReview(recordId: string, reason: string) {
    return { success: true }
  }

  async function manualOverrideAttendance(
    payload: ManualOverrideInput,
  ): Promise<ManualOverrideResult> {
    const targetId = payload.ma_dang_ky || (payload.ticketId ? Number(payload.ticketId) : undefined)
    if (!targetId) {
      return { success: false, error: "Không tìm thấy mã đăng ký để điều chỉnh." }
    }
    try {
      const res = await attendanceService.manualOverride({
        ma_dang_ky: targetId,
        trang_thai_moi: payload.trang_thai_moi,
        ti_le_drl_moi: payload.ti_le_drl_moi,
        ly_do: payload.ly_do,
      })
      setTickets((prev) =>
        prev.map((t) => {
          if (
            (payload.ma_dang_ky && t.ma_dang_ky === payload.ma_dang_ky) ||
            (payload.ticketId && t.id === payload.ticketId)
          ) {
            return {
              ...t,
              trang_thai: payload.trang_thai_moi,
              status: "attended",
              ti_le_drl: payload.ti_le_drl_moi,
              nghi_van_gian_lan: false,
              ma_thiet_bi_nghi_van: null,
              vi_pham_no_show: false,
            }
          }
          return t
        }),
      )
      return { success: true, data: res.data }
    } catch (e) {
      return { success: false, error: getApiErrorMessage(e) }
    }
  }

  return (
    <TicketDataContext.Provider
      value={{
        tickets,
        waitlistEntries,
        permissions,
        attendanceRecords,
        getUserActiveTicket,
        getActiveParticipants,
        getCheckedInCount,
        getStudentWaitlistEntries,
        registerEvent,
        cancelTicket,
        joinWaitlist,
        claimWaitlistOffer,
        declineWaitlistOffer,
        checkIn,
        checkOut,
        getStudentPermissions,
        getEventPermissions,
        grantCheckinPermission,
        revokePermission,
        suspendPermission,
        reactivatePermission,
        submitAttendanceResults,
        recognizeAttendance,
        requestAttendanceRevision,
        adjustAttendance,
        requestStudentReview,
        manualOverrideAttendance,
        ticketsLoading,
        ticketsError,
        refreshTickets,
      }}
    >
      {children}
    </TicketDataContext.Provider>
  )
}

export function useTicketData(): TicketDataContextType {
  const ctx = useContext(TicketDataContext)
  if (!ctx) {
    throw new Error("useTicketData must be used within a TicketDataProvider")
  }
  return ctx
}
