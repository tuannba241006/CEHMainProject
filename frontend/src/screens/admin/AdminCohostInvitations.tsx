import { useState, useMemo, useEffect } from "react"
import { useToast } from "../../components/Toast"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage } from "../../api/errors"

export interface AdminCohostInvitation {
  id: string
  eventId: number
  eventTitle: string
  topic: string
  hostUnit: string
  hostContact: string
  invitedUnit: string
  time: string
  location: string
  roleDescription: string
  drlPoints: number
  status: "pending" | "accepted" | "declined"
  softHoldRemainingHours: number
  declineReason?: string
}

const INITIAL_INVITATIONS: AdminCohostInvitation[] = [
  {
    id: "cohost-01",
    eventId: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    topic: "Trí tuệ Nhân tạo & Khoa học Dữ liệu",
    hostUnit: "Khoa Hệ thống Thông tin (Host A)",
    hostContact: "bqt.is@campus.edu.vn",
    invitedUnit: "Phòng Công tác Sinh viên (CTSV)",
    time: "2026-10-15 (08:30 - 11:30)",
    location: "Hội trường A - Cơ sở 1",
    roleDescription: "Đồng chủ trì thẩm định quy chế, điều phối truyền thông cấp trường và bảo trợ điểm rèn luyện.",
    drlPoints: 5,
    status: "pending",
    softHoldRemainingHours: 32,
  },
  {
    id: "cohost-02",
    eventId: 102,
    eventTitle: "UIT AI & Cloud Computing Workshop 2026",
    topic: "Học thuật & Trí tuệ nhân tạo",
    hostUnit: "CLB WebDev UIT (Host A)",
    hostContact: "contact@webdevuit.vn",
    invitedUnit: "Khoa Hệ thống Thông tin",
    time: "2026-11-15 (09:00 - 11:30)",
    location: "Hội trường E - Tầng 2 - Tòa E",
    roleDescription: "Phối hợp hỗ trợ kiểm tra thiết bị đường truyền mạng, điều phối sinh viên và hỗ trợ check-in.",
    drlPoints: 5,
    status: "pending",
    softHoldRemainingHours: 38,
  },
  {
    id: "cohost-03",
    eventId: 103,
    eventTitle: "Chung kết Hackathon UIT Code Sprint 2026",
    topic: "Kỹ năng mềm & Công nghệ",
    hostUnit: "Khoa Hệ thống Thông tin (Host A)",
    hostContact: "ts.nguyenminhai@is.uit.edu.vn",
    invitedUnit: "CLB WebDev UIT",
    time: "2026-11-20 (07:30 - 17:00)",
    location: "Hội trường B - Tòa B",
    roleDescription: "Cử 3 giám khảo vòng sơ loại và cử 5 CTV hỗ trợ soát vé thẻ sinh viên cơ sở.",
    drlPoints: 5,
    status: "accepted",
    softHoldRemainingHours: 0,
  },
  {
    id: "cohost-04",
    eventId: 104,
    eventTitle: "Ngày hội Sách và Văn hóa Đọc Sinh viên",
    topic: "Văn hóa & Nghệ thuật",
    hostUnit: "Đoàn Thanh niên - Hội Sinh viên",
    hostContact: "doantn@campus.edu.vn",
    invitedUnit: "CLB Sách & Tri Thức",
    time: "2026-11-25 (08:00 - 16:30)",
    location: "Sảnh Tòa A - Cơ sở 1",
    roleDescription: "Quản lý gian hàng triển lãm sách và tổ chức minigame đố vui nhận thưởng.",
    drlPoints: 3,
    status: "declined",
    softHoldRemainingHours: 0,
    declineReason: "Trùng lịch tổ chức kỳ thi cuối kỳ của thành viên Ban Chủ nhiệm CLB.",
  },
]

