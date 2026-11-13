import {
  EVENTS,
  TICKETS,
  ORGANIZATIONS,
  CONTRACT_TOPICS,
  ROOMS,
  CERTIFICATES,
  type Ticket,
  type EventCard,
  type User,
  type Organization,
  type Topic,
  type RoomPublic,
  type CohostInvitationStatus,
} from "../data/mock"
import type { RequestOptions } from "./client"
import type { ApiEnvelope } from "./services/auth.service"

// In-memory mock stores for demo mode mutations
const mockEvents = [...EVENTS]
const mockTickets = [...TICKETS]
const mockOrgs = [...ORGANIZATIONS]
const mockTopics = [...CONTRACT_TOPICS]
const mockRooms = [...ROOMS]

const mockUser: User = {
  ma_tai_khoan: 1001,
  ho_ten: "Nguyễn Văn An",
  mssv: "22520001",
  email: "22520001@gm.uit.edu.vn",
  loai_tai_khoan: "SinhVien",
  so_dien_thoai: "0901234567",
  lop_sinh_hoat: "KTPM2022.1",
  ma_khoa: 1,
  khoa: "Khoa Kỹ thuật Phần mềm",
  dong_y_nghi_dinh_13: true,
  buoc_doi_mat_khau: false,
  la_nhan_vien_soat_ve: true,
  hoat_dong: true,
  thoi_gian_tao: "2024-09-01T08:00:00+07:00",
}

