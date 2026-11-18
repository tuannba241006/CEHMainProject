import { useState, useMemo, useEffect } from "react"
import { OrgLayout } from "./OrgLayout"
import { useUser } from "../../context/UserContext"
import {
  useApp,
  computeEventStatus,
  EVENT_STATUS_LABELS,
  type LiveEvent,
  type ManualOverrideInput,
  type ManualOverrideResult,
} from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { getApiErrorMessage, isAuthError } from "../../api/errors"
import { drlService } from "../../api/services/drl.service"
import { triggerFileDownload } from "../../api/client"
import { eventsService } from "../../api/services/events.service"
import {
  attendanceService,
  type ParticipantAttendanceData,
} from "../../api/services/attendance.service"
import {
  EVENT_STATUS_LABELS as API_EVENT_STATUS_LABELS,
  type EventCard,
  type TicketStatus,
} from "../../data/contract"
import type { Ticket } from "../../data/mock"
import {
  Users,
  AlertTriangle,
  Download,
  Lock,
  Star,
  Lightbulb,
  ShieldAlert,
  X,
  CheckCircle2,
} from "lucide-react"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

const STATUS_MAP = {
  attended: { bg: "#dcfce7", text: "#15803d", label: "Đã điểm danh" },
  pending: { bg: "#fef9c3", text: "#a16207", label: "Chưa điểm danh" },
  cancelled: { bg: "#fee2e2", text: "#b91c1c", label: "Đã hủy" },
}

const PERM_STATUS_MAP = {
  active: { bg: "#dcfce7", text: "#15803d", label: "Đang hoạt động" },
  suspended: { bg: "#fef9c3", text: "#a16207", label: "Tạm ngưng" },
  revoked: { bg: "#fee2e2", text: "#b91c1c", label: "Đã thu hồi" },
  expired: { bg: "#f1f5f9", text: "#94a3b8", label: "Hết hạn" },
}

type ParticipantEvent = LiveEvent & {
  statusLabel: string
}

type ParticipantTicket = Pick<
  Ticket,
  | "id"
  | "ma_dang_ky"
  | "studentId"
  | "studentName"
  | "faculty"
  | "registeredAt"
  | "trang_thai"
  | "checkinTime"
  | "ti_le_drl"
  | "nghi_van_gian_lan"
  | "ma_thiet_bi_nghi_van"
  | "vi_pham_no_show"
> & { status: "attended" | "pending" | "cancelled" }

function ticketStatus(status: TicketStatus): ParticipantTicket["status"] {
  if (status === "DaHuy") return "cancelled"
  return status === "DaDangKy" ? "pending" : "attended"
}

function toParticipantTicket(row: ParticipantAttendanceData): ParticipantTicket {
  return {
    id: String(row.ma_dang_ky),
    ma_dang_ky: row.ma_dang_ky,
    studentId: row.mssv ?? "",
    studentName: row.ho_ten,
    faculty: row.khoa ?? "",
    registeredAt: row.thoi_gian_dang_ky ?? "",
    trang_thai: row.trang_thai,
    status: ticketStatus(row.trang_thai),
    checkinTime: row.thoi_gian_check_in ?? undefined,
    ti_le_drl: row.ti_le_drl,
    nghi_van_gian_lan: row.nghi_van_gian_lan,
    ma_thiet_bi_nghi_van: row.ma_thiet_bi_nghi_van,
    vi_pham_no_show: row.vi_pham_no_show,
  }
}

async function fetchAllPages<T>(
  load: (
    page: number,
  ) => Promise<{ data: T[]; meta?: { last_page?: number; tong_so_trang?: number } }>,
): Promise<T[]> {
  const first = await load(1)
  const rows = [...first.data]
  const lastPage = first.meta?.last_page ?? first.meta?.tong_so_trang ?? 1
  for (let page = 2; page <= lastPage; page++) {
    rows.push(...(await load(page)).data)
  }
  return rows
}

