/**
 * Campus Event Hub — Enterprise API Contract (Contract v3.2.3 | Baseline v3.1.2)
 * TypeScript types & definitions strictly mapped 1:1 with OpenAPI 3.0.3 specification
 */

// ─── Enums & Literals ────────────────────────────────────────────────────────

/** Trạng thái vòng đời sự kiện (UC-EVT-01 -> 03) */
export type EventStatus = "DRAFT" | "WAITING_COHOST_CONFIRM" | "COHOST_REJECTED" | "PENDING_FACULTY" | "PENDING_ADMIN" | "APPROVED" | "REJECTED" | "PUBLISHED" | "HAPPENING" | "COMPLETED" | "CANCELLED"

/** Trạng thái vé tham dự cá nhân (UC-TCK-01) */
export type TicketStatus = "DaDangKy" | "DaCheckIn" | "DaCheckOut" | "DaHuy"

/** Phân loại tài khoản trong hệ thống (UC-AUTH-01 -> 05) */
export type UserRole = "SinhVien" | "ToChuc" | "Admin"

/** Cơ sở học tập & tổ chức */
export type Campus = "CoSo1" | "CoSo2"

/** Điều khoản cộng Điểm rèn luyện */
export type DrlRule = "KhongCo" | "Dieu3" | "Dieu4"

/** Phân loại đơn vị tổ chức */
export type OrganizationType = "Khoa" | "PhongBan" | "CLB_Doi_Nhom"

/** Trạng thái nút bấm điều hướng thời gian thực (UC-DISC-02) */
export type SmartActionButtonStatus = "CHUA_DANG_NHAP" | "DANG_KY" | "DA_CO_VE" | "DANG_O_WAITLIST" | "CO_OFFER_WAITLIST" | "VAO_WAITLIST" | "HET_VE_DONG_WAITLIST_T2H" | "DONG_DANG_KY_T2H" | "VAO_DIEM_DANH" | "SU_KIEN_DANG_DIEN_RA_DONG_DK" | "LAM_FEEDBACK_NHAN_CERT" | "SU_KIEN_DA_KET_THUC" | "SU_KIEN_DA_HUY"

/** Trạng thái chứng nhận công khai */
export type CertificatePublicStatus = "HOP_LE" | "DA_THU_HOI"

/** Phân loại thông báo hệ thống */
export type NotificationType = "HE_THONG" | "MOI_DONG_TO_CHUC" | "PHAN_HOI_DONG_TO_CHUC" | "DE_XUAT_SU_KIEN" | "KET_QUA_KIEM_DUYET" | "CAP_NHAT_SU_KIEN" | "DOI_PHONG_KHAN_CAP" | "HUY_SU_KIEN" | "NHAC_HEN" | "CLAIM_SLOT" | "VE_MOI" | "WAITLIST_DONG" | "CANH_BAO_NO_SHOW"

// ─── Human-readable Labels & Badges ─────────────────────────────────────────

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Bản nháp",
  WAITING_COHOST_CONFIRM: "Chờ đồng tổ chức xác nhận",
  COHOST_REJECTED: "Đồng tổ chức từ chối",
  PENDING_FACULTY: "Chờ Khoa duyệt",
  PENDING_ADMIN: "Chờ CTSV duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  PUBLISHED: "Đang mở đăng ký",
  HAPPENING: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
}

export const EVENT_STATUS_COLORS: Record<EventStatus, {
  bg: string
  text: string
}> = {
  DRAFT: { bg: "#f1f5f9", text: "#64748b" },
  WAITING_COHOST_CONFIRM: { bg: "#fef9c3", text: "#a16207" },
  COHOST_REJECTED: { bg: "#fee2e2", text: "#b91c1c" },
  PENDING_FACULTY: { bg: "#fff7ed", text: "#c2410c" },
  PENDING_ADMIN: { bg: "#eff6ff", text: "#1d4ed8" },
  APPROVED: { bg: "#f0fdf4", text: "#15803d" },
  REJECTED: { bg: "#fee2e2", text: "#b91c1c" },
  PUBLISHED: { bg: "#dcfce7", text: "#15803d" },
  HAPPENING: { bg: "#e0e7ff", text: "#4338ca" },
  COMPLETED: { bg: "#f1f5f9", text: "#64748b" },
  CANCELLED: { bg: "#fee2e2", text: "#b91c1c" },
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  DaDangKy: "Chưa check-in",
  DaCheckIn: "Đã check-in",
  DaCheckOut: "Đã check-out",
  DaHuy: "Đã hủy",
}

