import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router"
import { useApp } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { attendanceService } from "../../api/services/attendance.service"
import { getApiErrorMessage } from "../../api/errors"
import { Camera, UserPlus, Search, Building2, Lock, Unlock } from "lucide-react"

export interface StaffAccount {
  id: string
  userId?: number
  name: string
  email: string
  eventId: string | number
  eventTitle: string
  organizer: string
  permissions: string[]
  status: "active" | "inactive" | "locked"
  lastActive: string
}

const INITIAL_STAFF: StaffAccount[] = [
  {
    id: "st-01",
    userId: 1,
    name: "Trần Minh Phúc",
    email: "22521999@gm.uit.edu.vn",
    eventId: 101,
    eventTitle: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu 2026",
    organizer: "Khoa Hệ thống Thông tin",
    permissions: ["Điểm danh (Check-in / Check-out)"],
    status: "active",
    lastActive: "20/09/2026 14:32",
  },
  {
    id: "st-02",
    userId: 2,
    name: "Lê Quỳnh Như",
    email: "nhu.le@campus.edu.vn",
    eventId: 102,
    eventTitle: "Hội thảo Điện toán đám mây & Thực hành DevOps",
    organizer: "CLB WebDev UIT",
    permissions: ["Điểm danh (Check-in / Check-out)"],
    status: "active",
    lastActive: "19/09/2026 09:15",
  },
  {
    id: "st-03",
    userId: 3,
    name: "Hoàng Đức Anh",
    email: "anh.hoang@campus.edu.vn",
    eventId: 104,
    eventTitle: "Lễ hội Âm nhạc Sinh viên & Đêm nhạc UIT 2026",
    organizer: "CLB Trí tuệ Nhân tạo (AI Club)",
    permissions: ["Điểm danh (Check-in)"],
    status: "inactive",
    lastActive: "Chưa kích hoạt",
  },
  {
    id: "st-04",
    userId: 4,
    name: "Nguyễn Bảo Khánh",
    email: "khanh.nb@campus.edu.vn",
    eventId: 103,
    eventTitle: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
    organizer: "Phòng Công tác Sinh viên (CTSV)",
    permissions: ["Điểm danh (Check-in / Check-out)"],
    status: "locked",
    lastActive: "15/09/2026 08:00",
  },
  {
    id: "st-05",
    name: "Phạm Quốc Tuấn",
    email: "tuan.pq@campus.edu.vn",
    eventId: 103,
    eventTitle: "Workshop Kỹ năng lãnh đạo & Thuyết trình chuyên nghiệp",
    organizer: "Phòng Công tác Sinh viên (CTSV)",
    permissions: ["Điểm danh (Check-in / Check-out)"],
    status: "active",
    lastActive: "01/10/2026 10:20",
  },
]

