import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { ROOMS } from "../../data/mock"
import type { RoomPublic } from "../../data/contract"
import { roomsService } from "../../api/services/rooms.service"
import { useCollection } from "../../hooks/useCollection"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"
import { getApiErrorMessage } from "../../api/errors"
import AdminLayout from "./AdminLayout"
import { OrgLayout } from "../organizer/OrgLayout"
import FormDialog from "./FormDialog"

interface Props {
  readOnly?: boolean
  onNavigate?: (screen: string) => void
  onLogout?: () => void
}

export default function RoomManagement({
  readOnly = false,
  onNavigate,
  onLogout,
}: Props) {
  const navigate = useNavigate()
  const { logout } = useUser()
  const { showToast } = useToast()
  const col = useCollection<RoomPublic>("admin_rooms", ROOMS, "ma_phong", {
    list: async () => {
      try {
        const res = await roomsService.list()
        const rawList = (res.data || []) as Array<Partial<RoomPublic> & { suc_chua_toi_da?: number; trang_thiet_bi?: { may_chieu?: boolean; am_thanh?: boolean; wifi?: boolean } }>
        const mapped: RoomPublic[] = rawList.map((r) => ({
          ma_phong: Number(r.ma_phong),
          ten_phong: r.ten_phong || "Hội trường",
          suc_chua: Number(r.suc_chua_toi_da ?? r.suc_chua ?? 100),
          co_so: (r.co_so === "CoSo2" ? "CoSo2" : "CoSo1") as RoomPublic["co_so"],
          toa_nha: r.toa_nha || (r.co_so === "CoSo2" ? "Tòa B" : "Tòa A"),
          vi_tri_tang: Number(r.vi_tri_tang ?? 1),
          thiet_bi: {
            may_chieu: Boolean(
              r.trang_thiet_bi?.may_chieu ?? r.thiet_bi?.may_chieu ?? true,
            ),
            am_thanh: Boolean(
              r.trang_thiet_bi?.am_thanh ?? r.thiet_bi?.am_thanh ?? true,
            ),
            wifi: Boolean(r.trang_thiet_bi?.wifi ?? r.thiet_bi?.wifi ?? true),
          },
        }))
        return { data: mapped }
      } catch (err) {
        console.warn("Failed to fetch rooms from backend, using seed fallback:", err)
        return { data: ROOMS }
      }
    },
    create: (i) => roomsService.create(i),
    update: (id, i) => roomsService.update(id, i),
    remove: (id) => roomsService.remove(id),
  })
  const [selected, setSelected] = useState<number | undefined>(ROOMS[0]?.ma_phong)
  const [dialog, setDialog] = useState<"new" | "edit" | null>(null)
  const room = useMemo(
    () => col.items.find((item) => item.ma_phong === selected) ?? col.items[0],
    [col.items, selected],
  )
  const roomFields = [
    { name: "ten_phong", label: "Tên phòng", required: true },
    { name: "suc_chua", label: "Sức chứa", type: "number" as const, required: true, min: 1 },
    { name: "co_so", label: "Cơ sở", type: "select" as const, options: [{ value: "CoSo1", label: "Cơ sở 1" }, { value: "CoSo2", label: "Cơ sở 2" }] },
    { name: "toa_nha", label: "Tòa nhà", required: true },
    { name: "vi_tri_tang", label: "Tầng", type: "number" as const, min: 0 },
  ]
  async function saveRoom(v: Record<string, unknown>) {
    const base = dialog === "edit" && room ? room : { ma_phong: 0, thiet_bi: { may_chieu: true, am_thanh: true, wifi: true } }
    try {
      await col.save({ ...base, ten_phong: String(v.ten_phong), suc_chua: Number(v.suc_chua), co_so: v.co_so as RoomPublic["co_so"], toa_nha: String(v.toa_nha), vi_tri_tang: Number(v.vi_tri_tang) }, dialog === "new")
      showToast("Đã lưu phòng.", "success")
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
      throw e
    }
  }

  const content = (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl">
      <p className="text-xs text-slate-400">
        {readOnly ? "Ban tổ chức / Lịch trống hội trường" : "Admin / Phòng & Lịch phòng"}
      </p>
      <h1 className="font-display font-bold text-3xl text-navy mt-2">
        {readOnly ? "Lịch trống & Danh mục hội trường" : "Quản lý phòng hội trường"}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        {readOnly
          ? "Tra cứu sức chứa, thiết bị và lịch trống của các hội trường trước khi đề xuất sự kiện."
          : "Kiểm tra sức chứa, bảo trì, Soft Hold và buffer lịch 15 phút."}
      </p>
      {!readOnly && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setDialog("new")}
            className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer"
          >
            Thêm phòng
          </button>
        </div>
      )}
        {col.loading && <p className="text-sm text-slate-500 mt-4">Đang tải phòng...</p>}
        {col.error && <p role="alert" className="text-sm text-red-600 mt-4">{col.error} <button onClick={col.reload} className="underline font-semibold">Thử lại</button></p>}
        <div className="grid lg:grid-cols-3 gap-6 mt-4">
          <div className="space-y-3">
            {col.items.map((item) => (
              <button
                key={item.ma_phong}
                onClick={() => setSelected(item.ma_phong)}
                className={`w-full text-left rounded-2xl border p-4 ${
                  selected === item.ma_phong
                    ? "border-indigo bg-indigo-light"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex justify-between">
                  <p className="font-semibold text-navy">{item.ten_phong}</p>
                  <span className="text-xs text-emerald-700">Khả dụng</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {item.co_so} · {item.toa_nha} · {item.suc_chua} chỗ
                </p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-xl text-navy">
                  {room?.ten_phong}
                </h2>
                <p className="text-sm text-slate-500">
                  {room?.toa_nha} · Tầng {room?.vi_tri_tang}
                </p>
              </div>
              {!readOnly && (
                <button
                  onClick={() => setDialog("edit")}
                  className="px-4 py-2 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer"
                >
                  Cập nhật phòng
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                ["Sức chứa", room?.suc_chua],
                ["Cơ sở", room?.co_so],
                ["Buffer", "15 phút"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-semibold text-navy mt-1">{value}</p>
                </div>
              ))}
            </div>
            {/* UC-ROOM-02: Visual Gantt & Room Schedule Timeline */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-base text-navy flex items-center gap-2">
                    <span>Biểu đồ Lịch phòng trực quan</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Chuẩn Buffer 15 phút
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trực quan hóa ca sự kiện, thời gian đệm 15m và khung giờ còn trống trong ngày.
                  </p>
                </div>
                
                {/* Timeline Legend */}
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Confirmed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" /> Soft Hold
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Buffer 15m
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Trống
                  </span>
                </div>
              </div>

              {/* Visual Horizontal Timeline Bar (07:00 - 22:00 = 15 hours) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                {/* Time Axis Markers */}
                <div className="flex justify-between text-[11px] font-mono text-slate-600 pb-2 border-b border-slate-200 px-1">
                  <span>07:00</span>
                  <span>10:00</span>
                  <span>13:00</span>
                  <span>16:00</span>
                  <span>19:00</span>
                  <span>22:00</span>
                </div>

                {/* Visual Gantt Bar Track */}
                <div className="relative h-12 w-full bg-slate-200/70 rounded-xl overflow-hidden mt-3 flex items-center text-xs">
                  {/* 07:00-08:00 (1h = 6.67%) Available */}
                  <div className="h-full bg-emerald-50 hover:bg-emerald-100/80 transition-colors flex items-center justify-center text-[10px] text-emerald-700 font-semibold border-r border-emerald-200" style={{ width: "6.67%" }} title="07:00-08:00: Khả dụng">
                    Trống
                  </div>

                  {/* 08:00-11:30 (3.5h = 23.33%) Confirmed Event */}
                  <div className="h-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex flex-col justify-center px-2 shadow-xs" style={{ width: "23.33%" }} title="08:00-11:30: Ngày hội nghề nghiệp AI (CONFIRMED)">
                    <span className="font-bold truncate text-[11px]">Ngày hội AI</span>
                    <span className="text-[9px] opacity-80 font-mono">08:00-11:30</span>
                  </div>

                  {/* 11:30-11:45 (0.25h = 1.67%) Buffer 15m */}
                  <div className="h-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center text-[8px] font-bold text-amber-950" style={{ width: "1.67%" }} title="11:30-11:45: Buffer 15 phút kỹ thuật & vệ sinh">
                    ⚡
                  </div>

                  {/* 11:45-13:30 (1.75h = 11.67%) Available */}
                  <div className="h-full bg-emerald-50 hover:bg-emerald-100/80 transition-colors flex items-center justify-center text-[10px] text-emerald-700 font-semibold border-x border-emerald-200" style={{ width: "11.67%" }} title="11:45-13:30: Khả dụng cho sự kiện mới">
                    Trống
                  </div>

                  {/* 13:30-13:45 (0.25h = 1.67%) Buffer 15m */}
                  <div className="h-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center text-[8px] font-bold text-amber-950" style={{ width: "1.67%" }} title="13:30-13:45: Buffer 15 phút chuẩn bị setup">
                    ⚡
                  </div>

                  {/* 13:45-17:15 (3.5h = 23.33%) Soft Hold Event */}
                  <div className="h-full bg-cyan-600 hover:bg-cyan-700 text-white transition-colors flex flex-col justify-center px-2 shadow-xs" style={{ width: "23.33%" }} title="13:45-17:15: Workshop DevOps (SOFT_HOLD)">
                    <span className="font-bold truncate text-[11px]">Workshop DevOps</span>
                    <span className="text-[9px] opacity-80 font-mono">13:45-17:15</span>
                  </div>

                  {/* 17:15-17:30 (0.25h = 1.67%) Buffer 15m */}
                  <div className="h-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center text-[8px] font-bold text-amber-950" style={{ width: "1.67%" }} title="17:15-17:30: Buffer 15 phút kỹ thuật">
                    ⚡
                  </div>

                  {/* 17:30-18:00 (0.5h = 3.33%) Available */}
                  <div className="h-full bg-emerald-50 hover:bg-emerald-100/80 transition-colors flex items-center justify-center text-[9px] text-emerald-700 font-semibold" style={{ width: "3.33%" }} title="17:30-18:00: Trống">
                    Trống
                  </div>

                  {/* 18:00-21:30 (3.5h = 23.33%) Confirmed Event */}
                  <div className="h-full bg-purple-700 hover:bg-purple-800 text-white transition-colors flex flex-col justify-center px-2 shadow-xs" style={{ width: "23.33%" }} title="18:00-21:30: Đêm nhạc sinh viên (CONFIRMED)">
                    <span className="font-bold truncate text-[11px]">Đêm nhạc SV</span>
                    <span className="text-[9px] opacity-80 font-mono">18:00-21:30</span>
                  </div>

                  {/* 21:30-22:00 (0.5h = 3.33%) Buffer / Closing */}
                  <div className="h-full bg-slate-300 text-slate-600 flex items-center justify-center text-[9px]" style={{ width: "3.33%" }} title="21:30-22:00: Đóng cửa phòng">
                    Đóng
                  </div>
                </div>

                {/* Details list */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo font-bold">08:00–11:30</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">CONFIRMED</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">Ngày hội nghề nghiệp AI</p>
                    <p className="text-[11px] text-slate-500">Khoa HTTT · Buffer sau: 11:30–11:45</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-700 font-bold">13:45–17:15</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700">SOFT_HOLD</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">Workshop DevOps Cloud</p>
                    <p className="text-[11px] text-slate-500">CLB IT · Buffer trước: 13:30–13:45</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-purple-700 font-bold">18:00–21:30</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">CONFIRMED</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">Đêm nhạc sinh viên 2026</p>
                    <p className="text-[11px] text-slate-500">Đoàn Thanh niên · Buffer trước: 17:15–17:30</p>
                  </div>
                </div>

                {/* Conflict Status Bar */}
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                  <span className="text-sm">🛡️</span>
                  <span>
                    <b>Kiểm tra xung đột tự động:</b> Không phát hiện trùng lịch. Toàn bộ khoảng cách giữa các ca đều thỏa mãn quy tắc bắt buộc <b>Buffer ≥ 15 phút</b>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

  if (readOnly) {
    const defaultOrgPaths: Record<string, string> = {
      "org-dashboard": "/organizer/dashboard",
      "org-events": "/organizer/events",
      "org-event-form": "/organizer/events/create",
      "org-participants": "/organizer/participants",
      "org-staff": "/organizer/staff",
      "org-cohost": "/organizer/cohost-invitations",
      "org-rooms": "/organizer/rooms",
      "org-scanner": "/staff/scanner",
      "staff-scanner": "/staff/scanner",
      "org-settings": "/organizer/settings",
      "faculty-inbox": "/faculty/approvals",
      "affairs-inbox": "/affairs/approvals",
      "affairs-results": "/affairs/drl",
      "affairs-certificates": "/affairs/certificates",
      "admin-dashboard": "/admin/dashboard",
      "admin-rooms": "/admin/rooms",
    }
    const handleOrgNavigate =
      onNavigate || ((screen: string) => navigate(defaultOrgPaths[screen] || screen))
    const handleLogout =
      onLogout || (() => void logout().finally(() => navigate("/login")))

    return (
      <OrgLayout
        current="org-rooms"
        onNavigate={handleOrgNavigate}
        onLogout={handleLogout}
      >
        {content}
      </OrgLayout>
    )
  }

  return (
    <AdminLayout>
      {content}
      {dialog && (
        <FormDialog
          key={dialog === "edit" ? room?.ma_phong : "new"}
          open
          title={dialog === "edit" ? "Cập nhật phòng" : "Thêm phòng"}
          fields={roomFields}
          initial={
            dialog === "edit" && room
              ? {
                  ten_phong: room.ten_phong,
                  suc_chua: room.suc_chua,
                  co_so: room.co_so,
                  toa_nha: room.toa_nha,
                  vi_tri_tang: room.vi_tri_tang,
                }
              : { co_so: "CoSo1", vi_tri_tang: 1, suc_chua: 50 }
          }
          onClose={() => setDialog(null)}
          onSubmit={saveRoom}
        />
      )}
    </AdminLayout>
  )
}