export const TICKET_STATUS_COLORS: Record<TicketStatus, {
  bg: string
  text: string
}> = {
  DaDangKy: { bg: "#eef2ff", text: "#4338ca" },
  DaCheckIn: { bg: "#dcfce7", text: "#15803d" },
  DaCheckOut: { bg: "#e0f2fe", text: "#0369a1" },
  DaHuy: { bg: "#fee2e2", text: "#b91c1c" },
}

// ─── Component Schemas ──────────────────────────────────────────────────────

/** Chuyên đề sự kiện */
export interface Topic {
  ma_chuyen_de: number
  ten_chuyen_de: string
  mo_ta?: string | null
  da_xoa: boolean
}

/** Tóm tắt đơn vị tổ chức */
export interface OrganizationSummary {
  ma_don_vi: number
  ten_don_vi: string
  loai_don_vi: OrganizationType
  ma_don_vi_cha?: number | null
}

/** Chi tiết đơn vị tổ chức (UC-ADM-01) */
export interface Organization extends OrganizationSummary {
  mo_ta?: string | null
  hoat_dong: boolean
  thoi_gian_tao: string
  thoi_gian_cap_nhat?: string
}

/** Trạng thái lời mời đồng tổ chức */
export interface CohostInvitationStatus {
  id: number
  ma_su_kien: number
  ten_su_kien: string
  don_vi_host: OrganizationSummary
  don_vi_dong_to_chuc: OrganizationSummary
  trang_thai_xac_nhan: "CHO_XAC_NHAN" | "DONG_Y" | "TU_CHOI"
  ly_do_tu_choi?: string | null
  thoi_gian_tao: string
  thoi_gian_bat_dau?: string
  thoi_gian_ket_thuc?: string
  ten_phong?: string
}

/** Payload tạo bản nháp sự kiện */
export interface EventCreateDraftPayload {
  ten_su_kien: string
  ma_chuyen_de?: number
  mo_ta?: string
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  ma_phong?: number | null
  danh_sach_ma_dong_to_chuc?: number[]
  khong_gioi_han_slot?: boolean
  so_luong_toi_da?: number | null
  dieu_khoan_drl?: DrlRule | string
  diem_drl_du_kien?: number
  gio_tinh_nguyen?: number
  anh_bia?: string | null
  dien_gia?: string | null
  doi_tuong_tham_gia?: string | null
  lo_trinh?: AgendaItem[] | null
  danh_sach_co_host_ids?: number[]
  ngay_cong_bo?: string
  [key: string]: unknown
}

/** Payload cập nhật bản nháp sự kiện */
export type EventUpdateDraftPayload = Partial<EventCreateDraftPayload>

/** Payload thẩm định sự kiện */
export interface EventReviewPayload {
  trang_thai?: "APPROVED" | "REJECTED" | string
  ly_do_tu_choi?: string
  ghi_chu?: string
  hanh_dong?: string
  [key: string]: unknown
}

/** Payload đổi phòng khẩn cấp */
export interface EventChangeRoomPayload {
  ma_phong_moi: number | string
  ly_do: string
}

/** Thông tin phòng ốc công khai */
export interface RoomPublic {
  ma_phong: number
  ten_phong: string
  suc_chua: number
  co_so: Campus
  toa_nha: string
  vi_tri_tang: number
  thiet_bi: {
    may_chieu: boolean
    am_thanh: boolean
    wifi: boolean
  }
  trang_thai?: "KhaDung" | "BaoTri"
  bao_tri_tu_ngay?: string | null
  bao_tri_den_ngay?: string | null
  xac_nhan_bo_qua_canh_bao?: boolean
}

/** Lịch đặt phòng */
export interface RoomScheduleEntry {
  ma_dat_phong?: number
  ma_su_kien?: number
  ten_su_kien?: string
  tieu_de?: string
  ten_don_vi_host?: string
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  trang_thai: string
  loai?: "CONFIRMED" | "PENDING_HOLD" | "BAO_TRI" | string
}

/** Kết quả kiểm tra tình trạng trống của phòng */
export interface RoomAvailabilityCheck {
  ma_phong: number
  trong_lich: boolean
  xung_dot?: {
    ma_su_kien: number
    ten_su_kien: string
    thoi_gian_bat_dau: string
    thoi_gian_ket_thuc: string
  } | null
}

