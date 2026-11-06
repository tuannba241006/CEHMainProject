import { useState, useMemo } from "react"
import { OrgLayout } from "./OrgLayout"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"

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
}

const INITIAL_INVITATIONS: CohostInvitation[] = [
  {
    id: "cohost-01",
    eventId: "evt-01",
    eventTitle: "UIT AI & Cloud Computing Workshop 2026",
    hostUnit: "CLB WebDev UIT (Host A)",
    invitedUnit: "Phòng Công tác Sinh viên (P.CTSV)",
    hostContact: "Nguyễn Văn An · bch.webdev@uit.edu.vn",
    topic: "Học thuật & Trí tuệ nhân tạo",
    eventDate: "2026-11-15",
    eventTime: "08:00 - 11:30",
    roomName: "Hội trường E · Tầng 2 · Tòa E",
    roleDescription:
      "Phối hợp hỗ trợ kiểm tra thiết bị đường truyền mạng, điều phối sinh viên và hỗ trợ check-in.",
    drlAllocation: "Cộng 5 điểm DRL Điều 3 cho sinh viên tham gia.",
    deadline: "2026-11-02T18:00:00+07:00",
    hoursLeft: 38,
    status: "pending",
  },
  {
    id: "cohost-02",
    eventId: "evt-02",
    eventTitle: "Chung kết Hackathon UIT Code Sprint 2026",
    hostUnit: "Khoa Hệ thống Thông tin (Host A)",
    invitedUnit: "CLB WebDev UIT",
    hostContact: "TS. Nguyễn Minh Hải · bql.httt@uit.edu.vn",
    topic: "Kỹ năng mềm & Công nghệ",
    eventDate: "2026-11-20",
    eventTime: "07:30 - 17:00",
    roomName: "Hội trường B · Tòa B",
    roleDescription:
      "Cử 3 giám khảo vòng sơ loại và cử 5 CTV hỗ trợ soát vé thẻ sinh viên cơ sở.",
    drlAllocation: "Cộng 8 điểm DRL Điều 2.",
    deadline: "2026-10-30T12:00:00+07:00",
    hoursLeft: 0,
    status: "accepted",
  },
  {
    id: "cohost-03",
    eventId: "evt-03",
    eventTitle: "Ngày hội Sách và Văn hóa Đọc Sinh viên",
    hostUnit: "Đoàn Thanh niên - Hội Sinh viên (Host A)",
    invitedUnit: "Khoa Hệ thống Thông tin",
    hostContact: "Đ/c Lê Thanh Tùng · doanthanhnien@uit.edu.vn",
    topic: "Văn hóa & Nghệ thuật",
    eventDate: "2026-12-01",
    eventTime: "08:30 - 16:30",
    roomName: "Sảnh Tòa A",
    roleDescription: "Hỗ trợ 2 gian hàng trưng bày sản phẩm công nghệ.",
    drlAllocation: "Cộng 4 điểm DRL Điều 4.",
    deadline: "2026-10-25T17:00:00+07:00",
    hoursLeft: 0,
    status: "declined",
    declineReason: "Trùng lịch tổ chức kỳ thi giữa kỳ của đơn vị.",
  },
]

export default function CohostInvitations({ onNavigate, onLogout }: Props) {
  const { user, role } = useUser()
  const { showToast } = useToast()
  const [invitations, setInvitations] =
    useState<CohostInvitation[]>(INITIAL_INVITATIONS)
  const [filter, setFilter] =
    useState<"all" | "pending" | "accepted" | "declined">("all")
  const [selectedDecline, setSelectedDecline] =
    useState<CohostInvitation | null>(null)
  const [declineReason, setDeclineReason] = useState("")

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

  function handleAccept(inv: CohostInvitation) {
    setInvitations((prev) =>
      prev.map((item) =>
        item.id === inv.id ? { ...item, status: "accepted" } : item,
      ),
    )
    showToast(
      `Đã đồng ý (DONG_Y) tham gia đồng tổ chức sự kiện "${inv.eventTitle}". Hồ sơ tiến hành chuyển bước phê duyệt tiếp theo.`,
      "success",
    )
  }

  function handleDeclineConfirm() {
    if (!selectedDecline) return
    if (!declineReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối đồng tổ chức.", "error")
      return
    }

    setInvitations((prev) =>
      prev.map((item) =>
        item.id === selectedDecline.id
          ? { ...item, status: "declined", declineReason: declineReason.trim() }
          : item,
      ),
    )
    showToast(
      `Đã từ chối (TU_CHOI) lời mời đồng tổ chức cho sự kiện "${selectedDecline.eventTitle}".`,
      "info",
    )
    setSelectedDecline(null)
    setDeclineReason("")
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
                Khi Đơn vị chủ trì chính (Host A) gửi đề xuất có mời đơn vị của
                bạn đồng tổ chức, bạn có thời hạn 48 giờ để xác nhận Đồng ý (
                <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                  DONG_Y
                </code>
                ) hoặc Từ chối (
                <code className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">
                  TU_CHOI
                </code>
                ).
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
              <p className="text-xs text-emerald-700">Đã đồng ý (DONG_Y)</p>
              <p className="font-display font-bold text-xl text-emerald-900 mt-0.5">
                {scopedInvitations.filter((i) => i.status === "accepted").length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
              <p className="text-xs text-rose-700">Đã từ chối (TU_CHOI)</p>
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

        {/* Invitations List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              ✉️
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
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Đã đồng ý (DONG_Y)
                        </span>
                      )}
                      {inv.status === "declined" && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ Đã từ chối (TU_CHOI)
                        </span>
                      )}
                    </div>

                    <h2 className="font-display font-bold text-lg sm:text-xl text-navy">
                      {inv.eventTitle}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">
                          Đơn vị chủ trì (Host A):
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
                        <p className="font-semibold text-slate-900 mt-0.5">
                          📅 {inv.eventDate} ({inv.eventTime})
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">
                          Địa điểm / Hội trường:
                        </span>
                        <p className="font-semibold text-slate-900 mt-0.5">
                          📍 {inv.roomName}
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
                  {inv.status === "pending" && (
                    <div className="flex lg:flex-col gap-2 self-start lg:self-center shrink-0 w-full lg:w-44 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleAccept(inv)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer text-center"
                      >
                        Đồng ý (DONG_Y)
                      </button>
                      <button
                        onClick={() => setSelectedDecline(inv)}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors cursor-pointer text-center"
                      >
                        Từ chối (TU_CHOI)
                      </button>
                    </div>
                  )}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lý do từ chối tham gia (Bắt buộc theo quy chế kiểm toán)
                </label>
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
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgLayout>
  )
}
