/**
 * Campus Event Hub — Mock Data & Datasets
 * Synchronized with Enterprise API Contract v3.2.3
 */

import {
  type EventStatus,
  type TicketStatus,
  type UserRole,
  type DrlRule,
  type Campus,
  type Topic as ContractTopic,
  type OrganizationSummary,
  type RoomPublic,
  type AgendaItem,
  type SmartActionButton,
  type EventCard as ContractEventCard,
  type EventPublicDetail,
  type Ticket as ContractTicket,
  type TicketDetail as ContractTicketDetail,
  type User as ContractUser,
  type Participant as ContractParticipant,
  type StaffAssignment as ContractStaffAssignment,
  type Certificate as ContractCertificate,
  type CertificatePublic as ContractCertificatePublic,
  type DrlRecord as ContractDrlRecord,
  type OrganizerDashboard as ContractOrganizerDashboard,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  buildQrPayload,
  parseQrPayload,
} from "./contract"

export * from "./contract"

// ─── Legacy & Convenience Type Aliases ──────────────────────────────────────

export type TopicKey = "academic" | "skill" | "culture" | "sport" | "community"
export type Topic = TopicKey

export const TOPIC_LABELS: Record<string, string> = {
  academic: "Học thuật & Trí tuệ nhân tạo",
  skill: "Kỹ năng mềm & Công nghệ",
  culture: "Văn hóa & Nghệ thuật",
  sport: "Thể dục Thể thao",
  community: "Hoạt động Cộng đồng",
}

export const CONTRACT_TOPICS: ContractTopic[] = [
  {
    ma_chuyen_de: 1,
    ten_chuyen_de: "Trí tuệ Nhân tạo & Khoa học Dữ liệu",
    da_xoa: false,
  },
  {
    ma_chuyen_de: 2,
    ten_chuyen_de: "Điện toán Đám mây & DevOps",
    da_xoa: false,
  },
  {
    ma_chuyen_de: 3,
    ten_chuyen_de: "Kỹ năng Lãnh đạo & Khởi nghiệp",
    da_xoa: false,
  },
  {
    ma_chuyen_de: 4,
    ten_chuyen_de: "Lễ hội Âm nhạc & Bản sắc Văn hóa",
    da_xoa: false,
  },
  {
    ma_chuyen_de: 5,
    ten_chuyen_de: "Giải Thể thao Sinh viên UIT",
    da_xoa: false,
  },
]

export const ORGANIZATIONS: OrganizationSummary[] = [
  {
    ma_don_vi: 1,
    ten_don_vi: "Khoa Hệ thống Thông tin",
    loai_don_vi: "Khoa",
    ma_don_vi_cha: null,
  },
  {
    ma_don_vi: 2,
    ten_don_vi: "Khoa Công nghệ Thông tin",
    loai_don_vi: "Khoa",
    ma_don_vi_cha: null,
  },
  {
    ma_don_vi: 3,
    ten_don_vi: "Phòng Công tác Sinh viên (CTSV)",
    loai_don_vi: "PhongBan",
    ma_don_vi_cha: null,
  },
  {
    ma_don_vi: 4,
    ten_don_vi: "CLB WebDev UIT",
    loai_don_vi: "CLB",
    ma_don_vi_cha: 1,
  },
  {
    ma_don_vi: 5,
    ten_don_vi: "Đoàn Thanh niên - Hội Sinh viên",
    loai_don_vi: "DoanHoi",
    ma_don_vi_cha: null,
  },
]

export const ROOMS: RoomPublic[] = [
  {
    ma_phong: 1,
    ten_phong: "Hội trường A",
    suc_chua: 250,
    co_so: "CoSo1",
    toa_nha: "Tòa A",
    vi_tri_tang: 1,
    thiet_bi: { may_chieu: true, am_thanh: true, wifi: true },
  },
  {
    ma_phong: 2,
    ten_phong: "Hội trường E",
    suc_chua: 200,
    co_so: "CoSo1",
    toa_nha: "Tòa E",
    vi_tri_tang: 2,
    thiet_bi: { may_chieu: true, am_thanh: true, wifi: true },
  },
  {
    ma_phong: 3,
    ten_phong: "Hội trường B",
    suc_chua: 150,
    co_so: "CoSo1",
    toa_nha: "Tòa B",
    vi_tri_tang: 1,
    thiet_bi: { may_chieu: true, am_thanh: true, wifi: true },
  },
  {
    ma_phong: 4,
    ten_phong: "Nhà Thi đấu Đa năng",
    suc_chua: 300,
    co_so: "CoSo1",
    toa_nha: "Khu Thể thao",
    vi_tri_tang: 1,
    thiet_bi: { may_chieu: false, am_thanh: true, wifi: true },
  },
]

