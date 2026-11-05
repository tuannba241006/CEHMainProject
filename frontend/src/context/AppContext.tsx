import { createContext, useContext, useState, useEffect } from "react"
import {
  EVENTS,
  TICKETS,
  CERTIFICATES,
  DRL_RECORDS,
  type Ticket,
  type Topic,
  type EventStatus as ContractEventStatus,
  type TicketStatus as ContractTicketStatus,
  type Certificate as ContractCertificate,
  type CertificatePublic,
  type DrlRecord,
  type WaitlistEntry,
  parseQrPayload,
} from "../data/mock"
import {
  INITIAL_NOTIFICATIONS,
  type Notification,
  type NotifType,
  type NotifAction,
} from "../data/notifications"
import type { UserData } from "./UserContext"
import { isApiMode } from "../api/config"
import { eventsService } from "../api/services/events.service"
import { bookingsService } from "../api/services/bookings.service"
import { ticketsService } from "../api/services/tickets.service"
import { waitlistService } from "../api/services/waitlist.service"
import { getApiErrorMessage } from "../api/errors"
import { notificationsService } from "../api/services/notifications.service"
import { attendanceService } from "../api/services/attendance.service"

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventStatus = "open" | "nearly_full" | "full" | "draft" | "closed" | "ended"

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

export interface LiveEvent {
  // Contract fields
  ma_su_kien: number
  ten_su_kien: string
  anh_bia?: string | null
  dien_gia?: string | null
  ten_chuyen_de: string
  ten_don_vi_host: string
  danh_sach_ten_dong_to_chuc: string[]
  ten_phong: string
  co_so: "CoSo1" | "CoSo2"
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  khong_gioi_han_slot: boolean
  so_ve_con_lai?: number | null
  so_luong_toi_da?: number | null
  trang_thai: ContractEventStatus
  dieu_khoan_drl: "KhongCo" | "Dieu3" | "Dieu4"
  diem_drl_du_kien: number
  gio_tinh_nguyen: number
  mo_ta: string
  lo_trinh: any[]
  doi_tuong_tham_gia?: string | null

  // Legacy & UI properties
  id: string
  title: string
  speaker: string
  topic: Topic
  description: string
  date: string
  time: string
  endTime: string
  location: string
  room: string
  capacity: number
  registered: number
  registrationOpen: boolean
  isCancelled: boolean
  banner: string
  organizer: string
  benefits: string[]
  schedule: { time: string; title: string }[]
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

export type ApprovalStatus = "draft" | "faculty_pending" | "faculty_revision" | "faculty_rejected" | "faculty_approved" | "affairs_pending" | "affairs_revision" | "affairs_rejected" | "approved"

export interface ApprovalHistory {
  id: string
  actor: string
  action: string
  at: string
  note?: string
}

export interface ApprovalCase {
  id: string
  eventId: string
  title: string
  unit: string
  faculty: string
  submitter: string
  submittedAt: string
  eventDate: string
  status: ApprovalStatus
  lifecycle: "draft" | "scheduled" | "registration_open" | "ended"
  description: string
  plan: string
  documents: string[]
  proposedPoints: number
  semester: string
  criteriaCode: string
  maxPoints: number
  validMinutes: number
  thresholds: Array<{ ratio: number; points: number }>
  requiredSessions: string[]
  certificateCondition: string
  ruleBasis: string
  ruleVersion: string
  facultyDecision?: string
  history: ApprovalHistory[]
}

export type ReconciliationStatus = "draft" | "needs_review" | "submitted" | "recognized" | "revision"

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
  history: ApprovalHistory[]
}

export interface SurveyResponse {
  id: string
  eventId: string
  studentId: string
  overall: number
  content: number
  organization: number
  venue: number
  useful: string
  improvement: string
  joinAgain: boolean
  submittedAt: string
}

export type CertificateStatus = "ineligible" | "pending" | "issued" | "revoked" | "replaced"

export interface Certificate {
  id: string
  code: string
  eventId: string
  eventTitle: string
  recipientName: string
  studentId: string
  issuer: string
  participantRole: string
  eventTime: string
  issuedAt?: string
  status: CertificateStatus
  replacedBy?: string
  replaces?: string
  revokeReason?: string