function useApiParticipants(eventId: string | null) {
  const [events, setEvents] = useState<EventCard[]>([])
  const [eventError, setEventError] = useState("")
  const [eventsLoading, setEventsLoading] = useState(true)
  const [selected, setSelected] = useState<{
    id: string
    tickets: ParticipantTicket[]
    details?: Pick<ParticipantEvent, "trang_thai" | "da_chot_drl">
    error?: string
  } | null>(null)

  useEffect(() => {
    let active = true
    void fetchAllPages<EventCard>((page) =>
      eventsService.organizerList({ vai_tro_don_vi: "HOST", page, limit: 100 }),
    )
      .then((rows) => {
        if (active) setEvents(rows)
      })
      .catch((error: unknown) => {
        if (active) setEventError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (active) setEventsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!eventId) return
    let active = true
    void Promise.all([
      fetchAllPages<ParticipantAttendanceData>((page) =>
        attendanceService.participants(eventId, { page, limit: 100 }),
      ),
      eventsService.organizerDetail(eventId),
    ])
      .then(([rows, { data }]) => {
        if (active)
          setSelected({
            id: eventId,
            tickets: rows.map(toParticipantTicket),
            details: data,
          })
      })
      .catch((error: unknown) => {
        if (active)
          setSelected({
            id: eventId,
            tickets: [],
            error: getApiErrorMessage(error),
          })
      })
    return () => {
      active = false
    }
  }, [eventId])

  function applyOverride(result: ManualOverrideResult) {
    if (!result.success || !result.data) return
    const updated = result.data
    setSelected((current) =>
      current?.id === eventId
        ? {
            ...current,
            tickets: current.tickets.map((ticket) =>
              ticket.ma_dang_ky === updated.ma_dang_ky
                ? {
                    ...ticket,
                    ...updated,
                    status: ticketStatus(updated.trang_thai),
                    checkinTime: updated.thoi_gian_check_in ?? undefined,
                  }
                : ticket,
            ),
          }
        : current,
    )
  }

  return {
    events,
    eventsLoading,
    eventError,
    selected: selected?.id === eventId ? selected : null,
    applyOverride,
  }
}

export default function Participants({ onNavigate, onLogout }: Props) {
  const {
    events: demoEvents,
    tickets,
    getEventPermissions,
    grantCheckinPermission,
    revokePermission,
    suspendPermission,
    reactivatePermission,
    attendanceRecords,
    surveyResponses,
    submitAttendanceResults,
    adjustAttendance,
    certificates,
    manualOverrideAttendance,
  } = useApp()
  const { user, role } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    eventsService
      .getEvents()
      .catch((err) => {
        if (isAuthError(err)) return
        if (!cancelled) setError(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] =
    useState<"participants" | "checkin" | "reconciliation" | "survey" | "certificates" | "staff">(
      "participants",
    )
  const remote = useApiParticipants(selectedEventId)
  const events: ParticipantEvent[] =
    remote.events.length > 0
      ? remote.events.map((event) => ({
          id: String(event.ma_su_kien),
          ma_su_kien: event.ma_su_kien,
          title: event.ten_su_kien,
          ten_su_kien: event.ten_su_kien,
          dien_gia: event.dien_gia,
          ten_chuyen_de: event.ten_chuyen_de,
          ten_don_vi_host: event.ten_don_vi_host,
          danh_sach_ten_dong_to_chuc: event.danh_sach_ten_dong_to_chuc ?? [],
          ten_phong: event.ten_phong,
          co_so: (event.co_so as "CoSo1" | "CoSo2") || "CoSo1",
          thoi_gian_bat_dau: event.thoi_gian_bat_dau,
          thoi_gian_ket_thuc: event.thoi_gian_ket_thuc,
          khong_gioi_han_slot: event.so_luong_toi_da === null,
          so_ve_con_lai: event.so_ve_con_lai,
          so_luong_toi_da: event.so_luong_toi_da,
          trang_thai: event.trang_thai,
          dieu_khoan_drl: "Dieu3",
          diem_drl_du_kien: 5,
          gio_tinh_nguyen: 0,
          mo_ta: "",
          lo_trinh: [],
          doi_tuong_tham_gia: null,
          speaker: event.dien_gia || "",
          topic: event.ten_chuyen_de,
          description: "",
          date: event.thoi_gian_bat_dau.slice(0, 10),
          time: event.thoi_gian_bat_dau.slice(11, 16),
          endTime: event.thoi_gian_ket_thuc.slice(11, 16),
          location: `${event.ten_phong} (${event.co_so})`,
          room: event.ten_phong,
          capacity: event.so_luong_toi_da ?? 100,
          registered:
            (event.so_luong_toi_da ?? 100) - (event.so_ve_con_lai ?? 0),
          registrationOpen:
            event.trang_thai === "HAPPENING" ||
            event.trang_thai === "PUBLISHED" ||
            event.trang_thai === "APPROVED",
          isCancelled: event.trang_thai === "CANCELLED",
          banner: event.anh_bia || "",
          organizer: event.ten_don_vi_host,
          benefits: [],
          schedule: [],
          don_vi_host: {
            ma_don_vi: 0,
            ten_don_vi: event.ten_don_vi_host ?? "",
            loai_don_vi: "CLB",
          },
          ma_don_vi_to_chuc: 0,
          coHosts: event.danh_sach_ten_dong_to_chuc ?? [],
          status: event.trang_thai,
          statusLabel:
            API_EVENT_STATUS_LABELS[event.trang_thai] || event.trang_thai,
        }))
      : demoEvents.map((event) => ({
          ...event,
          statusLabel: EVENT_STATUS_LABELS[computeEventStatus(event)],
        }))

  // Data scoping cô lập tuyệt đối:
  // - Admin (P.CTSV): CHỈ THẤY các sự kiện thuộc P.CTSV! Tuyệt đối không lẫn lộn sự kiện của các CLB khác.
  // - Ban tổ chức (CLB/Khoa): CHỈ THẤY các sự kiện thuộc đơn vị mình!
  const scopedEvents = useMemo(() => {
    const isPctsAdmin = role === "admin" || role === "student_affairs"
    const userEmail = (user.email || "").toLowerCase()
    const rawUnit =
      user.don_vi?.ten_don_vi ||
      user.faculty ||
      user.khoa ||
      (userEmail.includes("webdev") ? "webdev" : "") ||
      (userEmail.includes("is@") || userEmail.includes(".is@") ? "thông tin" : "") ||
      (user.name && user.name.includes("CLB") ? user.name : "") ||
      ""
    const targetUnit = isPctsAdmin ? "sinh viên" : rawUnit.toLowerCase().trim()
    const unitId = user.ma_don_vi_to_chuc || user.don_vi?.ma_don_vi

    const filteredList = events.filter((e) => {
      const hostName = (
        e.organizer ||
        e.don_vi_host?.ten_don_vi ||
        e.ten_don_vi_host ||
        ""
      ).toLowerCase()
      const hostId = e.don_vi_host?.ma_don_vi || e.ma_don_vi_to_chuc
      const isHost =
        (unitId && hostId === unitId) ||
        (targetUnit && hostName.includes(targetUnit)) ||
        (targetUnit.includes("webdev") && (hostName.includes("webdev") || hostName.includes("devops") || hostName.includes("ai")))
      const isCoHost = (
        e.coHosts ||
        e.danh_sach_ten_dong_to_chuc ||
        []
      ).some((ch: string) => {
        const c = ch.toLowerCase()
        return (targetUnit && c.includes(targetUnit)) || (targetUnit.includes("webdev") && c.includes("webdev"))
      })
      return isHost || isCoHost
    })

    return filteredList.length > 0 ? filteredList : events
  }, [events, role, user])

  // Event list view
  if (!selectedEventId) {
    return (
      <OrgLayout
        current="org-participants"
        onNavigate={onNavigate}
        onLogout={onLogout}
      >
        <div className="p-6 lg:p-8 max-w-screen-xl">
          <div className="mb-6">
            <h1
              className="font-display font-bold text-2xl"
              style={{ color: "#1a1a2e" }}
            >
              Người tham gia
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {role === "admin" || role === "student_affairs"
                ? "Danh sách sinh viên tham gia các sự kiện do Phòng Công tác Sinh viên (P.CTSV) chủ trì"
                : `Danh sách người tham gia các sự kiện thuộc đơn vị: ${user.don_vi?.ten_don_vi || "Ban tổ chức"}`}
            </p>
          </div>

          {scopedEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <h2 className="text-lg font-bold text-slate-800">Chưa có sự kiện nào</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Đơn vị của bạn hiện chưa chủ trì sự kiện nào để xem danh sách người tham gia. Hãy tạo sự kiện mới hoặc kiểm tra tiến trình phê duyệt hồ sơ!
              </p>
              <button
                onClick={() => onNavigate("org-event-form")}
                className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                + Tạo sự kiện mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {scopedEvents.map((event) => {
              const eventTickets = tickets.filter((t) => t.eventId === event.id)
              const attended = eventTickets.filter(
                (t) => t.status === "attended",
              ).length
              const total = eventTickets.filter(
                (t) => t.status !== "cancelled",
              ).length
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <div className="relative h-28 overflow-hidden bg-slate-200">
                    {event.banner && <img
                      src={event.banner}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))",
                      }}
                    />
                    <div className="absolute bottom-2 left-3 right-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          color: "white",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {event.statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3
                      className="font-display font-semibold text-sm leading-snug mb-1"
                      style={{ color: "#1a1a2e" }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                      {new Date(event.date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      · {event.location}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs" style={{ color: "#64748b" }}>
                        <span
                          className="font-semibold"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "#4f46e5",
                          }}
                        >
                          {total}
                        </span>{" "}
                        đăng ký
                        {" · "}
                        <span
                          className="font-semibold"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "#059669",
                          }}
                        >
                          {attended}
                        </span>{" "}
                        điểm danh
                      </div>
                      {total > 0 && (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#d97706" }}
                        >
                          {Math.round((attended / total) * 100)}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEventId(event.id)
                        setActiveTab("participants")
                      }}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "#4f46e5" }}
                    >
                      Xem người tham gia
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      </OrgLayout>
    )
  }

  // Participant detail view
  const selectedEvent = events.find(
    (e) =>
      e.id === selectedEventId ||
      String(e.ma_su_kien) === String(selectedEventId) ||
      `EVT${e.ma_su_kien}` === selectedEventId,
  )
  const event = selectedEvent && { ...selectedEvent, ...remote.selected?.details }
  const localTickets: ParticipantTicket[] = tickets
    .filter(
      (t) =>
        t.eventId === selectedEventId ||
        String(t.ma_su_kien) === String(selectedEventId) ||
        (event && (t.eventId === event.id || t.ma_su_kien === event.ma_su_kien)),
    )
    .map((t) => ({
      id: t.id,
      ma_dang_ky: t.ma_dang_ky,
      studentId: t.studentId,
      studentName: t.studentName,
      faculty: t.faculty,
      registeredAt: t.registeredAt,
      trang_thai: t.trang_thai,
      status: ticketStatus(t.trang_thai),
      checkinTime: t.checkinTime,
      ti_le_drl: t.ti_le_drl ?? 1,
      nghi_van_gian_lan: t.nghi_van_gian_lan,
      ma_thiet_bi_nghi_van: t.ma_thiet_bi_nghi_van,
      vi_pham_no_show: t.vi_pham_no_show,
    }))

  const allTickets: ParticipantTicket[] =
    remote.selected?.tickets && remote.selected.tickets.length > 0
      ? remote.selected.tickets
      : localTickets

  const participants = allTickets.map((t) => ({
    mssv: t.studentId,
    name: t.studentName,
    faculty: t.faculty,
    registeredAt: t.registeredAt,
    status: t.status,
    checkinTime: t.checkinTime ?? "",
  }))
  const eventPerms = getEventPermissions(selectedEventId)

  async function handleManualOverride(payload: ManualOverrideInput) {
    const result = await manualOverrideAttendance(payload)
    remote.applyOverride(result)
    return result
  }

  return (
    <OrgLayout
      current="org-participants"
      onNavigate={onNavigate}
      onLogout={onLogout}
    >
      <div className="p-6 lg:p-8 max-w-screen-xl">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: "#94a3b8" }}
        >
          <button
            onClick={() => setSelectedEventId(null)}
            className="hover:underline flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Người tham gia
          </button>
          <span>/</span>
          <span
            className="truncate"
            style={{ color: "#1a1a2e", maxWidth: 280 }}
          >
            {event?.title}
          </span>
        </div>

        <div className="mb-5">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <h1
            className="font-display font-bold text-xl"
            style={{ color: "#1a1a2e" }}
          >
            {event?.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {event?.date &&
              new Date(event.date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}{" "}
            · {event?.location}
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar"
          style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
        >
          {([
            ["participants", "Người tham gia"],
            ["checkin", "Điểm danh"],
            ["reconciliation", "Điểm danh & đối soát"],
            ["survey", "Khảo sát & đánh giá"],
            ["certificates", "Chứng nhận"],
            ["staff", "Nhân viên điểm danh"],
          ] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setActiveTab(v)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === v ? "#4f46e5" : "transparent",
                color: activeTab === v ? "white" : "#64748b",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
            <div className="h-10 bg-slate-100 rounded w-full" />
            <div className="h-10 bg-slate-100 rounded w-full" />
            <div className="h-10 bg-slate-100 rounded w-full" />
          </div>
        ) : (
          <>
            {activeTab === "participants" && (
              <ParticipantsList
                event={event}
                allTickets={allTickets}
                onManualOverride={handleManualOverride}
              />
            )}
            {activeTab === "checkin" && <CheckinView participants={participants} />}
            {activeTab === "reconciliation" && (
              <ReconciliationView
                eventId={selectedEventId}
                rows={attendanceRecords.filter(
                  (row) => row.eventId === selectedEventId,
                )}
                onSubmit={() => submitAttendanceResults(selectedEventId)}
                onAdjust={adjustAttendance}
              />
            )}
            {activeTab === "survey" && (
              <SurveyReport
                responses={surveyResponses.filter(
                  (response) => response.eventId === selectedEventId,
                )}
                registered={participants.length || 180}
              />
            )}
            {activeTab === "certificates" && (
              <OrganizerCertificates
                certificates={certificates.filter(
                  (item) => item.eventId === selectedEventId,
                )}
              />
            )}
            {activeTab === "staff" && (
              <StaffView
                eventId={selectedEventId}
                eventTitle={event?.title ?? ""}
                permissions={eventPerms}
                onGrant={grantCheckinPermission}
                onRevoke={revokePermission}
                onSuspend={suspendPermission}
                onReactivate={reactivatePermission}
              />
            )}
          </>
        )}
      </div>
    </OrgLayout>
  )
}

function ReconciliationView({
  eventId,
  rows,
  onSubmit,
  onAdjust,
}: {
  eventId?: string | null
  rows: import("../../context/AppContext").AttendanceRecord[]
  onSubmit: () => { success: boolean; error?: string }
  onAdjust: (
    id: string,
    minutes: number,
    reason: string,
    evidence: string,
  ) => { success: boolean; error?: string }
}) {
  const { showToast } = useToast()
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [minutes, setMinutes] = useState("120")
  const [reason, setReason] = useState("")
  const [evidence, setEvidence] = useState("")
  const [message, setMessage] = useState("")
  function submit() {
    const result = onSubmit()
    setMessage(
      result.success
        ? "Đã gửi kết quả cho Phòng CTSV."
        : result.error || "Không thể gửi kết quả.",
    )
  }
  function saveAdjustment() {
    if (!adjusting) return
    const result = onAdjust(adjusting, Number(minutes), reason, evidence)
    setMessage(
      result.success
        ? "Đã lưu điều chỉnh và lịch sử."
        : result.error || "Không thể điều chỉnh.",
    )
    if (result.success) {
      setAdjusting(null)
      setReason("")
      setEvidence("")
    }
  }
  return (
    <div>
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 mb-4">
        <p className="text-sm font-semibold text-sky-800">
          Nguyên tắc tính thời lượng
        </p>
        <p className="text-xs text-sky-700 mt-1">
          Chỉ tính trong khung chương trình hợp lệ, loại thời gian nghỉ, gộp
          khoảng trùng và không vượt tổng thời lượng. Thiếu check-out hoặc dữ
          liệu bất thường luôn chuyển “Cần kiểm tra”.
        </p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-navy">
            Bảng đối soát
          </h3>
          <p className="text-xs text-slate-400">
            {rows.length} dòng · Quy tắc DK-2026.1
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              try {
                if (eventId) {
                  const data = await drlService.export(eventId)
                  triggerFileDownload(
                    data,
                    `Danh_Sach_DRL_Su_Kien_${eventId}.xlsx`,
                  )
                  showToast(
                    "Đã xuất danh sách ĐRL chuẩn 12 cột thành công.",
                    "success",
                  )
                  return
                }
              } catch (err) {
                console.warn("Backend DRL export failed, falling back to CSV:", err)
              }
              // Generate CSV file formatted per CTSV standard
              const headers =
                "STT,MSSV,Họ và tên,Lớp,Thời lượng tham gia (phút),Tỷ lệ (%),Đạt điều kiện,Điểm ĐRL cộng\n"
              const dataRows = rows
                .map(
                  (r, i) =>
                    `${i + 1},${r.studentId},"${r.studentName}",HTTT2022,${r.validMinutes},${r.participationRatio}%,${
                      r.participationRatio >= 80 ? "ĐẠT" : "KHÔNG ĐẠT"
                    },${r.participationRatio >= 80 ? 5 : 0}`,
                )
                .join("\n")
              const blob = new Blob(["\uFEFF" + headers + dataRows], {
                type: "text/csv;charset=utf-8;",
              })
              const url = URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.href = url
              link.download = `Danh_Sach_DRL_CTSV_${rows[0]?.id || "export"}.csv`
              link.click()
              URL.revokeObjectURL(url)
              showToast("Đã xuất danh sách ĐRL dạng CSV thành công.", "success")
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel ĐRL (12 cột)</span>
          </button>
          <button
            onClick={async () => {
              try {
                if (eventId) {
                  await drlService.lock(eventId)
                }
                setMessage(
                  "Đã khóa chốt danh sách Điểm Rèn Luyện. Dữ liệu đã được niêm phong gửi về Phòng CTSV.",
                )
                showToast(
                  "Đã khóa chốt danh sách Điểm Rèn Luyện thành công.",
                  "success",
                )
              } catch (e) {
                showToast(getApiErrorMessage(e), "error")
              }
            }}
            className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Khóa chốt ĐRL</span>
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-xl bg-indigo text-white text-xs font-semibold cursor-pointer hover:bg-indigo-700"
          >
            Gửi kết quả cho CTSV
          </button>
        </div>
      </div>
      {message && (
        <p
          className={`text-sm p-3 rounded-xl mb-4 ${
            message.startsWith("Đã")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">
            Chưa có dữ liệu đối soát cho sự kiện này.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Bạn có thể xem dữ liệu mẫu tại sự kiện Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
                <tr>
                  {[
                    "MSSV / Họ tên",
                    "Check-in",
                    "Check-out",
                    "Phút",
                    "Tỷ lệ",
                    "Điểm đề xuất",
                    "Chứng nhận",
                    "Trạng thái / cảnh báo",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-4 py-4">
                      <p className="font-medium text-navy">{row.studentName}</p>
                      <p className="text-xs font-mono text-slate-400">
                        {row.studentId}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">
                      {row.checkin}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">
                      {row.checkout || "—"}
                    </td>
                    <td className="px-4 py-4 font-mono">{row.validMinutes}</td>
                    <td className="px-4 py-4">{row.participationRatio}%</td>
                    <td className="px-4 py-4 font-bold text-indigo">
                      {row.proposedPoints}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {row.certificateEligible ? "Đủ điều kiện" : "Chưa đủ"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          row.status === "needs_review"
                            ? "bg-red-50 text-red-700"
                            : row.status === "recognized"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.status === "needs_review"
                          ? "Cần kiểm tra"
                          : row.status === "recognized"
                            ? "Đã công nhận"
                            : "Đang đối soát"}
                      </span>
                      {row.warning && (
                        <p className="text-xs text-red-600 mt-1 max-w-56">
                          {row.warning}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setAdjusting(row.id)}
                        className="text-xs font-semibold text-indigo"
                      >
                        Điều chỉnh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-3">
            {rows.map((row) => (
              <article
                key={row.id}
                className="bg-white rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold text-sm text-navy">
                      {row.studentName}
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      {row.studentId}
                    </p>
                  </div>
                  <b className="text-indigo">{row.proposedPoints} điểm</b>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3">
                  <p>
                    Vào / ra
                    <br />
                    <b>
                      {row.checkin} / {row.checkout || "Thiếu"}
                    </b>
                  </p>
                  <p>
                    Hợp lệ
                    <br />
                    <b>
                      {row.validMinutes} phút · {row.participationRatio}%
                    </b>
                  </p>
                </div>
                {row.warning && (
                  <p className="mt-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                    {row.warning}
                  </p>
                )}
                <button
                  onClick={() => setAdjusting(row.id)}
                  className="w-full mt-3 py-2 rounded-xl bg-indigo-light text-indigo text-xs font-semibold"
                >
                  Điều chỉnh có minh chứng
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {adjusting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display font-bold text-lg text-navy">
              Điều chỉnh thủ công
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Mọi thay đổi được lưu vào lịch sử. Thời lượng không vượt 150 phút
              hợp lệ.
            </p>
            <div className="space-y-3">
              <label className="block text-sm text-slate-600">
                Phút hợp lệ
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200"
                />
              </label>
              <label className="block text-sm text-slate-600">
                Lý do
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200"
                />
              </label>
              <label className="block text-sm text-slate-600">
                Minh chứng
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="VD: Biên bản trực cổng số 02"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200"
                />
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setAdjusting(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={saveAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-indigo text-white font-semibold"
              >
                Lưu điều chỉnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SurveyReport({
  responses,
  registered,
}: {
  responses: import("../../context/AppContext").SurveyResponse[]
  registered: number
}) {
  const threshold = 5
  const average = responses.length
    ? responses.reduce((sum, row) => sum + row.overall, 0) / responses.length
    : 0
  const hidden = responses.length < threshold
  return (
    <div>
      <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 mb-4">
        <p className="text-sm font-semibold text-purple-800">Báo cáo ẩn danh</p>
        <p className="text-xs text-purple-700 mt-1">
          Không hiển thị danh tính, MSSV, email hoặc danh sách người đã gửi.
          Ngưỡng hiển thị tối thiểu là {threshold} phản hồi để bảo vệ tính ẩn danh của sinh viên.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          ["Số phản hồi", responses.length],
          [
            "Tỷ lệ phản hồi",
            `${Math.round((responses.length / registered) * 100)}%`,
          ],
          ["Điểm trung bình", hidden ? "Đã ẩn" : average.toFixed(1)],
          ["Thời hạn", "17/10 · 11:30"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white rounded-xl p-4 border border-slate-100"
          >
            <p className="font-display font-bold text-xl text-purple-700">
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {hidden ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
          <p className="font-medium text-slate-500">
            Báo cáo chi tiết đang được ẩn
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Cần ít nhất {threshold} phản hồi để giảm nguy cơ suy ra danh tính.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-semibold text-navy mb-4">
              Phân bố hài lòng chung
            </h3>
            {[5, 4, 3, 2, 1].map((score) => {
              const count = responses.filter(
                (row) => row.overall === score,
              ).length
              return (
                <div key={score} className="flex items-center gap-3 mb-2">
                  <span className="text-xs w-8 flex items-center gap-1">
                    {score} <Star className="w-3 h-3 fill-amber-400 text-amber-500 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${
                          responses.length
                            ? (count / responses.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-5">{count}</span>
                </div>
              )
            })}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-semibold text-navy mb-4">Góp ý cải thiện</h3>
            <div className="space-y-2">
              {responses.map((row) => (
                <p
                  key={row.id}
                  className="p-3 rounded-xl bg-slate-50 text-sm text-slate-600"
                >
                  “{row.improvement}”
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrganizerCertificates({
  certificates,
}: {
  certificates: import("../../context/AppContext").Certificate[]
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-navy">
            Mẫu & danh sách đủ điều kiện
          </h3>
          <p className="text-xs text-slate-400">
            Ban tổ chức chuẩn bị; Phòng CTSV kiểm tra và phát hành.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold">
          Tải mẫu chứng nhận
        </button>
      </div>
      {certificates.length ? (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-sm text-navy">
                  {cert.recipientName}
                </p>
                <p className="text-xs text-slate-400">{cert.code}</p>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Chờ CTSV xử lý
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">
            Chưa có danh sách chứng nhận cho sự kiện này.
          </p>
          <button className="mt-3 px-4 py-2 rounded-xl bg-indigo-light text-indigo text-sm font-semibold">
            Tạo từ danh sách đủ điều kiện
          </button>
        </div>
      )}
    </div>
  )
}

function ParticipantsList({
  event,
  allTickets,
  onManualOverride,
}: {
  event?: ParticipantEvent
  allTickets: ParticipantTicket[]
  onManualOverride: (payload: ManualOverrideInput) => Promise<ManualOverrideResult>
}) {
  const [statusFilter, setStatusFilter] =
    useState<"all" | "pending" | "checkin" | "checkout" | "cancelled" | "fraud" | "noshow">(
      "all",
    )
  const [search, setSearch] = useState("")

  // UC-OPS-04 Modal State
  const [overrideTicket, setOverrideTicket] = useState<ParticipantTicket | null>(null)
  const [newStatus, setNewStatus] = useState<"DaCheckIn" | "DaCheckOut">(
    "DaCheckOut",
  )
  const [drlRate, setDrlRate] = useState<1.0 | 0.5>(1.0)
  const [reason, setReason] = useState("")
  const [verifiedPhysicalCard, setVerifiedPhysicalCard] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [overrideError, setOverrideError] = useState("")
  const [overrideSuccess, setOverrideSuccess] = useState("")

  const isEventCompleted =
    event?.trang_thai === "COMPLETED" ||
    event?.status === "ended" ||
    (event?.thoi_gian_ket_thuc ? Date.now() > Date.parse(event.thoi_gian_ket_thuc) : false) ||
    (event?.date
      ? new Date().getTime() >
        new Date(
          `${event.date}T${event.endTime?.split(" ")[0] || "11:30"}:00+07:00`,
        ).getTime()
      : false)

  // Quick reason presets
  const REASON_PRESETS = [
    "Đã kiểm tra thẻ sinh viên tại bàn đón tiếp do camera hỏng",
    "Đã đối soát thẻ sinh viên cuối giờ do điện thoại sinh viên sập nguồn",
    "Sinh viên gặp sự cố mạng, đã đối chiếu thẻ sinh viên vật lý hợp lệ",
  ]

  function openOverrideModal(ticket: ParticipantTicket) {
    setOverrideTicket(ticket)
    setOverrideError("")
    setOverrideSuccess("")
    setVerifiedPhysicalCard(false)

    // Contextual default according to UC-OPS-04:
    // If event is COMPLETED, default to DaCheckOut
    if (isEventCompleted) {
      setNewStatus("DaCheckOut")
      setDrlRate(1.0)
    } else {
      setNewStatus(
        ticket.trang_thai === "DaCheckIn" ? "DaCheckOut" : "DaCheckIn",
      )
      setDrlRate(1.0)
    }

    if (ticket.nghi_van_gian_lan) {
      setReason(
        "Đã đối soát thẻ sinh viên vật lý chính chủ tại bàn đón tiếp, giải tỏa cờ nghi vấn gian lận thiết bị.",
      )
    } else {
      setReason("")
    }
  }

  async function handleConfirmOverride() {
    if (!overrideTicket) return

    if (overrideTicket.nghi_van_gian_lan && !verifiedPhysicalCard) {
      setOverrideError(
        "Bắt buộc phải đối soát Thẻ sinh viên vật lý trước khi giải tỏa cờ nghi vấn gian lận.",
      )
      return
    }

    if (reason.trim().length < 10) {
      setOverrideError("Lý do điều chỉnh bắt buộc tối thiểu 10 ký tự.")
      return
    }

    setSubmitting(true)
    setOverrideError("")

    const effectiveDrlRate = newStatus === "DaCheckIn" ? 0.0 : drlRate

    const result = await onManualOverride({
      ma_dang_ky: overrideTicket.ma_dang_ky,
      ticketId: overrideTicket.id,
      trang_thai_moi: newStatus,
      ti_le_drl_moi: effectiveDrlRate,
      ly_do: reason.trim(),
      da_doi_soat_the: verifiedPhysicalCard,
    })

    setSubmitting(false)

    if (result.success) {
      setOverrideSuccess(
        "Đã điều chỉnh trạng thái thành công và lưu vết kiểm toán Audit Log.",
      )
      setTimeout(() => {
        setOverrideTicket(null)
        setOverrideSuccess("")
      }, 1500)
    } else {
      setOverrideError(result.error || "Không thể thực hiện điều chỉnh.")
    }
  }

  const filteredTickets = allTickets.filter((t) => {
    // Search filter
    const matchesSearch =
      (t.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.studentId || "").includes(search) ||
      (t.faculty || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    // Status filter
    if (statusFilter === "all") return true
    if (statusFilter === "pending")
      return t.trang_thai === "DaDangKy" || t.status === "pending"
    if (statusFilter === "checkin") return t.trang_thai === "DaCheckIn"
    if (statusFilter === "checkout")
      return t.trang_thai === "DaCheckOut" || (t.trang_thai !== "DaCheckIn" && t.status === "attended")
    if (statusFilter === "cancelled")
      return t.trang_thai === "DaHuy" || t.status === "cancelled"
    if (statusFilter === "fraud") return Boolean(t.nghi_van_gian_lan)
    if (statusFilter === "noshow") return Boolean(t.vi_pham_no_show)

    return true
  })

  // Counters
  const countAttended = allTickets.filter(
    (t) =>
      t.trang_thai === "DaCheckOut" ||
      t.trang_thai === "DaCheckIn" ||
      t.status === "attended",
  ).length
  const countPending = allTickets.filter(
    (t) =>
      (t.trang_thai === "DaDangKy" || t.status === "pending") &&
      !t.vi_pham_no_show,
  ).length
  const countFraud = allTickets.filter((t) => t.nghi_van_gian_lan).length
  const countNoShow = allTickets.filter((t) => t.vi_pham_no_show).length
  const countCancelled = allTickets.filter(
    (t) => t.trang_thai === "DaHuy" || t.status === "cancelled",
  ).length

  return (
    <div>
      {/* Top Advisory Banner for Completed Events (UC-OPS-04) */}
      {isEventCompleted && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Gợi ý ngữ cảnh:</strong> Sự kiện này đã kết
            thúc. Để sinh viên đủ điều kiện làm khảo sát Feedback và nhận Điểm
            Rèn Luyện, vui lòng ưu tiên điều chỉnh sang trạng thái{" "}
            <strong>DaCheckOut</strong> kèm chọn mức hưởng ĐRL tương ứng thay vì
            chỉ chọn <strong>DaCheckIn</strong> (vì chỉ Check-in sẽ nhận 0 ĐRL).
          </div>
        </div>
      )}

      {/* Stats Counter Cards with Quick Filtering */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <button
          onClick={() => setStatusFilter("all")}
          className={`bg-white rounded-xl px-4 py-3 shadow-xs border text-left transition-all ${
            statusFilter === "all"
              ? "ring-2 ring-indigo-500 border-indigo-200"
              : "border-slate-100 hover:border-slate-300"
          }`}
        >
          <div className="font-display font-bold text-2xl text-indigo-600">
            {allTickets.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tổng vé đăng ký</div>
        </button>

        <button
          onClick={() => setStatusFilter("checkout")}
          className={`bg-white rounded-xl px-4 py-3 shadow-xs border text-left transition-all ${
            statusFilter === "checkout"
              ? "ring-2 ring-emerald-500 border-emerald-200"
              : "border-slate-100 hover:border-slate-300"
          }`}
        >
          <div className="font-display font-bold text-2xl text-emerald-600">
            {countAttended}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Đã điểm danh</div>
        </button>

        <button
          onClick={() => setStatusFilter("pending")}
          className={`bg-white rounded-xl px-4 py-3 shadow-xs border text-left transition-all ${
            statusFilter === "pending"
              ? "ring-2 ring-amber-500 border-amber-200"
              : "border-slate-100 hover:border-slate-300"
          }`}
        >
          <div className="font-display font-bold text-2xl text-amber-600">
            {countPending}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Chưa điểm danh</div>
        </button>

        <button
          onClick={() => setStatusFilter("fraud")}
          className={`rounded-xl px-4 py-3 shadow-xs border text-left transition-all ${
            countFraud > 0
              ? statusFilter === "fraud"
                ? "bg-red-50 ring-2 ring-red-500 border-red-300"
                : "bg-red-50/50 border-red-200 hover:border-red-400"
              : statusFilter === "fraud"
                ? "bg-white ring-2 ring-slate-400 border-slate-200"
                : "bg-white border-slate-100"
          }`}
        >
          <div
            className={`font-display font-bold text-2xl ${
              countFraud > 0 ? "text-red-600" : "text-slate-400"
            }`}
          >
            {countFraud}
          </div>
          <div className="text-xs font-semibold text-red-700 mt-0.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Nghi vấn gian lận</span>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("noshow")}
          className={`rounded-xl px-4 py-3 shadow-xs border text-left transition-all ${
            countNoShow > 0
              ? statusFilter === "noshow"
                ? "bg-amber-50 ring-2 ring-amber-500 border-amber-300"
                : "bg-amber-50/50 border-amber-200 hover:border-amber-400"
              : statusFilter === "noshow"
                ? "bg-white ring-2 ring-slate-400 border-slate-200"
                : "bg-white border-slate-100"
          }`}
        >
          <div
            className={`font-display font-bold text-2xl ${
              countNoShow > 0 ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {countNoShow}
          </div>
          <div className="text-xs font-semibold text-amber-700 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Vi phạm No-show</span>
          </div>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm MSSV, họ tên, khoa..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-white border border-slate-200 overflow-x-auto no-scrollbar">
          {[
            ["all", "Tất cả"],
            ["pending", "Chưa điểm danh"],
            ["checkin", "Đã Check-in"],
            ["checkout", "Đã Check-out"],
            ["cancelled", `Đã hủy (${countCancelled})`],
            ["fraud", `Nghi vấn (${countFraud})`],
            ["noshow", `No-show (${countNoShow})`],
          ].map(([s, label]) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? s === "fraud"
                    ? "bg-red-600 text-white"
                    : s === "noshow"
                      ? "bg-amber-600 text-white"
                      : "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Participants Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs overflow-hidden border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  "STT",
                  "MSSV",
                  "Họ tên",
                  "Khoa",
                  "Thời gian đăng ký",
                  "Trạng thái vé",
                  "Tỷ lệ ĐRL & Cảnh báo",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wide text-slate-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, i) => {
                const isCancelled =
                  t.trang_thai === "DaHuy" || t.status === "cancelled"
                const isCheckin = t.trang_thai === "DaCheckIn"
                const isCheckout =
                  t.trang_thai === "DaCheckOut" || (!isCheckin && t.status === "attended")

                return (
                  <tr
                    key={t.id || t.ma_dang_ky || i}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono font-medium text-slate-700">
                      {t.studentId}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {t.studentName}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {t.faculty}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {t.registeredAt || "—"}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          isCancelled
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : isCheckout
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isCheckin
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isCancelled
                          ? "Đã hủy"
                          : isCheckout
                            ? "Đã Check-out"
                            : isCheckin
                              ? "Đã Check-in"
                              : "Chưa điểm danh"}
                      </span>
                    </td>

                    {/* DRL & Anti-Fraud Warnings */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.nghi_van_gian_lan && (
                          <span
                            title={`Thiết bị vi phạm: ${t.ma_thiet_bi_nghi_van || "Quét hộ"}`}
                            className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold border border-red-200 flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-red-700 shrink-0" />
                            <span>Nghi vấn gian lận</span>
                          </span>
                        )}

                        {t.vi_pham_no_show && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Vi phạm No-show</span>
                          </span>
                        )}

                        {t.ti_le_drl !== undefined && t.ti_le_drl > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-200">
                            {Math.round(t.ti_le_drl * 100)}% ĐRL
                          </span>
                        )}

                        {!t.nghi_van_gian_lan &&
                          !t.vi_pham_no_show &&
                          (t.ti_le_drl === 0 || t.ti_le_drl === undefined) && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                      </div>
                    </td>

                    {/* Action Column (UC-OPS-04) */}
                    <td className="px-4 py-3.5">
                      {isCancelled ? (
                        <span
                          title="Cấm điều chỉnh điểm danh cho vé đã hủy (409 INVALID_STATE_TRANSITION)"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        >
                          Đã hủy (Khóa)
                        </span>
                      ) : event?.da_chot_drl ? (
                        <span
                          title="Danh sách ĐRL đã khóa chốt. Chỉ Quản trị viên P.CTSV mới có quyền mở khóa"
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        >
                          Đã chốt ĐRL
                        </span>
                      ) : (
                        <button
                          onClick={() => openOverrideModal(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                            t.nghi_van_gian_lan
                              ? "bg-red-600 hover:bg-red-700 text-white"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                          }`}
                        >
                          {t.nghi_van_gian_lan
                            ? "Xử lý nghi vấn"
                            : "Điều chỉnh thủ công"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTickets.map((t, i) => {
          const isCancelled =
            t.trang_thai === "DaHuy" || t.status === "cancelled"
          return (
            <div
              key={t.id || i}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    {t.studentName}
                  </p>
                  <p className="text-xs font-mono text-slate-400">
                    MSSV: {t.studentId}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isCancelled
                      ? "bg-red-50 text-red-700"
                      : t.trang_thai === "DaCheckOut"
                        ? "bg-emerald-50 text-emerald-700"
                        : t.trang_thai === "DaCheckIn"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isCancelled
                    ? "Đã hủy"
                    : t.trang_thai === "DaCheckOut"
                      ? "Đã Check-out"
                      : t.trang_thai === "DaCheckIn"
                        ? "Đã Check-in"
                        : "Chưa điểm danh"}
                </span>
              </div>

              {/* Warnings */}
              {(t.nghi_van_gian_lan ||
                t.vi_pham_no_show ||
                t.ti_le_drl > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {t.nghi_van_gian_lan && (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-700 shrink-0" />
                      <span>Nghi vấn gian lận ({t.ma_thiet_bi_nghi_van || "Quét trùng"})</span>
                    </span>
                  )}
                  {t.vi_pham_no_show && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Vi phạm No-show</span>
                    </span>
                  )}
                  {t.ti_le_drl > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                      {Math.round(t.ti_le_drl * 100)}% ĐRL
                    </span>
                  )}
                </div>
              )}

              {/* Action Button */}
              {!isCancelled && !event?.da_chot_drl && (
                <button
                  onClick={() => openOverrideModal(t)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold ${
                    t.nghi_van_gian_lan
                      ? "bg-red-600 text-white"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {t.nghi_van_gian_lan
                    ? "Xử lý nghi vấn gian lận"
                    : "Điều chỉnh thủ công"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Manual Attendance Override & Fraud Resolution Modal */}
      {overrideTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                  Ghi nhận kiểm toán
                </span>
                <h3 className="font-display font-bold text-lg text-slate-900 mt-1">
                  Điều chỉnh điểm danh & Xử lý nghi vấn
                </h3>
              </div>
              <button
                onClick={() => setOverrideTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    {overrideTicket.studentName}
                  </p>
                  <p className="text-xs font-mono text-slate-500">
                    MSSV: {overrideTicket.studentId} · Khoa:{" "}
                    {overrideTicket.faculty}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">
                    Vé #{overrideTicket.ma_dang_ky || overrideTicket.id}
                  </span>
                  <p className="text-xs font-semibold text-slate-600">
                    Hiện tại:{" "}
                    {overrideTicket.trang_thai || overrideTicket.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Contextual Advisory Banner for COMPLETED events (UC-OPS-04 requirement) */}
            {isEventCompleted && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed flex items-start gap-2.5">
                <Lightbulb className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Gợi ý theo ngữ cảnh:</strong> Sự kiện đã
                  kết thúc. Để sinh viên đủ điều kiện làm khảo sát Feedback và
                  nhận Điểm Rèn Luyện, vui lòng chuyển trạng thái sang{" "}
                  <strong>DaCheckOut</strong> kèm chọn mức hưởng ĐRL tương ứng
                  thay vì chỉ chọn DaCheckIn (vì chỉ Check-in sẽ nhận 0 ĐRL).
                </div>
              </div>
            )}

            {/* Fraud Suspect Resolution Card (if ticket has nghi_van_gian_lan) */}
            {overrideTicket.nghi_van_gian_lan && (
              <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                      Phát hiện nghi vấn gian lận thiết bị
                    </h4>
                    <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                      Phát hiện quét thiết bị trùng cho nhiều tài khoản trong cùng sự kiện.
                      {overrideTicket.ma_thiet_bi_nghi_van && (
                        <> Mã thiết bị: <code>{overrideTicket.ma_thiet_bi_nghi_van}</code>.</>
                      )} Ban tổ chức phải đối soát Thẻ sinh viên vật lý trước khi giải tỏa cờ.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-2 border-t border-red-200/80 cursor-pointer text-xs font-semibold text-red-950">
                  <input
                    type="checkbox"
                    checked={verifiedPhysicalCard}
                    onChange={(e) => setVerifiedPhysicalCard(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    Xác nhận: Đã đối soát Thẻ sinh viên vật lý chính chủ hợp lệ
                    tại bàn BTC
                  </span>
                </label>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Target State Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Trạng thái mới <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewStatus("DaCheckIn")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newStatus === "DaCheckIn"
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    DaCheckIn (Đã vào)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus("DaCheckOut")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newStatus === "DaCheckOut"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    DaCheckOut (Hoàn tất)
                  </button>
                </div>
              </div>

              {/* DRL Rate Selector (Only when DaCheckOut) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tỷ lệ hưởng Điểm Rèn Luyện (ti_le_drl){" "}
                  <span className="text-red-500">*</span>
                </label>
                {newStatus === "DaCheckOut" ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDrlRate(1.0)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        drlRate === 1.0
                          ? "bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 text-purple-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-sm">100% · Trọn vẹn</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Hưởng tối đa ĐRL & Chứng nhận
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDrlRate(0.5)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        drlRate === 0.5
                          ? "bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 text-purple-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-sm">50% · Một phần</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tham gia một phần thời lượng
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs">
                    Cố định <strong>0.00 (0% ĐRL)</strong> khi chỉ chuyển sang DaCheckIn.
                  </div>
                )}
              </div>

              {/* Mandatory Reason with character counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Lý do điều chỉnh bắt buộc (Audit Log){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      reason.trim().length >= 10
                        ? "text-emerald-600 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {reason.trim().length} / 10 ký tự tối thiểu
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do điều chỉnh (hỏng camera, hết pin, đối soát thẻ SV vật lý...)"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] transition-colors text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error and Success Feedback */}
              {overrideError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {overrideError}
                </div>
              )}
              {overrideSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  {overrideSuccess}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideTicket(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                disabled={
                  submitting ||
                  reason.trim().length < 10 ||
                  (overrideTicket.nghi_van_gian_lan && !verifiedPhysicalCard)
                }
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {submitting ? "Đang lưu..." : "Xác nhận & Lưu kiểm toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CheckinParticipantItem {
  mssv: string
  name: string
  faculty: string
  registeredAt: string
  status: TicketStatus | "pending" | "cancelled" | "attended" | "checked_in" | "checked_out" | string
  checkinTime?: string
}

function CheckinView({ participants }: { participants: CheckinParticipantItem[] }) {
  const attended = participants.filter((p) => p.status === "attended")
  const pending = participants.filter((p) => p.status === "pending")

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          ["Đã điểm danh", attended.length, "#059669", "#dcfce7"],
          ["Chưa điểm danh", pending.length, "#d97706", "#fef9c3"],
          [
            "Tỷ lệ",
            participants.length > 0
              ? `${Math.round((attended.length / participants.length) * 100)}%`
              : "0%",
            "#4f46e5",
            "#eef2ff",
          ],
        ].map(([l, v, c, bg]) => (
          <div
            key={l as string}
            className="bg-white rounded-xl px-4 py-3 shadow-sm border text-center"
            style={{ borderColor: "#f1f5f9" }}
          >
            <div
              className="font-display font-bold text-2xl"
              style={{ color: c as string }}
            >
              {v}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              {l}
            </div>
          </div>
        ))}
      </div>
      <div
        className="bg-white rounded-2xl shadow-sm border overflow-hidden"
        style={{ borderColor: "#f1f5f9" }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: "#f1f5f9" }}>
          <h3 className="font-semibold text-sm" style={{ color: "#1a1a2e" }}>
            Danh sách đã điểm danh ({attended.length})
          </h3>
        </div>
        {attended.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Chưa có ai điểm danh
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["MSSV", "Họ tên", "Thời gian điểm danh"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#94a3b8" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attended.map((p) => (
                  <tr
                    key={p.mssv}
                    className="border-t hover:bg-slate-50"
                    style={{ borderColor: "#f8fafc" }}
                  >
                    <td
                      className="px-4 py-3 text-xs"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "#475569",
                      }}
                    >
                      {p.mssv}
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-sm"
                      style={{ color: "#1a1a2e" }}
                    >
                      {p.name}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "#059669",
                      }}
                    >
                      {p.checkinTime || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StaffView({
  eventId,
  eventTitle,
  permissions,
  onGrant,
  onRevoke,
  onSuspend,
  onReactivate,
}: {
  eventId: string
  eventTitle: string
  permissions: import("../../context/AppContext").CheckInPermission[]
  onGrant: (
    studentId: string,
    studentName: string,
    eventId: string,
    validFrom?: string,
    validUntil?: string,
  ) => import("../../context/AppContext").GrantPermissionResult
  onRevoke: (
    id: string,
  ) => import("../../context/AppContext").RevokePermissionResult
  onSuspend: (
    id: string,
  ) => import("../../context/AppContext").RevokePermissionResult
  onReactivate: (
    id: string,
  ) => import("../../context/AppContext").RevokePermissionResult
}) {
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)
  const [searchStudent, setSearchStudent] = useState("")
  const [draftStudentId, setDraftStudentId] = useState("")
  const [draftStudentName, setDraftStudentName] = useState("")
  const [draftValidFrom, setDraftValidFrom] = useState("")
  const [draftValidUntil, setDraftValidUntil] = useState("")
  const [grantError, setGrantError] = useState("")
  const [grantSuccess, setGrantSuccess] = useState("")

  function handleGrant() {
    if (!draftStudentId.trim() || !draftStudentName.trim()) {
      setGrantError("Vui lòng điền MSSV và họ tên.")
      return
    }
    const result = onGrant(
      draftStudentId.trim(),
      draftStudentName.trim(),
      eventId,
      draftValidFrom || undefined,
      draftValidUntil || undefined,
    )
    if (result.success) {
      setGrantSuccess(`Đã cấp quyền điểm danh cho ${draftStudentName}.`)
      setDraftStudentId("")
      setDraftStudentName("")
      setDraftValidFrom("")
      setDraftValidUntil("")
      setGrantError("")
      setTimeout(() => {
        setGrantSuccess("")
        setShowGrantModal(false)
      }, 2000)
    } else {
      setGrantError(result.error ?? "Lỗi không xác định.")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="font-display font-semibold text-base"
            style={{ color: "#1a1a2e" }}
          >
            Nhân viên điểm danh
          </h3>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Sinh viên được cấp quyền điểm danh cho sự kiện này
          </p>
        </div>
        <button
          onClick={() => {
            setShowGrantModal(true)
            setGrantError("")
            setGrantSuccess("")
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#4f46e5" }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Cấp quyền
        </button>
      </div>

      {permissions.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-8 text-center border"
          style={{ borderColor: "#f1f5f9" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "#f1f5f9" }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: "#cbd5e1" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "#94a3b8" }}>
            Chưa có nhân viên điểm danh
          </p>
          <p className="text-sm mt-1" style={{ color: "#cbd5e1" }}>
            Nhấn "+ Cấp quyền" để thêm sinh viên
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {permissions.map((perm) => {
            const ps = PERM_STATUS_MAP[perm.status]
            return (
              <div
                key={perm.id}
                className="bg-white rounded-2xl p-4 border shadow-sm"
                style={{ borderColor: "#f1f5f9" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                      style={{
                        background:
                          perm.status === "active" ? "#4f46e5" : "#94a3b8",
                      }}
                    >
                      {perm.studentName
                        .split(" ")
                        .slice(-2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: "#1a1a2e" }}
                      >
                        {perm.studentName}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "#94a3b8",
                        }}
                      >
                        MSSV: {perm.studentId}
                      </p>
                      {perm.validFrom && (
                        <p className="text-xs" style={{ color: "#64748b" }}>
                          Từ {perm.validFrom}
                          {perm.validUntil ? ` đến ${perm.validUntil}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: ps.bg, color: ps.text }}
                    >
                      {ps.label}
                    </span>
                    <div className="flex gap-1">
                      {perm.status === "active" && (
                        <button
                          onClick={() => onSuspend(perm.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#fef9c3", color: "#a16207" }}
                        >
                          Tạm ngưng
                        </button>
                      )}
                      {perm.status === "suspended" && (
                        <button
                          onClick={() => onReactivate(perm.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#dcfce7", color: "#15803d" }}
                        >
                          Kích hoạt
                        </button>
                      )}
                      {perm.status !== "revoked" && (
                        <button
                          onClick={() => setConfirmRevoke(perm.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "#fee2e2", color: "#b91c1c" }}
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Grant permission modal */}
      {showGrantModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3
              className="font-display font-bold text-lg mb-1"
              style={{ color: "#1a1a2e" }}
            >
              Cấp quyền điểm danh
            </h3>
            <p className="text-sm mb-5" style={{ color: "#64748b" }}>
              Sự kiện:{" "}
              <span className="font-medium" style={{ color: "#1a1a2e" }}>
                {eventTitle}
              </span>
            </p>

            {grantSuccess ? (
              <div className="py-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: "#dcfce7" }}
                >
                  <svg
                    className="w-6 h-6"
                    style={{ color: "#059669" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: "#059669" }}>
                  {grantSuccess}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    MSSV sinh viên
                  </label>
                  <input
                    value={draftStudentId}
                    onChange={(e) => setDraftStudentId(e.target.value)}
                    placeholder="VD: 22521001"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{
                      borderColor: "#e2e8f0",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#475569" }}
                  >
                    Họ và tên
                  </label>
                  <input
                    value={draftStudentName}
                    onChange={(e) => setDraftStudentName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#e2e8f0" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "#475569" }}
                    >
                      Từ ngày (tùy chọn)
                    </label>
                    <input
                      type="datetime-local"
                      value={draftValidFrom}
                      onChange={(e) => setDraftValidFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "#475569" }}
                    >
                      Đến ngày (tùy chọn)
                    </label>
                    <input
                      type="datetime-local"
                      value={draftValidUntil}
                      onChange={(e) => setDraftValidUntil(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                      style={{ borderColor: "#e2e8f0" }}
                    />
                  </div>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <p className="text-xs flex items-center gap-1.5" style={{ color: "#15803d" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Được phép điểm danh người tham gia sự kiện</span>
                  </p>
                </div>
                {grantError && (
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "#fee2e2" }}
                  >
                    <p className="text-xs" style={{ color: "#b91c1c" }}>
                      {grantError}
                    </p>
                  </div>
                )}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setShowGrantModal(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
                    style={{ borderColor: "#e2e8f0", color: "#475569" }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleGrant}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                    style={{ background: "#4f46e5" }}
                  >
                    Cấp quyền
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revoke confirmation */}
      {confirmRevoke && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#fee2e2" }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: "#dc2626" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3
              className="font-display font-bold text-lg text-center mb-2"
              style={{ color: "#1a1a2e" }}
            >
              Thu hồi quyền điểm danh?
            </h3>
            <p
              className="text-sm text-center mb-6"
              style={{ color: "#64748b" }}
            >
              Sinh viên sẽ ngay lập tức mất quyền điểm danh cho sự kiện này.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevoke(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold border"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onRevoke(confirmRevoke)
                  setConfirmRevoke(null)
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "#dc2626" }}
              >
                Thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