// Unified Event Interface supporting both Contract fields and Legacy aliases
export type UiEventStatus =
  | EventStatus
  | "draft"
  | "pending"
  | "upcoming"
  | "happening"
  | "completed"
  | "cancelled"
  | "open"
  | "full"
  | "nearly_full"
  | "closed"
  | "ended"
  | "published"
  | "rejected"
  | string

export interface Event
  extends ContractEventCard {
  // Legacy aliases
  // Extended contract fields
  id: string
  title: string
  speaker: string
  topic: TopicKey | string
  description: string
  date: string
  time: string
  endTime: string
  location: string
  room: string
  capacity: number
  registered: number
  status: UiEventStatus
  banner: string
  organizer: string
  benefits: string[]
  schedule: { time: string; title: string }[]
  mo_ta: string
  lo_trinh: AgendaItem[]
  chuyen_de: ContractTopic
  don_vi_host: OrganizationSummary
  danh_sach_dong_to_chuc: OrganizationSummary[]
  phong: RoomPublic
  ngay_cong_bo: string
  gio_tinh_nguyen: number
  doi_tuong_tham_gia?: string | null
  nut_bam_dieu_huong?: SmartActionButton
  da_chot_drl?: boolean
  so_luong_da_dang_ky?: number
  coHosts?: string[]
  ly_do_tu_choi?: string | null
  points?: number
}

// Unified Ticket Interface supporting both Contract fields and Legacy aliases
export interface Ticket
  extends ContractTicketDetail {
  // Legacy aliases
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  studentId: string
  studentName: string
  faculty: string
  status: TicketStatus | "attended" | "pending" | "cancelled" | "checked_in" | "checked_out"
  checkinTime?: string
  checkoutTime?: string
  qrCode: string
  registeredAt: string
  ticketCode?: string
  mssv?: string
  studentEmail?: string
}

export interface Staff {
  id: string
  name: string
  email: string
  assignedEvent: string
  permission: string
  accountStatus: "active" | "inactive" | "locked"
  lastActive: string
}

// ─── Unified Mock Events Dataset ────────────────────────────────────────────

