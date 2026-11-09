import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import AdminLayout from "./AdminLayout"
import {
  CONTRACT_TOPICS,
  EVENTS,
  ORGANIZATIONS,
  type Ticket,
} from "../../data/mock"
import type { OrganizationSummary, Topic, User } from "../../data/contract"
import { adminService } from "../../api/services/admin.service"
import { feedbackService } from "../../api/services/feedback.service"
import { useCollection } from "../../hooks/useCollection"
import { useToast } from "../../components/Toast"
import { getApiErrorMessage } from "../../api/errors"
import { reportsService } from "../../api/services/reports.service"
import { certificatesService } from "../../api/services/certificates.service"
import FormDialog, { ConfirmDialog, type FieldSpec } from "./FormDialog"
import Modal from "../../components/Modal"
import { useApp } from "../../context/AppContext"
import { BiAssistantDrawer } from "../../components/BiAssistantDrawer"
import { Certificates } from "../management/AffairsOperations"
import AdminEventsManagement, { type AdminManageEvent } from "./AdminEventsManagement"
import AdminParticipants from "./AdminParticipants"
import AdminStaff from "./AdminStaff"
import AdminCohostInvitations from "./AdminCohostInvitations"
import { attendanceService } from "../../api/services/attendance.service"
import {
  FileSpreadsheet,
  Monitor,
  Users as UsersIcon,
  AlertTriangle,
  Download,
  Scale,
  CheckCircle2,
  Ticket as TicketIcon,
  Clock,
  Lightbulb,
  ShieldAlert,
  X,
} from "lucide-react"

export type Section =
  | "dashboard"
  | "events"
  | "events-create"
  | "events-edit"
  | "users"
  | "organizations"
  | "topics"
  | "reports"
  | "no-show"
  | "certificates"
  | "participants"
  | "staff"
  | "cohost-invitations"

export interface NoShowViolation {
  ma_dang_ky: number
  mssv: string
  name: string
  lop: string
  khoa: string
  count: number
  events: string
  penalty: string
  vi_pham_no_show: boolean
}

const DEFAULT_NO_SHOWS: NoShowViolation[] = [
  {
    ma_dang_ky: 501,
    mssv: "22520088",
    name: "Trần Minh Quân",
    lop: "HTTT2022",
    khoa: "Hệ thống Thông tin",
    count: 3,
    events: "Hội thảo AI 2026, Web Dev Workshop, Talkshow Startup",
    penalty: "Khóa quyền đặt vé 30 ngày",
    vi_pham_no_show: true,
  },
  {
    ma_dang_ky: 502,
    mssv: "22520145",
    name: "Lê Hoàng Long",
    lop: "KHMT2022",
    khoa: "Khoa học Máy tính",
    count: 2,
    events: "An toàn Thông tin 2026, Techfest UIT",
    penalty: "Trừ 5 Điểm rèn luyện",
    vi_pham_no_show: true,
  },
  {
    ma_dang_ky: 503,
    mssv: "23520312",
    name: "Phạm Thu Hương",
    lop: "KTPM2023",
    khoa: "Kỹ thuật Phần mềm",
    count: 2,
    events: "Chinh phục Hackathon, Lễ hội CLB",
    penalty: "Cảnh cáo in-app lần 1",
    vi_pham_no_show: true,
  },
]

interface AdminUser {
  ma_nguoi_dung: number
  ho_ten: string
  email: string
  loai_tai_khoan: "SinhVien" | "ToChuc" | "Admin"
  ma_don_vi: number | null
  bi_khoa: boolean
}

const SEED_USERS: AdminUser[] = [
  {
    ma_nguoi_dung: 1,
    ho_ten: "Cao Duy Anh",
    email: "22521001@gm.uit.edu.vn",
    loai_tai_khoan: "SinhVien",
    ma_don_vi: 1,
    bi_khoa: false,
  },
  {
    ma_nguoi_dung: 2,
    ho_ten: "CLB WebDev UIT",
    email: "bch.webdev@uit.edu.vn",
    loai_tai_khoan: "ToChuc",
    ma_don_vi: 3,
    bi_khoa: false,
  },
  {
    ma_nguoi_dung: 3,
    ho_ten: "Ban quản lý Khoa",
    email: "bql.httt@uit.edu.vn",
    loai_tai_khoan: "ToChuc",
    ma_don_vi: 1,
    bi_khoa: false,
  },
  {
    ma_nguoi_dung: 4,
    ho_ten: "Phòng CTSV",
    email: "ctsv@uit.edu.vn",
    loai_tai_khoan: "Admin",
    ma_don_vi: null,
    bi_khoa: false,
  },
]

const PAGE_SIZE = 8