  // Contract & verify fields
  ma_hash?: string
  da_thu_hoi?: boolean
  ten_su_kien?: string
  don_vi_to_chuc?: string
  ngay_cap?: string
  ho_ten_che_mo?: string
  mssv_che_mo?: string
  vai_tro?: string
  nguoi_ky?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function computeEventStatus(e: LiveEvent): EventStatus {
  if (e.isCancelled) return "closed"
  if (!e.registrationOpen) return "closed"
  if (e.registered >= e.capacity) return "full"
  const ratio = (e.capacity - e.registered) / e.capacity
  if (ratio <= 0.2) return "nearly_full"
  return "open"
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  open: "Còn chỗ",
  nearly_full: "Sắp hết",
  full: "Hết chỗ",
  draft: "Bản nháp",
  closed: "Đã đóng",
  ended: "Đã kết thúc",
}

// ─── Seed permissions ─────────────────────────────────────────────────────────

// The check-in demo account has an event-scoped permission for EVT001.
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

let _permSeq = 1
function nextPermId() {
  return `PERM-${String(100 + _permSeq++).padStart(3, "0")}`
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_LIVE_EVENTS: LiveEvent[] = EVENTS.map((e) => ({
  ...e,
  ma_su_kien: e.ma_su_kien || 101,
  ten_su_kien: e.ten_su_kien || e.title,
  anh_bia: e.anh_bia || e.banner,
  dien_gia: e.dien_gia || e.speaker,
  ten_chuyen_de: e.ten_chuyen_de || "Công nghệ Thông tin",
  ten_don_vi_host: e.ten_don_vi_host || e.organizer,
  danh_sach_ten_dong_to_chuc: e.danh_sach_ten_dong_to_chuc || [],
  ten_phong: e.ten_phong || e.room,
  co_so: e.co_so || "CoSo1",
  thoi_gian_bat_dau: e.thoi_gian_bat_dau || e.date + "T" + e.time + ":00+07:00",
  thoi_gian_ket_thuc:
    e.thoi_gian_ket_thuc || e.date + "T" + e.endTime + ":00+07:00",
  khong_gioi_han_slot: false,
  so_ve_con_lai: e.capacity - e.registered,
  so_luong_toi_da: e.capacity,
  trang_thai: (e.status === "full"
    ? "PUBLISHED"
    : e.status === "nearly_full"
      ? "PUBLISHED"
      : e.status === "closed"
        ? "COMPLETED"
        : "PUBLISHED") as ContractEventStatus,
  dieu_khoan_drl: "Dieu3",
  diem_drl_du_kien: 5,
  gio_tinh_nguyen: 0,
  mo_ta: e.description,
  lo_trinh: [],
  registrationOpen: e.status !== "closed" && e.status !== "ended",
  isCancelled: false,
}))

// Pre-existing tickets: EVT005 (upcoming, pending) + past attended event
// EVT001 is NOT pre-registered so the demo "register" flow starts fresh at 180/200
const SEED_TICKETS: Ticket[] = [
  ...TICKETS,
  {
    id: "TKT-2026-001928",
    ma_dang_ky: 501,
    eventId: "EVT001",
    ma_su_kien: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    eventDate: "2026-10-15",
    eventTime: "08:30 – 11:30",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    eventLocation: "Hội trường A, Trường Đại học Công nghệ Thông tin",
    studentId: "22521088",
    studentName: "Nguyễn Ngọc Mai",
    faculty: "Công nghệ Thông tin",
    status: "pending",
    trang_thai: "DaDangKy",
    qrCode: "TKT-2026-001928|EVT001|22521088",
    registeredAt: "2026-09-20 09:15",
    nghi_van_gian_lan: false,
    vi_pham_no_show: false,
    ti_le_drl: 1.0,
    diem_drl_du_kien: 5,
    da_feedback: false,
    co_the_feedback: false,
    du_dieu_kien_drl: false,
  },
  {
    id: "TKT-2026-001929",
    ma_dang_ky: 508,
    eventId: "EVT001",
    ma_su_kien: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    eventDate: "2026-10-15",
    eventTime: "08:30 – 11:30",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    eventLocation: "Hội trường A, Trường Đại học Công nghệ Thông tin",
    studentId: "22520888",
    studentName: "Trần Hoàng Nam",
    faculty: "Kỹ thuật Máy tính",
    status: "pending",
    trang_thai: "DaDangKy",
    qrCode: "TKT-2026-001929|EVT001|22520888",
    registeredAt: "2026-09-21 10:20",
    nghi_van_gian_lan: true,
    ma_thiet_bi_nghi_van: "DEV_SCANNER_712",
    vi_pham_no_show: false,
    ti_le_drl: 0.0,
    diem_drl_du_kien: 5,
    da_feedback: false,
    co_the_feedback: false,
    du_dieu_kien_drl: false,
  },
  {
    id: "TKT-2026-001930",
    ma_dang_ky: 509,
    eventId: "EVT001",
    ma_su_kien: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    eventDate: "2026-10-15",
    eventTime: "08:30 – 11:30",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    eventLocation: "Hội trường A, Trường Đại học Công nghệ Thông tin",
    studentId: "22520555",
    studentName: "Lê Quốc Bảo",
    faculty: "Khoa học Máy tính",
    status: "pending",
    trang_thai: "DaDangKy",
    qrCode: "TKT-2026-001930|EVT001|22520555",
    registeredAt: "2026-09-22 14:10",
    nghi_van_gian_lan: false,
    vi_pham_no_show: true,
    ti_le_drl: 0.0,
    diem_drl_du_kien: 5,
    da_feedback: false,
    co_the_feedback: false,
    du_dieu_kien_drl: false,
  },
  {
    id: "TKT-2026-001931",
    ma_dang_ky: 510,
    eventId: "EVT001",
    ma_su_kien: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    eventDate: "2026-10-15",
    eventTime: "08:30 – 11:30",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    eventLocation: "Hội trường A, Trường Đại học Công nghệ Thông tin",
    studentId: "22520333",
    studentName: "Phạm Minh Hoàng",
    faculty: "Hệ thống Thông tin",
    status: "cancelled",
    trang_thai: "DaHuy",
    qrCode: "TKT-2026-001931|EVT001|22520333",
    registeredAt: "2026-09-23 08:45",
    nghi_van_gian_lan: false,
    vi_pham_no_show: false,
    ti_le_drl: 0.0,
    diem_drl_du_kien: 0,
    da_feedback: false,
    co_the_feedback: false,
    du_dieu_kien_drl: false,
  },
  {
    id: "TKT-2026-003412",
    eventId: "EVT005",
    eventTitle: "Ngày hội việc làm Công nghệ 2026",
    eventDate: "2026-11-12",
    eventTime: "08:00 – 17:00",
    eventLocation: "Sân trung tâm & Hội trường B",
    studentId: "22521001",
    studentName: "Cao Duy Anh",
    faculty: "Công nghệ Thông tin",
    status: "pending",
    qrCode: "TKT-2026-003412|EVT005|22521001",
    registeredAt: "2026-09-18 14:30",
  },
  {
    id: "TKT-2026-000711",
    eventId: "EVT_PAST",
    eventTitle: "Cuộc thi Lập trình ACM ICPC Qualifier",
    eventDate: "2026-09-15",
    eventTime: "08:00 – 12:00",
    eventLocation: "Phòng máy C1",
    studentId: "22521001",
    studentName: "Cao Duy Anh",
    faculty: "Công nghệ Thông tin",
    status: "attended",
    checkinTime: "07:52",
    checkoutTime: "11:48",
    qrCode: "TKT-2026-000711|EVT_PAST|22521001",
    registeredAt: "2026-09-10 11:00",
  },
] as Ticket[]

const SEED_APPROVALS: ApprovalCase[] = [
  {
    id: "HS-2026-014",
    eventId: "EVT001",
    title: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    unit: "Khoa Công nghệ Thông tin",
    faculty: "Công nghệ Thông tin",
    submitter: "Nguyễn Minh Anh",
    submittedAt: "24/09/2026 09:30",
    eventDate: "15/10/2026",
    status: "faculty_pending",
    lifecycle: "scheduled",
    description:
      "Kết nối sinh viên với chuyên gia và doanh nghiệp trong lĩnh vực AI, dữ liệu.",
    plan: "Tổ chức tại Hội trường A, gồm khai mạc, tham luận, tọa đàm và kết nối doanh nghiệp.",
    documents: [
      "Kế hoạch tổ chức.pdf",
      "Dự toán kinh phí.xlsx",
      "Phương án an toàn.pdf",
    ],
    proposedPoints: 5,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-04-HĐ",
    maxPoints: 5,
    validMinutes: 150,
    thresholds: [
      { ratio: 70, points: 3 },
      { ratio: 90, points: 5 },
    ],
    requiredSessions: ["Khai mạc", "Tọa đàm AI trong thực tế"],
    certificateCondition:
      "Tham gia tối thiểu 90% thời lượng hợp lệ và có đủ check-in/check-out.",
    ruleBasis: "Khung tiêu chí hoạt động sinh viên nội bộ — dữ liệu minh họa",
    ruleVersion: "DK-2026.1",
    history: [
      {
        id: "h1",
        actor: "Nguyễn Minh Anh · Ban tổ chức",
        action: "Gửi hồ sơ đến khoa",
        at: "24/09/2026 09:30",
      },
    ],
  },
  {
    id: "HS-2026-011",
    eventId: "EVT002",
    title: "Hội thảo Điện toán đám mây & DevOps",
    unit: "CLB Điện toán đám mây",
    faculty: "Công nghệ Thông tin",
    submitter: "Trần Quốc Bảo",
    submittedAt: "22/09/2026 15:10",
    eventDate: "22/10/2026",
    status: "faculty_revision",
    lifecycle: "draft",
    description: "Hội thảo chuyên sâu về cloud, CI/CD và DevOps.",
    plan: "Chương trình 3 giờ tại B4.101.",
    documents: ["Kế hoạch tổ chức.pdf"],
    proposedPoints: 3,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-04-HĐ",
    maxPoints: 3,
    validMinutes: 150,
    thresholds: [
      { ratio: 80, points: 2 },
      { ratio: 95, points: 3 },
    ],
    requiredSessions: [],
    certificateCondition: "Tham gia ít nhất 95% thời lượng hợp lệ.",
    ruleBasis: "Khung minh họa cho prototype",
    ruleVersion: "DK-2026.1",
    history: [
      {
        id: "h2",
        actor: "Trần Quốc Bảo · Ban tổ chức",
        action: "Gửi hồ sơ đến khoa",
        at: "22/09/2026 15:10",
      },
      {
        id: "h3",
        actor: "Lê Thu Hà · Ban quản lý khoa",
        action: "Yêu cầu bổ sung",
        at: "23/09/2026 10:25",
        note: "Bổ sung phương án an toàn và xác nhận phòng.",
      },
    ],
  },
  {
    id: "HS-2026-009",
    eventId: "EVT004",
    title: "Ngày hội Đổi mới sáng tạo & Khởi nghiệp",
    unit: "Innovation Hub",
    faculty: "Công nghệ Thông tin",
    submitter: "Phạm Hoàng Nam",
    submittedAt: "20/09/2026 08:45",
    eventDate: "05/11/2026",
    status: "affairs_pending",
    lifecycle: "scheduled",
    description:
      "Ngày hội triển lãm, kết nối và thi thuyết trình ý tưởng khởi nghiệp.",
    plan: "Chương trình toàn ngày, có thời gian nghỉ 12:00–13:30 không tính thời lượng.",
    documents: [
      "Kế hoạch đã ký.pdf",
      "Quyết định khoa.pdf",
      "Lịch chương trình.pdf",
    ],
    proposedPoints: 8,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-05-ST",
    maxPoints: 8,
    validMinutes: 390,
    thresholds: [
      { ratio: 60, points: 3 },
      { ratio: 80, points: 5 },
      { ratio: 95, points: 8 },
    ],
    requiredSessions: ["Khai mạc"],
    certificateCondition:
      "Đủ 80% thời lượng hợp lệ; điều kiện này tách biệt điều kiện công nhận điểm.",
    ruleBasis: "Đề xuất của đơn vị và quyết định khoa — dữ liệu minh họa",
    ruleVersion: "DK-2026.2",
    facultyDecision:
      "Khoa thống nhất nội dung, phạm vi tổ chức và đề xuất chuyển Phòng CTSV thẩm định quy tắc điểm.",
    history: [
      {
        id: "h4",
        actor: "Phạm Hoàng Nam · Ban tổ chức",
        action: "Gửi hồ sơ đến khoa",
        at: "19/09/2026 14:20",
      },
      {
        id: "h5",
        actor: "Lê Thu Hà · Ban quản lý khoa",
        action: "Duyệt và chuyển Phòng CTSV",
        at: "20/09/2026 08:45",
      },
    ],
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
    history: [
      {
        id: "ah1",
        actor: "Nguyễn Thảo Vy · Phòng CTSV",
        action: "Công nhận kết quả",
        at: "16/09/2026 14:20",
      },
    ],
  },
  {
    id: "AT-002",
    eventId: "EVT001",
    studentId: "22521002",
    studentName: "Nguyễn Ngọc Mai",
    checkin: "08:34",
    checkout: "10:58",
    validMinutes: 138,
    participationRatio: 92,
    proposedPoints: 5,
    certificateEligible: true,
    status: "submitted",
    ruleVersion: "DK-2026.1",
    history: [],
  },
  {
    id: "AT-003",
    eventId: "EVT001",
    studentId: "22521003",
    studentName: "Trần Gia Huy",
    checkin: "08:45",
    validMinutes: 0,
    participationRatio: 0,
    proposedPoints: 0,
    certificateEligible: false,
    status: "needs_review",
    warning: "Thiếu check-out — không tự động tính đủ thời lượng.",
    ruleVersion: "DK-2026.1",
    history: [],
  },
]

const SEED_SURVEYS: SurveyResponse[] = [
  {
    id: "SR-001",
    eventId: "EVT001",
    studentId: "anon-01",
    overall: 5,
    content: 5,
    organization: 4,
    venue: 4,
    useful: "Phần tọa đàm thực tế.",
    improvement: "Tăng thời gian hỏi đáp.",
    joinAgain: true,
    submittedAt: "15/10/2026 14:10",
  },
  {
    id: "SR-002",
    eventId: "EVT001",
    studentId: "anon-02",
    overall: 4,
    content: 4,
    organization: 4,
    venue: 3,
    useful: "Kết nối doanh nghiệp.",
    improvement: "Bố trí thêm chỗ ngồi.",
    joinAgain: true,
    submittedAt: "15/10/2026 15:25",
  },
  {
    id: "SR-003",
    eventId: "EVT001",
    studentId: "anon-03",
    overall: 5,
    content: 5,
    organization: 5,
    venue: 4,
    useful: "Các ví dụ nghề nghiệp.",
    improvement: "Không có.",
    joinAgain: true,
    submittedAt: "16/10/2026 08:05",
  },
  {
    id: "SR-004",
    eventId: "EVT001",
    studentId: "anon-04",
    overall: 4,
    content: 4,
    organization: 5,
    venue: 4,
    useful: "Thông tin tuyển dụng.",
    improvement: "Gửi tài liệu sớm.",
    joinAgain: true,
    submittedAt: "16/10/2026 09:15",
  },
  {
    id: "SR-005",
    eventId: "EVT001",
    studentId: "anon-05",
    overall: 5,
    content: 4,
    organization: 5,
    venue: 5,
    useful: "Networking.",
    improvement: "Thêm booth.",
    joinAgain: true,
    submittedAt: "16/10/2026 10:40",
  },
]

const SEED_CERTIFICATES: Certificate[] = [
  {
    id: "CERT-001",
    code: "CEH-2026-AI-7K9P2",
    eventId: "EVT_PAST",
    eventTitle: "Cuộc thi Lập trình ACM ICPC Qualifier",
    recipientName: "Cao Duy Anh",
    studentId: "22521001",
    issuer: "Trường Đại học Công nghệ Thông tin",
    participantRole: "Thí sinh",
    eventTime: "15/09/2026",
    issuedAt: "18/09/2026",
    status: "issued",
  },
  {
    id: "CERT-002",
    code: "CEH-2026-CLOUD-X2K8",
    eventId: "EVT002",
    eventTitle: "Hội thảo Điện toán đám mây & DevOps",
    recipientName: "Nguyễn Ngọc Mai",
    studentId: "22521002",
    issuer: "Trường Đại học Công nghệ Thông tin",
    participantRole: "Người tham gia",
    eventTime: "22/10/2026",
    status: "pending",
  },
]

let _ticketSeq = 1
function nextTicketId(): string {
  return `TKT-2026-${String(4000 + _ticketSeq++).padStart(4, "0")}`
}

function nowStr() {
  return new Date().toLocaleString("vi-VN")
}
function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}
function newNotifId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function makeNotif(
  type: NotifType,
  title: string,
  description: string,
  action?: NotifAction,
  eventId?: string,
): Notification {
  const audience: Notification["audience"] = action?.startsWith("faculty")
    ? "faculty_manager"
    : action?.startsWith("affairs")
      ? "student_affairs"
      : action === "student-achievements"
        ? "student"
        : undefined
  return {
    id: newNotifId(),
    type,
    title,
    description,
    time: "Vừa xong",
    read: false,
    action,
    eventId,
    audience,
  } as unknown as Notification
}

function adaptApiTicket(
  ticket: import("../data/contract").TicketDetail,
  event: LiveEvent,
  user: UserData,
): Ticket {
  return {
    ...ticket,
    id: String(ticket.ma_dang_ky),
    eventId: event.id,
    eventTitle: ticket.ten_su_kien,
    eventDate: ticket.thoi_gian_bat_dau.slice(0, 10),
    eventTime: `${ticket.thoi_gian_bat_dau.slice(11, 16)} – ${ticket.thoi_gian_ket_thuc.slice(11, 16)}`,
    eventLocation: `${ticket.ten_phong}, ${ticket.co_so}`,
    studentId: user.studentId,
    studentName: user.ho_ten,
    faculty: user.khoa || user.faculty,
    status:
      ticket.trang_thai === "DaHuy"
        ? "cancelled"
        : ticket.trang_thai === "DaCheckOut"
          ? "attended"
          : "pending",
    checkinTime: ticket.thoi_gian_check_in?.slice(11, 19),
    checkoutTime: ticket.thoi_gian_check_out?.slice(11, 19),
    qrCode: ticket.payload_qr,
    registeredAt: ticket.thoi_gian_dang_ky,
  }
}

function adaptApiEvent(e: any): LiveEvent {
  const id = String(e.ma_su_kien || e.id || 101)
  const title = e.ten_su_kien || e.title || "Sự kiện học đường"
  const startIso = e.thoi_gian_bat_dau || "2026-11-20T08:30:00+07:00"
  const endIso = e.thoi_gian_ket_thuc || "2026-11-20T11:30:00+07:00"
  const date = startIso.includes("T") ? startIso.split("T")[0] : startIso
  const time = startIso.includes("T") ? startIso.split("T")[1].slice(0, 5) : "08:30"
  const endTime = endIso.includes("T") ? endIso.split("T")[1].slice(0, 5) : "11:30"
  const capacity = Number(e.so_luong_toi_da || e.capacity || 200)
  const remaining = typeof e.so_ve_con_lai === "number" ? e.so_ve_con_lai : capacity
  const registered = Math.max(0, capacity - remaining)
  const banner =
    e.anh_bia ||
    e.banner ||
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop"

  return {
    ma_su_kien: Number(e.ma_su_kien || id),
    ten_su_kien: title,
    anh_bia: banner,
    dien_gia: e.dien_gia || e.speaker || "Chuyên gia khách mời",
    ten_chuyen_de: e.ten_chuyen_de || e.topic || "Công nghệ Thông tin",
    ten_don_vi_host:
      e.ten_don_vi_host || e.organizer || "Đoàn Thanh niên - Hội Sinh viên",
    danh_sach_ten_dong_to_chuc: e.danh_sach_ten_dong_to_chuc || e.coHosts || [],
    ten_phong: e.ten_phong || e.room || "Hội trường A",
    co_so: (e.co_so || "CoSo1") as "CoSo1" | "CoSo2",
    thoi_gian_bat_dau: startIso,
    thoi_gian_ket_thuc: endIso,
    khong_gioi_han_slot: Boolean(e.khong_gioi_han_slot),
    so_ve_con_lai: remaining,
    so_luong_toi_da: capacity,
    trang_thai: (e.trang_thai || "PUBLISHED") as ContractEventStatus,
    dieu_khoan_drl: (e.dieu_khoan_drl || "Dieu3") as "KhongCo" | "Dieu3" | "Dieu4",
    diem_drl_du_kien: Number(e.diem_drl_du_kien || e.points || 5),
    gio_tinh_nguyen: Number(e.gio_tinh_nguyen || 0),
    mo_ta: e.mo_ta || e.description || "",
    lo_trinh: Array.isArray(e.lo_trinh) ? e.lo_trinh : [],
    doi_tuong_tham_gia: e.doi_tuong_tham_gia || null,

    // UI & Legacy fields
    id,
    title,
    speaker: e.dien_gia || e.speaker || "Chuyên gia khách mời",
    topic: (e.ten_chuyen_de || e.topic || "academic") as Topic,
    description: e.mo_ta || e.description || "",
    date,
    time,
    endTime,
    location: `${e.ten_phong || e.room || "Hội trường A"}, ${e.co_so || "Cơ sở 1"}`,
    room: e.ten_phong || e.room || "Hội trường A",
    capacity,
    registered,
    registrationOpen: e.trang_thai === "PUBLISHED" || e.status === "open",
    isCancelled: e.trang_thai === "CANCELLED" || e.status === "cancelled",
    banner,
    organizer:
      e.ten_don_vi_host || e.organizer || "Đoàn Thanh niên - Hội Sinh viên",
    benefits: ["Cộng điểm rèn luyện", "Cấp chứng nhận tham gia"],
    schedule: [{ time: `${time} - ${endTime}`, title: "Nội dung chương trình" }],
  }
}

function adaptApiNotification(n: any): Notification {
  const title = n.tieu_de || n.title || "Thông báo hệ thống"
  const desc = n.noi_dung || n.description || n.message || ""
  const time = n.thoi_gian_gui || n.created_at || new Date().toISOString()
  return {
    id: n.id || n.ma_thong_bao || newNotifId(),
    tieu_de: title,
    noi_dung: desc,
    loai_thong_bao: n.loai_thong_bao || n.type || "HE_THONG",
    lien_ket: n.lien_ket || n.link || null,
    da_doc: Boolean(n.da_doc ?? n.read ?? false),
    thoi_gian_gui: time,
    title,
    description: desc,
    type: n.loai_thong_bao || n.type || "HE_THONG",
    time: "Vừa xong",
    read: Boolean(n.da_doc ?? n.read ?? false),
    action: n.action,
    eventId: n.eventId || (n.ma_su_kien ? String(n.ma_su_kien) : undefined),
    audience: n.audience,
  } as unknown as Notification
}

function adaptApiTicketSummary(ticket: any): Ticket {
  const id = String(
    ticket.ma_ve_uuid || ticket.id || ticket.ma_dang_ky || `TKT-${Date.now()}`,
  )
  const eventId = String(ticket.ma_su_kien || ticket.eventId || 101)
  const title = ticket.ten_su_kien || ticket.eventTitle || "Sự kiện học đường"
  const startIso = ticket.thoi_gian_bat_dau || "2026-11-20T08:30:00+07:00"
  const endIso = ticket.thoi_gian_ket_thuc || "2026-11-20T11:30:00+07:00"
  const date = startIso.includes("T") ? startIso.split("T")[0] : startIso
  const time =
    startIso.includes("T") && endIso.includes("T")
      ? `${startIso.split("T")[1].slice(0, 5)} – ${endIso.split("T")[1].slice(0, 5)}`
      : "08:30 – 11:30"

  return {
    ...ticket,
    id,
    ma_dang_ky: ticket.ma_dang_ky || 1,
    ma_ve_uuid: ticket.ma_ve_uuid || id,
    eventId,
    ma_su_kien: Number(eventId),
    eventTitle: title,
    ten_su_kien: title,
    eventDate: date,
    eventTime: time,
    thoi_gian_bat_dau: startIso,
    thoi_gian_ket_thuc: endIso,
    eventLocation: `${ticket.ten_phong || "Hội trường A"}, ${ticket.co_so || "Cơ sở 1"}`,
    ten_phong: ticket.ten_phong || "Hội trường A",
    co_so: ticket.co_so || "CoSo1",
    studentId: String(ticket.mssv || ticket.studentId || "22520000"),
    mssv: String(ticket.mssv || ticket.studentId || "22520000"),
    studentName: ticket.ho_ten || ticket.studentName || "Sinh viên UIT",
    ho_ten: ticket.ho_ten || ticket.studentName || "Sinh viên UIT",
    studentEmail: ticket.email || ticket.studentEmail || "sinhvien@uit.edu.vn",
    faculty: ticket.khoa || ticket.faculty || "Khoa Hệ thống Thông tin",
    status:
      ticket.trang_thai === "DaHuy"
        ? "cancelled"
        : ticket.trang_thai === "DaCheckOut"
          ? "attended"
          : "pending",
    trang_thai: ticket.trang_thai || "DaDangKy",
    checkinTime: ticket.thoi_gian_check_in?.slice(11, 19),
    checkoutTime: ticket.thoi_gian_check_out?.slice(11, 19),
    qrCode: ticket.payload_qr || ticket.qrCode || `CEH1.${id}`,
    registeredAt: ticket.thoi_gian_dang_ky || new Date().toISOString(),
    thoi_gian_dang_ky: ticket.thoi_gian_dang_ky || new Date().toISOString(),
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  events: LiveEvent[]
  tickets: Ticket[]
  notifications: Notification[]
  permissions: CheckInPermission[]
  approvalCases: ApprovalCase[]
  attendanceRecords: AttendanceRecord[]
  surveyResponses: SurveyResponse[]
  certificates: Certificate[]

  getEvent: (id: string) => LiveEvent | undefined
  computeStatus: (e: LiveEvent) => EventStatus

  getUserActiveTicket: (
    eventId: string,
    studentId: string,
  ) => Ticket | undefined
  getActiveParticipants: (eventId: string) => Ticket[]
  getCheckedInCount: (eventId: string) => number

  registerEvent: (event: LiveEvent, user: UserData) => Promise<RegisterResult>
  cancelTicket: (ticketId: string, reason: string) => Promise<CancelResult>
  waitlistEntries: WaitlistEntry[]
  getStudentWaitlistEntries: (studentId: string) => WaitlistEntry[]
  joinWaitlist: (
    event: LiveEvent,
    user: UserData,
  ) => Promise<{ success: boolean; entry?: WaitlistEntry; error?: string }>
  claimWaitlistOffer: (
    id: number,
  ) => Promise<{ success: boolean; ticket?: Ticket; error?: string }>
  declineWaitlistOffer: (
    id: number,
  ) => Promise<{ success: boolean; error?: string }>
  checkIn: (qrCode: string, eventId?: string) => CheckInResult
  checkOut: (qrCode: string, eventId?: string) => CheckInResult

  markNotificationRead: (id: string) => void
  markAllRead: () => void

  // Permission management
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

  saveApprovalDraft: (
    input: Partial<ApprovalCase> & Pick<ApprovalCase, "title">,
    submit: boolean,
  ) => ApprovalCase
  updateApproval: (
    caseId: string,
    action:
      | "faculty_approve"
      | "faculty_approve_by_admin"
      | "affairs_approve"
      | "request_revision"
      | "reject"
      | "resubmit"
      | "withdraw"
      | "reopen",
    reason?: string,
  ) => { success: boolean; error?: string }
  cancelEvent: (
    eventId: string,
    reason: string,
  ) => { success: boolean; error?: string }
  submitAttendanceResults: (
    eventId: string,
  ) => { success: boolean; error?: string }
  recognizeAttendance: (recordId: string) => { success: boolean; error?: string }
  requestAttendanceRevision: (
    recordId: string,
    reason: string,
  ) => { success: boolean; error?: string }
  adjustAttendance: (
    recordId: string,
    minutes: number,
    reason: string,
    evidence: string,
  ) => { success: boolean; error?: string }
  requestStudentReview: (
    recordId: string,
    reason: string,
  ) => { success: boolean; error?: string }
  submitSurvey: (
    input: Omit<SurveyResponse, "id" | "submittedAt">,
  ) => { success: boolean; error?: string }
  issueCertificate: (
    certificateId: string,
  ) => { success: boolean; error?: string }
  revokeCertificate: (
    certificateId: string,
    reason: string,
  ) => { success: boolean; error?: string }
  replaceCertificate: (
    certificateId: string,
  ) => { success: boolean; certificate?: Certificate; error?: string }
  verifyCertificate: (code: string) => Certificate | undefined
  manualOverrideAttendance: (payload: {
    ma_dang_ky?: number
    ticketId?: string
    trang_thai_moi: "DaCheckIn" | "DaCheckOut"
    ti_le_drl_moi: number
    ly_do: string
    da_doi_soat_the?: boolean
  }) => Promise<{ success: boolean; error?: string }>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [events, setEvents] = useState<LiveEvent[]>(INITIAL_LIVE_EVENTS)
  const [tickets, setTickets] = useState<Ticket[]>(SEED_TICKETS)
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  )
  const [permissions, setPermissions] =
    useState<CheckInPermission[]>(SEED_PERMISSIONS)
  const [approvalCases, setApprovalCases] =
    useState<ApprovalCase[]>(SEED_APPROVALS)
  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(SEED_ATTENDANCE)
  const [surveyResponses, setSurveyResponses] =
    useState<SurveyResponse[]>(SEED_SURVEYS)
  const [certificates, setCertificates] =
    useState<Certificate[]>(SEED_CERTIFICATES)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([
    {
      id: 72,
      ma_su_kien: 103,
      ten_su_kien: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
      thoi_gian_bat_dau: "2026-10-22T09:00:00+07:00",
      thoi_gian_ket_thuc: "2026-10-22T11:30:00+07:00",
      ten_phong: "Hội trường B",
      co_so: "CoSo1",
      so_thu_tu: 2,
      trang_thai: "OFFERED",
      thoi_gian_dang_ky: "2026-10-06T10:15:00+07:00",
      han_chot_xac_nhan: new Date(Date.now() + 45 * 60_000).toISOString(),
      so_giay_con_lai: 2700,
      ma_tai_khoan: 1,
      mssv: "22521001",
      ho_ten: "Cao Duy Anh",
      studentId: "22521001",
    },
  ])

  async function hydrate() {
    setDataLoading(true)
    setDataError(null)
    try {
      const [eventRes, notifRes, ticketRes] = await Promise.allSettled([
        eventsService.listPublic(),
        notificationsService.list(),
        ticketsService.mine(),
      ])
      if (
        eventRes.status === "fulfilled" &&
        eventRes.value?.data &&
        Array.isArray(eventRes.value.data) &&
        eventRes.value.data.length > 0
      ) {
        setEvents(eventRes.value.data.map(adaptApiEvent))
      }
      if (
        notifRes.status === "fulfilled" &&
        notifRes.value?.data &&
        Array.isArray(notifRes.value.data) &&
        notifRes.value.data.length > 0
      ) {
        setNotifications(notifRes.value.data.map(adaptApiNotification))
      }
      if (
        ticketRes.status === "fulfilled" &&
        ticketRes.value?.data &&
        Array.isArray(ticketRes.value.data) &&
        ticketRes.value.data.length > 0
      ) {
        setTickets(ticketRes.value.data.map(adaptApiTicketSummary))
      }
    } catch (err) {
      setDataError(getApiErrorMessage(err))
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    void hydrate()
  }, [])

  function getEvent(id: string) {
    return events.find((e) => e.id === id)
  }

  function getUserActiveTicket(eventId: string, studentId: string) {
    return tickets.find(
      (t) =>
        t.eventId === eventId &&
        t.studentId === studentId &&
        t.status !== "cancelled",
    )
  }

  function getActiveParticipants(eventId: string) {
    return tickets.filter(
      (t) => t.eventId === eventId && t.status !== "cancelled",
    )
  }

  function getCheckedInCount(eventId: string) {
    return tickets.filter(
      (t) => t.eventId === eventId && t.status === "attended",
    ).length
  }

  function getStudentWaitlistEntries(studentId: string) {
    return waitlistEntries.filter(
      (entry) => entry.studentId === studentId || entry.mssv === studentId,
    )
  }

  async function joinWaitlist(
    event: LiveEvent,
    user: UserData,
  ): Promise<{ success: boolean; entry?: WaitlistEntry; error?: string }> {
    if (isApiMode()) {
      try {
        const { data } = await waitlistService.join(
          event.ma_su_kien,
          crypto.randomUUID(),
        )
        setWaitlistEntries((previous) => [...previous, data])
        return { success: true, entry: data }
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) }
      }
    }
    const now = Date.now()
    const closesAt =
      new Date(event.thoi_gian_bat_dau).getTime() - 2 * 60 * 60 * 1000
    if (event.khong_gioi_han_slot)
      return { success: false, error: "Sự kiện mở tự do không dùng hàng chờ." }
    if (event.registered < event.capacity)
      return {
        success: false,
        error: "Sự kiện vừa có vé trống. Vui lòng đặt vé trực tiếp.",
      }
    if (now >= closesAt)
      return {
        success: false,
        error: "Hàng đợi đã đóng vì còn dưới 2 giờ trước sự kiện.",
      }
    if (getUserActiveTicket(event.id, user.studentId))
      return { success: false, error: "Bạn đã có vé hợp lệ." }
    const duplicate = waitlistEntries.find(
      (entry) =>
        entry.ma_su_kien === event.ma_su_kien &&
        entry.studentId === user.studentId &&
        ["WAITING", "OFFERED"].includes(entry.trang_thai),
    )
    if (duplicate)
      return { success: false, error: "Bạn đã có trong danh sách chờ." }
    const sequence =
      Math.max(
        0,
        ...waitlistEntries
          .filter((entry) => entry.ma_su_kien === event.ma_su_kien)
          .map((entry) => entry.so_thu_tu),
      ) + 1
    const entry: WaitlistEntry = {
      id: Date.now(),
      ma_su_kien: event.ma_su_kien,
      ten_su_kien: event.ten_su_kien,
      thoi_gian_bat_dau: event.thoi_gian_bat_dau,
      thoi_gian_ket_thuc: event.thoi_gian_ket_thuc,
      ten_phong: event.ten_phong,
      co_so: event.co_so,
      so_thu_tu: sequence,
      trang_thai: "WAITING",
      thoi_gian_dang_ky: new Date().toISOString(),
      ma_tai_khoan: user.ma_tai_khoan,
      mssv: user.mssv || undefined,
      ho_ten: user.ho_ten,
      studentId: user.studentId,
    }
    setWaitlistEntries((previous) => [...previous, entry])
    return { success: true, entry }
  }

  async function claimWaitlistOffer(
    id: number,
  ): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    const entry = waitlistEntries.find((item) => item.id === id)
    if (!entry) return { success: false, error: "Không tìm thấy suất chờ." }
    if (entry.trang_thai !== "OFFERED")
      return { success: false, error: "Suất chờ không ở trạng thái OFFERED." }
    if (
      entry.han_chot_xac_nhan &&
      Date.now() > new Date(entry.han_chot_xac_nhan).getTime()
    ) {
      setWaitlistEntries((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, trang_thai: "EXPIRED" } : item,
        ),
      )
      return { success: false, error: "Suất giữ chỗ đã hết hạn." }
    }
    try {
      let ticket: Ticket
      if (isApiMode()) {
        const { data } = await waitlistService.claim(id, crypto.randomUUID())
        const event =
          events.find((item) => item.ma_su_kien === entry.ma_su_kien) ||
          events[0]
        ticket = adaptApiTicket(data, event, {
          ...{} as UserData,
          studentId: entry.mssv || "",
          ho_ten: entry.ho_ten || "",
          khoa: "",
          faculty: "",
        })
      } else {
        const event =
          events.find((item) => item.ma_su_kien === entry.ma_su_kien) ||
          events[0]
        const uuid = crypto.randomUUID()
        ticket = {
          ...TICKETS[0],
          id: nextTicketId(),
          ma_dang_ky: 500 + tickets.length + 1,
          ma_ve_uuid: uuid,
          ma_su_kien: entry.ma_su_kien,
          ten_su_kien: entry.ten_su_kien,
          eventId: event.id,
          eventTitle: entry.ten_su_kien,
          eventDate: entry.thoi_gian_bat_dau.slice(0, 10),
          eventTime: `${entry.thoi_gian_bat_dau.slice(11, 16)} – ${entry.thoi_gian_ket_thuc.slice(11, 16)}`,
          eventLocation: `${entry.ten_phong}, ${entry.co_so}`,
          studentId: entry.mssv || "",
          studentName: entry.ho_ten || "",
          trang_thai: "DaDangKy",
          status: "pending",
          payload_qr: `DEMO.${uuid}.${entry.ma_tai_khoan}.${entry.ma_su_kien}`,
          qrCode: `DEMO.${uuid}.${entry.ma_tai_khoan}.${entry.ma_su_kien}`,
          chu_ky_hmac: "DEMO_ONLY_NOT_SERVER_SIGNED".padEnd(64, "0"),
        }
      }
      setTickets((previous) => [...previous, ticket])
      setWaitlistEntries((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                trang_thai: "ACCEPTED",
                thoi_gian_phan_hoi: new Date().toISOString(),
              }
            : item,
        ),
      )
      return { success: true, ticket }
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error) }
    }
  }

  async function declineWaitlistOffer(id: number) {
    try {
      if (isApiMode()) await waitlistService.decline(id, crypto.randomUUID())
      setWaitlistEntries((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                trang_thai: "DECLINED",
                thoi_gian_phan_hoi: new Date().toISOString(),
              }
            : item,
        ),
      )
      return { success: true }
    } catch (error) {
      return { success: false, error: getApiErrorMessage(error) }
    }
  }

  async function registerEvent(
    event: LiveEvent,
    user: UserData,
  ): Promise<RegisterResult> {
    if (isApiMode()) {
      try {
        await bookingsService.precheck(event.ma_su_kien)
        const response = await bookingsService.book(
          event.ma_su_kien,
          crypto.randomUUID(),
        )
        const ticket = adaptApiTicket(response.data, event, user)
        setTickets((previous) => [...previous, ticket])
        setEvents((previous) =>
          previous.map((item) =>
            item.id === event.id
              ? {
                  ...item,
                  registered: item.registered + 1,
                  so_ve_con_lai: Math.max(0, (item.so_ve_con_lai || 1) - 1),
                }
              : item,
          ),
        )
        return { success: true, ticket }
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) }
      }
    }

    if (event.isCancelled)
      return { success: false, error: "Sự kiện đã bị hủy." }
    if (!event.registrationOpen)
      return { success: false, error: "Đăng ký đã đóng." }
    const remaining = event.capacity - event.registered
    if (remaining <= 0) return { success: false, error: "Sự kiện đã hết chỗ." }

    const existingTicket = tickets.find(
      (ticket) =>
        ticket.eventId === event.id &&
        ticket.studentId === user.studentId &&
        ticket.status !== "cancelled",
    )
    if (existingTicket)
      return {
        success: false,
        error: "Bạn đã đăng ký sự kiện này.",
        ticket: existingTicket,
      }

    const conflict = tickets.find(
      (ticket) =>
        ticket.studentId === user.studentId &&
        ticket.status !== "cancelled" &&
        ticket.ma_su_kien !== event.ma_su_kien &&
        !event.khong_gioi_han_slot &&
        new Date(ticket.thoi_gian_bat_dau).getTime() <
          new Date(event.thoi_gian_ket_thuc).getTime() &&
        new Date(ticket.thoi_gian_ket_thuc).getTime() >
          new Date(event.thoi_gian_bat_dau).getTime(),
    )
    if (conflict) {
      return {
        success: false,
        error: `Trùng lịch với ${conflict.eventTitle}.`,
      }
    }

    const ticketId = nextTicketId()
    const ma_dang_ky = 500 + tickets.length + 1
    const ma_ve_uuid = crypto.randomUUID()
    const ma_su_kien =
      event.ma_su_kien || parseInt(event.id.replace(/\D/g, "") || "101", 10)
    const chu_ky_hmac = "DEMO_ONLY_NOT_SERVER_SIGNED".padEnd(64, "0")
    const payload_qr = `DEMO.${ma_ve_uuid}.${user.ma_tai_khoan}.${ma_su_kien}`

    const newTicket: Ticket = {
      // Contract fields
      ma_dang_ky,
      ma_ve_uuid,
      ma_su_kien,
      ten_su_kien: event.ten_su_kien || event.title,
      trang_thai_su_kien: "PUBLISHED",
      thoi_gian_bat_dau:
        event.thoi_gian_bat_dau || event.date + "T" + event.time + ":00+07:00",
      thoi_gian_ket_thuc:
        event.thoi_gian_ket_thuc ||
        event.date + "T" + event.endTime + ":00+07:00",
      ten_phong: event.ten_phong || event.room,
      co_so: event.co_so || "CoSo1",
      trang_thai: "DaDangKy",
      thoi_gian_dang_ky: new Date().toISOString(),
      han_chot_huy: new Date(
        new Date(event.thoi_gian_bat_dau).getTime() - 4 * 60 * 60 * 1000,
      ).toISOString(),
      cho_phep_huy: true,
      ti_le_drl: 1.0,
      diem_drl_du_kien: event.diem_drl_du_kien || 5,
      da_feedback: false,
      co_the_feedback: false,
      du_dieu_kien_drl: false,
      co_the_nhan_chung_nhan: false,
      vi_pham_no_show: false,
      nghi_van_gian_lan: false,
      chu_ky_hmac,
      payload_qr,
      yeu_cau_wake_lock: true,

      // Legacy & UI properties
      id: ticketId,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: `${event.time} – ${event.endTime}`,
      eventLocation: `${event.room}, ${event.location}`,
      studentId: user.studentId,
      studentName: user.name,
      faculty: user.faculty,
      status: "pending",
      qrCode: payload_qr,
      registeredAt: nowStr(),
    }

    // Atomic update — all three setState calls are batched in React 18+
    setTickets((prev) => [...prev, newTicket])
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, registered: e.registered + 1 } : e,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "reg_success",
        "Đăng ký thành công",
        `Bạn đã đăng ký ${event.title}.`,
        "ticket-confirm",
        event.id,
      ),
      ...prev,
    ])

    return { success: true, ticket: newTicket }
  }

  async function cancelTicket(
    ticketId: string,
    reason: string,
  ): Promise<CancelResult> {
    const targetTicket = tickets.find((ticket) => ticket.id === ticketId)
    if (!targetTicket) return { success: false, error: "Không tìm thấy vé." }
    if (!reason.trim())
      return { success: false, error: "Vui lòng nhập lý do hủy vé." }
    if (
      targetTicket.status !== "pending" ||
      targetTicket.trang_thai !== "DaDangKy"
    ) {
      return {
        success: false,
        error: "Chỉ vé chưa check-in ở trạng thái DaDangKy mới được tự hủy.",
      }
    }
    const cancellationDeadline =
      new Date(targetTicket.thoi_gian_bat_dau).getTime() - 4 * 60 * 60 * 1000
    if (Date.now() >= cancellationDeadline) {
      return {
        success: false,
        error: "Không thể hủy vé trong vòng 4 giờ trước sự kiện.",
      }
    }
    if (isApiMode()) {
      try {
        await ticketsService.cancel(
          targetTicket.ma_dang_ky,
          reason.trim(),
          crypto.randomUUID(),
        )
      } catch (error) {
        return { success: false, error: getApiErrorMessage(error) }
      }
    }

    setTickets((previous) =>
      previous.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: "cancelled" as const,
              trang_thai: "DaHuy" as const,
              thoi_gian_huy: new Date().toISOString(),
              ly_do_huy: reason.trim(),
              cho_phep_huy: false,
            }
          : ticket,
      ),
    )

    setEvents((prev) =>
      prev.map((e) =>
        e.id === targetTicket.eventId
          ? { ...e, registered: Math.max(0, e.registered - 1) }
          : e,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "reg_cancelled",
        "Đã hủy vé",
        `Bạn đã hủy vé tham gia ${targetTicket.eventTitle}.`,
        undefined,
        targetTicket.eventId,
      ),
      ...prev,
    ])

    return { success: true }
  }

  function findTicketByQrOrInput(input: string): Ticket | undefined {
    const raw = input.trim()
    const parsed = parseQrPayload(raw)
    if (parsed.ma_ve_uuid) {
      const match = tickets.find((t) => t.ma_ve_uuid === parsed.ma_ve_uuid)
      if (match) return match
    }
    return tickets.find(
      (t) =>
        t.payload_qr === raw ||
        t.qrCode === raw ||
        t.id === raw ||
        String(t.ma_dang_ky) === raw ||
        t.studentId === raw ||
        (t as any).mssv === raw ||
        t.ma_ve_uuid === raw,
    )
  }

  function checkIn(qrCode: string, eventId?: string): CheckInResult {
    const ticket = findTicketByQrOrInput(qrCode)
    if (!ticket) {
      return {
        success: false,
        type: "not_found",
        message: "Không tìm thấy vé trong hệ thống.",
      }
    }
    return checkInTicket(ticket, eventId)
  }

  function checkOut(qrCode: string, eventId?: string): CheckInResult {
    const ticket = findTicketByQrOrInput(qrCode)
    if (!ticket)
      return {
        success: false,
        type: "not_found",
        message: "Không tìm thấy vé trong hệ thống.",
      }
    if (eventId && ticket.eventId !== eventId)
      return {
        success: false,
        type: "wrong_event",
        message: "Mã QR không thuộc sự kiện đang điểm danh.",
      }
    if (ticket.status === "cancelled")
      return {
        success: false,
        type: "cancelled_ticket",
        message: "Vé đã bị hủy và không thể check-out.",
      }
    if (ticket.status !== "attended" || !ticket.checkinTime) {
      return {
        success: false,
        type: "not_found",
        message: "Chưa có dữ liệu check-in cho vé này.",
      }
    }
    if (ticket.checkoutTime) {
      return {
        success: false,
        type: "already_checked_in",
        ticket,
        studentName: ticket.studentName,
        studentId: ticket.studentId,
        message: `Đã ghi nhận check-out lúc ${ticket.checkoutTime}.`,
      }
    }
    const time = nowTime()
    const updated = { ...ticket, checkoutTime: time }
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)))
    return {
      success: true,
      type: "success",
      ticket: updated,
      studentName: ticket.studentName,
      studentId: ticket.studentId,
      faculty: ticket.faculty,
      time,
      message: "Check-out thành công!",
    }
  }

  function checkInTicket(ticket: Ticket, eventId?: string): CheckInResult {
    if (eventId && ticket.eventId !== eventId)
      return {
        success: false,
        type: "wrong_event",
        message: "Mã QR không thuộc sự kiện đang điểm danh.",
      }
    if (ticket.status === "cancelled")
      return {
        success: false,
        type: "cancelled_ticket",
        message: "Vé đã bị hủy và không thể check-in.",
      }
    if (ticket.status === "attended")
      return {
        success: false,
        type: "already_checked_in",
        ticket,
        studentName: ticket.studentName,
        studentId: ticket.studentId,
        message: "Vé đã được check-in trước đó.",
      }

    const time = nowTime()
    const updated = {
      ...ticket,
      status: "attended" as const,
      checkinTime: time,
    }
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)))

    return {
      success: true,
      type: "success",
      ticket: updated,
      studentName: ticket.studentName,
      studentId: ticket.studentId,
      faculty: ticket.faculty,
      time,
      message: "Điểm danh thành công!",
    }
  }

  function markNotificationRead(id: string) {
    if (isApiMode()) {
      void notificationsService
        .read(Number(id))
        .then(() =>
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === id
                ? { ...notification, read: true, da_doc: true }
                : notification,
            ),
          ),
        )
      return
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, da_doc: true } : n)),
    )
  }
  function markAllRead() {
    if (isApiMode()) {
      void notificationsService.readAll().then(() =>
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            read: true,
            da_doc: true,
          })),
        ),
      )
      return
    }
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, da_doc: true })),
    )
  }

  function getStudentPermissions(studentId: string) {
    return permissions.filter(
      (p) => p.studentId === studentId && p.status === "active",
    )
  }
  function getEventPermissions(eventId: string) {
    return permissions.filter(
      (p) => p.eventId === eventId && p.status !== "revoked",
    )
  }

  function grantCheckinPermission(
    studentId: string,
    studentName: string,
    eventId: string,
    validFrom?: string,
    validUntil?: string,
  ): GrantPermissionResult {
    const existing = permissions.find(
      (p) =>
        p.studentId === studentId &&
        p.eventId === eventId &&
        p.status !== "revoked",
    )
    if (existing)
      return {
        success: false,
        error: "Sinh viên này đã được cấp quyền điểm danh cho sự kiện.",
      }
    const perm: CheckInPermission = {
      id: nextPermId(),
      studentId,
      studentName,
      eventId,
      status: "active",
      grantedAt: nowStr(),
      validFrom,
      validUntil,
    }
    setPermissions((prev) => [...prev, perm])
    return { success: true, permission: perm }
  }

  function revokePermission(permId: string): RevokePermissionResult {
    const perm = permissions.find((p) => p.id === permId)
    if (!perm) return { success: false, error: "Không tìm thấy quyền." }
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permId ? { ...p, status: "revoked" as const } : p,
      ),
    )
    return { success: true }
  }

  function suspendPermission(permId: string): RevokePermissionResult {
    const perm = permissions.find((p) => p.id === permId)
    if (!perm) return { success: false, error: "Không tìm thấy quyền." }
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permId ? { ...p, status: "suspended" as const } : p,
      ),
    )
    return { success: true }
  }

  function reactivatePermission(permId: string): RevokePermissionResult {
    const perm = permissions.find((p) => p.id === permId)
    if (!perm) return { success: false, error: "Không tìm thấy quyền." }
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permId ? { ...p, status: "active" as const } : p,
      ),
    )
    return { success: true }
  }

  function saveApprovalDraft(
    input: Partial<ApprovalCase> & Pick<ApprovalCase, "title">,
    submit: boolean,
  ): ApprovalCase {
    const id = `HS-2026-${String(approvalCases.length + 15).padStart(3, "0")}`
    const created: ApprovalCase = {
      id,
      eventId: `EVT-DRAFT-${Date.now()}`,
      title: input.title,
      unit: input.unit ?? "Khoa Công nghệ Thông tin",
      faculty: input.faculty ?? "Công nghệ Thông tin",
      submitter: input.submitter ?? "Ban tổ chức",
      submittedAt: submit ? nowStr() : "Chưa gửi",
      eventDate: input.eventDate ?? "",
      status: submit ? "faculty_pending" : "draft",
      lifecycle: "draft",
      description: input.description ?? "",
      plan: input.plan ?? "",
      documents: input.documents ?? [],
      proposedPoints: input.proposedPoints ?? 0,
      semester: input.semester ?? "HK1 2026–2027",
      criteriaCode: input.criteriaCode ?? "TC-04-HĐ",
      maxPoints: input.maxPoints ?? input.proposedPoints ?? 0,
      validMinutes: input.validMinutes ?? 0,
      thresholds: input.thresholds ?? [],
      requiredSessions: input.requiredSessions ?? [],
      certificateCondition: input.certificateCondition ?? "",
      ruleBasis: input.ruleBasis ?? "Đề xuất của đơn vị — dữ liệu minh họa",
      ruleVersion: input.ruleVersion ?? "DK-2026.1",
      history: submit
        ? [
            {
              id: `h-${Date.now()}`,
              actor: "Ban tổ chức",
              action: "Gửi hồ sơ đến khoa",
              at: nowStr(),
            },
          ]
        : [
            {
              id: `h-${Date.now()}`,
              actor: "Ban tổ chức",
              action: "Lưu bản nháp",
              at: nowStr(),
            },
          ],
    }
    setApprovalCases((prev) => [created, ...prev])
    if (submit) {
      setNotifications((prev) => [
        makeNotif(
          "approval_new",
          "Hồ sơ mới cần duyệt",
          `${created.title} đã được gửi đến Ban quản lý khoa.`,
          "faculty-detail",
          created.eventId,
        ),
        ...prev,
      ])
    }
    return created
  }

  function updateApproval(
    caseId: string,
    action:
      | "faculty_approve"
      | "faculty_approve_by_admin"
      | "affairs_approve"
      | "request_revision"
      | "reject"
      | "resubmit"
      | "withdraw"
      | "reopen",
    reason?: string,
  ) {
    const target = approvalCases.find((item) => item.id === caseId)
    if (!target) return { success: false, error: "Không tìm thấy hồ sơ." }
    if (
      (action === "request_revision" || action === "reject") &&
      !reason?.trim()
    ) {
      return { success: false, error: "Vui lòng nhập lý do xử lý hồ sơ." }
    }
    let status: ApprovalStatus = target.status
    let label = ""
    if (action === "faculty_approve") {
      status = "affairs_pending"
      label = "Duyệt và chuyển Phòng CTSV"
    }
    if (action === "faculty_approve_by_admin") {
      status = "affairs_pending"
      label = "Admin duyệt thay cấp Khoa (Sự cố) và chuyển CTSV"
    }
    if (action === "affairs_approve") {
      status = "approved"
      label = "Duyệt sự kiện và quy tắc điểm"
    }
    if (action === "request_revision") {
      status =
        target.status === "faculty_pending"
          ? "faculty_revision"
          : "affairs_revision"
      label = "Yêu cầu bổ sung"
    }
    if (action === "reject") {
      status =
        target.status === "faculty_pending"
          ? "faculty_rejected"
          : "affairs_rejected"
      label = "Từ chối hồ sơ"
    }
    if (action === "resubmit") {
      status =
        target.status === "faculty_revision"
          ? "faculty_pending"
          : "affairs_pending"
      label = "Bổ sung và gửi lại"
    }
    if (action === "withdraw") {
      status = "draft"
      label = "Rút hồ sơ về bản nháp"
    }
    if (action === "reopen") {
      status = "draft"
      label = "Tái mở bản nháp để chỉnh sửa"
    }
    setApprovalCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status,
              lifecycle: status === "approved" ? "scheduled" : item.lifecycle,
              facultyDecision:
                action === "faculty_approve"
                  ? reason || "Khoa thống nhất và chuyển Phòng CTSV thẩm định."
                  : item.facultyDecision,
              history: [
                ...item.history,
                {
                  id: `h-${Date.now()}`,
                  actor: action.startsWith("faculty")
                    ? "Ban quản lý khoa"
                    : action === "resubmit"
                      ? "Ban tổ chức"
                      : "Phòng CTSV",
                  action: label,
                  at: nowStr(),
                  note: reason,
                },
              ],
            }
          : item,
      ),
    )
    const type: NotifType =
      action === "request_revision" ? "approval_revision" : "approval_done"
    setNotifications((prev) => [
      makeNotif(
        type,
        label,
        `${target.title}: ${reason || "Trạng thái hồ sơ đã được cập nhật."}`,
        status === "affairs_pending" ? "affairs-detail" : undefined,
        target.eventId,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function cancelEvent(eventId: string, reason: string) {
    const target = events.find((e) => e.id === eventId)
    if (!target) return { success: false, error: "Không tìm thấy sự kiện." }
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, isCancelled: true, trang_thai: "CANCELLED" as const }
          : e,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "event_cancelled",
        "Hủy sự kiện khẩn cấp",
        `Sự kiện "${target.title}" đã bị hủy: ${reason}`,
        "tickets",
        target.id,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function submitAttendanceResults(eventId: string) {
    const rows = attendanceRecords.filter((row) => row.eventId === eventId)
    if (!rows.length)
      return { success: false, error: "Chưa có dữ liệu đối soát." }
    if (rows.some((row) => row.status === "needs_review")) {
      return {
        success: false,
        error: "Còn dòng cần kiểm tra. Hãy bổ sung minh chứng trước khi gửi.",
      }
    }
    setAttendanceRecords((prev) =>
      prev.map((row) =>
        row.eventId === eventId && row.status === "draft"
          ? { ...row, status: "submitted" as const }
          : row,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "result_pending",
        "Kết quả cần CTSV xử lý",
        "Ban tổ chức đã gửi bảng đối soát kết quả tham gia.",
        "affairs-results",
        eventId,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function recognizeAttendance(recordId: string) {
    const row = attendanceRecords.find((item) => item.id === recordId)
    if (!row) return { success: false, error: "Không tìm thấy kết quả." }
    if (row.status === "needs_review" || row.warning)
      return {
        success: false,
        error: "Dòng đang có cảnh báo không thể công nhận.",
      }
    if (row.status === "recognized") return { success: true }
    setAttendanceRecords((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              status: "recognized",
              officialPoints: item.proposedPoints,
              approvedBy: "Nguyễn Thảo Vy · Phòng CTSV",
              approvedAt: nowStr(),
              history: [
                ...item.history,
                {
                  id: `rh-${Date.now()}`,
                  actor: "Nguyễn Thảo Vy · Phòng CTSV",
                  action: "Công nhận kết quả",
                  at: nowStr(),
                },
              ],
            }
          : item,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "score_recognized",
        "Điểm hoạt động đã được công nhận",
        `${row.studentName} được công nhận ${row.proposedPoints} điểm đóng góp từ sự kiện.`,
        "student-achievements",
        row.eventId,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function requestAttendanceRevision(recordId: string, reason: string) {
    if (!reason.trim())
      return { success: false, error: "Vui lòng nhập lý do yêu cầu bổ sung." }
    setAttendanceRecords((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              status: "revision",
              warning: reason,
              history: [
                ...item.history,
                {
                  id: `rh-${Date.now()}`,
                  actor: "Phòng CTSV",
                  action: "Yêu cầu bổ sung",
                  at: nowStr(),
                  note: reason,
                },
              ],
            }
          : item,
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
    if (!reason.trim() || !evidence.trim())
      return {
        success: false,
        error: "Điều chỉnh thủ công bắt buộc có lý do và minh chứng.",
      }
    const capped = Math.max(0, Math.min(150, minutes))
    setAttendanceRecords((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              validMinutes: capped,
              participationRatio: Math.round((capped / 150) * 100),
              proposedPoints: capped >= 135 ? 5 : capped >= 105 ? 3 : 0,
              certificateEligible: capped >= 135,
              status: "draft",
              warning: undefined,
              adjustmentReason: reason,
              evidence,
              history: [
                ...item.history,
                {
                  id: `rh-${Date.now()}`,
                  actor: "Ban tổ chức",
                  action: "Điều chỉnh thời lượng thủ công",
                  at: nowStr(),
                  note: `${reason} · Minh chứng: ${evidence}`,
                },
              ],
            }
          : item,
      ),
    )
    return { success: true }
  }

  function requestStudentReview(recordId: string, reason: string) {
    if (!reason.trim())
      return { success: false, error: "Vui lòng mô tả nội dung cần kiểm tra." }
    setAttendanceRecords((prev) =>
      prev.map((item) =>
        item.id === recordId
          ? {
              ...item,
              history: [
                ...item.history,
                {
                  id: `rh-${Date.now()}`,
                  actor: "Sinh viên",
                  action: "Yêu cầu kiểm tra lại kết quả",
                  at: nowStr(),
                  note: reason,
                },
              ],
            }
          : item,
      ),
    )
    return { success: true }
  }

  function submitSurvey(input: Omit<SurveyResponse, "id" | "submittedAt">) {
    const ticket = tickets.find(
      (item) =>
        item.eventId === input.eventId && item.studentId === input.studentId,
    )
    if (!ticket) return { success: false, error: "Không tìm thấy vé tham dự." }
    if (
      ticket.trang_thai !== "DaCheckOut" ||
      ticket.status !== "attended" ||
      ticket.ti_le_drl <= 0
    ) {
      return {
        success: false,
        error: "Chỉ vé đã Check-out và có tỷ lệ ĐRL lớn hơn 0 được phản hồi.",
      }
    }
    if (ticket.trang_thai_su_kien !== "COMPLETED") {
      return { success: false, error: "Sự kiện chưa hoàn tất." }
    }
    const feedbackDeadline = ticket.han_an_han_feedback
      ? new Date(ticket.han_an_han_feedback).getTime()
      : ticket.han_feedback
        ? new Date(ticket.han_feedback).getTime()
        : new Date(ticket.thoi_gian_ket_thuc).getTime() + 48 * 60 * 60 * 1000
    if (Date.now() > feedbackDeadline) {
      return { success: false, error: "Thời hạn phản hồi 48 giờ đã kết thúc." }
    }
    if (
      surveyResponses.some(
        (item) =>
          item.eventId === input.eventId && item.studentId === input.studentId,
      )
    ) {
      return { success: false, error: "Bạn đã gửi đánh giá cho sự kiện này." }
    }
    setSurveyResponses((prev) => [
      ...prev,
      { ...input, id: `SR-${Date.now()}`, submittedAt: nowStr() },
    ])
    setTickets((previous) =>
      previous.map((item) =>
        item.id === ticket.id
          ? {
              ...item,
              da_feedback: true,
              co_the_feedback: false,
              du_dieu_kien_drl: item.ti_le_drl > 0,
              co_the_nhan_chung_nhan: item.ti_le_drl > 0,
            }
          : item,
      ),
    )
    return { success: true }
  }

  function issueCertificate(certificateId: string) {
    const cert = certificates.find((item) => item.id === certificateId)
    if (!cert) return { success: false, error: "Không tìm thấy chứng nhận." }
    if (cert.status === "issued") return { success: true }
    if (cert.status !== "pending")
      return {
        success: false,
        error: "Chứng nhận không ở trạng thái chờ phát hành.",
      }
    setCertificates((prev) =>
      prev.map((item) =>
        item.id === certificateId
          ? { ...item, status: "issued", issuedAt: nowStr() }
          : item,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "certificate_issued",
        "Chứng nhận đã phát hành",
        `Chứng nhận ${cert.eventTitle} đã sẵn sàng.`,
        "student-achievements",
        cert.eventId,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function revokeCertificate(certificateId: string, reason: string) {
    if (!reason.trim())
      return { success: false, error: "Thu hồi bắt buộc có lý do." }
    const cert = certificates.find((item) => item.id === certificateId)
    if (!cert) return { success: false, error: "Không tìm thấy chứng nhận." }
    setCertificates((prev) =>
      prev.map((item) =>
        item.id === certificateId
          ? { ...item, status: "revoked", revokeReason: reason }
          : item,
      ),
    )
    setNotifications((prev) => [
      makeNotif(
        "certificate_revoked",
        "Chứng nhận đã bị thu hồi",
        `${cert.eventTitle}: ${reason}`,
        "student-achievements",
        cert.eventId,
      ),
      ...prev,
    ])
    return { success: true }
  }

  function replaceCertificate(certificateId: string) {
    const cert = certificates.find((item) => item.id === certificateId)
    if (!cert) return { success: false, error: "Không tìm thấy chứng nhận." }
    const replacement: Certificate = {
      ...cert,
      id: `CERT-${Date.now()}`,
      code: `CEH-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "issued",
      issuedAt: nowStr(),
      replaces: cert.code,
      replacedBy: undefined,
      revokeReason: undefined,
    }
    setCertificates((prev) => [
      ...prev.map((item) =>
        item.id === certificateId
          ? {
              ...item,
              status: "replaced" as const,
              replacedBy: replacement.code,
            }
          : item,
      ),
      replacement,
    ])
    return { success: true, certificate: replacement }
  }

  function verifyCertificate(code: string): any {
    const q = code.trim().toLowerCase()
    const cert = certificates.find(
      (item) =>
        (item.ma_hash && item.ma_hash.toLowerCase() === q) ||
        (item.code && item.code.toLowerCase() === q) ||
        String(item.id).toLowerCase() === q,
    )
    if (!cert) return undefined

    const isRevoked = cert.da_thu_hoi || cert.status === "revoked"
    return {
      ...cert,
      trang_thai: isRevoked ? "DA_THU_HOI" : "HOP_LE",
      da_thu_hoi: isRevoked,
      ho_ten_che_mo: isRevoked
        ? null
        : cert.recipientName
          ? cert.recipientName.split(" ")[0] +
            " V** " +
            cert.recipientName.split(" ").slice(-1)[0]
          : "Nguyễn V** A",
      mssv_che_mo: isRevoked
        ? null
        : cert.studentId
          ? cert.studentId.slice(0, 4) + "****"
          : "2252****",
      ten_su_kien: cert.ten_su_kien || cert.eventTitle,
      don_vi_to_chuc: cert.don_vi_to_chuc || cert.issuer,
      ngay_cap: cert.ngay_cap || cert.issuedAt,
      ma_hash: cert.ma_hash || cert.code,
    }
  }

  async function manualOverrideAttendance(payload: {
    ma_dang_ky?: number
    ticketId?: string
    trang_thai_moi: "DaCheckIn" | "DaCheckOut"
    ti_le_drl_moi: number
    ly_do: string
    da_doi_soat_the?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    if (isApiMode()) {
      try {
        await attendanceService.manualOverride(payload)
      } catch (e) {
        return { success: false, error: getApiErrorMessage(e) }
      }
    }

    // Find ticket
    const ticket = tickets.find(
      (t) =>
        (payload.ma_dang_ky && t.ma_dang_ky === payload.ma_dang_ky) ||
        (payload.ticketId && t.id === payload.ticketId),
    )
    if (!ticket) {
      return {
        success: false,
        error: "Không tìm thấy vé hợp lệ để điều chỉnh.",
      }
    }

    // Business Rule (UC-OPS-04): Reject cancelled ticket (DaHuy) -> 409 INVALID_STATE_TRANSITION
    if (ticket.trang_thai === "DaHuy" || ticket.status === "cancelled") {
      return {
        success: false,
        error:
          "Không thể điều chỉnh điểm danh cho vé đã hủy (DaHuy) vì suất vé đã được hoàn trả hoặc chuyển cho danh sách chờ (409 INVALID_STATE_TRANSITION).",
      }
    }

    // Business Rule (UC-OPS-04.EX.1): Check if event DRL is locked
    const evt = events.find(
      (e) => e.id === ticket.eventId || e.ma_su_kien === ticket.ma_su_kien,
    )
    if (evt && (evt as any).da_chot_drl) {
      return {
        success: false,
        error:
          "Danh sách Điểm Rèn Luyện của sự kiện đã bị khóa chốt. Chỉ Quản trị viên P.CTSV mới có quyền mở khóa.",
      }
    }

    // Update ticket state
    setTickets((prev) =>
      prev.map((t) => {
        if (
          (payload.ma_dang_ky && t.ma_dang_ky === payload.ma_dang_ky) ||
          (payload.ticketId && t.id === payload.ticketId)
        ) {
          const isCheckout = payload.trang_thai_moi === "DaCheckOut"
          return {
            ...t,
            trang_thai: payload.trang_thai_moi,
            status: "attended" as const,
            ti_le_drl: payload.ti_le_drl_moi,
            vi_pham_no_show: false,
            nghi_van_gian_lan: false,
            ma_thiet_bi_nghi_van: null,
            thoi_gian_check_in: t.thoi_gian_check_in || nowStr(),
            thoi_gian_check_out: isCheckout
              ? t.thoi_gian_check_out || nowStr()
              : t.thoi_gian_check_out,
            checkinTime: t.checkinTime || "08:35",
            checkoutTime: isCheckout
              ? t.checkoutTime || "11:25"
              : t.checkoutTime,
            du_dieu_kien_drl: isCheckout && payload.ti_le_drl_moi > 0,
            co_the_feedback: isCheckout,
          }
        }
        return t
      }),
    )

    // Notify & audit log
    setNotifications((prev) => [
      {
        id: Date.now(),
        tieu_de: "Điều chỉnh điểm danh thủ công",
        title: "Điều chỉnh điểm danh thủ công",
        noi_dung: `Đã điều chỉnh vé #${ticket.ma_dang_ky || ticket.id} sang ${payload.trang_thai_moi} (${Math.round(payload.ti_le_drl_moi * 100)}% ĐRL). Đã xóa cờ nghi vấn gian lận/no-show và ghi nhận Audit Log.`,
        description: `Đã điều chỉnh vé #${ticket.ma_dang_ky || ticket.id} sang ${payload.trang_thai_moi} (${Math.round(payload.ti_le_drl_moi * 100)}% ĐRL). Đã xóa cờ nghi vấn gian lận/no-show và ghi nhận Audit Log.`,
        thoi_gian_gui: nowStr(),
        time: "Vừa xong",
        da_doc: false,
        read: false,
        loai_thong_bao: "CAP_NHAT_SU_KIEN",
        type: "event_update",
        action: "tickets",
      },
      ...prev,
    ])

    return { success: true }
  }

  return (
    <AppContext.Provider
      value={{
        events,
        tickets,
        notifications,
        permissions,
        approvalCases,
        attendanceRecords,
        surveyResponses,
        certificates,
        waitlistEntries,
        getStudentWaitlistEntries,
        joinWaitlist,
        claimWaitlistOffer,
        declineWaitlistOffer,
        getEvent,
        computeStatus: computeEventStatus,
        getUserActiveTicket,
        getActiveParticipants,
        getCheckedInCount,
        registerEvent,
        cancelTicket,
        checkIn,
        checkOut,
        markNotificationRead,
        markAllRead,
        getStudentPermissions,
        getEventPermissions,
        grantCheckinPermission,
        revokePermission,
        suspendPermission,
        reactivatePermission,
        saveApprovalDraft,
        updateApproval,
        cancelEvent,
        submitAttendanceResults,
        recognizeAttendance,
        requestAttendanceRevision,
        adjustAttendance,
        requestStudentReview,
        submitSurvey,
        issueCertificate,
        revokeCertificate,
        replaceCertificate,
        verifyCertificate,
        manualOverrideAttendance,
        loading: dataLoading,
        error: dataError,
        refetch: hydrate,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be inside AppProvider")
  return ctx
}