export const EVENTS: Event[] = [
  {
    ma_su_kien: 101,
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    anh_bia:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
    dien_gia: "TS. Nguyễn Minh Anh – Chuyên gia AI Viettel",
    ten_chuyen_de: "Trí tuệ Nhân tạo & Khoa học Dữ liệu",
    ten_don_vi_host: "Khoa Hệ thống Thông tin",
    danh_sach_ten_dong_to_chuc: ["CLB WebDev UIT", "Khoa Công nghệ Thông tin"],
    ten_phong: "Hội trường A",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    ngay_cong_bo: "2026-10-01T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 200,
    so_ve_con_lai: 20,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu3",
    diem_drl_du_kien: 5,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Sự kiện kết nối sinh viên với các chuyên gia AI và khoa học dữ liệu hàng đầu. Cơ hội gặp gỡ nhà tuyển dụng từ các công ty công nghệ top 10 Việt Nam và định hướng lộ trình nghề nghiệp trí tuệ nhân tạo.",
    doi_tuong_tham_gia:
      "Sinh viên toàn trường UIT và các trường thành viên ĐHQG-HCM",
    chuyen_de: CONTRACT_TOPICS[0],
    don_vi_host: ORGANIZATIONS[0],
    danh_sach_dong_to_chuc: [ORGANIZATIONS[3], ORGANIZATIONS[1]],
    phong: ROOMS[0],
    lo_trinh: [
      {
        thoi_gian_bat_dau: "08:30",
        thoi_gian_ket_thuc: "09:00",
        tieu_de: "Đón tiếp & Khai mạc sự kiện",
        dien_gia: "Ban tổ chức",
      },
      {
        thoi_gian_bat_dau: "09:00",
        thoi_gian_ket_thuc: "10:00",
        tieu_de: "Xu hướng AI và cơ hội nghề nghiệp 2026",
        dien_gia: "TS. Nguyễn Minh Anh",
      },
      {
        thoi_gian_bat_dau: "10:00",
        thoi_gian_ket_thuc: "11:00",
        tieu_de: "Tọa đàm: Chuẩn bị kỹ năng thực chiến",
        dien_gia: "Doanh nghiệp khách mời",
      },
      {
        thoi_gian_bat_dau: "11:00",
        thoi_gian_ket_thuc: "11:30",
        tieu_de: "Giao lưu doanh nghiệp & Check-out",
        dien_gia: "Toàn thể",
      },
    ],
    // Legacy mapping
    id: "EVT001",
    title: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    speaker: "TS. Nguyễn Minh Anh – Chuyên gia AI Viettel",
    topic: "academic",
    description:
      "Sự kiện kết nối sinh viên với các chuyên gia AI và khoa học dữ liệu hàng đầu. Cơ hội gặp gỡ nhà tuyển dụng từ các công ty công nghệ top 10 Việt Nam.",
    date: "2026-10-15",
    time: "08:30",
    endTime: "11:30",
    location: "Trường Đại học Công nghệ Thông tin",
    room: "Hội trường A",
    capacity: 200,
    registered: 180,
    status: "nearly_full",
    banner:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format",
    organizer: "Khoa Hệ thống Thông tin",
    benefits: [
      "Cộng +5 điểm rèn luyện (Điều 3)",
      "Chứng nhận kỹ năng số chính thức",
      "Giao lưu tuyển dụng trực tiếp",
      "Cơ hội thực tập doanh nghiệp",
    ],
    schedule: [
      { time: "08:30", title: "Đón tiếp & Khai mạc" },
      { time: "09:00", title: "Xu hướng AI năm 2026 – TS. Nguyễn Minh Anh" },
      { time: "10:00", title: "Panel Discussion: AI trong thực tế" },
      { time: "11:00", title: "Networking & Check-out nhận điểm" },
    ],
  },
  {
    ma_su_kien: 102,
    ten_su_kien: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    anh_bia:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&auto=format",
    dien_gia: "Trần Quốc Bảo – Cloud Architect tại AWS",
    ten_chuyen_de: "Điện toán Đám mây & DevOps",
    ten_don_vi_host: "CLB WebDev UIT",
    danh_sach_ten_dong_to_chuc: [],
    ten_phong: "Hội trường E",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-10-18T14:00:00+07:00",
    thoi_gian_ket_thuc: "2026-10-18T17:00:00+07:00",
    ngay_cong_bo: "2026-10-02T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 150,
    so_ve_con_lai: 55,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu3",
    diem_drl_du_kien: 5,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Khám phá kiến trúc microservices, Kubernetes và quy trình CI/CD tự động hóa trong môi trường production thực tế của các tập đoàn công nghệ toàn cầu.",
    chuyen_de: CONTRACT_TOPICS[1],
    don_vi_host: ORGANIZATIONS[3],
    danh_sach_dong_to_chuc: [],
    phong: ROOMS[1],
    lo_trinh: [
      {
        thoi_gian_bat_dau: "14:00",
        thoi_gian_ket_thuc: "14:30",
        tieu_de: "Khai mạc & Check-in",
        dien_gia: "BTC",
      },
      {
        thoi_gian_bat_dau: "14:30",
        thoi_gian_ket_thuc: "15:45",
        tieu_de: "AWS Cloud Native & K8s Deep Dive",
        dien_gia: "Trần Quốc Bảo",
      },
      {
        thoi_gian_bat_dau: "15:45",
        thoi_gian_ket_thuc: "17:00",
        tieu_de: "Hands-on CI/CD Pipeline & Q&A",
        dien_gia: "Trần Quốc Bảo",
      },
    ],
    // Legacy mapping
    id: "EVT002",
    title: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    speaker: "Trần Quốc Bảo – Cloud Architect tại AWS",
    topic: "skill",
    description:
      "Khám phá kiến trúc microservices, Kubernetes và quy trình CI/CD tự động hóa trong môi trường production thực tế.",
    date: "2026-10-18",
    time: "14:00",
    endTime: "17:00",
    location: "Trường Đại học Công nghệ Thông tin",
    room: "Hội trường E",
    capacity: 150,
    registered: 95,
    status: "open",
    banner:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&auto=format",
    organizer: "CLB WebDev UIT",
    benefits: [
      "+5 điểm rèn luyện (Điều 3)",
      "Voucher thi chứng chỉ AWS Cloud Practitioner",
      "Tài liệu thực hành Kubernetes độc quyền",
    ],
    schedule: [
      { time: "14:00", title: "Khai mạc & Check-in" },
      { time: "14:30", title: "Cloud Architecture Deep Dive" },
      { time: "15:45", title: "Demo: CI/CD Pipeline với GitHub Actions" },
      { time: "16:30", title: "Q&A và bốc thăm may mắn" },
    ],
  },
  {
    ma_su_kien: 103,
    ten_su_kien: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
    anh_bia:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop&auto=format",
    dien_gia: "Lê Hoàng Yến – Chuyên gia Đào tạo Kỹ năng mềm",
    ten_chuyen_de: "Kỹ năng Lãnh đạo & Khởi nghiệp",
    ten_don_vi_host: "Phòng Công tác Sinh viên (CTSV)",
    danh_sach_ten_dong_to_chuc: [],
    ten_phong: "Hội trường B",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-10-22T09:00:00+07:00",
    thoi_gian_ket_thuc: "2026-10-22T11:30:00+07:00",
    ngay_cong_bo: "2026-10-05T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 100,
    so_ve_con_lai: 0,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu4",
    diem_drl_du_kien: 4,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Trang bị cho sinh viên kỹ năng làm việc nhóm, giao tiếp tự tin trước đám đông và phong cách thuyết trình truyền cảm hứng.",
    chuyen_de: CONTRACT_TOPICS[2],
    don_vi_host: ORGANIZATIONS[2],
    danh_sach_dong_to_chuc: [],
    phong: ROOMS[2],
    lo_trinh: [],
    // Legacy mapping
    id: "EVT003",
    title: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
    speaker: "Lê Hoàng Yến – Chuyên gia Đào tạo Kỹ năng mềm",
    topic: "skill",
    description:
      "Trang bị cho sinh viên kỹ năng làm việc nhóm, giao tiếp tự tin và phong cách thuyết trình truyền cảm hứng.",
    date: "2026-10-22",
    time: "09:00",
    endTime: "11:30",
    location: "Trường Đại học Công nghệ Thông tin",
    room: "Hội trường B",
    capacity: 100,
    registered: 100,
    status: "full",
    banner:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop&auto=format",
    organizer: "Phòng Công tác Sinh viên (CTSV)",
    benefits: [
      "+4 điểm rèn luyện (Điều 4)",
      "Bộ tài liệu hướng dẫn thuyết trình TED-style",
      "Chứng chỉ tham gia từ diễn giả",
    ],
    schedule: [
      { time: "09:00", title: "Khai mạc & Khởi động" },
      { time: "09:30", title: "Nghệ thuật kể chuyện trong thuyết trình" },
      { time: "10:30", title: "Thực hành theo nhóm & Nhận xét" },
      { time: "11:15", title: "Tổng kết & Trao giải nhóm xuất sắc" },
    ],
  },
  {
    ma_su_kien: 104,
    ten_su_kien: "Lễ hội Âm nhạc Sinh viên & Đêm nhạc UIT Acoustics 2026",
    anh_bia:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop&auto=format",
    dien_gia: "CLB Văn nghệ Xung kích UIT",
    ten_chuyen_de: "Lễ hội Âm nhạc & Bản sắc Văn hóa",
    ten_don_vi_host: "Đoàn Thanh niên - Hội Sinh viên",
    danh_sach_ten_dong_to_chuc: [],
    ten_phong: "Hội trường A",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-10-26T18:00:00+07:00",
    thoi_gian_ket_thuc: "2026-10-26T21:30:00+07:00",
    ngay_cong_bo: "2026-10-08T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 250,
    so_ve_con_lai: 70,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu4",
    diem_drl_du_kien: 3,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Đêm nhạc sinh viên chào đón tân sinh viên với các tiết mục nghệ thuật đặc sắc, acoustic trẻ trung và giao lưu văn hóa học đường.",
    chuyen_de: CONTRACT_TOPICS[3],
    don_vi_host: ORGANIZATIONS[4],
    danh_sach_dong_to_chuc: [],
    phong: ROOMS[0],
    lo_trinh: [],
    // Legacy mapping
    id: "EVT004",
    title: "Lễ hội Âm nhạc Sinh viên & Đêm nhạc UIT Acoustics 2026",
    speaker: "CLB Văn nghệ Xung kích UIT",
    topic: "culture",
    description:
      "Đêm nhạc sinh viên chào đón tân sinh viên với các tiết mục nghệ thuật đặc sắc và giao lưu văn hóa học đường.",
    date: "2026-10-26",
    time: "18:00",
    endTime: "21:30",
    location: "Trường Đại học Công nghệ Thông tin",
    room: "Hội trường A",
    capacity: 250,
    registered: 180,
    status: "open",
    banner:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop&auto=format",
    organizer: "Đoàn Thanh niên - Hội Sinh viên",
    benefits: [
      "+3 điểm rèn luyện (Điều 4)",
      "Quà tặng check-in từ nhà tài trợ",
      "Không gian âm nhạc giải trí",
    ],
    schedule: [
      { time: "18:00", title: "Đón tiếp & Check-in QR" },
      { time: "18:30", title: "Phần 1: Giai điệu Tuổi trẻ" },
      { time: "19:45", title: "Giao lưu ban nhạc khách mời" },
      { time: "21:00", title: "Check-out & Bế mạc" },
    ],
  },
  {
    ma_su_kien: 105,
    ten_su_kien: "Giải Bóng đá Sinh viên UIT Cup & Hội thao Khoa CNTT",
    anh_bia:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop&auto=format",
    dien_gia: "Ban Thể thao Đoàn trường",
    ten_chuyen_de: "Giải Thể thao Sinh viên UIT",
    ten_don_vi_host: "Khoa Công nghệ Thông tin",
    danh_sach_ten_dong_to_chuc: [],
    ten_phong: "Nhà Thi đấu Đa năng",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-11-01T07:30:00+07:00",
    thoi_gian_ket_thuc: "2026-11-01T17:00:00+07:00",
    ngay_cong_bo: "2026-10-10T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 300,
    so_ve_con_lai: 80,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu4",
    diem_drl_du_kien: 5,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Hội thao truyền thống nâng cao sức khỏe, kết nối tinh thần đồng đội giữa các chi đoàn và câu lạc bộ sinh viên.",
    chuyen_de: CONTRACT_TOPICS[4],
    don_vi_host: ORGANIZATIONS[1],
    danh_sach_dong_to_chuc: [],
    phong: ROOMS[3],
    lo_trinh: [],
    // Legacy mapping
    id: "EVT005",
    title: "Giải Bóng đá Sinh viên UIT Cup & Hội thao Khoa CNTT",
    speaker: "Ban Thể thao Đoàn trường",
    topic: "sport",
    description:
      "Hội thao truyền thống nâng cao sức khỏe, kết nối tinh thần đồng đội giữa các chi đoàn.",
    date: "2026-11-01",
    time: "07:30",
    endTime: "17:00",
    location: "Khu Thể thao ĐHQG-HCM",
    room: "Nhà Thi đấu Đa năng",
    capacity: 300,
    registered: 220,
    status: "open",
    banner:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=400&fit=crop&auto=format",
    organizer: "Khoa Công nghệ Thông tin",
    benefits: [
      "+5 điểm rèn luyện (Điều 4)",
      "Huy chương & Áo lưu niệm cho VĐV",
      "Nước uống tài trợ",
    ],
    schedule: [
      { time: "07:30", title: "Lễ Khai mạc Hội thao" },
      { time: "08:30", title: "Các trận đấu vòng bảng" },
      { time: "14:00", title: "Trận Chung kết & Trao giải" },
    ],
  },
  {
    ma_su_kien: 106,
    ten_su_kien: "Hội thảo An toàn Thông tin & Phòng chống Tấn công mạng 2026",
    anh_bia:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop&auto=format",
    dien_gia: "ThS. Đỗ Tuấn Kiệt – Chuyên gia Bảo mật VNPT CyberImmunity",
    ten_chuyen_de: "Trí tuệ Nhân tạo & Khoa học Dữ liệu",
    ten_don_vi_host: "Khoa Hệ thống Thông tin",
    danh_sach_ten_dong_to_chuc: ["CLB WebDev UIT"],
    ten_phong: "Hội trường E",
    co_so: "CoSo1",
    thoi_gian_bat_dau: "2026-11-05T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-11-05T11:30:00+07:00",
    ngay_cong_bo: "2026-10-12T08:00:00+07:00",
    khong_gioi_han_slot: false,
    so_luong_toi_da: 120,
    so_ve_con_lai: 0,
    trang_thai: "PUBLISHED",
    dieu_khoan_drl: "Dieu3",
    diem_drl_du_kien: 5,
    gio_tinh_nguyen: 0,
    mo_ta:
      "Phân tích các lỗ hổng bảo mật phổ biến, chiến lược phòng thủ mạng zero-trust và kinh nghiệm thực chiến từ chuyên gia an ninh mạng hàng đầu.",
    doi_tuong_tham_gia: "Sinh viên toàn trường UIT đam mê An toàn thông tin",
    chuyen_de: CONTRACT_TOPICS[0],
    don_vi_host: ORGANIZATIONS[0],
    danh_sach_dong_to_chuc: [ORGANIZATIONS[3]],
    phong: ROOMS[1],
    lo_trinh: [
      {
        thoi_gian_bat_dau: "08:30",
        thoi_gian_ket_thuc: "09:00",
        tieu_de: "Đón tiếp & Khởi động",
        dien_gia: "BTC",
      },
      {
        thoi_gian_bat_dau: "09:00",
        thoi_gian_ket_thuc: "10:30",
        tieu_de: "Chuyên đề: Zero Trust & Bảo mật Đám mây",
        dien_gia: "ThS. Đỗ Tuấn Kiệt",
      },
      {
        thoi_gian_bat_dau: "10:30",
        thoi_gian_ket_thuc: "11:30",
        tieu_de: "Live Demo CTF & Hỏi đáp trực tiếp",
        dien_gia: "Chuyên gia & Sinh viên",
      },
    ],
    // Legacy mapping
    id: "EVT006",
    title: "Hội thảo An toàn Thông tin & Phòng chống Tấn công mạng 2026",
    speaker: "ThS. Đỗ Tuấn Kiệt – Chuyên gia Bảo mật VNPT CyberImmunity",
    topic: "academic",
    description:
      "Phân tích các lỗ hổng bảo mật phổ biến, chiến lược phòng thủ mạng zero-trust và kinh nghiệm thực chiến từ chuyên gia an ninh mạng.",
    date: "2026-11-05",
    time: "08:30",
    endTime: "11:30",
    location: "Trường Đại học Công nghệ Thông tin",
    room: "Hội trường E",
    capacity: 120,
    registered: 120,
    status: "full",
    banner:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop&auto=format",
    organizer: "Khoa Hệ thống Thông tin",
    benefits: [
      "+5 điểm rèn luyện (Điều 3)",
      "Voucher tham gia khóa đào tạo Security+",
      "Tài liệu thực hành pentest độc quyền",
    ],
    schedule: [
      { time: "08:30", title: "Đón tiếp & Khởi động" },
      { time: "09:00", title: "Zero Trust Architecture" },
      { time: "10:30", title: "Live Demo Tấn công & Phòng thủ" },
      { time: "11:15", title: "Q&A và bế mạc" },
    ],
  },
]