export async function handleMockRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | undefined> {
  const method = (options.method || "GET").toUpperCase()
  const cleanPath = path.split("?")[0]
  const body = options.body as Record<string, unknown> | undefined

  // Simulate minimal async delay for realism
  await new Promise((r) => setTimeout(r, 10))

  // ─── SANCTUM CSRF COOKIE (UC-AUTH-02 / NFR-SEC-01) ──────────────────────────
  if (cleanPath === "/sanctum/csrf-cookie" || cleanPath.endsWith("/csrf-cookie")) {
    if (typeof document !== "undefined") {
      document.cookie = `XSRF-TOKEN=mock_xsrf_token_${Date.now()}; path=/; SameSite=Lax`
    }
    return undefined as unknown as T
  }

  // ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────
  if (cleanPath === "/auth/login") {
    const creds = body as { ten_dang_nhap?: string } | undefined
    const email = creds?.ten_dang_nhap || mockUser.email
    const isOrg = email.includes("webdev") || email.includes("bch")
    const isAdmin =
      email.includes("admin") || email.includes("pctsv") || email.includes("ctsv")
    const role: User["loai_tai_khoan"] = isAdmin
      ? "Admin"
      : isOrg
        ? "ToChuc"
        : "SinhVien"
    const currentUser: User = {
      ...mockUser,
      email,
      loai_tai_khoan: role,
      ho_ten: isAdmin
        ? "Cán bộ Quản trị"
        : isOrg
          ? "Ban Tổ chức CLB WebDev"
          : mockUser.ho_ten,
      don_vi: isOrg
        ? {
            ma_don_vi: 1,
            ten_don_vi: "CLB WebDev",
            loai_don_vi: "CLB",
          }
        : null,
    }
    return {
      success: true,
      data: currentUser,
      token: "demo_token_ceh_2026",
      server_time: new Date().toISOString(),
    } as T
  }
  if (cleanPath === "/auth/me") {
    return {
      success: true,
      data: mockUser,
      server_time: new Date().toISOString(),
    } as T
  }
  if (cleanPath === "/auth/logout") {
    return {
      success: true,
      data: null,
      message: "Đăng xuất thành công",
    } as T
  }
  if (cleanPath === "/auth/verify-registration-otp") {
    const p = body as { email?: string; otp?: string; ma_otp?: string } | undefined
    return {
      success: true,
      data: {
        ...mockUser,
        email: p?.email || mockUser.email,
      },
      message: "Xác thực OTP thành công",
    } as T
  }
  if (cleanPath === "/auth/register") {
    const p = body as { email?: string } | undefined
    return {
      success: true,
      data: { email: p?.email || "22520001@gm.uit.edu.vn" },
      message: "Đăng ký thành công. Vui lòng xác thực OTP.",
    } as T
  }
  if (cleanPath === "/auth/profile") {
    return {
      success: true,
      data: { ...mockUser, ...(body || {}) },
      message: "Cập nhật hồ sơ thành công",
    } as T
  }

  // ─── EVENTS ENDPOINTS ─────────────────────────────────────────────────────────
  if (cleanPath === "/events" && method === "GET") {
    return {
      success: true,
      data: mockEvents as unknown as EventCard[],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockEvents.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (
    cleanPath.startsWith("/events/") &&
    cleanPath.endsWith("/participants") &&
    method === "GET"
  ) {
    const parts = cleanPath.split("/")
    const eventId = parts[2]
    const matchedTickets = mockTickets.filter(
      (t) => String(t.ma_su_kien) === eventId || t.eventId === eventId,
    )
    const list = (matchedTickets.length > 0 ? matchedTickets : mockTickets).map(
      (t, idx) => ({
        ma_dang_ky: t.ma_dang_ky || 100 + idx,
        ma_tai_khoan: 1000 + idx,
        mssv: t.mssv || t.studentId || `2252${String(idx).padStart(4, "0")}`,
        ho_ten: t.studentName || `Sinh viên ${idx + 1}`,
        lop_sinh_hoat: "KTPM2022.1",
        khoa: t.faculty || "Khoa Kỹ thuật Phần mềm",
        trang_thai:
          t.trang_thai ||
          (t.status === "cancelled"
            ? "DaHuy"
            : t.status === "attended"
              ? "DaCheckOut"
              : "DaDangKy"),
        da_check_in: Boolean(t.checkinTime),
        da_check_out: Boolean(t.checkoutTime),
        thoi_gian_dang_ky: t.registeredAt || new Date().toISOString(),
        thoi_gian_check_in: t.checkinTime || null,
        thoi_gian_check_out: t.checkoutTime || null,
        thoi_luong_tham_du_phut: 90,
        ty_le_tham_du_pct: 100,
        ti_le_drl: t.ti_le_drl ?? 1,
        da_feedback: false,
        han_an_han_feedback: null,
        du_dieu_kien_drl: true,
        nghi_van_gian_lan: Boolean(t.nghi_van_gian_lan),
        ma_thiet_bi_nghi_van: t.ma_thiet_bi_nghi_van || null,
        vi_pham_no_show: Boolean(t.vi_pham_no_show),
        ghi_chu: null,
      }),
    )
    return {
      success: true,
      data: list,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: list.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (cleanPath.startsWith("/events/") && method === "GET") {
    const parts = cleanPath.split("/")
    const id = parts[2]
    const evt = mockEvents.find((e) => String(e.ma_su_kien) === id || e.id === id) || mockEvents[0]
    return {
      success: true,
      data: evt,
    } as T
  }

  if (cleanPath === "/organizer/events") {
    return {
      success: true,
      data: mockEvents as unknown as EventCard[],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockEvents.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (cleanPath === "/events" && method === "POST") {
    const newId = 900 + mockEvents.length + 1
    const newEvt = {
      ma_su_kien: newId,
      id: String(newId),
      ten_su_kien: (body?.ten_su_kien as string) || "Sự kiện mới",
      title: (body?.ten_su_kien as string) || "Sự kiện mới",
      mo_ta: (body?.mo_ta as string) || "",
      description: (body?.mo_ta as string) || "",
      trang_thai: "NHAP",
      status: "draft",
      thoi_gian_bat_dau: (body?.thoi_gian_bat_dau as string) || new Date().toISOString(),
      thoi_gian_ket_thuc: (body?.thoi_gian_ket_thuc as string) || new Date().toISOString(),
      so_luong_toi_da: (body?.so_luong_toi_da as number) || 100,
      so_luong_da_dang_ky: 0,
      diem_drl_du_kien: (body?.diem_drl_du_kien as number) || 5,
      points: (body?.diem_drl_du_kien as number) || 5,
    }
    return {
      success: true,
      data: newEvt,
      message: "Tạo bản nháp sự kiện thành công",
    } as T
  }

  if (cleanPath === "/events/review-queue") {
    const queue = mockEvents.filter((e) =>
      ["PENDING_FACULTY", "PENDING_ADMIN", "WAITING_COHOST_CONFIRM"].includes(e.trang_thai),
    )
    return {
      success: true,
      data: queue as unknown as EventCard[],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: queue.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (cleanPath === "/organizer/cohost-invitations") {
    const invitations: CohostInvitationStatus[] = [
      {
        id: 1,
        ma_su_kien: 101,
        ten_su_kien: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
        don_vi_host: {
          ma_don_vi: 4,
          ten_don_vi: "Phòng Công tác Sinh viên (P.CTSV)",
          loai_don_vi: "PhongBan",
        },
        don_vi_dong_to_chuc: {
          ma_don_vi: 1,
          ten_don_vi: "CLB WebDev UIT",
          loai_don_vi: "CLB",
        },
        trang_thai_xac_nhan: "CHO_XAC_NHAN",
        thoi_gian_tao: "2026-11-01T08:00:00+07:00",
      },
    ]
    return {
      success: true,
      data: invitations,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: invitations.length,
        kich_thuoc_trang: 10,
      },
    } as T
  }

  // Event Mutations (reopen, review, changeRoom, submitApproval, etc.)
  if (cleanPath.includes("/co-host-respond")) {
    const payload = (options.body ? JSON.parse(options.body as string) : {}) as {
      dong_y?: boolean
      trang_thai_xac_nhan?: string
      ghi_chu_tu_choi?: string
      ly_do_tu_choi?: string
    }
    if (payload.trang_thai_xac_nhan === "TU_CHOI") {
      const reason = (payload.ghi_chu_tu_choi || payload.ly_do_tu_choi || "").trim()
      if (reason.length < 5) {
        throw new Error("Lý do từ chối đồng tổ chức bắt buộc phải có ít nhất 5 ký tự.")
      }
    }
    return {
      success: true,
      data: mockEvents[0],
      message: "Phản hồi lời mời đồng tổ chức thành công",
    } as T
  }

  if (cleanPath.includes("/reopen") || cleanPath.includes("/submit-approval") || cleanPath.includes("/withdraw") || cleanPath.includes("/review") || cleanPath.includes("/change-room") || cleanPath.includes("/emergency-cancel")) {
    return {
      success: true,
      data: mockEvents[0],
      message: "Thao tác thành công trên hệ thống",
    } as T
  }

  // ─── TICKETS & REGISTRATION ──────────────────────────────────────────────────
  if (cleanPath === "/tickets/my-tickets") {
    return {
      success: true,
      data: mockTickets,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockTickets.length,
        kich_thuoc_trang: 20,
      },
    } as T
  }

  if (cleanPath.startsWith("/tickets/") && cleanPath.endsWith("/cancel")) {
    const id = cleanPath.split("/")[2]
    const ticket = mockTickets.find((t) => String(t.ma_dang_ky) === id || t.id === id) || mockTickets[0]
    return {
      success: true,
      data: { ...ticket, trang_thai: "DaHuy", status: "cancelled" },
      message: "Hủy vé tham gia thành công",
    } as T
  }

  if (cleanPath === "/waitlist/my-entries") {
    return {
      success: true,
      data: [],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: 0,
        kich_thuoc_trang: 20,
      },
    } as T
  }

  if (cleanPath.includes("/book") || cleanPath.includes("/waitlist")) {
    return {
      success: true,
      data: mockTickets[0],
      message: "Đăng ký thành công",
    } as T
  }

  // ─── ATTENDANCE & KIOSK ──────────────────────────────────────────────────────
  if (cleanPath.includes("/kiosk/start")) {
    return {
      success: true,
      data: { kiosk_token: "mock_kiosk_token_123" },
      message: "Khởi động kiosk điểm danh thành công",
    } as T
  }

  if (cleanPath === "/kiosk/totp-stream") {
    return {
      success: true,
      data: {
        ma_su_kien: 101,
        ten_su_kien: "Hội thảo UIT",
        che_do_hien_tai: "CHECK_IN",
        cong_check_in_mo: true,
        cong_check_out_mo: false,
        totp_code: "892143",
        qr_payload: "CEH1.KIOSK.101.892143",
        chu_ky_giay: 30,
        het_han_luc: new Date(Date.now() + 30000).toISOString(),
        expires_in_seconds: 28,
      },
    } as T
  }

  if (cleanPath.includes("/kiosk/open-checkin") || cleanPath.includes("/kiosk/open-checkout") || cleanPath.includes("/kiosk/close-gates")) {
    return {
      success: true,
      data: { status: "updated" },
      message: "Cập nhật trạng thái cổng điểm danh thành công",
    } as T
  }

  if (cleanPath === "/staff/my-events") {
    return {
      success: true,
      data: mockEvents.slice(0, 3).map((e) => ({
        ma_su_kien: e.ma_su_kien,
        ten_su_kien: e.ten_su_kien || e.title,
      })),
    } as T
  }

  if (cleanPath.match(/^\/events\/[^/]+\/staff\/[^/]+/) && method === "DELETE") {
    return {
      success: true,
      data: null,
      message: "Thu hồi quyền nhân viên soát vé thành công",
    } as T
  }

  if (cleanPath.match(/^\/events\/[^/]+\/staff/) && method === "GET") {
    return {
      success: true,
      data: [
        { id: 1, ma_su_kien: 101, ma_tai_khoan: 10 },
        { id: 2, ma_su_kien: 101, ma_tai_khoan: 11 },
      ],
      message: "Danh sách nhân viên soát vé",
    } as T
  }

  if (cleanPath.match(/^\/events\/[^/]+\/staff/) && method === "POST") {
    return {
      success: true,
      data: [
        { id: 99, ma_su_kien: 101, ma_tai_khoan: 22521999 },
      ],
      message: "Phân công nhân viên soát vé thành công",
    } as T
  }

  if (cleanPath === "/attendance/staff-scan") {
    return {
      success: true,
      data: {
        ma_dang_ky: 101,
        sinh_vien: {
          ho_ten: "Nguyễn Văn An",
          mssv: "22520001",
          khoa: "Khoa Kỹ thuật Phần mềm",
          lop_sinh_hoat: "KTPM2022.1",
        },
        canh_bao_doi_soat_the_sv: false,
        trang_thai_ve: "DaCheckIn",
        thoi_gian_quet: new Date().toISOString(),
        thoi_luong_tham_du_phut: 90,
        ti_le_drl: 1.0,
      },
      message: "Điểm danh vé thành công",
    } as T
  }

  if (cleanPath === "/attendance/self-check-in") {
    const payload = (options.body || {}) as { ma_su_kien?: number }
    const ticket =
      mockTickets.find(
        (t) =>
          t.ma_su_kien === payload.ma_su_kien ||
          t.eventId === String(payload.ma_su_kien),
      ) || mockTickets[0]
    if (ticket) {
      ticket.trang_thai = "DaCheckIn"
      ticket.status = "DaCheckIn"
      ticket.checkinTime = new Date().toISOString()
    }
    return {
      success: true,
      data: {
        ma_dang_ky: ticket?.ma_dang_ky || 101,
        trang_thai: "DaCheckIn",
        thoi_gian_check_in: new Date().toISOString(),
      },
      message: "Điểm danh Check-in thành công.",
    } as T
  }

  if (cleanPath === "/attendance/self-check-out") {
    const payload = (options.body || {}) as { ma_su_kien?: number }
    const ticket =
      mockTickets.find(
        (t) =>
          t.ma_su_kien === payload.ma_su_kien ||
          t.eventId === String(payload.ma_su_kien),
      ) || mockTickets[0]
    if (ticket) {
      ticket.trang_thai = "DaCheckOut"
      ticket.status = "DaCheckOut"
      ticket.checkoutTime = new Date().toISOString()
    }
    return {
      success: true,
      data: {
        ma_dang_ky: ticket?.ma_dang_ky || 101,
        trang_thai: "DaCheckOut",
        thoi_gian_check_out: new Date().toISOString(),
        thoi_luong_tham_du_phut: 110,
        ty_le_tham_du_pct: 92,
        ti_le_drl: 1,
      },
      message: "Điểm danh Check-out thành công.",
    } as T
  }

  // ─── DRL ENDPOINTS (UC-DRL-01) ────────────────────────────────────────────────
  if (cleanPath.match(/\/events\/[^/]+\/drl\/export$/)) {
    return new Blob(
      [
        "STT,MSSV,Ho_Ten,Lop_Sinh_Hoat,Khoa,Ten_Su_Kien,Dieu_DRL,Diem_Cong,Thoi_Gian_Vao,Thoi_Gian_Ra,Phut_Hop_Le,Ghi_Chu\n1,22520001,Nguyen Van An,KTPM2022.1,Khoa KTPM,Su kien CEH,Dieu3,5,08:30,11:30,180,Du dieu kien",
      ],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ) as unknown as T
  }

  if (cleanPath.match(/\/events\/[^/]+\/drl\/lock$/)) {
    return {
      success: true,
      data: { da_chot_drl: 1 },
      message: "Đã khóa chốt danh sách điểm rèn luyện sự kiện thành công",
    } as T
  }

  if (cleanPath.match(/\/events\/[^/]+\/drl\/unlock$/)) {
    return {
      success: true,
      data: { da_chot_drl: 0 },
      message: "Đã mở khóa điều chỉnh điểm rèn luyện sự kiện thành công",
    } as T
  }

  if (cleanPath.match(/\/events\/[^/]+\/drl$/)) {
    return {
      success: true,
      data: [
        {
          stt: 1,
          mssv: "22520001",
          ho_ten: "Nguyễn Văn An",
          lop_sinh_hoat: "KTPM2022.1",
          khoa: "Khoa Kỹ thuật Phần mềm",
          ten_su_kien: "Chương trình Gặp gỡ Tân sinh viên & Vận hành Điểm danh",
          dieu_drl: "Dieu3",
          diem_cong_thuc_nhan: 5,
          thoi_gian_vao: "08:30:00",
          thoi_gian_ra: "11:30:00",
          thoi_luong_tham_du_phut: 180,
          ghi_chu_tham_du: "Tham dự đầy đủ 100% thời lượng",
        },
        {
          stt: 2,
          mssv: "22520002",
          ho_ten: "Trần Thị Bình",
          lop_sinh_hoat: "HTTT2022.1",
          khoa: "Khoa Hệ thống Thông tin",
          ten_su_kien: "Chương trình Gặp gỡ Tân sinh viên & Vận hành Điểm danh",
          dieu_drl: "Dieu3",
          diem_cong_thuc_nhan: 5,
          thoi_gian_vao: "08:32:00",
          thoi_gian_ra: "11:28:00",
          thoi_luong_tham_du_phut: 176,
          ghi_chu_tham_du: "Tham dự đầy đủ",
        },
      ],
      message: "Danh sách điểm rèn luyện sự kiện",
    } as T
  }

  // ─── MASTER DATA & ADMIN ─────────────────────────────────────────────────────
  if (cleanPath.startsWith("/rooms/") && cleanPath.endsWith("/schedule")) {
    const roomId = Number(cleanPath.split("/")[2])
    const roomItem = mockRooms.find((r) => r.ma_phong === roomId)
    const baseSchedule = [
      {
        ma_dat_phong: 1,
        ma_su_kien: 101,
        tieu_de: "Ngày hội AI & Big Data 2026",
        ten_su_kien: "Ngày hội AI & Big Data 2026",
        ten_don_vi_host: "Khoa Hệ thống Thông tin",
        thoi_gian_bat_dau: "08:00",
        thoi_gian_ket_thuc: "11:30",
        trang_thai: "CONFIRMED",
        loai: "CONFIRMED",
      },
      {
        ma_dat_phong: 2,
        ma_su_kien: 102,
        tieu_de: "Workshop DevOps Cloud",
        ten_su_kien: "Workshop DevOps Cloud",
        ten_don_vi_host: "CLB WebDev UIT",
        thoi_gian_bat_dau: "13:45",
        thoi_gian_ket_thuc: "17:15",
        trang_thai: "PENDING",
        loai: "PENDING_HOLD",
      },
      {
        ma_dat_phong: 3,
        ma_su_kien: 103,
        tieu_de: "Đêm nhạc Sinh viên UIT 2026",
        ten_su_kien: "Đêm nhạc Sinh viên UIT 2026",
        ten_don_vi_host: "Đoàn Thanh niên",
        thoi_gian_bat_dau: "18:00",
        thoi_gian_ket_thuc: "21:30",
        trang_thai: "CONFIRMED",
        loai: "CONFIRMED",
      },
    ]

    let result = roomId === 1 ? baseSchedule : roomId === 2 ? [baseSchedule[1]] : [baseSchedule[0]]
    if (roomItem?.trang_thai === "BaoTri") {
      result = [
        ...result,
        {
          ma_dat_phong: 999,
          ma_su_kien: 0,
          tieu_de: "BẢO TRÌ PHÒNG HỘI TRƯỜNG",
          ten_su_kien: "Bảo trì định kỳ cơ sở vật chất",
          ten_don_vi_host: "Phòng Quản trị Thiết bị",
          thoi_gian_bat_dau: "07:00",
          thoi_gian_ket_thuc: "22:00",
          trang_thai: "BAO_TRI",
          loai: "BAO_TRI",
        },
      ]
    }
    return {
      success: true,
      data: result,
      message: "Truy vấn lịch phòng thành công",
    } as T
  }

  if (cleanPath.startsWith("/rooms/") && cleanPath.endsWith("/availability")) {
    const roomId = Number(cleanPath.split("/")[2])
    const roomItem = mockRooms.find((r) => r.ma_phong === roomId)
    const isMaintenance = roomItem?.trang_thai === "BaoTri"
    return {
      success: true,
      data: {
        ma_phong: roomId,
        trong_lich: !isMaintenance,
        xung_dot: isMaintenance
          ? {
              ma_su_kien: 0,
              ten_su_kien: "Phòng đang trong thời gian bảo trì",
              thoi_gian_bat_dau: "07:00",
              thoi_gian_ket_thuc: "22:00",
            }
          : null,
      },
      message: "Kiểm tra tính khả dụng phòng thành công",
    } as T
  }

  if (cleanPath.startsWith("/rooms/") && method === "PUT") {
    const roomId = Number(cleanPath.split("/")[2])
    const body = (options.body ? JSON.parse(options.body as string) : {}) as Partial<RoomPublic>
    const idx = mockRooms.findIndex((r) => r.ma_phong === roomId)
    if (idx !== -1) {
      mockRooms[idx] = { ...mockRooms[idx], ...body }
    }
    return {
      success: true,
      data: mockRooms[idx] || body,
      message: "Cập nhật phòng thành công",
    } as T
  }

  if (cleanPath === "/rooms") {
    if (method === "POST") {
      const body = (options.body ? JSON.parse(options.body as string) : {}) as Partial<RoomPublic>
      const newRoom: RoomPublic = {
        ma_phong: Date.now(),
        ten_phong: body.ten_phong || "Phòng mới",
        suc_chua: Number(body.suc_chua_toi_da ?? body.suc_chua ?? 100),
        suc_chua_toi_da: Number(body.suc_chua_toi_da ?? body.suc_chua ?? 100),
        co_so: body.co_so || "CoSo1",
        toa_nha: body.toa_nha || "Tòa A",
        vi_tri_tang: body.vi_tri_tang || 1,
        thiet_bi: {
          may_chieu: Boolean(body.trang_thiet_bi?.may_chieu ?? body.thiet_bi?.may_chieu ?? true),
          am_thanh: Boolean(body.trang_thiet_bi?.am_thanh ?? body.thiet_bi?.am_thanh ?? true),
          wifi: Boolean(body.trang_thiet_bi?.wifi ?? body.thiet_bi?.wifi ?? true),
        },
        trang_thai: body.trang_thai || "KhaDung",
        bao_tri_tu_ngay: body.bao_tri_tu_ngay || null,
        bao_tri_den_ngay: body.bao_tri_den_ngay || null,
        ly_do_bao_tri: body.ly_do_bao_tri || null,
      }
      mockRooms.push(newRoom)
      return {
        success: true,
        data: newRoom,
        message: "Tạo phòng hội trường thành công",
      } as T
    }
    return {
      success: true,
      data: mockRooms,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockRooms.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (cleanPath === "/topics") {
    return {
      success: true,
      data: mockTopics,
    } as T
  }

  if (cleanPath === "/organizations" || cleanPath === "/admin/organizations") {
    return {
      success: true,
      data: mockOrgs,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockOrgs.length,
        kich_thuoc_trang: 50,
      },
    } as T
  }

  if (cleanPath === "/admin/organizations") {
    if (method === "POST") {
      const payload = (options.body ? JSON.parse(options.body as string) : {}) as Partial<Organization>
      const newOrg = {
        ma_don_vi: Math.max(0, ...mockOrgs.map((o) => o.ma_don_vi)) + 1,
        ten_don_vi: payload.ten_don_vi || "Đơn vị mới",
        loai_don_vi: payload.loai_don_vi || "CLB",
        ma_don_vi_cha: payload.ma_don_vi_cha ?? null,
        hoat_dong: true,
        thoi_gian_tao: new Date().toISOString(),
      } as Organization
      mockOrgs.push(newOrg)
      return { success: true, data: newOrg } as T
    }
    return {
      success: true,
      data: mockOrgs,
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: mockOrgs.length,
        kich_thuoc_trang: 20,
      },
    } as T
  }

  if (cleanPath.startsWith("/admin/organizations/")) {
    const id = Number(cleanPath.split("/")[3])
    const payload = (options.body ? JSON.parse(options.body as string) : {}) as Partial<Organization>
    const org = mockOrgs.find((o) => o.ma_don_vi === id)
    if (org) Object.assign(org, payload)
    return { success: true, data: org } as T
  }

  if (cleanPath.startsWith("/admin/users/") && cleanPath.endsWith("/status")) {
    const id = Number(cleanPath.split("/")[3])
    const payload = (options.body ? JSON.parse(options.body as string) : {}) as { hoat_dong?: boolean }
    const updated = {
      ...mockUser,
      ma_tai_khoan: id,
      hoat_dong: payload.hoat_dong ?? true,
    }
    return {
      success: true,
      message: "Cập nhật trạng thái tài khoản thành công.",
      data: updated,
    } as T
  }

  if (cleanPath === "/admin/users") {
    return {
      success: true,
      data: [mockUser],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: 1,
        kich_thuoc_trang: 20,
      },
    } as T
  }

  if (cleanPath === "/admin/topics") {
    return {
      success: true,
      data: mockTopics,
    } as T
  }

  if (cleanPath === "/notifications") {
    return {
      success: true,
      data: [],
      meta: {
        trang_hien_tai: 1,
        tong_so_trang: 1,
        tong_so_ban_ghi: 0,
        kich_thuoc_trang: 20,
      },
    } as T
  }

  if (cleanPath === "/certificates/my-certificates") {
    return {
      success: true,
      data: CERTIFICATES,
    } as T
  }

  if (cleanPath.startsWith("/certificates/verify/")) {
    return {
      success: true,
      data: {
        trang_thai: "HOP_LE",
        da_thu_hoi: false,
        ho_ten_che_mo: "Nguyễn V** A",
        mssv_che_mo: "2252****",
        ten_su_kien: "Hội thảo Công nghệ UIT",
        don_vi_to_chuc: "Trường Đại học Công nghệ Thông tin",
        ngay_cap: new Date().toISOString(),
      },
    } as T
  }

  // ─── ADMIN ANALYTICS & MACRO REPORT (UC-REP-02) ─────────────────────────
  if (cleanPath === "/admin/analytics/macro/export") {
    return new Blob(
      [
        "BÁO CÁO CHIẾN LƯỢC TOÀN TRƯỜNG\nTổng sự kiện: 48\nTổng lượt SV tham gia: 3850\nTỷ lệ Show-up toàn trường: 91.2%\nTỷ lệ No-show toàn trường: 5.8%\nTốc độ cháy vé trung bình: 132.5 phút\n",
      ],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ) as unknown as T
  }

  if (cleanPath === "/admin/analytics/no-show-violations") {
    return {
      success: true,
      data: [
        {
          ma_tai_khoan: 1,
          mssv: "22520088",
          ho_ten: "Trần Minh Quân",
          lop_sinh_hoat: "HTTT2022",
          so_lan_vi_pham: 3,
          danh_sach_su_kien_no_show: [
            { ma_su_kien: 101, ten_su_kien: "Hội thảo AI 2026", ngay_dien_ra: "2026-10-10" },
            { ma_su_kien: 102, ten_su_kien: "Web Dev Workshop", ngay_dien_ra: "2026-10-24" },
            { ma_su_kien: 103, ten_su_kien: "Talkshow Startup", ngay_dien_ra: "2026-11-02" },
          ],
        },
        {
          ma_tai_khoan: 502,
          mssv: "22520145",
          ho_ten: "Lê Hoàng Long",
          lop_sinh_hoat: "KHMT2022",
          so_lan_vi_pham: 2,
          danh_sach_su_kien_no_show: [
            { ma_su_kien: 104, ten_su_kien: "An toàn Thông tin 2026", ngay_dien_ra: "2026-10-15" },
            { ma_su_kien: 105, ten_su_kien: "Techfest UIT", ngay_dien_ra: "2026-11-01" },
          ],
        },
        {
          ma_tai_khoan: 503,
          mssv: "23520312",
          ho_ten: "Phạm Thu Hương",
          lop_sinh_hoat: "KTPM2023",
          so_lan_vi_pham: 2,
          danh_sach_su_kien_no_show: [
            { ma_su_kien: 106, ten_su_kien: "Chinh phục Hackathon", ngay_dien_ra: "2026-10-18" },
            { ma_su_kien: 107, ten_su_kien: "Lễ hội CLB", ngay_dien_ra: "2026-11-05" },
          ],
        },
      ],
      message: "Danh sách sinh viên vi phạm No-show toàn trường",
    } as T
  }

  if (cleanPath === "/admin/analytics/macro") {
    return {
      success: true,
      data: {
        tu_ngay: "2026-09-01",
        den_ngay: "2026-12-31",
        tong_so_su_kien: 48,
        tong_luot_sinh_vien_tham_gia: 3850,
        ty_le_show_up_toan_truong_pct: 91.2,
        ty_le_no_show_toan_truong_pct: 5.8,
        toc_do_chay_ve_phut_tb: 132.5,
        su_kien_theo_chuyen_de: [
          { ten_chuyen_de: "Công nghệ thông tin & Trí tuệ Nhân tạo", so_su_kien: 16, tong_luot_tham_du: 1520 },
          { ten_chuyen_de: "Kỹ năng mềm & Hội nhập", so_su_kien: 12, tong_luot_tham_du: 980 },
          { ten_chuyen_de: "Học thuật & NCKH", so_su_kien: 10, tong_luot_tham_du: 720 },
          { ten_chuyen_de: "Văn thể mỹ & Hoạt động Xã hội", so_su_kien: 6, tong_luot_tham_du: 410 },
          { ten_chuyen_de: "Khởi nghiệp & Đổi mới sáng tạo", so_su_kien: 4, tong_luot_tham_du: 220 },
        ],
        su_kien_theo_cap_don_vi: [
          { loai_don_vi: "CLB", so_su_kien: 20 },
          { loai_don_vi: "Khoa", so_su_kien: 14 },
          { loai_don_vi: "DoanHoi", so_su_kien: 9 },
          { loai_don_vi: "PhongBan", so_su_kien: 5 },
        ],
        cong_suat_su_dung_phong: [
          { ma_phong: 1, ten_phong: "Hội trường A - Tòa A (Cơ sở 1)", so_su_kien_to_chuc: 18, ty_le_lap_day_tb_pct: 94.5 },
          { ma_phong: 2, ten_phong: "Hội trường E - Tòa E (Cơ sở 1)", so_su_kien_to_chuc: 14, ty_le_lap_day_tb_pct: 88.0 },
          { ma_phong: 3, ten_phong: "Hội trường B1.14 - Tòa B (Cơ sở 2)", so_su_kien_to_chuc: 9, ty_le_lap_day_tb_pct: 78.4 },
          { ma_phong: 4, ten_phong: "Phòng Hội thảo C301 (Cơ sở 1)", so_su_kien_to_chuc: 7, ty_le_lap_day_tb_pct: 82.1 },
        ],
        top_don_vi_hoat_dong_tich_cuc: [
          { ma_don_vi_to_chuc: 2, ten_don_vi: "CLB WebDev UIT", so_su_kien: 9, diem_hai_long_tb: 4.88 },
          { ma_don_vi_to_chuc: 1, ten_don_vi: "Khoa Kỹ thuật Phần mềm", so_su_kien: 8, diem_hai_long_tb: 4.82 },
          { ma_don_vi_to_chuc: 3, ten_don_vi: "Ban quản lý Khoa HTTT", so_su_kien: 6, diem_hai_long_tb: 4.75 },
          { ma_don_vi_to_chuc: 4, ten_don_vi: "Đoàn Thanh niên - Hội Sinh viên", so_su_kien: 5, diem_hai_long_tb: 4.69 },
        ],
      },
      message: "Báo cáo chiến lược toàn trường (< 1.0s)",
    } as T
  }

  if (cleanPath === "/ai/admin/text-to-insight") {
    const body = options.body ? JSON.parse(options.body as string) : {}
    const q = String(body.cau_hoi_tu_nhien || body.prompt || "").toLowerCase()
    let summary = "Hệ thống ghi nhận 48 sự kiện đang vận hành trong học kỳ với tỷ lệ show-up trung bình đạt 91.2%."
    let strategy = [
      "Tối ưu hóa các khung giờ cao điểm tại Hội trường A và Hội trường E.",
      "Tiếp tục duy trì quy chế điểm danh Kiosk Dynamic TOTP 30s.",
    ]
    let table: Array<Record<string, unknown>> = []
    let chart: "BarChart" | "LineChart" | "PieChart" | "Table" = "BarChart"

    if (q.includes("tái phạm") || q.includes("chế tài")) {
      summary =
        "Báo cáo sinh viên tái phạm No-show (≥ 2 lần vi phạm không check-in và không hủy vé trước T-4h): Phát hiện 3 trường hợp cần P.CTSV xem xét chế tài theo Điều 4 Quy chế ĐRL."
      strategy = [
        "Khóa quyền đăng ký vé trong vòng 30 ngày đối với sinh viên vi phạm lần 2.",
        "Trừ 5 điểm rèn luyện đối với sinh viên vi phạm lần 3 theo Điều 4.",
      ]
      table = [
        { mssv: "22520112", ho_ten: "Trần Văn ***", so_lan: "2 lần", khoa: "HTTT", de_xuat: "Tạm khóa quyền đặt vé 30 ngày" },
        { mssv: "22520543", ho_ten: "Lê Thị ***", so_lan: "3 lần", khoa: "KHMT", de_xuat: "Trừ 5 Điểm rèn luyện học kỳ" },
        { mssv: "22520988", ho_ten: "Nguyễn Hoàng ***", so_lan: "2 lần", khoa: "KTPM", de_xuat: "Cảnh cáo in-app & Email nhắc nhở" },
      ]
      chart = "Table"
    } else if (q.includes("no-show") || q.includes("vi phạm")) {
      summary =
        "Phân tích 30 ngày qua cho P.CTSV: Toàn trường ghi nhận 7 trường hợp vi phạm No-show. Tỷ lệ No-show chung toàn trường chỉ ở mức 2.1% (thấp hơn ngưỡng báo động 5.0%)."
      strategy = [
        "Tăng cường gửi thông báo in-app trước T-24h và T-4h.",
        "Tạo điều kiện cho hàng đợi Waitlist được đẩy vé tự động.",
      ]
      table = [
        { don_vi: "Khoa Hệ thống Thông tin", vi_pham: "3 ca (42.8%)", bien_phap: "Đã gửi cảnh báo P.CTSV" },
        { don_vi: "Khoa Khoa học Máy tính", vi_pham: "2 ca (28.6%)", bien_phap: "Đang chờ đối soát" },
        { don_vi: "Khoa Kỹ thuật Phần mềm", vi_pham: "2 ca (28.6%)", bien_phap: "Nhắc nhở qua email trường" },
      ]
      chart = "PieChart"
    }

    return {
      success: true,
      message: "Phân tích dữ liệu vĩ mô thành công",
      data: {
        cau_tra_loi_tom_tat: summary,
        nhan_dinh_chien_luoc: strategy,
        bang_du_lieu: table,
        bieu_do_goi_y: chart,
      },
    } as T
  }

  if (cleanPath.includes("/analytics")) {
    return {
      success: true,
      data: {
        ma_su_kien: 101,
        tong_ve_dang_ky: 180,
        so_luong_check_in: 165,
        so_luong_check_out: 158,
        ty_le_show_up_pct: 91.6,
        so_luong_no_show: 15,
        ty_le_no_show_pct: 8.4,
        diem_noi_dung_tb: 4.8,
        diem_dien_gia_tb: 4.9,
        diem_to_chuc_tb: 4.7,
      },
    } as T
  }

  // Generic fallback envelope for any other mocked route
  return {
    success: true,
    data: null,
    message: "Operation completed in demo mode",
  } as T
}