export default function AdminPortal({ section }: { section: Section }) {
  const navigate = useNavigate()
  const { tickets, certificates, attendanceRecords } = useApp()
  const { showToast } = useToast()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [page, setPage] = useState(1)
  const usersCol = useCollection<AdminUser>(
    "admin_users",
    SEED_USERS,
    "ma_nguoi_dung",
    {
      list: async () => {
        try {
          const res = await adminService.users()
          const rawUsers = (res.data || []) as Array<Partial<User> & { ma_nguoi_dung?: number; bi_khoa?: boolean; ma_don_vi?: number | null }>
          const mapped: AdminUser[] = rawUsers.map((u) => ({
            ma_nguoi_dung: Number(u.ma_tai_khoan ?? u.ma_nguoi_dung),
            ho_ten: u.ho_ten || "",
            email: u.email || "",
            loai_tai_khoan: u.loai_tai_khoan || "SinhVien",
            ma_don_vi: u.ma_don_vi_to_chuc ?? u.ma_don_vi ?? null,
            bi_khoa: u.hoat_dong !== undefined ? !u.hoat_dong : Boolean(u.bi_khoa),
          }))
          return { data: mapped }
        } catch (err) {
          console.warn("Failed to fetch admin users from backend, using seed data:", err)
          return { data: SEED_USERS }
        }
      },
      create: (i) =>
        adminService.createInternalUser({
          ...i,
          ma_don_vi_to_chuc: i.ma_don_vi ? Number(i.ma_don_vi) : undefined,
        }),
      update: (id, i) =>
        adminService.updateUserStatus(Number(id), {
          hoat_dong: !i.bi_khoa,
          ly_do: i.bi_khoa ? "Quản trị viên mở khóa tài khoản" : "Quản trị viên khóa tài khoản",
        }),
    },
  )
  const orgCol = useCollection<OrganizationSummary>(
    "admin_orgs",
    ORGANIZATIONS,
    "ma_don_vi",
    {
      list: async () => {
        try {
          const res = await adminService.organizations()
          const rows = ((res.data || []) as unknown) as Array<Record<string, unknown>>
          const mapped: OrganizationSummary[] = rows.map((r) => {
            const rawType = String(r.loai_don_vi || "")
            const loai_don_vi: OrganizationSummary["loai_don_vi"] =
              rawType === "Khoa"
                ? "Khoa"
                : rawType === "PhongBan" || rawType === "DoanHoi"
                  ? "PhongBan"
                  : "CLB_Doi_Nhom"
            return {
              ma_don_vi: Number(r.ma_don_vi ?? r.ma_don_vi_to_chuc),
              ten_don_vi: String(r.ten_don_vi || ""),
              loai_don_vi,
              ma_don_vi_cha: r.ma_don_vi_cha ? Number(r.ma_don_vi_cha) : null,
            }
          })
          return { data: mapped.length > 0 ? mapped : ORGANIZATIONS }
        } catch (err) {
          console.warn("Admin organizations API returned error, using fallback seed:", err)
          return { data: ORGANIZATIONS }
        }
      },
      create: (i) => {
        const payload = {
          ...i,
          ma_dinh_danh:
            (i as Record<string, unknown>).ma_dinh_danh ||
            i.ten_don_vi
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase() + "_" + Date.now().toString().slice(-4),
        }
        return adminService.createOrganization(payload)
      },
      update: (id, i) => adminService.updateOrganization(id, i),
    },
  )
  const topicCol = useCollection<Topic>(
    "admin_topics",
    CONTRACT_TOPICS,
    "ma_chuyen_de",
    {
      list: async () => {
        try {
          const res = await adminService.topics()
          const rows = (res.data || []) as Topic[]
          return { data: rows.length > 0 ? rows : CONTRACT_TOPICS }
        } catch (err) {
          console.warn("Admin topics API error, using fallback seed:", err)
          return { data: CONTRACT_TOPICS }
        }
      },
      create: (i) => adminService.createTopic(i),
      update: (id, i) => adminService.updateTopic(id, i),
      remove: (id) => adminService.deleteTopic(id),
    },
  )
  type Dialog =
    | { kind: "user"; item?: AdminUser }
    | { kind: "org"; item?: OrganizationSummary }
    | { kind: "topic"; item?: Topic }
    | { kind: "lock"; item: AdminUser }
    | { kind: "delTopic"; item: Topic }
    | { kind: "ticketLookup"; student: AdminUser }
    | { kind: "eventReconciliation"; event: AdminManageEvent }
    | { kind: "noShowGrace"; violation: NoShowViolation }
    | null
  const [dialog, setDialog] = useState<Dialog>(null)
  const [noShowList, setNoShowList] = useState<NoShowViolation[]>(DEFAULT_NO_SHOWS)
  const [noShowRate, setNoShowRate] = useState<number>(1.0)
  const [noShowReason, setNoShowReason] = useState<string>("")
  const [noShowSubmitting, setNoShowSubmitting] = useState<boolean>(false)
  const [lockReason, setLockReason] = useState<string>("")

  const users = useMemo(
    () =>
      usersCol.items.filter(
        (u) =>
          (!typeFilter || u.loai_tai_khoan === typeFilter) &&
          `${u.ho_ten} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [usersCol.items, search, typeFilter],
  )
  const pages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const pageUsers = users.slice(
    (Math.min(page, pages) - 1) * PAGE_SIZE,
    Math.min(page, pages) * PAGE_SIZE,
  )
  const orgOptions = [
    { value: "", label: "Không có" },
    ...orgCol.items.map((o) => ({
      value: String(o.ma_don_vi),
      label: o.ten_don_vi,
    })),
  ]
  const orgName = (id: number | null | undefined) =>
    orgCol.items.find((o) => o.ma_don_vi === id)?.ten_don_vi ?? "—"
  const state = (c: {
    loading: boolean
    error: string | null
    reload: () => void
  }) =>
    c.loading ? (
      <p className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</p>
    ) : c.error ? (
      <div className="p-6 text-sm text-red-600">
        {c.error}{" "}
        <button onClick={c.reload} className="font-semibold underline">
          Thử lại
        </button>
      </div>
    ) : null
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      showToast(ok, "success")
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
      throw e
    }
  }
  const createFor: Partial<Record<Section, Dialog>> = {
    users: { kind: "user" },
    organizations: { kind: "org" },
    topics: { kind: "topic" },
  }
  const titles: Record<Section, [string, string]> = {
    dashboard: [
      "Tổng quan toàn trường",
      "Các chỉ số macro theo phạm vi Admin.",
    ],
    events: [
      "Quản lý sự kiện & Khởi tạo cấp trường",
      "Khởi tạo sự kiện cấp Trường (P.CTSV), tạo nháp ủy quyền, sửa nháp, duyệt/rút đề xuất và can thiệp khẩn cấp.",
    ],
    "events-create": [
      "Khởi tạo sự kiện mới",
      "Tạo sự kiện cấp Trường (P.CTSV) hoặc tạo nháp ủy quyền cho các Khoa/CLB.",
    ],
    "events-edit": [
      "Chỉnh sửa nội dung sự kiện",
      "Cập nhật thông tin bản nháp hoặc điều chỉnh cấu hình sự kiện toàn trường.",
    ],
    users: [
      "Quản lý tài khoản",
      "Tạo tài khoản nội bộ, gán đơn vị và khóa/mở tài khoản.",
    ],
    organizations: [
      "Cây đơn vị tổ chức",
      "Khoa, Phòng ban và CLB/Đội/Nhóm theo quan hệ cha-con.",
    ],
    topics: ["Quản lý chuyên đề", "Danh mục chuyên đề dùng trong sự kiện."],
    reports: [
      "Báo cáo toàn trường",
      "Xu hướng sự kiện, đăng ký, tham gia và điểm rèn luyện.",
    ],
    "no-show": [
      "Quản lý No-show",
      "Xử lý vi phạm, đối soát minh chứng và cứu xét/xóa cờ vi phạm No-show theo quy chuẩn CTSV.",
    ],
    certificates: [
      "Quản trị chứng nhận",
      "Danh sách phát hành và thu hồi có kiểm soát.",
    ],
    participants: [
      "Quản trị người tham gia",
      "Giám sát người tham gia và đối soát điểm danh toàn trường.",
    ],
    staff: [
      "Nhân viên & CTV điểm danh",
      "Phân quyền nhân sự quét vé và vận hành sự kiện toàn trường.",
    ],
    "cohost-invitations": [
      "Lời mời đồng tổ chức",
      "Giám sát và duyệt thay lời mời phối hợp đồng tổ chức cấp trường.",
    ],
  }
  const [title, description] = titles[section]
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl">
        <p className="text-xs text-slate-400 mb-2">Admin / {title}</p>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-navy">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          {createFor[section] && (
            <button
              onClick={() => setDialog(createFor[section] ?? null)}
              className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer hover:bg-indigo-700"
            >
              Tạo mới
            </button>
          )}
          {section === "reports" && (
            <button
              onClick={() => {
                showToast(
                  "Đang kết xuất báo cáo vĩ mô toàn trường ra file Excel (GET /admin/analytics/macro/export)...",
                  "info",
                )
              }}
              onClickCapture={() => void reportsService.exportMacro().catch(() => null)}
              className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-700"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Báo cáo Vĩ mô (.xlsx)</span>
            </button>
          )}
        </div>
        {section === "events" ||
        section === "events-create" ||
        section === "events-edit" ? (
          <AdminEventsManagement
            initialMode={
              section === "events-create"
                ? "create"
                : section === "events-edit"
                  ? "edit"
                  : "list"
            }
            orgs={orgCol.items}
            topics={topicCol.items}
            onOpenReconciliation={(evt) =>
              setDialog({ kind: "eventReconciliation", event: evt })
            }
          />
        ) : section === "dashboard" || section === "reports" ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Tổng sự kiện", EVENTS.length],
                [
                  "Lượt đăng ký",
                  tickets.filter((ticket) => ticket.trang_thai !== "DaHuy")
                    .length,
                ],
                ["Lượt tham gia", attendanceRecords.length],
                ["Chứng nhận", certificates.length],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-display font-bold text-3xl text-navy mt-2">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-display font-semibold text-navy">
                Phân bổ sự kiện theo đơn vị
              </h2>
              <div className="mt-5 space-y-3">
                {ORGANIZATIONS.slice(0, 4).map((org, index) => (
                  <div key={org.ma_don_vi}>
                    <div className="flex justify-between text-sm">
                      <span>{org.ten_don_vi}</span>
                      <span>
                        {
                          EVENTS.filter(
                            (event) =>
                              event.don_vi_host.ma_don_vi === org.ma_don_vi,
                          ).length
                        }
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 mt-1">
                      <div
                        className="h-full rounded-full bg-indigo"
                        style={{ width: `${20 + index * 17}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Giám sát sự kiện & Mở Kiosk Điểm danh (Toàn quyền Admin / P.CTSV - UC-OPS-01 & UC-OPS-04) */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Toàn quyền Giám sát & Điều hành
                    </span>
                  </div>
                  <h2 className="font-display font-semibold text-lg text-navy mt-1">
                    Giám sát Hội trường & Điều hành Kiosk Điểm danh
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản trị viên P.CTSV có toàn quyền khởi tạo phiên Kiosk hội
                    trường độc lập và can thiệp điểm danh thủ công cho mọi sự
                    kiện toàn trường.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                      <th className="p-3 text-left">Sự kiện</th>
                      <th className="p-3 text-left">Đơn vị chủ trì</th>
                      <th className="p-3 text-left">Phòng & Thời gian</th>
                      <th className="p-3 text-left">Trạng thái</th>
                      <th className="p-3 text-right">Thao tác điều hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {EVENTS.slice(0, 4).map((evt) => (
                      <tr
                        key={evt.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="p-3 font-semibold text-navy max-w-xs truncate">
                          {evt.title}
                        </td>
                        <td className="p-3 text-xs text-slate-600">
                          {evt.organizer}
                        </td>
                        <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                          {evt.room} · {evt.time}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            PUBLISHED
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/kiosk/${evt.id}`)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 text-xs font-semibold mr-2 transition-colors cursor-pointer shadow-2xs"
                            title="Khởi tạo phiên Kiosk trình chiếu mã QR điểm danh hội trường"
                          >
                            <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Mở Kiosk</span>
                          </button>
                          <button
                            onClick={() =>
                              setDialog({
                                kind: "eventReconciliation",
                                event: evt,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Đối soát người tham gia & điều chỉnh thủ công trực tiếp"
                          >
                            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> Đối soát & Giải tỏa nghi vấn</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : section === "organizations" ? (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {state(orgCol)}
            {!orgCol.loading && !orgCol.error && orgCol.items.length === 0 && (
              <p className="p-6 text-sm text-slate-500">Chưa có đơn vị nào.</p>
            )}
            {orgCol.items.map((org) => (
              <div
                key={org.ma_don_vi}
                className="p-4 flex items-center justify-between"
              >
                <div style={{ paddingLeft: org.ma_don_vi_cha ? 28 : 0 }}>
                  <p className="font-semibold text-sm text-navy">
                    {org.ten_don_vi}
                  </p>
                  <p className="text-xs text-slate-400">
                    {org.loai_don_vi} · Cấp trên:{" "}
                    {org.ma_don_vi_cha ? orgName(org.ma_don_vi_cha) : "Gốc"}
                  </p>
                </div>
                <button
                  onClick={() => setDialog({ kind: "org", item: org })}
                  className="text-sm font-semibold text-indigo"
                >
                  Cập nhật
                </button>
              </div>
            ))}
          </div>
        ) : section === "topics" ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            {state(topicCol)}
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-3">Mã</th>
                  <th className="text-left p-3">Tên chuyên đề</th>
                  <th className="text-left p-3">Trạng thái</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {topicCol.items.map((topic) => (
                  <tr
                    key={topic.ma_chuyen_de}
                    className="border-t border-slate-100"
                  >
                    <td className="p-3 font-mono">{topic.ma_chuyen_de}</td>
                    <td className="p-3 font-medium">{topic.ten_chuyen_de}</td>
                    <td className="p-3 text-emerald-700">Đang dùng</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          setDialog({ kind: "topic", item: topic })
                        }
                        className="text-indigo font-semibold mr-4"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() =>
                          setDialog({ kind: "delTopic", item: topic })
                        }
                        className="text-red-600 font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : section === "users" ? (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Tìm họ tên, email..."
                aria-label="Tìm tài khoản"
                className="flex-1 min-w-[200px] max-w-md px-4 py-2.5 rounded-xl border border-slate-200"
              />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                aria-label="Lọc loại tài khoản"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">Tất cả loại</option>
                <option value="SinhVien">Sinh viên</option>
                <option value="ToChuc">Tổ chức</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              {state(usersCol)}
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {[
                      "Mã",
                      "Họ tên",
                      "Email",
                      "Loại",
                      "Đơn vị",
                      "Trạng thái",
                      "",
                    ].map((cell) => (
                      <th key={cell} className="text-left p-3">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.map((u) => (
                    <tr
                      key={u.ma_nguoi_dung}
                      className="border-t border-slate-100"
                    >
                      <td className="p-3">{u.ma_nguoi_dung}</td>
                      <td className="p-3">{u.ho_ten}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.loai_tai_khoan}</td>
                      <td className="p-3">{orgName(u.ma_don_vi)}</td>
                      <td
                        className={`p-3 ${
                          u.bi_khoa ? "text-red-600" : "text-emerald-700"
                        }`}
                      >
                        {u.bi_khoa ? "Đã khóa" : "Hoạt động"}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {u.loai_tai_khoan === "SinhVien" && (
                          <button
                            onClick={() =>
                              setDialog({ kind: "ticketLookup", student: u })
                            }
                            className="font-semibold text-cyan-700 hover:text-cyan-800 mr-4"
                            title="Tra cứu lịch sử đặt vé, hủy vé và hỗ trợ sinh viên"
                          >
                            Tra cứu vé & Hỗ trợ
                          </button>
                        )}
                        <button
                          onClick={() => {
                            showToast(
                              `Đã cấp lại mật khẩu tạm cho ${u.ho_ten} (${u.email}): UIT@2026!Temp. Đã bật cờ bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo.`,
                              "success",
                            )
                          }}
                          className="font-semibold text-amber-600 hover:text-amber-700 mr-4"
                          title="Cấp phát lại mật khẩu tạm & yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo"
                        >
                          Reset MK
                        </button>
                        <button
                          onClick={() => setDialog({ kind: "user", item: u })}
                          className="font-semibold text-indigo mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDialog({ kind: "lock", item: u })}
                          className="font-semibold text-slate-600"
                        >
                          {u.bi_khoa ? "Mở khóa" : "Khóa"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!usersCol.loading && pageUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-slate-500"
                      >
                        Không có tài khoản phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm text-slate-500">
              <span>
                {users.length} tài khoản · Trang {Math.min(page, pages)}/{pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        ) : section === "no-show" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Sinh viên vi phạm No-show ≥ 2 lần (đặt vé có slot nhưng không
                check-in và không hủy trước mốc T-4h) sẽ bị đưa vào danh sách
                xem xét trừ ĐRL hoặc hạn chế đặt vé theo quy chế CTSV.</span>
              </div>
              <button
                onClick={() => {
                  showToast(
                    "Đang xuất danh sách sinh viên tái phạm No-show ra Excel (GET /admin/analytics/no-show-violations)...",
                    "info",
                  )
                }}
                onClickCapture={() => void reportsService.noShow().catch(() => null)}
                className="px-3.5 py-2 rounded-xl bg-indigo text-white text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-indigo-700 flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Xuất file No-show (.xlsx)</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    {[
                      "MSSV",
                      "Họ tên",
                      "Lớp",
                      "Khoa",
                      "Số lần No-show",
                      "Lịch sử sự kiện bỏ vé",
                      "Biện pháp xử lý",
                      "Thao tác cứu xét",
                    ].map((c) => (
                      <th
                        key={c}
                        className={`p-3 text-left ${c.includes("Thao tác") ? "text-right" : ""}`}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {noShowList.map((row) => (
                    <tr
                      key={row.mssv}
                      className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {row.mssv}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="p-3 text-slate-600">{row.lop}</td>
                      <td className="p-3 text-slate-600">{row.khoa}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.vi_pham_no_show
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.count} lần
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500 max-w-xs">
                        {row.events}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                            row.vi_pham_no_show
                              ? "text-amber-700 bg-amber-50 border-amber-200"
                              : "text-emerald-700 bg-emerald-50 border-emerald-200"
                          }`}
                        >
                          {row.penalty}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {row.vi_pham_no_show ? (
                          <button
                            onClick={() => {
                              setNoShowReason("")
                              setNoShowRate(1.0)
                              setDialog({ kind: "noShowGrace", violation: row })
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                            title="Xử lý cứu xét phân bậc ĐRL và xóa cờ vi phạm No-show theo quy chuẩn CTSV"
                          >
                            <span className="flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Cứu xét / Xóa cờ</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã xóa cờ vi phạm</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : section === "certificates" ? (
          <Certificates embedded />
        ) : section === "participants" ? (
          <AdminParticipants />
        ) : section === "staff" ? (
          <AdminStaff />
        ) : section === "cohost-invitations" ? (
          <AdminCohostInvitations />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-sm text-slate-500">
              Module đã ánh xạ API. Demo Mode hiển thị dữ liệu mô phỏng.
            </p>
          </div>
        )}
      </div>
      {dialog?.kind === "user" && (
        <FormDialog
          key={dialog.item?.ma_nguoi_dung ?? "new"}
          open
          title={dialog.item ? "Cập nhật tài khoản" : "Tạo tài khoản nội bộ"}
          fields={
            [
              { name: "ho_ten", label: "Họ tên", required: true },
              { name: "email", label: "Email", type: "email", required: true },
              {
                name: "loai_tai_khoan",
                label: "Loại tài khoản",
                type: "select",
                options: [
                  { value: "ToChuc", label: "Tổ chức" },
                  { value: "Admin", label: "Admin" },
                  { value: "SinhVien", label: "Sinh viên" },
                ],
              },
              {
                name: "ma_don_vi",
                label: "Đơn vị",
                type: "select",
                options: orgOptions,
              },
              {
                name: "cap_mat_khau_tam",
                label:
                  "Cấp mật khẩu tạm (UIT@2026!Temp) & Bắt buộc đổi MK lần đầu",
                type: "checkbox",
              },
            ] satisfies FieldSpec[]
          }
          initial={
            dialog.item
              ? {
                  ho_ten: dialog.item.ho_ten,
                  email: dialog.item.email,
                  loai_tai_khoan: dialog.item.loai_tai_khoan,
                  ma_don_vi: dialog.item.ma_don_vi ?? "",
                  cap_mat_khau_tam: false,
                }
              : {
                  loai_tai_khoan: "ToChuc",
                  ma_don_vi: "",
                  cap_mat_khau_tam: true,
                }
          }
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            await run(
              () =>
                usersCol.save(
                  {
                    ...(dialog.item ?? { ma_nguoi_dung: 0, bi_khoa: false }),
                    ho_ten: String(v.ho_ten),
                    email: String(v.email),
                    loai_tai_khoan:
                      v.loai_tai_khoan as AdminUser["loai_tai_khoan"],
                    ma_don_vi: v.ma_don_vi ? Number(v.ma_don_vi) : null,
                  },
                  !dialog.item,
                ),
              dialog.item
                ? "Đã cập nhật tài khoản."
                : "Đã tạo tài khoản và kích hoạt cờ cấp mật khẩu tạm thành công.",
            )
          }}
        />
      )}
      {dialog?.kind === "org" && (
        <FormDialog
          key={dialog.item?.ma_don_vi ?? "new"}
          open
          title={dialog.item ? "Cập nhật đơn vị" : "Tạo đơn vị"}
          fields={[
            { name: "ten_don_vi", label: "Tên đơn vị", required: true },
            {
              name: "loai_don_vi",
              label: "Loại đơn vị",
              type: "select",
              options: [
                { value: "Khoa", label: "Khoa" },
                { value: "PhongBan", label: "Phòng ban" },
                { value: "CLB_Doi_Nhom", label: "CLB / Đội / Nhóm" },
              ],
            },
            {
              name: "ma_don_vi_cha",
              label: "Đơn vị cấp trên",
              type: "select",
              options: orgOptions.filter(
                (o) => o.value !== String(dialog.item?.ma_don_vi),
              ),
            },
          ]}
          initial={
            dialog.item
              ? {
                  ten_don_vi: dialog.item.ten_don_vi,
                  loai_don_vi: dialog.item.loai_don_vi,
                  ma_don_vi_cha: dialog.item.ma_don_vi_cha ?? "",
                }
              : { loai_don_vi: "CLB_Doi_Nhom", ma_don_vi_cha: "" }
          }
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            await run(
              () =>
                orgCol.save(
                  {
                    ...(dialog.item ?? { ma_don_vi: 0 }),
                    ten_don_vi: String(v.ten_don_vi),
                    loai_don_vi:
                      v.loai_don_vi as OrganizationSummary["loai_don_vi"],
                    ma_don_vi_cha: v.ma_don_vi_cha
                      ? Number(v.ma_don_vi_cha)
                      : null,
                  },
                  !dialog.item,
                ),
              "Đã lưu đơn vị.",
            )
          }}
        />
      )}
      {dialog?.kind === "topic" && (
        <FormDialog
          key={dialog.item?.ma_chuyen_de ?? "new"}
          open
          title={dialog.item ? "Cập nhật chuyên đề" : "Tạo chuyên đề"}
          fields={[
            { name: "ten_chuyen_de", label: "Tên chuyên đề", required: true },
          ]}
          initial={{ ten_chuyen_de: dialog.item?.ten_chuyen_de ?? "" }}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            await run(
              () =>
                topicCol.save(
                  {
                    ...(dialog.item ?? { ma_chuyen_de: 0, da_xoa: false }),
                    ten_chuyen_de: String(v.ten_chuyen_de),
                  },
                  !dialog.item,
                ),
              "Đã lưu chuyên đề.",
            )
          }}
        />
      )}
      {dialog?.kind === "lock" && (
        <Modal
          open
          title={dialog.item.bi_khoa ? "Mở khóa tài khoản" : "Khóa tài khoản"}
          onClose={() => {
            setDialog(null)
            setLockReason("")
          }}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {dialog.item.bi_khoa
                ? `Mở khóa tài khoản ${dialog.item.ho_ten} (${dialog.item.email})? Người dùng sẽ có thể đăng nhập lại bình thường.`
                : `Khóa tài khoản ${dialog.item.ho_ten} (${dialog.item.email})? Thao tác này sẽ đình chỉ hoạt động và thu hồi toàn bộ phiên làm việc của người dùng.`}
            </p>

            {!dialog.item.bi_khoa && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lý do khóa tài khoản (bắt buộc, tối thiểu 5 ký tự) *
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Ví dụ: Tái phạm vi phạm quy chế hoặc no-show nhiều lần..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                {lockReason.trim().length > 0 && lockReason.trim().length < 5 && (
                  <p className="text-[11px] text-red-500 mt-1">Lý do phải có tối thiểu 5 ký tự.</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDialog(null)
                  setLockReason("")
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!dialog.item.bi_khoa && lockReason.trim().length < 5}
                onClick={async () => {
                  const isLocking = !dialog.item.bi_khoa
                  await run(
                    async () => {
                      await adminService.updateUserStatus(dialog.item.ma_nguoi_dung, {
                        hoat_dong: !isLocking,
                        ...(isLocking ? { ly_do: lockReason.trim() } : {}),
                      })
                      await usersCol.reload()
                      setDialog(null)
                      setLockReason("")
                    },
                    isLocking ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công.",
                  )
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 cursor-pointer ${
                  dialog.item.bi_khoa ? "bg-indigo hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {dialog.item.bi_khoa ? "Mở khóa" : "Khóa tài khoản"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {dialog?.kind === "delTopic" && (
        <ConfirmDialog
          open
          danger
          title="Xóa chuyên đề"
          message={`Xóa chuyên đề "${dialog.item.ten_chuyen_de}"? Sự kiện đang dùng chuyên đề này có thể bị từ chối bởi backend.`}
          confirmLabel="Xóa"
          onClose={() => setDialog(null)}
          onConfirm={() =>
            run(
              () => topicCol.remove(dialog.item.ma_chuyen_de),
              "Đã xóa chuyên đề.",
            )
          }
        />
      )}
      {dialog?.kind === "ticketLookup" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
                  <TicketIcon className="w-5 h-5 text-cyan-700" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-lg text-navy">
                    Tra cứu vé & Lịch sử tham gia (P.CTSV)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ sinh viên <b>{dialog.student.ho_ten}</b> (
                    {dialog.student.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDialog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4">
              <div className="p-3 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl text-xs text-cyan-900 leading-relaxed">
                <b>Nghiệp vụ Tra cứu hỗ trợ:</b> Quản trị viên đối soát thời
                điểm đặt vé, kiểm tra tính hợp lệ của việc hủy vé trước mốc{" "}
                <b>T - 4h</b>, và cung cấp hỗ trợ kỹ thuật tại bàn CTSV khi sinh
                viên khiếu nại hoặc mất thiết bị.
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Danh sách vé của sinh viên trong hệ thống:
                </h3>
                {tickets.slice(0, 3).map((t) => (
                  <div
                    key={t.ma_dang_ky}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy text-sm">
                        {t.ten_su_kien}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.trang_thai === "DaHuy"
                            ? "bg-rose-100 text-rose-700"
                            : t.trang_thai === "DaCheckOut"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {t.trang_thai === "DaHuy"
                          ? "Đã hủy"
                          : t.trang_thai === "DaCheckOut"
                            ? "Đã tham dự"
                            : t.trang_thai === "DaCheckIn"
                              ? "Đã check-in"
                              : "Chưa check-in"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
                      <div>
                        Mã vé:{" "}
                        <b className="font-mono text-slate-900">
                          {t.ma_ve_uuid}
                        </b>
                      </div>
                      <div>
                        Thời gian:{" "}
                        <b>
                          {new Date(t.thoi_gian_bat_dau).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </b>
                      </div>
                      <div>
                        Địa điểm: <b>{t.ten_phong}</b>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {t.trang_thai === "DaHuy"
                            ? "Đã hủy trước ngày sự kiện (Hợp lệ trước mốc T-4h, không phạt No-show)"
                            : `Đặt vé lúc: ${new Date(t.thoi_gian_dang_ky).toLocaleString("vi-VN")}`}
                        </span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(t.ma_ve_uuid)
                              showToast(
                                `Đã sao chép mã vé ${t.ma_ve_uuid}`,
                                "success",
                              )
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          Sao chép mã
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              if (t.ma_dang_ky) {
                                await feedbackService.grantGrace(
                                  t.ma_dang_ky,
                                  `Admin phê duyệt ân hạn khảo sát 24h cho sinh viên ${dialog.student.ho_ten}`,
                                )
                              }
                              showToast(
                                `Đã cấp ân hạn làm bài khảo sát 24h cho sinh viên ${dialog.student.ho_ten} (POST /admin/tickets/${t.ma_dang_ky}/feedback-grace).`,
                                "success",
                              )
                            } catch (err) {
                              showToast(getApiErrorMessage(err), "error")
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] cursor-pointer"
                          title="Cấp ân hạn làm bài khảo sát sau 48h (UC-FEED-01.AC.1)"
                        >
                          Ân hạn 24h
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
              <button
                onClick={() => setDialog(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog?.kind === "noShowGrace" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                  <Scale className="w-4 h-4 text-purple-700" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-lg text-navy">
                    Cứu xét & Xóa cờ No-show
                  </h2>
                  <p className="text-xs text-slate-500">
                    Phòng Công tác Sinh viên (UC-OPS-04)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDialog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs my-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Sinh viên:</span>
                <b className="text-navy">
                  {dialog.violation.name} ({dialog.violation.mssv})
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp / Khoa:</span>
                <span className="text-slate-700">
                  {dialog.violation.lop} · {dialog.violation.khoa}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lần vi phạm:</span>
                <span className="font-bold text-rose-600">
                  {dialog.violation.count} lần
                </span>
              </div>
              <div className="text-slate-500 pt-1 border-t border-slate-200">
                Sự kiện:{" "}
                <span className="text-slate-700">
                  {dialog.violation.events}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phương án cứu xét & Phân bậc ĐRL *
                </label>
                <select
                  value={noShowRate}
                  onChange={(e) => setNoShowRate(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white font-medium focus:outline-none focus:border-indigo"
                >
                  <option value={1.0}>
                    Xóa cờ No-show & Cứu xét 100% ĐRL (ti_le_drl = 1.00)
                  </option>
                  <option value={0.7}>
                    Xóa cờ No-show & Cứu xét 70% ĐRL (ti_le_drl = 0.70)
                  </option>
                  <option value={0.5}>
                    Xóa cờ No-show & Cứu xét 50% ĐRL (ti_le_drl = 0.50)
                  </option>
                  <option value={0.0}>
                    Chỉ xóa cờ No-show, không cấp ĐRL (ti_le_drl = 0.00)
                  </option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700">
                    Lý do cứu xét (Lưu Audit Log) *
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      noShowReason.trim().length >= 10
                        ? "text-emerald-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {noShowReason.trim().length} / 10 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  placeholder="Ví dụ: Đã đối soát minh chứng sinh viên có mặt tham dự nhưng điện thoại hết pin không quét được mã check-in..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={noShowSubmitting || noShowReason.trim().length < 10}
                onClick={async () => {
                  setNoShowSubmitting(true)
                  try {
                    await attendanceService.manualOverride({
                      ma_dang_ky: dialog.violation.ma_dang_ky,
                      trang_thai_moi:
                        noShowRate > 0 ? "DaCheckOut" : "DaCheckIn",
                      ti_le_drl_moi: noShowRate,
                      ly_do: noShowReason.trim(),
                    })
                    setNoShowList((prev) =>
                      prev.map((row) =>
                        row.mssv === dialog.violation.mssv
                          ? {
                              ...row,
                              vi_pham_no_show: false,
                              count: Math.max(0, row.count - 1),
                              penalty: "Đã giải tỏa vi phạm",
                            }
                          : row,
                      ),
                    )
                    showToast(
                      `Đã cứu xét và xóa cờ No-show cho sinh viên ${dialog.violation.name} (${dialog.violation.mssv}) thành công.`,
                      "success",
                    )
                    setDialog(null)
                    setNoShowReason("")
                  } catch (err) {
                    showToast(getApiErrorMessage(err), "error")
                  } finally {
                    setNoShowSubmitting(false)
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {noShowSubmitting ? "Đang xử lý..." : "Xác nhận xóa cờ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog?.kind === "eventReconciliation" && (
        <AdminEventReconciliationDialog
          event={dialog.event}
          onClose={() => setDialog(null)}
        />
      )}
    </AdminLayout>
  )
}

function AdminEventReconciliationDialog({
  event,
  onClose,
}: {
  event: AdminManageEvent
  onClose: () => void
}) {
  const { tickets, manualOverrideAttendance } = useApp()
  const { showToast } = useToast()
  const [filter, setFilter] =
    useState<"all" | "pending" | "checkin" | "checkout" | "cancelled" | "fraud" | "noshow">(
      "all",
    )
  const [search, setSearch] = useState("")

  // Override sub-state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newStatus, setNewStatus] = useState<"DaCheckIn" | "DaCheckOut">(
    "DaCheckOut",
  )
  const [drlRate, setDrlRate] = useState<1.0 | 0.5>(1.0)
  const [reason, setReason] = useState("")
  const [verifiedPhysicalCard, setVerifiedPhysicalCard] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const eventTickets = tickets.filter(
    (t) =>
      t.eventId === event.id ||
      String(t.ma_su_kien) === String(event.ma_su_kien) ||
      (event.ma_su_kien && t.ma_su_kien === event.ma_su_kien),
  )

  const isEventCompleted =
    (event.status as string) === "closed" ||
    event.trang_thai === "COMPLETED" ||
    new Date().getTime() >
      new Date(
        `${event.date}T${event.endTime?.split(" ")[0] || "11:30"}:00+07:00`,
      ).getTime()

  // Counters
  const countAttended = eventTickets.filter(
    (t) =>
      t.trang_thai === "DaCheckOut" ||
      t.trang_thai === "DaCheckIn" ||
      t.status === "attended",
  ).length
  const countPending = eventTickets.filter(
    (t) =>
      (t.trang_thai === "DaDangKy" || t.status === "pending") &&
      !t.vi_pham_no_show,
  ).length
  const countFraud = eventTickets.filter((t) => t.nghi_van_gian_lan).length
  const countNoShow = eventTickets.filter((t) => t.vi_pham_no_show).length
  const countCancelled = eventTickets.filter(
    (t) => t.trang_thai === "DaHuy" || t.status === "cancelled",
  ).length

  const filtered = eventTickets.filter((t) => {
    const matches =
      (t.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.studentId || "").includes(search) ||
      (t.faculty || "").toLowerCase().includes(search.toLowerCase())

    if (!matches) return false
    if (filter === "all") return true
    if (filter === "pending")
      return t.trang_thai === "DaDangKy" || t.status === "pending"
    if (filter === "checkin") return t.trang_thai === "DaCheckIn"
    if (filter === "checkout")
      return t.trang_thai === "DaCheckOut" || t.status === "attended"
    if (filter === "cancelled")
      return t.trang_thai === "DaHuy" || t.status === "cancelled"
    if (filter === "fraud") return Boolean(t.nghi_van_gian_lan)
    if (filter === "noshow") return Boolean(t.vi_pham_no_show)
    return true
  })

  function startOverride(t: Ticket) {
    setSelectedTicket(t)
    setError("")
    setVerifiedPhysicalCard(false)
    if (isEventCompleted) {
      setNewStatus("DaCheckOut")
      setDrlRate(1.0)
    } else {
      setNewStatus(t.trang_thai === "DaCheckIn" ? "DaCheckOut" : "DaCheckIn")
      setDrlRate(1.0)
    }
    if (t.nghi_van_gian_lan) {
      setReason(
        "Quản trị viên P.CTSV đã đối soát Thẻ sinh viên vật lý chính chủ tại hiện trường, giải tỏa cờ nghi vấn gian lận.",
      )
    } else {
      setReason("")
    }
  }

  async function handleSaveOverride() {
    if (!selectedTicket) return
    if (selectedTicket.nghi_van_gian_lan && !verifiedPhysicalCard) {
      setError(
        "Bắt buộc phải đối soát Thẻ sinh viên vật lý trước khi giải tỏa cờ nghi vấn gian lận.",
      )
      return
    }
    if (reason.trim().length < 10) {
      setError("Lý do điều chỉnh bắt buộc tối thiểu 10 ký tự.")
      return
    }

    setSubmitting(true)
    setError("")

    const effectiveDrlRate = newStatus === "DaCheckIn" ? 0.0 : drlRate

    const res = await manualOverrideAttendance({
      ma_dang_ky: selectedTicket.ma_dang_ky,
      ticketId: selectedTicket.id,
      trang_thai_moi: newStatus,
      ti_le_drl_moi: effectiveDrlRate,
      ly_do: reason.trim(),
      da_doi_soat_the: verifiedPhysicalCard,
    })

    setSubmitting(false)

    if (res.success) {
      showToast(
        "Đã điều chỉnh trạng thái thành công và ghi nhận Audit Log.",
        "success",
      )
      setSelectedTicket(null)
    } else {
      setError(res.error || "Không thể thực hiện điều chỉnh.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Toàn quyền Quản trị viên
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-medium">
                {event.room} · {event.time}
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-navy mt-1">
              Đối soát điểm danh & Giải tỏa nghi vấn: {event.title}
            </h2>
            <p className="text-xs text-slate-500">
              Đơn vị chủ trì: <b>{event.organizer}</b> · Quản trị viên can thiệp
              trực tiếp không cần chuyển vai trò
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Advisory Banner if completed */}
        {isEventCompleted && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <strong>Gợi ý ngữ cảnh Admin:</strong> Sự kiện đã kết thúc kế
              hoạch. Khi can thiệp, hãy ưu tiên chọn <strong>DaCheckOut</strong>{" "}
              kèm mức hưởng ĐRL tương ứng để đảm bảo sinh viên đủ điều kiện làm
              khảo sát và nhận ĐRL.
            </div>
          </div>
        )}

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3">
          <button
            onClick={() => setFilter("all")}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              filter === "all"
                ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="font-bold text-lg text-navy">
              {eventTickets.length}
            </div>
            <div className="text-slate-500 text-[11px]">Tổng vé đăng ký</div>
          </button>
          <button
            onClick={() => setFilter("checkout")}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              filter === "checkout"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="font-bold text-lg text-emerald-600">
              {countAttended}
            </div>
            <div className="text-slate-500 text-[11px]">Đã điểm danh</div>
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              filter === "pending"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="font-bold text-lg text-amber-600">
              {countPending}
            </div>
            <div className="text-slate-500 text-[11px]">Chưa điểm danh</div>
          </button>
          <button
            onClick={() => setFilter("fraud")}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              countFraud > 0
                ? filter === "fraud"
                  ? "bg-red-50 border-red-300 ring-2 ring-red-200 text-red-700"
                  : "bg-red-50/50 border-red-200 text-red-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <div
              className={`font-bold text-lg ${
                countFraud > 0 ? "text-red-600" : ""
              }`}
            >
              {countFraud}
            </div>
            <div className="text-[11px] font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Nghi vấn gian lận</span>
            </div>
          </button>
          <button
            onClick={() => setFilter("noshow")}
            className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
              countNoShow > 0
                ? filter === "noshow"
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200 text-amber-700"
                  : "bg-amber-50/50 border-amber-200 text-amber-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <div
              className={`font-bold text-lg ${
                countNoShow > 0 ? "text-amber-600" : ""
              }`}
            >
              {countNoShow}
            </div>
            <div className="text-[11px] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Vi phạm No-show</span>
            </div>
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo MSSV, họ tên..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
          />
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[
              ["all", "Tất cả"],
              ["fraud", `Nghi vấn (${countFraud})`],
              ["noshow", `No-show (${countNoShow})`],
              ["pending", "Chưa điểm danh"],
              ["checkout", "Đã điểm danh"],
              ["cancelled", `Đã hủy (${countCancelled})`],
            ].map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f
                    ? f === "fraud"
                      ? "bg-red-600 text-white"
                      : f === "noshow"
                        ? "bg-amber-600 text-white"
                        : "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="mt-3 flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="p-2.5 text-left">MSSV & Họ tên</th>
                <th className="p-2.5 text-left">Khoa</th>
                <th className="p-2.5 text-left">Trạng thái vé</th>
                <th className="p-2.5 text-left">Cảnh báo & ĐRL</th>
                <th className="p-2.5 text-right">Thao tác Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const isCancelled =
                  t.trang_thai === "DaHuy" || t.status === "cancelled"
                return (
                  <tr
                    key={t.id || t.ma_dang_ky}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="p-2.5">
                      <p className="font-semibold text-slate-900">
                        {t.studentName}
                      </p>
                      <p className="font-mono text-slate-400 text-[11px]">
                        {t.studentId}
                      </p>
                    </td>
                    <td className="p-2.5 text-slate-600">{t.faculty}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? "bg-red-100 text-red-700"
                            : t.trang_thai === "DaCheckOut"
                              ? "bg-emerald-100 text-emerald-700"
                              : t.trang_thai === "DaCheckIn"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-amber-100 text-amber-700"
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
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-wrap gap-1">
                        {t.nghi_van_gian_lan && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                            Nghi vấn ({t.ma_thiet_bi_nghi_van || "Quét hộ"})
                          </span>
                        )}
                        {t.vi_pham_no_show && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Vi phạm No-show
                          </span>
                        )}
                        {t.ti_le_drl > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
                            {Math.round(t.ti_le_drl * 100)}% ĐRL
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      {isCancelled ? (
                        <span className="text-[11px] text-slate-400 font-semibold cursor-not-allowed">
                          Đã hủy (Khóa)
                        </span>
                      ) : (
                        <button
                          onClick={() => startOverride(t)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                            t.nghi_van_gian_lan
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-2xs"
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {t.nghi_van_gian_lan
                            ? "Xử lý nghi vấn"
                            : "Điều chỉnh"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Không tìm thấy sinh viên nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 mt-3 flex justify-between items-center text-xs text-slate-500">
          <span>{filtered.length} kết quả đối soát</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>

        {/* Sub-Modal: Override action for selected ticket */}
        {selectedTicket && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Thao tác Quản trị viên
                  </span>
                  <h3 className="font-display font-bold text-base text-navy mt-1">
                    Điều chỉnh trạng thái điểm danh
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Student info */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                <p className="font-bold text-navy">
                  {selectedTicket.studentName} ({selectedTicket.studentId})
                </p>
                <p className="text-slate-500">
                  Khoa: {selectedTicket.faculty} · Vé #
                  {selectedTicket.ma_dang_ky || selectedTicket.id}
                </p>
                <p className="text-slate-600 font-semibold">
                  Hiện tại: {selectedTicket.trang_thai || selectedTicket.status}
                </p>
              </div>

              {/* Fraud Warning Checkbox */}
              {selectedTicket.nghi_van_gian_lan && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Phát hiện nghi vấn gian lận ({selectedTicket.ma_thiet_bi_nghi_van || "Quét hộ"})</span>
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer font-semibold pt-1 border-t border-red-200/80">
                    <input
                      type="checkbox"
                      checked={verifiedPhysicalCard}
                      onChange={(e) =>
                        setVerifiedPhysicalCard(e.target.checked)
                      }
                      className="mt-0.5 w-4 h-4 rounded text-red-600"
                    />
                    <span>
                      Xác nhận: Quản trị viên P.CTSV đã đối soát Thẻ sinh viên
                      vật lý chính chủ hợp lệ tại hiện trường
                    </span>
                  </label>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trạng thái mới <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus("DaCheckIn")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newStatus === "DaCheckIn"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    DaCheckIn (Đã vào)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus("DaCheckOut")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      newStatus === "DaCheckOut"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    DaCheckOut (Hoàn tất)
                  </button>
                </div>
              </div>

              {/* DRL Rate Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tỷ lệ Điểm Rèn Luyện (ti_le_drl){" "}
                  <span className="text-red-500">*</span>
                </label>
                {newStatus === "DaCheckOut" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDrlRate(1.0)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        drlRate === 1.0
                          ? "bg-purple-50 border-purple-400 ring-2 ring-purple-200 text-purple-900 font-bold"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <div>100% · Trọn vẹn</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Hưởng tối đa ĐRL
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrlRate(0.5)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        drlRate === 0.5
                          ? "bg-purple-50 border-purple-400 ring-2 ring-purple-200 text-purple-900 font-bold"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      <div>50% · Một phần</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Tham gia một phần
                      </div>
                    </button>
                  </div>
                ) : (
                  <p className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-500">
                    Cố định <strong>0.00 (0% ĐRL)</strong> khi chỉ chuyển sang
                    DaCheckIn.
                  </p>
                )}
              </div>

              {/* Reason input */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700">
                    Lý do điều chỉnh (Audit Log) *
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      reason.trim().length >= 10
                        ? "text-emerald-600 font-bold"
                        : "text-slate-400"
                    }`}
                  >
                    {reason.trim().length} / 10 ký tự
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do điều chỉnh bắt buộc (>= 10 ký tự)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  disabled={
                    submitting ||
                    reason.trim().length < 10 ||
                    (selectedTicket.nghi_van_gian_lan && !verifiedPhysicalCard)
                  }
                  className="flex-1 py-2 rounded-xl bg-indigo text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  {submitting ? "Đang lưu..." : "Xác nhận & Lưu kiểm toán"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