// ─── Unified Mock Tickets Dataset ───────────────────────────────────────────

export const TICKETS: Ticket[] = [
  {
    ma_dang_ky: 501,
    ma_ve_uuid: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    ma_su_kien: 101,
    ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    trang_thai_su_kien: "PUBLISHED",
    thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
    thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
    ten_phong: "Hội trường A",
    co_so: "CoSo1",
    trang_thai: "DaDangKy",
    thoi_gian_dang_ky: "2026-10-10T14:22:00+07:00",
    han_chot_huy: "2026-10-15T04:30:00+07:00",
    cho_phep_huy: true,
    ti_le_drl: 1.0,
    diem_drl_du_kien: 5,
    da_feedback: false,
    co_the_feedback: false,
    du_dieu_kien_drl: false,
    co_the_nhan_chung_nhan: false,
    vi_pham_no_show: false,
    nghi_van_gian_lan: false,
    chu_ky_hmac:
      "a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    payload_qr:
      "CEH1.9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.1.101.a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    yeu_cau_wake_lock: true,

    // Legacy mapping
    id: "TKT-2026-001928",
    eventId: "EVT001",
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    eventDate: "2026-10-15",
    eventTime: "08:30 - 11:30",
    eventLocation: "Hội trường A, Cơ sở 1",
    studentId: "22521001",
    studentName: "Cao Duy Anh",
    faculty: "Công nghệ Thông tin",
    status: "pending",
    qrCode:
      "CEH1.9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.1.101.a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    registeredAt: "2026-10-10 14:22",
  },
  {
    ma_dang_ky: 502,
    ma_ve_uuid: "7c2adb1e-4c8e-4aef-8bee-3c1e8c4eda7e",
    ma_su_kien: 102,
    ten_su_kien: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    trang_thai_su_kien: "COMPLETED",
    thoi_gian_bat_dau: "2026-10-05T14:00:00+07:00",
    thoi_gian_ket_thuc: "2026-10-05T17:00:00+07:00",
    ten_phong: "Hội trường E",
    co_so: "CoSo1",
    trang_thai: "DaCheckOut",
    thoi_gian_dang_ky: "2026-10-01T10:15:00+07:00",
    thoi_gian_check_in: "2026-10-05T13:55:12+07:00",
    thoi_gian_check_out: "2026-10-05T16:58:30+07:00",
    han_chot_huy: "2026-10-05T10:00:00+07:00",
    cho_phep_huy: false,
    ti_le_drl: 1.0,
    diem_drl_du_kien: 5,
    da_feedback: true,
    co_the_feedback: false,
    du_dieu_kien_drl: true,
    ma_chung_nhan: 301,
    co_the_nhan_chung_nhan: true,
    vi_pham_no_show: false,
    nghi_van_gian_lan: false,
    chu_ky_hmac:
      "b9f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    payload_qr:
      "CEH1.7c2adb1e-4c8e-4aef-8bee-3c1e8c4eda7e.1.102.b9f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    yeu_cau_wake_lock: true,

    // Legacy mapping
    id: "TKT-2026-001540",
    eventId: "EVT002",
    eventTitle: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    eventDate: "2026-10-05",
    eventTime: "14:00 - 17:00",
    eventLocation: "Hội trường E, Cơ sở 1",
    studentId: "22521001",
    studentName: "Cao Duy Anh",
    faculty: "Công nghệ Thông tin",
    status: "attended",
    checkinTime: "13:55",
    checkoutTime: "16:58",
    qrCode:
      "CEH1.7c2adb1e-4c8e-4aef-8bee-3c1e8c4eda7e.1.102.b9f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678",
    registeredAt: "2026-10-01 10:15",
  },
]

