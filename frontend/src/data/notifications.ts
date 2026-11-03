import type { NotificationType } from "./contract"

export type NotifType = NotificationType | "event_reminder" | "reg_close" | "reg_success" | "reg_cancelled" | "checkin_reminder" | "event_update" | "event_cancelled" | "approval_new" | "approval_revision" | "approval_done" | "result_pending" | "score_recognized" | "survey_open" | "certificate_issued" | "certificate_revoked"

export type NotifAction = "event-detail" | "ticket-confirm" | "tickets" | "faculty-inbox" | "faculty-detail" | "affairs-inbox" | "affairs-detail" | "affairs-results" | "student-achievements"

export interface Notification {
  // Contract fields
  id: any
  tieu_de: string
  noi_dung: string
  loai_thong_bao: NotificationType
  lien_ket?: string | null
  da_doc: boolean
  thoi_gian_gui: string

  // Legacy & UI convenience aliases
  title: string
  description: string
  type: NotifType
  time: string
  read: boolean
  action?: NotifAction
  eventId?: string
  audience?: "student" | "organizer" | "faculty_manager" | "student_affairs"
}

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    tieu_de: "Nhắc nhở: Sự kiện diễn ra trong 24h tới",
    noi_dung:
      "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu sẽ diễn ra ngày mai lúc 08:30 tại Hội trường A.",
    loai_thong_bao: "NHAC_HEN",
    lien_ket: "/events/101",
    da_doc: false,
    thoi_gian_gui: "2026-10-14T08:30:00+07:00",
    title: "Nhắc nhở: Sự kiện sắp diễn ra",
    description:
      "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu sẽ diễn ra ngày mai lúc 08:30 tại Hội trường A.",
    type: "NHAC_HEN",
    time: "10 phút trước",
    read: false,
    action: "event-detail",
    eventId: "EVT001",
    audience: "student",
  },
  {
    id: 2,
    tieu_de: "Nhắc nhở chuẩn bị Check-in hội trường",
    noi_dung:
      "Sự kiện Hội thảo Điện toán đám mây & Thực hành DevOps bắt đầu sau 2 giờ. Mở vé để quét QR.",
    loai_thong_bao: "NHAC_HEN",
    lien_ket: "/my-tickets/502",
    da_doc: false,
    thoi_gian_gui: "2026-10-14T06:30:00+07:00",
    title: "Nhắc nhở check-in sự kiện",
    description:
      "Sự kiện Hội thảo Điện toán đám mây & Thực hành DevOps bắt đầu sau 2 giờ. Mở vé để quét QR.",
    type: "NHAC_HEN",
    time: "2 giờ trước",
    read: false,
    action: "tickets",
    audience: "student",
  },
  {
    id: 3,
    tieu_de: "Đăng ký vé thành công",
    noi_dung:
      "Bạn đã giữ chỗ thành công sự kiện Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026.",
    loai_thong_bao: "VE_MOI",
    lien_ket: "/my-tickets/501",
    da_doc: true,
    thoi_gian_gui: "2026-10-10T14:22:00+07:00",
    title: "Đăng ký thành công",
    description:
      "Bạn đã đăng ký Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026.",
    type: "VE_MOI",
    time: "Hôm qua",
    read: true,
    action: "ticket-confirm",
    eventId: "EVT001",
    audience: "student",
  },
  {
    id: 4,
    tieu_de: "Hồ sơ sự kiện mới cần phê duyệt",
    noi_dung:
      "CLB WebDev UIT đã nộp hồ sơ sự kiện Hội thảo Cloud Native cần Khoa duyệt nội dung.",
    loai_thong_bao: "DE_XUAT_SU_KIEN",
    lien_ket: "/management/approvals",
    da_doc: false,
    thoi_gian_gui: "2026-10-13T10:00:00+07:00",
    title: "Hồ sơ sự kiện mới cần duyệt",
    description:
      "CLB WebDev UIT đã nộp hồ sơ sự kiện Hội thảo Cloud Native cần Khoa duyệt nội dung.",
    type: "DE_XUAT_SU_KIEN",
    time: "1 ngày trước",
    read: false,
    action: "faculty-inbox",
    audience: "faculty_manager",
  },
  {
    id: 5,
    tieu_de: "Khoa đã duyệt hồ sơ, chuyển P.CTSV thẩm định",
    noi_dung:
      "Hồ sơ sự kiện đã được Ban quản lý Khoa CNTT phê duyệt, đang chờ Phòng CTSV thẩm định quy tắc điểm.",
    loai_thong_bao: "KET_QUA_KIEM_DUYET",
    lien_ket: "/management/approvals",
    da_doc: false,
    thoi_gian_gui: "2026-10-12T15:30:00+07:00",
    title: "Khoa đã phê duyệt hồ sơ sự kiện",
    description:
      "Hồ sơ sự kiện đã được Ban quản lý Khoa CNTT phê duyệt, đang chờ Phòng CTSV thẩm định quy tắc điểm.",
    type: "KET_QUA_KIEM_DUYET",
    time: "2 ngày trước",
    read: false,
    action: "affairs-inbox",
    audience: "student_affairs",
  },
]

export function getNotifIcon(
  type: string,
): { bg: string; color: string; path: string } {
  const iconMap: Record<string, { bg: string; color: string; path: string }> = {
    NHAC_HEN: {
      bg: "#eef2ff",
      color: "#4f46e5",
      path: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
    VE_MOI: {
      bg: "#dcfce7",
      color: "#15803d",
      path: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
    DE_XUAT_SU_KIEN: {
      bg: "#fef9c3",
      color: "#a16207",
      path: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    },
    KET_QUA_KIEM_DUYET: {
      bg: "#eff6ff",
      color: "#1d4ed8",
      path: "M9 12.75 11.25 15 15 9.75m-6 6.75-3 3v-4.5m12 4.5 3 3v-4.5M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z",
    },
    CANH_BAO_NO_SHOW: {
      bg: "#fee2e2",
      color: "#b91c1c",
      path: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
    },
  }

  return (
    iconMap[type] || {
      bg: "#f1f5f9",
      color: "#64748b",
      path: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
    }
  )
}