export default function AdminStaff() {
  const navigate = useNavigate()
  const { events } = useApp()
  const { showToast } = useToast()

  const [staffList, setStaffList] = useState<StaffAccount[]>(INITIAL_STAFF)
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal create staff
  const [showAddModal, setShowAddModal] = useState(false)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formEventId, setFormEventId] = useState<string | number>(events[0]?.id || 101)
  const [formRole, setFormRole] = useState("Điểm danh (Check-in / Check-out)")
  const [submittingStaff, setSubmittingStaff] = useState(false)

  // UC-OPS-05: Tự động đồng bộ danh sách nhân viên từ Backend API khi có sự kiện
  useEffect(() => {
    let active = true
    const targetEventId = events[0]?.id || events[0]?.ma_su_kien || 101
    attendanceService
      .staff(targetEventId)
      .then((res) => {
        if (active && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped: StaffAccount[] = res.data.map((item, idx) => ({
            id: `st-api-${item.id || idx + 1}`,
            userId: item.ma_tai_khoan,
            name: item.ho_ten || `Cộng tác viên ${item.ma_tai_khoan}`,
            email: item.mssv
              ? `${item.mssv}@gm.uit.edu.vn`
              : `staff${item.ma_tai_khoan}@gm.uit.edu.vn`,
            eventId: item.ma_su_kien,
            eventTitle:
              events.find(
                (e) =>
                  Number(e.id) === item.ma_su_kien ||
                  e.ma_su_kien === item.ma_su_kien,
              )?.title || "Sự kiện trường",
            organizer: "Phòng Công tác Sinh viên (CTSV)",
            permissions: ["Điểm danh (Check-in / Check-out)"],
            status: "active",
            lastActive: "Vừa kích hoạt",
          }))
          setStaffList(mapped)
        }
      })
      .catch(() => {
        // Giữ fallback local INITIAL_STAFF khi mock/server offline
      })
    return () => {
      active = false
    }
  }, [events])

  // Filter staff by selected unit
  const filteredStaff = useMemo(() => {
    return staffList.filter((st) => {
      // Unit filter
      let matchUnit = true
      if (selectedUnit !== "all") {
        const unitLower = selectedUnit.toLowerCase()
        const orgLower = st.organizer.toLowerCase()
        if (selectedUnit === "pctsv") {
          matchUnit = orgLower.includes("sinh viên") || orgLower.includes("ctsv")
        } else {
          matchUnit = orgLower.includes(unitLower)
        }
      }

      // Search filter
      const matchSearch =
        !search.trim() ||
        st.name.toLowerCase().includes(search.toLowerCase()) ||
        st.email.toLowerCase().includes(search.toLowerCase()) ||
        st.eventTitle.toLowerCase().includes(search.toLowerCase())

      // Status filter
      const matchStatus = statusFilter === "all" || st.status === statusFilter

      return matchUnit && matchSearch && matchStatus
    })
  }, [staffList, selectedUnit, search, statusFilter])

  // Handle toggle lock/active
  async function handleToggleStatus(st: StaffAccount) {
    const newStatus = st.status === "locked" ? "active" : "locked"
    setStaffList((prev) =>
      prev.map((item) => (item.id === st.id ? { ...item, status: newStatus } : item)),
    )
    if (newStatus === "locked") {
      try {
        const numericUserId =
          (st.userId ?? Number(st.id.replace(/\D/g, ""))) || 1
        await attendanceService.revokeStaff(st.eventId, numericUserId)
      } catch (err) {
        showToast(
          "Không thể thu hồi quyền điểm danh: " + getApiErrorMessage(err),
          "error",
        )
      }
      showToast(`Đã khóa quyền điểm danh của nhân viên ${st.name}.`, "info")
    } else {
      showToast(`Đã mở khóa và kích hoạt lại quyền cho nhân viên ${st.name}.`, "success")
    }
  }

  // Handle add staff (UC-OPS-05: Đồng bộ REST API POST /events/{id}/staff)
  async function handleAddStaff() {
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Vui lòng điền đầy đủ họ tên và email sinh viên/nhân viên.", "error")
      return
    }
    setSubmittingStaff(true)
    try {
      const targetEvt = events.find((e) => e.id === formEventId || e.ma_su_kien === formEventId)
      const mssvMatch = formEmail.match(/\d{8}/) || [formEmail.split("@")[0].trim()]
      const mssv = mssvMatch ? mssvMatch[0] : formEmail.trim()
      
      await attendanceService.assignStaff(formEventId, [mssv])

      const newStaff: StaffAccount = {
        id: `st-${Date.now()}`,
        name: formName.trim(),
        email: formEmail.trim(),
        eventId: formEventId,
        eventTitle: targetEvt?.title || targetEvt?.ten_su_kien || "Sự kiện được chọn",
        organizer: targetEvt?.ten_don_vi_host || targetEvt?.organizer || "Phòng Công tác Sinh viên (CTSV)",
        permissions: [formRole],
        status: "active",
        lastActive: "Vừa kích hoạt",
      }

      setStaffList((prev) => [newStaff, ...prev])
      showToast(`Đã cấp quyền điểm danh cho nhân sự "${formName}".`, "success")
      setShowAddModal(false)
      setFormName("")
      setFormEmail("")
    } catch (err) {
      showToast("Không thể phân công nhân viên: " + getApiErrorMessage(err), "error")
    } finally {
      setSubmittingStaff(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Unit Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wide">
              Quản trị Vận hành Toàn trường
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Phân quyền Nhân sự & Quét vé</span>
          </div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-navy">
            Quản lý Nhân viên & CTV Điểm danh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin có toàn quyền phân quyền tài khoản quét vé cho mọi sự kiện của các Khoa, CLB và P.CTSV.
          </p>
        </div>

        {/* Dropdown chọn Đơn vị Tổ chức & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Phạm vi Đơn vị:</span>
            </span>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="text-xs font-bold text-navy bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              <option value="all">Toàn trường (Tất cả đơn vị)</option>
              <option value="pctsv">Phòng Công tác Sinh viên (P.CTSV)</option>
              <option value="Khoa Hệ thống Thông tin">Khoa Hệ thống Thông tin</option>
              <option value="Khoa Công nghệ Thông tin">Khoa Công nghệ Thông tin</option>
              <option value="CLB WebDev UIT">CLB WebDev UIT</option>
              <option value="CLB Trí tuệ Nhân tạo">CLB Trí tuệ Nhân tạo (AI Club)</option>
            </select>
          </div>

          <button
            onClick={() => navigate("/staff/scanner")}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>Mở máy quét soát vé (Camera)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>Thêm nhân viên / CTV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo tên, email, sự kiện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
        </div>

        <div className="flex gap-1.5">
          {[
            ["all", "Tất cả"],
            ["active", "Đang hoạt động"],
            ["inactive", "Chưa kích hoạt"],
            ["locked", "Đã khóa"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === val
                  ? "bg-navy text-white shadow-2xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="p-3.5 pl-5">Nhân viên</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Đơn vị & Sự kiện phụ trách</th>
                <th className="p-3.5">Quyền hạn</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Hoạt động gần nhất</th>
                <th className="p-3.5 pr-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo flex items-center justify-center font-bold text-xs uppercase">
                        {st.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">{st.name}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-500">{st.email}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{st.eventTitle}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{st.organizer}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                      {st.permissions.join(", ")}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {st.status === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang hoạt động
                      </span>
                    ) : st.status === "inactive" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Chưa kích hoạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{st.lastActive}</td>
                  <td className="p-3.5 pr-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors shadow-2xs flex items-center gap-1 ${
                          st.status === "locked"
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                            : "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                        }`}
                        title={st.status === "locked" ? "Mở khóa tài khoản" : "Khóa quyền nhân sự"}
                      >
                        {st.status === "locked" ? (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Mở khóa</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Khóa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStaff.length === 0 && (
          <div className="p-10 text-center text-slate-400 text-xs">
            Không tìm thấy nhân viên/CTV nào phù hợp bộ lọc.
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="font-display font-bold text-lg text-navy flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Thêm nhân viên / CTV điểm danh
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Cấp quyền quét vé và điểm danh cho sinh viên hoặc cán bộ phụ trách sự kiện.
            </p>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên nhân sự *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Lê Văn Nam"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email sinh viên / cán bộ *
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ví dụ: nam.lv@gm.uit.edu.vn"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sự kiện phụ trách điểm danh *
                </label>
                <select
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo bg-white"
                >
                  {events.map((e) => (
                    <option key={e.id || e.ma_su_kien} value={e.id || e.ma_su_kien}>
                      {e.title || e.ten_su_kien} ({e.ten_don_vi_host || e.organizer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quyền hạn cấp phát *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo bg-white"
                >
                  <option value="Điểm danh (Check-in / Check-out)">Điểm danh cả Check-in & Check-out</option>
                  <option value="Điểm danh (Check-in)">Chỉ điểm danh Check-in đầu giờ</option>
                  <option value="Điểm danh (Check-out)">Chỉ điểm danh Check-out cuối giờ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddStaff}
                disabled={submittingStaff}
                className="flex-1 py-2.5 rounded-xl bg-indigo hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingStaff ? "Đang xử lý..." : "Cấp quyền nhân sự"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