/** Payload bài đánh giá sự kiện */
export interface FeedbackPayload {
  ma_su_kien?: number
  diem_noi_dung?: number
  diem_dien_gia?: number
  diem_to_chuc?: number
  gop_y?: string
  content?: number
  organization?: number
  venue?: number
  overall?: number
  useful?: string
  improvement?: string
  joinAgain?: boolean
}

/** Phân bổ sự kiện theo chuyên đề (UC-REP-02) */
export interface MacroTopicBreakdown {
  ten_chuyen_de: string
  so_su_kien: number
  tong_luot_tham_du: number
}

/** Phân bổ sự kiện theo cấp đơn vị (UC-REP-02) */
export interface MacroUnitLevelBreakdown {
  loai_don_vi: "CLB" | "DoanHoi" | "Khoa" | "PhongBan" | string
  so_su_kien: number
}

/** Công suất sử dụng phòng hội trường (UC-REP-02) */
export interface MacroRoomOccupancy {
  ma_phong: number
  ten_phong: string
  so_su_kien_to_chuc: number
  ty_le_lap_day_tb_pct: number
}

/** Đơn vị tổ chức tích cực nhất kèm điểm hài lòng (UC-REP-02) */
export interface MacroTopUnit {
  ma_don_vi_to_chuc: number
  ten_don_vi: string
  so_su_kien: number
  diem_hai_long_tb: number | null
}

/** Báo cáo chiến lược vĩ mô toàn trường (UC-REP-02, OpenAPI AdminMacroDashboard) */
export interface AdminMacroDashboard {
  tu_ngay: string
  den_ngay: string
  tong_so_su_kien: number
  tong_luot_sinh_vien_tham_gia: number
  ty_le_show_up_toan_truong_pct: number
  ty_le_no_show_toan_truong_pct: number
  toc_do_chay_ve_phut_tb: number | null
  su_kien_theo_chuyen_de: MacroTopicBreakdown[]
  su_kien_theo_cap_don_vi: MacroUnitLevelBreakdown[]
  cong_suat_su_dung_phong: MacroRoomOccupancy[]
  top_don_vi_hoat_dong_tich_cuc: MacroTopUnit[]
}

/** Thống kê vĩ mô cấp trường (Tương thích ngược & mở rộng AdminMacroDashboard) */
export interface MacroAnalytics {
  tu_ngay?: string
  den_ngay?: string
  tong_so_su_kien: number
  tong_luot_sinh_vien_tham_gia: number
  ty_le_show_up_toan_truong_pct?: number
  ty_le_no_show_toan_truong_pct?: number
  ty_le_checkin_tb?: number
  ty_le_no_show_tb?: number
  toc_do_chay_ve_phut_tb?: number | null
  su_kien_theo_chuyen_de?: MacroTopicBreakdown[] | Record<string, number>
  su_kien_theo_cap_don_vi?: MacroUnitLevelBreakdown[]
  cong_suat_su_dung_phong?: MacroRoomOccupancy[]
  top_don_vi_hoat_dong_tich_cuc?: MacroTopUnit[]
}

/** Hồ sơ sinh viên vi phạm No-show */
export interface NoShowViolationItem {
  ma_tai_khoan: number
  mssv: string
  ho_ten: string
  lop_sinh_hoat: string
  so_lan_vi_pham: number
  danh_sach_su_kien_no_show?: {
    ma_su_kien: number
    ten_su_kien: string
    ngay_dien_ra: string
  }[]
}

/** Hạng mục trong lộ trình sự kiện */
export interface AgendaItem {
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  tieu_de: string
  dien_gia?: string | null
  mo_ta?: string | null
}

/** Nút bấm thông minh thời gian thực (Smart Action Button) */
export interface SmartActionButton {
  trang_thai_nut: SmartActionButtonStatus
  thong_diep_nut: string
  cho_phep_bam: boolean
  ma_dang_ky?: number | null
  ma_hang_doi?: number | null
  so_thu_tu_waitlist?: number | null
  han_chot_offer?: string | null
  so_giay_offer_con_lai?: number | null
}

/** Thẻ sự kiện rút gọn trong danh sách công khai (EventCard) */
export interface EventCard {
  ma_su_kien: number
  ten_su_kien: string
  anh_bia?: string | null
  dien_gia?: string | null
  ten_chuyen_de: string
  ten_don_vi_host: string
  danh_sach_ten_dong_to_chuc: string[]
  ten_phong: string
  co_so: Campus
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  khong_gioi_han_slot: boolean
  so_ve_con_lai?: number | null
  so_luong_toi_da?: number | null
  trang_thai: EventStatus
  dieu_khoan_drl: DrlRule
  diem_drl_du_kien: number
}

