import { useState, useEffect, useCallback } from "react"
import { TOPIC_LABELS } from "../../data/mock"
import type {
  WaitlistEntry,
  Topic as ContractTopic,
  OrganizationSummary,
} from "../../data/contract"
import { useUser } from "../../context/UserContext"
import {
  useApp,
  EVENT_STATUS_LABELS,
  type LiveEvent,
  type EventStatus,
} from "../../context/AppContext"
import { mapContractEventToLiveEvent } from "../../context/EventDataContext"
import { eventsService } from "../../api/services/events.service"
import { organizationsService } from "../../api/services/organizations.service"
import type { PaginationMeta } from "../../api/services/auth.service"
import { getApiErrorMessage } from "../../api/errors"

import {
  Building2,
  Award,
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export { TOPIC_LABELS }

interface Props {
  onSelectEvent: (eventId: string) => void
  onNavigate: (screen: string) => void
  isGuest?: boolean
  onOpenLogin?: () => void
  onOpenRegister?: () => void
}

type OrgOption = OrganizationSummary & { ma_don_vi_to_chuc?: number }

const STATUS_COLORS: Record<EventStatus, { bg: string; text: string }> = {
  open: { bg: "#dcfce7", text: "#15803d" },
  nearly_full: { bg: "#fef9c3", text: "#a16207" },
  full: { bg: "#fee2e2", text: "#b91c1c" },
  draft: { bg: "#f1f5f9", text: "#64748b" },
  closed: { bg: "#e0e7ff", text: "#4338ca" },
  happening: { bg: "#e0f2fe", text: "#0369a1" },
  ended: { bg: "#f1f5f9", text: "#94a3b8" },
}

const TOPIC_PALETTE = [
  "#4f46e5",
  "#0891b2",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#db2777",
]

function getTopicColor(name: string, index?: number): string {
  if (typeof index === "number") {
    return TOPIC_PALETTE[index % TOPIC_PALETTE.length]
  }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return TOPIC_PALETTE[hash % TOPIC_PALETTE.length]
}

export default function EventList({
  onSelectEvent,
  isGuest = false,
  onOpenLogin,
  onOpenRegister,
}: Props) {
  const { user, role } = useUser()
  const {
    events,
    getUserActiveTicket,
    computeStatus,
    getStudentWaitlistEntries,
    refreshTickets,
  } = useApp()

  useEffect(() => {
    if (!isGuest && role === "student" && refreshTickets) {
      void refreshTickets(user)
    }
  }, [isGuest, role, user.studentId, refreshTickets])

  const [topics, setTopics] = useState<ContractTopic[]>([])
  const [organizations, setOrganizations] = useState<OrgOption[]>([])

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [topicId, setTopicId] = useState("")
  const [orgId, setOrgId] = useState("")
  const [drlRule, setDrlRule] = useState<"" | "Dieu3" | "Dieu4" | "KhongCo">("")
  const [slotType, setSlotType] = useState<"" | "limited" | "unlimited">("")
  const [statusMode, setStatusMode] = useState<
    "" | "con_cho" | "PUBLISHED" | "HAPPENING" | "COMPLETED"
  >("")
  const [tuNgay, setTuNgay] = useState("")
  const [denNgay, setDenNgay] = useState("")
  const [sort, setSort] = useState<"bat_dau_asc" | "bat_dau_desc" | "moi_cong_bo">(
    "bat_dau_asc",
  )
  const [page, setPage] = useState(1)

  const [pagedEvents, setPagedEvents] = useState<LiveEvent[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [serverStats, setServerStats] = useState<{
    openCount: number | null
    totalCount: number | null
  }>({ openCount: null, totalCount: null })
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let ignore = false
    Promise.allSettled([
      organizationsService.topics(),
      organizationsService.publicList(),
      eventsService.listPublic({ con_cho: "true", limit: 1 }),
      eventsService.listPublic({ limit: 1 }),
    ]).then(([topicsRes, orgsRes, openRes, totalRes]) => {
      if (ignore) return
      if (topicsRes.status === "fulfilled" && Array.isArray(topicsRes.value.data)) {
        setTopics(topicsRes.value.data)
      }
      if (orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value.data)) {
        setOrganizations(orgsRes.value.data as OrgOption[])
      }
      setServerStats({
        openCount:
          openRes.status === "fulfilled"
            ? (openRes.value.meta?.tong_so_ban_ghi ?? openRes.value.meta?.total ?? null)
            : null,
        totalCount:
          totalRes.status === "fulfilled"
            ? (totalRes.value.meta?.tong_so_ban_ghi ?? totalRes.value.meta?.total ?? null)
            : null,
      })
    })
    return () => {
      ignore = true
    }
  }, [])

  const fetchFilteredEvents = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    try {
      const query: Record<string, string | number | undefined> = {
        page,
        limit: 12,
        sort,
      }
      if (debouncedSearch) query.q = debouncedSearch
      if (topicId) query.ma_chuyen_de = Number(topicId)
      if (orgId) query.ma_don_vi_to_chuc = Number(orgId)
      if (drlRule) query.dieu_khoan_drl = drlRule
      if (slotType === "unlimited") query.khong_gioi_han_slot = "true"
      else if (slotType === "limited") query.khong_gioi_han_slot = "false"

      if (statusMode === "con_cho") {
        query.con_cho = "true"
      } else if (statusMode) {
        query.trang_thai = statusMode
      }

      if (tuNgay) query.tu_ngay = tuNgay
      if (denNgay) query.den_ngay = denNgay

      const res = await eventsService.listPublic(query)
      const cards = Array.isArray(res.data) ? res.data : []
      setPagedEvents(cards.map(mapContractEventToLiveEvent))
      setMeta(res.meta ?? null)
    } catch (err) {
      setListError(getApiErrorMessage(err))
    } finally {
      setListLoading(false)
    }
  }, [
    page,
    sort,
    debouncedSearch,
    topicId,
    orgId,
    drlRule,
    slotType,
    statusMode,
    tuNgay,
    denNgay,
  ])

  useEffect(() => {
    void fetchFilteredEvents()
  }, [fetchFilteredEvents])

  const activeFiltersCount =
    (topicId ? 1 : 0) +
    (orgId ? 1 : 0) +
    (drlRule ? 1 : 0) +
    (slotType ? 1 : 0) +
    (statusMode ? 1 : 0) +
    (tuNgay ? 1 : 0) +
    (denNgay ? 1 : 0) +
    (search.trim() ? 1 : 0)

  function resetFilters() {
    setSearch("")
    setDebouncedSearch("")
    setTopicId("")
    setOrgId("")
    setDrlRule("")
    setSlotType("")
    setStatusMode("")
    setTuNgay("")
    setDenNgay("")
    setSort("bat_dau_asc")
    setPage(1)
  }

  const totalRecords = meta?.tong_so_ban_ghi ?? meta?.total ?? pagedEvents.length
  const currentPage = meta?.trang_hien_tai ?? meta?.current_page ?? page
  const totalPages = meta?.tong_so_trang ?? meta?.last_page ?? 1

  return (
    <div className="min-h-full pb-16">
      {/* Web Hero Banner */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              {isGuest ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                  <span>Cổng thông tin sự kiện sinh viên công khai</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xin chào, {user.displayName}</span>
                  <span>·</span>
                  <span>{user.faculty}</span>
                </div>
              )}
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 tracking-tight">
                Khám phá sự kiện học đường
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                Tham gia các hội thảo học thuật, workshop kỹ năng, ngày hội nghề
                nghiệp và hoạt động tình nguyện để tích lũy điểm rèn luyện và
                nhận chứng nhận số.
              </p>

              {isGuest && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onOpenLogin}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Đăng nhập để đăng ký sự kiện
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Đăng ký tài khoản mới
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs text-center min-w-[120px]">
                <div className="text-2xl font-display font-bold text-indigo-600">
                  {serverStats.openCount ??
                    events.filter(
                      (e) =>
                        computeStatus(e) === "open" ||
                        computeStatus(e) === "nearly_full",
                    ).length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                  Đang mở đăng ký
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-xs text-center min-w-[120px]">
                <div className="text-2xl font-display font-bold text-emerald-600">
                  {serverStats.totalCount ?? totalRecords}
                </div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                  Tổng sự kiện
                </div>
              </div>
            </div>
          </div>

          {/* Web Search & Filtering Toolbar */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            {/* Row 1: Keyword, Topic, Organization, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Search input */}
              <div className="relative sm:col-span-2 lg:col-span-4">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
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
                  placeholder="Tìm kiếm tên sự kiện, mô tả, diễn giả..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>

              {/* Topic dropdown */}
              <div className="lg:col-span-3">
                <select
                  value={topicId}
                  onChange={(e) => {
                    setTopicId(e.target.value)
                    setPage(1)
                  }}
                  aria-label="Lọc theo chuyên đề"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">Tất cả chuyên đề</option>
                  {topics.map((t) => (
                    <option key={t.ma_chuyen_de} value={String(t.ma_chuyen_de)}>
                      {t.ten_chuyen_de}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organization / Faculty dropdown */}
              <div className="lg:col-span-3">
                <select
                  value={orgId}
                  onChange={(e) => {
                    setOrgId(e.target.value)
                    setPage(1)
                  }}
                  aria-label="Lọc theo Khoa / Đơn vị tổ chức"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">Tất cả Khoa / Đơn vị tổ chức</option>
                  {organizations.map((org) => {
                    const id = org.ma_don_vi_to_chuc ?? org.ma_don_vi
                    return (
                      <option key={id} value={String(id)}>
                        {org.ten_don_vi}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Status / Availability dropdown */}
              <div className="lg:col-span-2">
                <select
                  value={statusMode}
                  onChange={(e) => {
                    setStatusMode(
                      e.target.value as
                        | ""
                        | "con_cho"
                        | "PUBLISHED"
                        | "HAPPENING"
                        | "COMPLETED",
                    )
                    setPage(1)
                  }}
                  aria-label="Lọc theo trạng thái"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">Đang mở & Sắp tới</option>
                  <option value="con_cho">Còn chỗ mở đăng ký</option>
                  <option value="PUBLISHED">Sắp diễn ra (PUBLISHED)</option>
                  <option value="HAPPENING">Đang diễn ra (HAPPENING)</option>
                  <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                </select>
              </div>
            </div>

            {/* Row 2: DRL Rule, Slot Type, Date Range (tu_ngay - den_ngay), Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* DRL Rule */}
              <div className="lg:col-span-3">
                <select
                  value={drlRule}
                  onChange={(e) => {
                    setDrlRule(
                      e.target.value as "" | "Dieu3" | "Dieu4" | "KhongCo",
                    )
                    setPage(1)
                  }}
                  aria-label="Lọc theo điều khoản ĐRL"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">Tất cả điều khoản ĐRL</option>
                  <option value="Dieu3">Điều 3 (ĐRL Học thuật / Chính trị)</option>
                  <option value="Dieu4">Điều 4 (ĐRL Văn hóa / Cộng đồng)</option>
                  <option value="KhongCo">Không cộng ĐRL</option>
                </select>
              </div>

              {/* Slot Type */}
              <div className="lg:col-span-2">
                <select
                  value={slotType}
                  onChange={(e) => {
                    setSlotType(e.target.value as "" | "limited" | "unlimited")
                    setPage(1)
                  }}
                  aria-label="Lọc theo loại sự kiện"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">Tất cả loại slot</option>
                  <option value="limited">Giới hạn slot</option>
                  <option value="unlimited">Mở tự do</option>
                </select>
              </div>

              {/* Date Range: Từ ngày - Đến ngày */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={tuNgay}
                  onChange={(e) => {
                    const nextFrom = e.target.value
                    setTuNgay(nextFrom)
                    if (denNgay && nextFrom && denNgay < nextFrom) {
                      setDenNgay(nextFrom)
                    }
                    setPage(1)
                  }}
                  title="Từ ngày"
                  aria-label="Từ ngày"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                />
              </div>
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={denNgay}
                  min={tuNgay || undefined}
                  onChange={(e) => {
                    setDenNgay(e.target.value)
                    setPage(1)
                  }}
                  title="Đến ngày"
                  aria-label="Đến ngày"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                />
              </div>

              {/* Sort */}
              <div className="lg:col-span-3">
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(
                      e.target.value as
                        | "bat_dau_asc"
                        | "bat_dau_desc"
                        | "moi_cong_bo",
                    )
                    setPage(1)
                  }}
                  aria-label="Sắp xếp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="bat_dau_asc">Sắp diễn ra gần nhất</option>
                  <option value="bat_dau_desc">Thời gian muộn nhất trước</option>
                  <option value="moi_cong_bo">Mới công bố</option>
                </select>
              </div>
            </div>

            {/* Secondary filter chips row */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">
                  Chuyên đề:
                </span>
                <Chip
                  label="Tất cả"
                  active={!topicId}
                  onClick={() => {
                    setTopicId("")
                    setPage(1)
                  }}
                  color="#4f46e5"
                />
                {topics.map((t, idx) => (
                  <Chip
                    key={t.ma_chuyen_de}
                    label={t.ten_chuyen_de}
                    active={topicId === String(t.ma_chuyen_de)}
                    onClick={() => {
                      const nextId = String(t.ma_chuyen_de)
                      setTopicId(topicId === nextId ? "" : nextId)
                      setPage(1)
                    }}
                    color={getTopicColor(t.ten_chuyen_de, idx)}
                  />
                ))}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Xóa bộ lọc ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Danh sách sự kiện
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị {pagedEvents.length} / {totalRecords} sự kiện phù hợp
            </p>
          </div>
        </div>

        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4"
              >
                <div className="h-44 bg-slate-100 rounded-2xl w-full" />
                <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : listError ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
            <p className="text-sm font-semibold text-rose-800">
              Không thể tải dữ liệu sự kiện từ máy chủ
            </p>
            <p className="text-xs text-rose-600 mt-1">{listError}</p>
            <button
              onClick={() => void fetchFilteredEvents()}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : pagedEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">
              Không tìm thấy sự kiện
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Không có sự kiện nào khớp với tiêu chí tìm kiếm của bạn.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              Xem tất cả sự kiện
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedEvents.map((event) => {
                const activeWaitlist =
                  !isGuest && user?.studentId
                    ? getStudentWaitlistEntries(user.studentId).find(
                        (w) =>
                          w.ma_su_kien === event.ma_su_kien &&
                          ["WAITING", "OFFERED"].includes(w.trang_thai),
                      )
                    : undefined
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={
                      !isGuest && role === "student" && !!getUserActiveTicket(event.id, user.studentId)
                    }
                    waitlistEntry={role === "student" ? activeWaitlist : undefined}
                    isGuest={isGuest}
                    canJoinWaitlistView={isGuest || role === "student"}
                    onSelect={() => onSelectEvent(event.id)}
                  />
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-xs">
                <p className="text-xs text-slate-500 font-medium">
                  Trang <span className="font-bold text-slate-800">{currentPage}</span> /{" "}
                  <span className="font-bold text-slate-800">{totalPages}</span> · Tổng{" "}
                  <span className="font-bold text-slate-800">{totalRecords}</span> sự kiện
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        p === currentPage
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EventCard({
  event,
  isRegistered,
  waitlistEntry,
  isGuest,
  canJoinWaitlistView = true,
  onSelect,
}: {
  event: LiveEvent
  isRegistered: boolean
  waitlistEntry?: WaitlistEntry
  isGuest: boolean
  canJoinWaitlistView?: boolean
  onSelect: () => void
  key?: React.Key
}) {
  const { computeStatus } = useApp()
  const status = computeStatus(event)
  const isHappening = event.trang_thai === "HAPPENING" && status !== "ended"
  const isWaitlistOpen =
    canJoinWaitlistView && status === "full" && event.trang_thai === "PUBLISHED"
  const sc = isHappening
    ? { bg: "#e0e7ff", text: "#4338ca" }
    : STATUS_COLORS[status]
  const statusBadgeLabel = isHappening
    ? "Đang diễn ra"
    : status === "closed"
      ? "Đã đóng đăng ký"
      : EVENT_STATUS_LABELS[status]
  const pct = Math.round((event.registered / event.capacity) * 100)
  const dateObj = new Date(event.date)
  const dateStr = dateObj.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col border border-slate-200/80 group cursor-pointer focus:outline-none"
    >
      {/* Banner Image with 16:9 Aspect Ratio */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs backdrop-blur-xs"
              style={{
                background: getTopicColor(
                  event.ten_chuyen_de || String(event.topic),
                ),
              }}
            >
              {event.ten_chuyen_de ||
                TOPIC_LABELS[event.topic] ||
                "Chuyên đề"}
            </span>
            {event.khong_gioi_han_slot && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500 text-white shadow-xs">
                Mở tự do
              </span>
            )}
          </div>
          <span
            className={`px-2.5 py-0.8 rounded-full text-xs font-semibold shadow-xs ${
              isWaitlistOpen && !isRegistered
                ? waitlistEntry?.trang_thai === "OFFERED"
                  ? "bg-amber-500 text-white animate-pulse"
                  : waitlistEntry
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-amber-500 text-white"
                : ""
            }`}
            style={
              isWaitlistOpen && !isRegistered
                ? undefined
                : { background: sc.bg, color: sc.text }
            }
          >
            {isWaitlistOpen && !isRegistered
              ? waitlistEntry?.trang_thai === "OFFERED"
                ? "Có suất nhận vé ưu tiên"
                : waitlistEntry
                  ? `Hàng chờ FIFO #${waitlistEntry.so_thu_tu}`
                  : "Hết vé · Hàng chờ FIFO mở"
              : statusBadgeLabel}
          </span>
        </div>

        {/* Bottom Banner Tag */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5">
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
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5"
              />
            </svg>
            <span className="font-medium">
              {dateStr} · {event.time} - {event.endTime}
            </span>
          </div>
          {isRegistered && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
              Đã có vé
            </span>
          )}
          {!isRegistered && waitlistEntry?.trang_thai === "OFFERED" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
              Suất vé chờ xác nhận
            </span>
          )}
          {!isRegistered && waitlistEntry?.trang_thai === "WAITING" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white shadow-xs">
              Hàng chờ #{waitlistEntry.so_thu_tu}
            </span>
          )}
          {!isRegistered && !waitlistEntry && isWaitlistOpen && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/90 text-white shadow-xs">
              Hàng chờ FIFO mở
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            {event.dieu_khoan_drl && event.dieu_khoan_drl !== "KhongCo" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Award className="w-3 h-3" />
                <span>
                  +{event.diem_drl_du_kien} ĐRL ·{" "}
                  {event.dieu_khoan_drl === "Dieu4" ? "Điều 4" : "Điều 3"}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                Không cộng ĐRL
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2">
            {event.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mb-1.5">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" />
            <span className="truncate">{event.ten_don_vi_host}</span>
          </div>

          {event.danh_sach_ten_dong_to_chuc &&
            event.danh_sach_ten_dong_to_chuc.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                <Users className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">
                  Đồng tổ chức: {event.danh_sach_ten_dong_to_chuc.join(", ")}
                </span>
              </div>
            )}

          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1.5">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <span className="truncate">{event.speaker}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Capacity Meter */}
        <div className="pt-3 border-t border-slate-100">
          {event.khong_gioi_han_slot ? (
            <div className="flex justify-between items-center text-xs py-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Mở tự do
              </span>
              <span className="text-slate-500 text-xs font-medium">
                {status === "ended"
                  ? "Đã kết thúc"
                  : status === "closed"
                    ? "Đã đóng"
                    : "Không giới hạn slot"}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {event.registered}/{event.capacity} chỗ ({pct}%)
                </span>
                <span
                  className={`font-semibold text-xs ${
                    status === "closed" || status === "ended"
                      ? "text-slate-500"
                      : pct >= 100
                        ? "text-amber-700"
                        : pct >= 90
                          ? "text-rose-600"
                          : pct >= 70
                            ? "text-amber-600"
                            : "text-emerald-600"
                  }`}
                >
                  {status === "ended"
                    ? "Đã kết thúc"
                    : isHappening
                      ? "Đang diễn ra (Đóng ĐK)"
                      : status === "closed"
                        ? "Đã đóng đăng ký"
                        : event.capacity - event.registered > 0
                          ? "Còn " + (event.capacity - event.registered) + " chỗ"
                          : "Hết vé · Có hàng chờ FIFO"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100
                      ? "bg-amber-500"
                      : pct >= 90
                        ? "bg-rose-500"
                        : pct >= 70
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Button CTA preview */}
          <div
            className="mt-3.5 w-full py-2.5 rounded-xl text-xs font-semibold text-center transition-colors shadow-xs"
            style={{
              background:
                !isGuest && isRegistered
                  ? "#dcfce7"
                  : waitlistEntry?.trang_thai === "OFFERED"
                    ? "#fef3c7"
                    : waitlistEntry
                      ? "#fef9c3"
                      : status === "full"
                        ? "#fffbeb"
                        : "#eef2ff",
              color:
                !isGuest && isRegistered
                  ? "#15803d"
                  : waitlistEntry?.trang_thai === "OFFERED"
                    ? "#b45309"
                    : waitlistEntry
                      ? "#854d0e"
                      : status === "full"
                        ? "#b45309"
                        : "#4f46e5",
              border:
                status === "full" && !isRegistered
                  ? "1px solid #fde68a"
                  : "none",
            }}
          >
            {!isGuest && isRegistered
              ? "Xem vé của bạn →"
              : waitlistEntry?.trang_thai === "OFFERED"
                ? "Có suất nhận vé — Mở Ví vé →"
                : waitlistEntry
                  ? `Trong hàng chờ FIFO #${waitlistEntry.so_thu_tu} →`
                  : isWaitlistOpen
                    ? "Hết vé · Đăng ký hàng chờ FIFO →"
                    : status === "ended" || status === "closed" || isHappening
                      ? "Xem chi tiết sự kiện →"
                      : isGuest
                        ? "Xem chi tiết sự kiện →"
                        : "Xem chi tiết & Đăng ký →"}
          </div>
        </div>
      </div>
    </button>
  )
}

function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string
  active: boolean
  onClick: () => void
  color: string
  key?: React.Key
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer"
      style={{
        background: active ? color : "#f1f5f9",
        color: active ? "white" : "#64748b",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  )
}

export function BottomNav({
  current,
  onNavigate,
}: {
  current: string
  onNavigate: (s: string) => void
}) {
  return null
}