// ─── Staff Assignments Dataset ──────────────────────────────────────────────

export const STAFF_ASSIGNMENTS: ContractStaffAssignment[] = [
  {
    id: 1,
    ma_su_kien: 101,
    ma_tai_khoan: 2,
    mssv: "22521999",
    ho_ten: "Trần Minh Phúc",
    lop_sinh_hoat: "HTTT2022",
    khoa: "Khoa Công nghệ Thông tin",
    thoi_gian_phan_cong: "2026-10-12T09:00:00+07:00",
  },
]

// ─── Certificates Dataset ───────────────────────────────────────────────────

export const CERTIFICATES: ContractCertificate[] = [
  {
    id: 301,
    ma_dang_ky: 502,
    ma_su_kien: 102,
    ten_su_kien: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    don_vi_to_chuc: "CLB WebDev UIT",
    ngay_cap: "2026-10-06T10:00:00+07:00",
    ma_hash: "CEH-2026-AI-7K9P2", // Canonical verification hash
    ty_le_tham_du_pct: 100.0,
    diem_drl_thuc_nhan: 5.0,
    file_pdf_url: "/api/v1/certificates/301/download",
    da_thu_hoi: false,
  },
  {
    id: 302,
    ma_dang_ky: 503,
    ma_su_kien: 103,
    ten_su_kien: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
    don_vi_to_chuc: "Phòng Công tác Sinh viên (CTSV)",
    ngay_cap: "2026-09-28T09:30:00+07:00",
    ma_hash: "CEH-2026-AI-8B2X1",
    ty_le_tham_du_pct: 90.0,
    diem_drl_thuc_nhan: 4.0,
    file_pdf_url: "/api/v1/certificates/302/download",
    da_thu_hoi: true,
    thoi_gian_thu_hoi: "2026-09-30T14:00:00+07:00",
    ly_do_thu_hoi: "Phát hiện lỗi đối soát thời lượng ra vào hội trường.",
  },
]