/** Chi tiết sự kiện công khai (EventPublicDetail) */
export interface EventPublicDetail extends EventCard {
  mo_ta: string
  lo_trinh?: AgendaItem[] | null
  doi_tuong_tham_gia?: string | null
  chuyen_de: Topic
  don_vi_host: OrganizationSummary
  danh_sach_dong_to_chuc: OrganizationSummary[]
  phong: RoomPublic
  ngay_cong_bo: string
  gio_tinh_nguyen: number
  nut_bam_dieu_huong: SmartActionButton
}

/** Tài khoản người dùng (User) */
export interface User {
  ma_tai_khoan: number
  ho_ten: string
  mssv?: string | null
  email: string
  loai_tai_khoan: UserRole
  so_dien_thoai?: string | null
  lop_sinh_hoat?: string | null
  ma_khoa?: number | null
  khoa?: string | null
  ma_don_vi_to_chuc?: number | null
  don_vi?: OrganizationSummary | null
  avatar_url?: string | null
  dong_y_nghi_dinh_13: boolean
  buoc_doi_mat_khau: boolean
  la_nhan_vien_soat_ve: boolean
  hoat_dong: boolean
  thoi_gian_tao: string
}

/** Thông tin vé trong ví vé cá nhân (Ticket) */
export interface Ticket {
  ma_dang_ky: number
  ma_ve_uuid: string
  ma_su_kien: number
  ten_su_kien: string
  trang_thai_su_kien: EventStatus
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  ten_phong: string
  co_so: Campus
  trang_thai: TicketStatus
  thoi_gian_dang_ky: string
  thoi_gian_check_in?: string | null
  thoi_gian_check_out?: string | null
  thoi_gian_huy?: string | null
  ly_do_huy?: string | null
  han_chot_huy: string
  cho_phep_huy: boolean
  ti_le_drl: number
  diem_drl_du_kien: number
  da_feedback: boolean
  han_feedback?: string | null
  han_an_han_feedback?: string | null
  co_the_feedback: boolean
  du_dieu_kien_drl: boolean
  ma_chung_nhan?: number | null
  co_the_nhan_chung_nhan: boolean
  vi_pham_no_show: boolean
  nghi_van_gian_lan: boolean
}

/** Chi tiết vé kèm QR và chữ ký HMAC (TicketDetail) */
export interface TicketDetail extends Ticket {
  chu_ky_hmac: string
  payload_qr: string
  yeu_cau_wake_lock: boolean
  ma_thiet_bi_nghi_van?: string | null
}

/** Bản ghi người tham dự sự kiện (Participant) */
export interface Participant {
  ma_dang_ky: number
  ma_tai_khoan: number
  mssv: string
  ho_ten: string
  lop_sinh_hoat?: string | null
  khoa?: string | null
  trang_thai: TicketStatus
  thoi_gian_dang_ky: string
  thoi_gian_check_in?: string | null
  thoi_gian_check_out?: string | null
  da_check_in: boolean
  da_check_out: boolean
  thoi_luong_tham_du_phut: number
  ty_le_tham_du_pct: number
  ti_le_drl: number
  diem_drl_thuc_nhan: number
  da_feedback: boolean
  du_dieu_kien_drl: boolean
  nghi_van_gian_lan: boolean
  vi_pham_no_show: boolean
}

/** Phân công nhân sự soát vé (StaffAssignment) */
export interface StaffAssignment {
  id: number
  ma_su_kien: number
  ma_tai_khoan: number
  mssv: string
  ho_ten: string
  lop_sinh_hoat?: string | null
  khoa?: string | null
  thoi_gian_phan_cong: string
}

/** Chứng nhận tham gia sự kiện (Certificate) */
export interface Certificate {
  id: number
  ma_dang_ky: number
  ma_su_kien: number
  ten_su_kien: string
  don_vi_to_chuc: string
  ngay_cap: string
  ma_hash: string
  ty_le_tham_du_pct: number
  diem_drl_thuc_nhan: number
  file_pdf_url: string
  da_thu_hoi: boolean
  thoi_gian_thu_hoi?: string | null
  ly_do_thu_hoi?: string | null
}