export default function AdminCohostInvitations() {
  const { showToast } = useToast()

  const [invitations, setInvitations] = useState<AdminCohostInvitation[]>(INITIAL_INVITATIONS)
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "declined">("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadInvitations() {
      try {
        setLoading(true)
        const res = await eventsService.getCohostInvitations()
        if (!cancelled && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: AdminCohostInvitation[] = res.data.map((inv, idx) => ({
            id: `api-cohost-${inv.id || idx}`,
            eventId: inv.ma_su_kien,
            eventTitle: inv.ten_su_kien,
            topic: "Đồng tổ chức",
            hostUnit: inv.don_vi_host.ten_don_vi,
            hostContact: "contact@uit.edu.vn",
            invitedUnit: inv.don_vi_dong_to_chuc.ten_don_vi,
            time: inv.thoi_gian_tao || "2026-11-01",
            location: "Hội trường UIT",
            roleDescription: "Phối hợp tổ chức sự kiện và điều phối sinh viên.",
            drlPoints: 5,
            status: inv.trang_thai_xac_nhan === "DONG_Y" ? "accepted" : inv.trang_thai_xac_nhan === "TU_CHOI" ? "declined" : "pending",
            softHoldRemainingHours: inv.trang_thai_xac_nhan === "CHO_XAC_NHAN" ? 48 : 0,
            declineReason: inv.ly_do_tu_choi || undefined,
          }))
          setInvitations(mapped)
        }
      } catch {
        // Fall back to INITIAL_INVITATIONS silently
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadInvitations()
    return () => {
      cancelled = true
    }
  }, [])

  // Decline modal state
  const [selectedDecline, setSelectedDecline] = useState<AdminCohostInvitation | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Filter invitations by unit and status
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      // Unit filter (matches either invited unit or host unit)
      let matchUnit = true
      if (selectedUnit !== "all") {
        const unitLower = selectedUnit.toLowerCase()
        const invitedLower = inv.invitedUnit.toLowerCase()
        if (selectedUnit === "pctsv") {
          matchUnit = invitedLower.includes("sinh viên") || invitedLower.includes("ctsv")
        } else {
          matchUnit = invitedLower.includes(unitLower)
        }
      }

      // Status filter
      const matchStatus = filter === "all" || inv.status === filter

      return matchUnit && matchStatus
    })
  }, [invitations, selectedUnit, filter])

  // Statistics
  const stats = useMemo(() => {
    const total = invitations.length
    const pending = invitations.filter((i) => i.status === "pending").length
    const accepted = invitations.filter((i) => i.status === "accepted").length
    const declined = invitations.filter((i) => i.status === "declined").length
    return { total, pending, accepted, declined }
  }, [invitations])

  // Handle Admin accepting on behalf of co-host
  async function handleAccept(inv: AdminCohostInvitation) {
    setSubmitting(true)
    try {
      await eventsService.cohostRespond(inv.eventId, {
        trang_thai_xac_nhan: "DONG_Y",
        ten_don_vi_dai_dien: inv.invitedUnit,
      })
      setInvitations((prev) =>
        prev.map((item) => (item.id === inv.id ? { ...item, status: "accepted" } : item)),
      )
      showToast(
        `Đã phê duyệt ĐỒNG Ý (DONG_Y) thay cho đơn vị "${inv.invitedUnit}". Hệ thống giải tỏa hạn giữ phòng tạm 48h và chuyển hồ sơ lên hàng duyệt.`,
        "success",
      )
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Admin declining on behalf of co-host
  async function handleDeclineConfirm() {
    if (!selectedDecline) return
    if (!declineReason.trim() || declineReason.trim().length < 5) {
      showToast("Vui lòng nhập lý do từ chối đồng tổ chức (tối thiểu 5 ký tự).", "error")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.cohostRespond(selectedDecline.eventId, {
        trang_thai_xac_nhan: "TU_CHOI",
        ghi_chu_tu_choi: declineReason.trim(),
        ten_don_vi_dai_dien: selectedDecline.invitedUnit,
      })
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === selectedDecline.id
            ? { ...item, status: "declined", declineReason: declineReason.trim() }
            : item,
        ),
      )
      showToast(
        `Đã ghi nhận TỪ CHỐI (TU_CHOI) thay cho đơn vị "${selectedDecline.invitedUnit}". Sự kiện chuyển sang COHOST_REJECTED và phòng hội trường đã được giải phóng an toàn.`,
        "info",
      )
      setSelectedDecline(null)
      setDeclineReason("")
    } catch (err) {
      showToast(getApiErrorMessage(err), "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Unit Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 uppercase tracking-wide">
              Đặc quyền Admin (UC-EVT-02.AC.1 & AC.2)
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Soft Hold 48h & Override</span>
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-navy">
            Giám sát & Duyệt thay Lời mời Đồng tổ chức
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin có toàn quyền xác nhận hoặc từ chối lời mời phối hợp thay cho bất kỳ đơn vị nào trong toàn trường khi cần xử lý đặc biệt hoặc tránh hết hạn 48h.
          </p>
        </div>

        {/* Dropdown chọn Đơn vị nhận lời mời */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">🏛️ Đơn vị đại diện:</span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="text-xs font-bold text-navy bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="all">🏛️ Toàn trường (Tất cả đơn vị)</option>
              <option value="pctsv">🏢 Phòng Công tác Sinh viên (P.CTSV)</option>
              <option value="Khoa Hệ thống Thông tin">🎓 Khoa Hệ thống Thông tin</option>
              <option value="CLB WebDev UIT">⚡ CLB WebDev UIT</option>
              <option value="Khoa Kỹ thuật Phần mềm">💻 Khoa Kỹ thuật Phần mềm</option>
              <option value="CLB Sách & Tri Thức">📚 CLB Sách & Tri Thức</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Tổng lời mời</p>
          <p className="text-2xl font-bold text-navy mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase">Chờ phản hồi (cần xử lý)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Đã đồng ý (DONG_Y)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.accepted}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Đã từ chối (TU_CHOI)</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.declined}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          ["all", "Tất cả lời mời"],
          ["pending", "Chờ phản hồi"],
          ["accepted", "Đã đồng ý"],
          ["declined", "Đã từ chối"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as typeof filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filter === val
                ? "bg-navy text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {filteredInvitations.map((inv) => (
          <div
            key={inv.id}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {inv.topic}
                  </span>

                  {inv.status === "pending" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                      ⏱️ Thời hạn Soft Hold còn {inv.softHoldRemainingHours} giờ
                    </span>
                  )}

                  {inv.status === "accepted" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Đã đồng ý (DONG_Y)
                    </span>
                  )}

                  {inv.status === "declined" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      ✗ Đã từ chối (TU_CHOI)
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg text-navy">{inv.eventTitle}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700">Đơn vị chủ trì (Host A):</span>{" "}
                    {inv.hostUnit}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Đơn vị nhận lời mời:</span>{" "}
                    <b className="text-purple-700 font-bold">{inv.invitedUnit}</b>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Thời gian tổ chức:</span> {inv.time}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Địa điểm / Hội trường:</span>{" "}
                    {inv.location}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 mt-2 border border-slate-100">
                  <p className="font-semibold text-slate-800 mb-1">Phân công vai trò & Quyền lợi đề xuất:</p>
                  <p className="leading-relaxed">{inv.roleDescription}</p>
                  <div className="flex items-center gap-1.5 text-indigo font-semibold mt-1.5">
                    <span>⭐ Cộng +{inv.drlPoints} Điểm rèn luyện Điều 3 cho sinh viên tham gia.</span>
                  </div>
                </div>

                {inv.declineReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                    <b>Lý do đã từ chối:</b> {inv.declineReason}
                  </div>
                )}
              </div>

              {/* Action Buttons for Admin */}
              <div className="flex md:flex-col gap-2 shrink-0 self-end md:self-start">
                {inv.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>✅</span>
                      <span>Duyệt thay: Đồng ý</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDecline(inv)
                        setDeclineReason("")
                      }}
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>❌</span>
                      <span>Duyệt thay: Từ chối</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (inv.status === "accepted") {
                        setSelectedDecline(inv)
                        setDeclineReason("")
                      } else {
                        handleAccept(inv)
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    🔄 Đổi quyết định
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredInvitations.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
            <p className="text-slate-400 text-sm">Không tìm thấy lời mời đồng tổ chức nào phù hợp.</p>
          </div>
        )}
      </div>

      {/* DECLINE CONFIRM MODAL */}
      {selectedDecline && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <span>❌</span> Duyệt thay: Từ chối lời mời phối hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Bạn đang thực thi thẩm quyền Admin để từ chối lời mời đồng tổ chức cho sự kiện{" "}
              <b>{selectedDecline.eventTitle}</b> thay cho đơn vị <b>{selectedDecline.invitedUnit}</b>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-rose-700 mb-1">
                Lý do từ chối (Bắt buộc tối thiểu 5 ký tự) *
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Nhập lý do đơn vị không thể phối hợp..."
                className="w-full p-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:border-rose-500"
              />
              <p className="text-[11px] text-rose-600 mt-1">
                ⚠️ Khi từ chối, sự kiện chuyển sang COHOST_REJECTED và phòng hội trường được giải phóng an toàn.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setSelectedDecline(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeclineConfirm}
                disabled={submitting || declineReason.trim().length < 5}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