// ─── DRL Records Dataset ────────────────────────────────────────────────────

export const DRL_RECORDS: ContractDrlRecord[] = [
  {
    stt: 1,
    mssv: "22521001",
    ho_ten: "Cao Duy Anh",
    lop_sinh_hoat: "HTTT2022",
    khoa: "Khoa Công nghệ Thông tin",
    ten_su_kien: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    dieu_drl: "Dieu3",
    diem_cong_thuc_nhan: 5.0,
    thoi_gian_vao: "13:55:12",
    thoi_gian_ra: "16:58:30",
    thoi_luong_tham_du_phut: 183,
    ghi_chu_tham_du: "Tham gia đủ 100% thời lượng, đạt chuẩn cộng điểm Điều 3.",
  },
]

// ─── Chart Data for Organizer Dashboard (contract aligned) ─────────────────

export const CHART_BAR_DATA = [
  { date: "09/10", checkin: 45, checkout: 42 },
  { date: "10/10", checkin: 80, checkout: 78 },
  { date: "11/10", checkin: 120, checkout: 115 },
  { date: "12/10", checkin: 95, checkout: 90 },
  { date: "13/10", checkin: 150, checkout: 145 },
  { date: "14/10", checkin: 180, checkout: 175 },
  { date: "15/10", checkin: 172, checkout: 168 },
]