/** Thông tin xác thực chứng nhận công khai tuân thủ Nghị định 13 (CertificatePublic) */
export interface CertificatePublic {
  trang_thai: CertificatePublicStatus
  da_thu_hoi: boolean
  ho_ten_che_mo?: string | null
  mssv_che_mo?: string | null
  ten_su_kien?: string | null
  don_vi_to_chuc?: string | null
  ngay_cap?: string | null
}

/** Bản ghi đối soát Điểm rèn luyện View v_danh_sach_drl (DrlRecord) */
export interface DrlRecord {
  stt: number
  mssv: string
  ho_ten: string
  lop_sinh_hoat: string
  khoa: string
  ten_su_kien: string
  dieu_drl: string
  diem_cong_thuc_nhan: number
  thoi_gian_vao: string
  thoi_gian_ra: string
  thoi_luong_tham_du_phut: number
  ghi_chu_tham_du: string
}

/** Thông báo In-app (Notification) */
export interface Notification {
  id: number
  tieu_de: string
  noi_dung: string
  loai_thong_bao: NotificationType
  lien_ket?: string | null
  da_doc: boolean
  thoi_gian_gui: string
}

/** Báo cáo phân tích Dashboard Ban tổ chức (OrganizerDashboard) */
export interface OrganizerDashboard {
  ma_su_kien: number
  khong_gioi_han_slot: boolean
  so_luong_toi_da?: number | null
  tong_ve_dang_ky: number
  so_luong_check_in: number
  so_luong_check_out: number
  ty_le_lap_day_pct?: number | null
  ty_le_show_up_pct: number
  so_luong_no_show?: number | null
  ty_le_no_show_pct?: number | null
  diem_noi_dung_tb?: number | null
  diem_dien_gia_tb?: number | null
  diem_to_chuc_tb?: number | null
}

// ─── Standard QR Format Utilities (Contract v3.2.3 Spec) ────────────────────

/**
 * Tạo chuỗi QR theo chuẩn hợp đồng:
 * CEH1.{ma_ve_uuid}.{ma_tai_khoan}.{ma_su_kien}.{chu_ky_hmac}
 */
export function buildQrPayload(
  ma_ve_uuid: string,
  ma_tai_khoan: number,
  ma_su_kien: number,
  chu_ky_hmac: string = "a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
): string {
  return `CEH1.${ma_ve_uuid}.${ma_tai_khoan}.${ma_su_kien}.${chu_ky_hmac}`
}

/**
 * Phân tích cú pháp chuỗi QR soát vé:
 * Hỗ trợ định dạng chuẩn hợp đồng CEH1 và định dạng fallback
 */
export function parseQrPayload(
  raw: string,
): {
  isValid: boolean
  version?: string
  ma_ve_uuid?: string
  ma_tai_khoan?: number
  ma_su_kien?: number
  chu_ky_hmac?: string
  code?: string
} {
  const trimmed = raw.trim()
  const match = trimmed.match(
    /^CEH1\.([0-9a-fA-F-]{36})\.([0-9]+)\.([0-9]+)\.([0-9a-f]{64})$/,
  )
  if (match) {
    return {
      isValid: true,
      version: "CEH1",
      ma_ve_uuid: match[1],
      ma_tai_khoan: parseInt(match[2], 10),
      ma_su_kien: parseInt(match[3], 10),
      chu_ky_hmac: match[4],
      code: trimmed,
    }
  }
  // Fallback for pipe separated or raw UUID / Ticket ID
  if (trimmed.includes("|")) {
    const parts = trimmed.split("|")
    return {
      isValid: true,
      ma_ve_uuid: parts[0],
      code: parts[0],
    }
  }
  return {
    isValid: trimmed.length > 0,
    code: trimmed,
  }
}

export interface WaitlistEntry {
  id: number
  ma_su_kien: number
  ten_su_kien: string
  thoi_gian_bat_dau: string
  thoi_gian_ket_thuc: string
  ten_phong: string
  co_so: "CoSo1" | "CoSo2"
  so_thu_tu: number
  trang_thai: "WAITING" | "OFFERED" | "ACCEPTED" | "EXPIRED" | "CANCELLED" | "DECLINED"
  thoi_gian_dang_ky: string
  thoi_gian_het_han_giu_cho?: string | null
  han_chot_xac_nhan?: string | null
  thoi_gian_phan_hoi?: string | null
  so_giay_con_lai?: number
  ma_tai_khoan: number
  mssv?: string
  ho_ten: string
  studentId: string
}
