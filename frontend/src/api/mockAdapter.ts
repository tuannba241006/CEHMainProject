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
            loai_don_vi: "CLB_Doi_Nhom",
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
          loai_don_vi: "CLB_Doi_Nhom",
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
        loai_don_vi: payload.loai_don_vi || "CLB_Doi_Nhom",
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