export const CHART_PIE_DATA = [
  { name: "Khoa CNTT", value: 35 },
  { name: "Khoa HTTT", value: 25 },
  { name: "Khoa KHMT", value: 20 },
  { name: "Khoa KTPM", value: 12 },
  { name: "Khoa khác", value: 8 },
]

export const CHART_LINE_DATA = [
  { time: "08:00", count: 15 },
  { time: "08:15", count: 48 },
  { time: "08:30", count: 120 },
  { time: "08:45", count: 165 },
  { time: "09:00", count: 180 },
]

// ─── Additional Exports for Organizer Screens & Legacy Compatibility ────────

export const STATUS_LABELS: Record<string, string> = {
  open: "Còn chỗ",
  nearly_full: "Sắp hết",
  full: "Hết chỗ",
  draft: "Bản nháp",
  closed: "Đã đóng",
  ended: "Đã kết thúc",
  PUBLISHED: "Đang mở đăng ký",
  HAPPENING: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
  APPROVED: "Đã duyệt",
  PENDING_FACULTY: "Chờ khoa duyệt",
  PENDING_ADMIN: "Chờ CTSV duyệt",
}

export const STAFF_LIST: Staff[] = [
  {
    id: "STF01",
    name: "Trần Minh Phúc",
    email: "22521999@gm.uit.edu.vn",
    assignedEvent: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    permission: "Điểm danh (Check-in / Check-out)",
    accountStatus: "active",
    lastActive: "20/09/2026 14:32",
  },
  {
    id: "STF02",
    name: "Lê Quỳnh Như",
    email: "nhu.le@campus.edu.vn",
    assignedEvent: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    permission: "Điểm danh (Check-in / Check-out)",
    accountStatus: "active",
    lastActive: "19/09/2026 09:15",
  },
  {
    id: "STF03",
    name: "Hoàng Đức Anh",
    email: "anh.hoang@campus.edu.vn",
    assignedEvent: "Lễ hội Âm nhạc Sinh viên 2026",
    permission: "Điểm danh",
    accountStatus: "inactive",
    lastActive: "Chưa kích hoạt",
  },
  {
    id: "STF04",
    name: "Nguyễn Bảo Khánh",
    email: "khanh.nb@campus.edu.vn",
    assignedEvent: "Giải Bóng đá Sinh viên UIT Cup",
    permission: "Điểm danh",
    accountStatus: "locked",
    lastActive: "15/09/2026 08:00",
  },
]

export const MY_TICKETS: Ticket[] = TICKETS

export const DASHBOARD_STATS = {
  totalEvents: 12,
  totalRegistrations: 1284,
  avgCheckinRate: 73.4,
  totalParticipants: 3741,
}

export const CHECKIN_HISTORY = [
  {
    name: "Nguyễn Văn A",
    studentId: "22520001",
    time: "08:29:12",
    status: "success" as const,
  },
  {
    name: "Trần Minh B",
    studentId: "22520002",
    time: "08:28:54",
    status: "success" as const,
  },
]
