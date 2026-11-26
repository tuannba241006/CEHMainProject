import { useState, useMemo, useEffect } from "react"
import { OrgLayout } from "./OrgLayout"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage, isAuthError } from "../../api/errors"
import { AlertTriangle, Mail, Check, X, Calendar, MapPin } from "lucide-react"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export interface CohostInvitation {
  id: string
  eventId: string
  eventTitle: string
  hostUnit: string
  hostContact: string
  topic: string
  eventDate: string
  eventTime: string
  roomName: string
  roleDescription: string
  drlAllocation: string
  deadline: string // ISO string or relative time
  hoursLeft: number
  status: "pending" | "accepted" | "declined" | "expired"
  declineReason?: string
  invitedUnit?: string
  description?: string
  agenda?: any
  speaker?: string
  targetAudience?: string
}

const INITIAL_INVITATIONS: CohostInvitation[] = []

export default function CohostInvitations({ onNavigate, onLogout }: Props) {
  const { user, role } = useUser()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    eventsService
      .getCohostInvitations({ trang_thai_xac_nhan: "ALL", limit: 100 })
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data)) {
          const mapped: CohostInvitation[] = res.data.map((item: any) => {
            const startDateStr = item.thoi_gian_bat_dau || "2026-11-15T08:00:00+07:00"
            const endDateStr = item.thoi_gian_ket_thuc || "2026-11-15T11:30:00+07:00"
            const eventDate = startDateStr.slice(0, 10)
            const startTime = startDateStr.includes("T")
              ? startDateStr.split("T")[1].slice(0, 5)
              : "08:00"
            const endTime = endDateStr.includes("T")
              ? endDateStr.split("T")[1].slice(0, 5)
              : "11:30"
            let uiStatus: CohostInvitation["status"] = "pending"
            if (item.trang_thai_xac_nhan === "DONG_Y") uiStatus = "accepted"
            else if (item.trang_thai_xac_nhan === "TU_CHOI") uiStatus = "declined"

            let hoursLeft = 48
            if (item.han_giu_cho_tam) {
              const diffMs = new Date(item.han_giu_cho_tam).getTime() - Date.now()
              hoursLeft = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)))
            }

            return {
              id: `cohost-${item.id}`,
              eventId: String(item.ma_su_kien),
              eventTitle: item.ten_su_kien,
              hostUnit: item.don_vi_host?.ten_don_vi || "Ban tổ chức",
              invitedUnit:
                item.don_vi_dong_to_chuc?.ten_don_vi ||
                user.don_vi?.ten_don_vi ||
                "CLB WebDev UIT",
              hostContact: item.don_vi_host?.loai_don_vi || "Đơn vị chủ trì",
              topic: item.ten_chuyen_de || "Chuyên đề sự kiện",
              eventDate,
              eventTime: `${startTime} - ${endTime}`,
              roomName: item.ten_phong || "Chưa cập nhật",
              roleDescription:
                "Phối hợp đồng tổ chức, truyền thông và điều phối check-in sinh viên.",
              drlAllocation: item.diem_drl_du_kien
                ? `Cộng ${item.diem_drl_du_kien} điểm ĐRL (${item.dieu_khoan_drl === "Dieu4" ? "Điều 4" : item.dieu_khoan_drl === "Dieu3" ? "Điều 3" : "Không có"})`
                : "Không cộng điểm ĐRL",
              deadline: item.han_giu_cho_tam || "2026-11-02T18:00:00+07:00",
              hoursLeft,
              status: uiStatus,
              declineReason: item.ghi_chu_tu_choi || item.ly_do_tu_choi || undefined,
              description: item.mo_ta,
              agenda: item.lo_trinh,
              speaker: item.dien_gia,
              targetAudience: item.doi_tuong_tham_gia,
            }
          })
          setInvitations(mapped)
        }
      })
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
  }, [user])

  const [invitations, setInvitations] =
    useState<CohostInvitation[]>(INITIAL_INVITATIONS)
  const [filter, setFilter] =
    useState<"all" | "pending" | "accepted" | "declined">("all")
  const [selectedDecline, setSelectedDecline] =
    useState<CohostInvitation | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [viewPlanModal, setViewPlanModal] =
    useState<CohostInvitation | null>(null)

  // Data scoping cô lập tuyệt đối: Chỉ hiển thị lời mời gửi đích danh đến đơn vị của người dùng!
  const scopedInvitations = useMemo(() => {
    const isPctsAdmin = role === "admin" || role === "student_affairs"
    const targetKeyword = isPctsAdmin
      ? "sinh viên"
      : (user.don_vi?.ten_don_vi || "").toLowerCase()

    return invitations.filter((inv) => {
      const target = (inv.invitedUnit || "").toLowerCase()
      if (target) return target.includes(targetKeyword)
      if (isPctsAdmin) return inv.id === "cohost-01"
      return !inv.hostUnit.toLowerCase().includes(targetKeyword)
    })
  }, [invitations, role, user])

  const filtered = scopedInvitations.filter(
    (inv) => filter === "all" || inv.status === filter,
  )

  async function handleAccept(inv: CohostInvitation) {
    const numericEventId = Number(inv.eventId.replace(/\D/g, "")) || 101
    try {
      await eventsService.cohostRespond(numericEventId, {
        dong_y: true,
        trang_thai_xac_nhan: "DONG_Y",
      })
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === inv.id ? { ...item, status: "accepted" } : item,
        ),
      )
      showToast(
        `Đã đồng ý tham gia đồng tổ chức sự kiện "${inv.eventTitle}". Hồ sơ tiến hành chuyển bước phê duyệt tiếp theo.`,
        "success",
      )
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  async function handleDeclineConfirm() {
    if (!selectedDecline) return
    const trimmed = declineReason.trim()
    if (!trimmed) {
      showToast("Vui lòng nhập lý do từ chối đồng tổ chức.", "error")
      return
    }
    if (trimmed.length < 5) {
      showToast("Lý do từ chối đồng tổ chức bắt buộc phải có ít nhất 5 ký tự.", "error")
      return
    }

    const numericEventId =
      Number(selectedDecline.eventId.replace(/\D/g, "")) || 101
    try {
      await eventsService.cohostRespond(numericEventId, {
        dong_y: false,
        trang_thai_xac_nhan: "TU_CHOI",
        ghi_chu_tu_choi: trimmed,
        ly_do_tu_choi: trimmed,
      })
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === selectedDecline.id
            ? {
                ...item,
                status: "declined",
                declineReason: trimmed,
              }
            : item,
        ),
      )
      showToast(
        `Đã từ chối lời mời đồng tổ chức cho sự kiện "${selectedDecline.eventTitle}".`,
        "info",
      )
      setSelectedDecline(null)
      setDeclineReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    }
  }

  const pendingCount = scopedInvitations.filter((i) => i.status === "pending").length

  return (
    <OrgLayout current="org-cohost" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-screen-xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <button
            onClick={() =>
              onNavigate(
                role === "admin" || role === "student_affairs"
                  ? "/admin/dashboard"
                  : "org-dashboard",
              )
            }
            className="hover:text-indigo-600 cursor-pointer"
          >
            {role === "admin" || role === "student_affairs"
              ? "Quản trị viên"
              : "Ban tổ chức"}
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">
            Lời mời đồng tổ chức
          </span>
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Đồng tổ chức
                </span>
                <span className="text-xs text-slate-400">Soft Hold 48 giờ</span>
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-navy mt-2">
                Lời mời đồng tổ chức sự kiện
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Khi Đơn vị chủ trì gửi đề xuất có mời đơn vị của
                bạn đồng tổ chức, bạn có thời hạn 48 giờ để xác nhận Đồng ý hoặc Từ chối phối hợp.
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Có {pendingCount} lời mời cần bạn phản hồi gấp!</span>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-slate-50">
              <p className="text-xs text-slate-500">Tổng lời mời</p>
              <p className="font-display font-bold text-xl text-navy mt-0.5">
                {scopedInvitations.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <p className="text-xs text-amber-700">Chờ phản hồi (48h)</p>
              <p className="font-display font-bold text-xl text-amber-900 mt-0.5">
                {pendingCount}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-xs text-emerald-700">Đã đồng ý</p>
              <p className="font-display font-bold text-xl text-emerald-900 mt-0.5">
                {scopedInvitations.filter((i) => i.status === "accepted").length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
              <p className="text-xs text-rose-700">Đã từ chối</p>
              <p className="font-display font-bold text-xl text-rose-900 mt-0.5">
                {scopedInvitations.filter((i) => i.status === "declined").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {[
            ["all", "Tất cả lời mời"],
            ["pending", `Chờ phản hồi (${pendingCount})`],
            ["accepted", "Đã đồng ý"],
            ["declined", "Đã từ chối"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val as typeof filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === val
                  ? "bg-navy text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invitations List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`skel-inv-${idx}`}
                className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Không có lời mời nào
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hiện tại không có lời mời đồng tổ chức nào trong mục này.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {inv.topic}
                      </span>
                      {inv.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>
                            Thời hạn Soft Hold còn {inv.hoursLeft} giờ
                          </span>
                        </span>
                      )}
                      {inv.status === "accepted" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã đồng ý</span>
                        </span>
                      )}
                      {inv.status === "declined" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>Đã từ chối</span>
                        </span>
                      )}
                    </div>

                    <h2 className="font-display font-bold text-lg sm:text-xl text-navy">
                      {inv.eventTitle}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">
                          Đơn vị chủ trì:
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          {inv.hostUnit}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {inv.hostContact}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">
                          Thời gian tổ chức:
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{inv.eventDate} ({inv.eventTime})</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">
                          Địa điểm / Hội trường:
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{inv.roomName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
                      <p className="font-semibold text-indigo-900">
                        Phân công vai trò & Quyền lợi đề xuất:
                      </p>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        {inv.roleDescription}
                      </p>
                      <p className="text-indigo-700 font-medium mt-1.5">
                        ⭐ {inv.drlAllocation}
                      </p>
                    </div>

                    {inv.status === "declined" && inv.declineReason && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800">
                        <b>Lý do từ chối:</b> {inv.declineReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 self-start lg:self-center shrink-0 w-full lg:w-44 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      onClick={() => setViewPlanModal(inv)}
                      className="flex-1 py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer text-center"
                    >
                      Xem chi tiết kế hoạch
                    </button>
                    {inv.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(inv)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer text-center"
                        >
                          Đồng ý tham gia
                        </button>
                        <button
                          onClick={() => setSelectedDecline(inv)}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer text-center"
                        >
                          Từ chối lời mời
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Decline Reason Modal */}
        {selectedDecline && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h3 className="font-display font-bold text-lg text-navy">
                Từ chối lời mời đồng tổ chức
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sự kiện: <b>{selectedDecline.eventTitle}</b> do{" "}
                <b>{selectedDecline.hostUnit}</b> chủ trì.
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Lý do từ chối tham gia (bắt buộc)
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      declineReason.trim().length >= 5
                        ? "text-emerald-600 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {declineReason.trim().length} / 5 ký tự tối thiểu
                  </span>
                </div>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Đơn vị đã có kế hoạch khác vào thời điểm trên; hoặc không đủ nhân sự hỗ trợ..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2.5 mt-6">
                <button
                  onClick={() => {
                    setSelectedDecline(null)
                    setDeclineReason("")
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeclineConfirm}
                  disabled={declineReason.trim().length < 5}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Detail Modal */}
        {viewPlanModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    Kế hoạch tổ chức chi tiết
                  </span>
                  <h3 className="font-display font-bold text-lg text-navy mt-1">
                    {viewPlanModal.eventTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setViewPlanModal(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl">
                  <div>
                    <span className="text-slate-400">Đơn vị chủ trì:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewPlanModal.hostUnit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Địa điểm:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewPlanModal.roomName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Thời gian tổ chức:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewPlanModal.eventDate} ({viewPlanModal.eventTime})</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Diễn giả:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{viewPlanModal.speaker || "Chưa cập nhật"}</p>
                  </div>
                </div>

                {viewPlanModal.description && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Mô tả sự kiện:</h4>
                    <p className="p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-wrap">{viewPlanModal.description}</p>
                  </div>
                )}

                {viewPlanModal.targetAudience && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Đối tượng tham gia:</h4>
                    <p className="p-3 bg-slate-50 rounded-xl leading-relaxed">{viewPlanModal.targetAudience}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Lộ trình chương trình (Agenda):</h4>
                  {Array.isArray(viewPlanModal.agenda) && viewPlanModal.agenda.length > 0 ? (
                    <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl">
                      {viewPlanModal.agenda.map((ag: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                          <span className="font-mono font-semibold text-indigo-600 shrink-0">{ag.thoi_gian}</span>
                          <span className="text-slate-800">{ag.hoat_dong} {ag.dien_gia ? `(${ag.dien_gia})` : ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : typeof viewPlanModal.agenda === "string" && viewPlanModal.agenda ? (
                    <p className="p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-wrap">{viewPlanModal.agenda}</p>
                  ) : (
                    <p className="p-3 bg-slate-50 rounded-xl text-slate-400 italic">Theo phân công của Ban tổ chức chủ trì.</p>
                  )}
                </div>

                <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="font-semibold text-indigo-900">Phân công vai trò & Quyền lợi DRL:</p>
                  <p className="mt-1 text-slate-600">{viewPlanModal.roleDescription}</p>
                  <p className="font-medium text-indigo-700 mt-1">⭐ {viewPlanModal.drlAllocation}</p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setViewPlanModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                {viewPlanModal.status === "pending" && (
                  <button
                    onClick={() => {
                      const item = viewPlanModal
                      setViewPlanModal(null)
                      void handleAccept(item)
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    Đồng ý tham gia
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  )
}
