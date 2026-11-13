import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { ROOMS } from "../../data/mock"
import type { RoomPublic, RoomScheduleEntry } from "../../data/contract"
import { roomsService } from "../../api/services/rooms.service"
import { useCollection } from "../../hooks/useCollection"
import { useToast } from "../../components/Toast"
import { useUser } from "../../context/UserContext"
import { getApiErrorMessage } from "../../api/errors"
import AdminLayout from "./AdminLayout"
import { OrgLayout } from "../organizer/OrgLayout"
import FormDialog, { type FieldSpec } from "./FormDialog"
import { Wrench, AlertTriangle, ShieldCheck, Zap } from "lucide-react"

interface Props {
  readOnly?: boolean
  onNavigate?: (screen: string) => void
  onLogout?: () => void
}

function parseTimeToMinutes(str?: string): number {
  if (!str) return 420
  if (str.includes("T")) {
    const d = new Date(str)
    return d.getHours() * 60 + d.getMinutes()
  }
  const parts = str.split(":")
  return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0)
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0")
  const m = (min % 60).toString().padStart(2, "0")
  return `${h}:${m}`
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
        const rawList = (res.data || []) as Array<
          Partial<RoomPublic> & {
            suc_chua_toi_da?: number
            trang_thiet_bi?: { may_chieu?: boolean; am_thanh?: boolean; wifi?: boolean }
          }
        >
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
          trang_thai: (r.trang_thai === "BaoTri" ? "BaoTri" : "KhaDung") as RoomPublic["trang_thai"],
          bao_tri_tu_ngay: r.bao_tri_tu_ngay || null,
          bao_tri_den_ngay: r.bao_tri_den_ngay || null,
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [scheduleData, setScheduleData] = useState<RoomScheduleEntry[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  const room = useMemo(
    () => col.items.find((item) => item.ma_phong === selected) ?? col.items[0],
    [col.items, selected],
  )

  // UC-ROOM-02: Query dynamic schedule for the selected room & date
  useEffect(() => {
    if (!room?.ma_phong) return
    let cancelled = false
    setLoadingSchedule(true)
    roomsService
      .schedule(room.ma_phong, {
        tu_ngay: `${selectedDate}T00:00:00`,
        den_ngay: `${selectedDate}T23:59:59`,
      })
      .then((res) => {
        if (!cancelled && res.data) {
          setScheduleData(res.data)
        }
      })
      .catch(() => {
        if (!cancelled) setScheduleData([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSchedule(false)
      })
    return () => {
      cancelled = true
    }
  }, [room?.ma_phong, selectedDate])

  // UC-ROOM-01.AC.1: Room Fields with Maintenance Configuration
  const roomFields: FieldSpec[] = [
    { name: "ten_phong", label: "Tên phòng", required: true },
    { name: "suc_chua", label: "Sức chứa", type: "number", required: true, min: 1 },
    {
      name: "co_so",
      label: "Cơ sở",
      type: "select",
      options: [
        { value: "CoSo1", label: "Cơ sở 1 (Thủ Đức)" },
        { value: "CoSo2", label: "Cơ sở 2" },
      ],
    },
    { name: "toa_nha", label: "Tòa nhà", required: true },
    { name: "vi_tri_tang", label: "Tầng", type: "number", min: 0 },
    {
      name: "trang_thai",
      label: "Trạng thái phòng",
      type: "select",
      options: [
        { value: "KhaDung", label: "Khả dụng (Hoạt động bình thường)" },
        { value: "BaoTri", label: "Bảo trì phòng (BaoTri)" },
      ],
    },
    {
      name: "bao_tri_tu_ngay",
      label: "Bảo trì: Bắt đầu từ ngày giờ (nếu chọn Bảo trì)",
      type: "datetime-local",
    },
    {
      name: "bao_tri_den_ngay",
      label: "Bảo trì: Kết thúc đến ngày giờ (nếu chọn Bảo trì)",
      type: "datetime-local",
    },
    {
      name: "xac_nhan_bo_qua_canh_bao",
      label: "Xác nhận bỏ qua cảnh báo nếu trùng lịch sự kiện đã xác nhận",
      type: "checkbox",
    },
  ]

  async function saveRoom(v: Record<string, unknown>) {
    const base =
      dialog === "edit" && room
        ? room
        : { ma_phong: 0, thiet_bi: { may_chieu: true, am_thanh: true, wifi: true } }

    const trangThai = (v.trang_thai === "BaoTri" ? "BaoTri" : "KhaDung") as "KhaDung" | "BaoTri"
    let tuNgay: string | null = null
    let denNgay: string | null = null

    // UC-ROOM-01.AC.1: Maintenance Interval & Conflict Enforcement
    if (trangThai === "BaoTri") {
      if (!v.bao_tri_tu_ngay || !v.bao_tri_den_ngay) {
        throw new Error("Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc bảo trì.")
      }
      const dTu = new Date(String(v.bao_tri_tu_ngay))
      const dDen = new Date(String(v.bao_tri_den_ngay))
      if (dTu >= dDen) {
        throw new Error("Thời gian bắt đầu bảo trì phải trước thời gian kết thúc bảo trì.")
      }
      tuNgay = String(v.bao_tri_tu_ngay)
      denNgay = String(v.bao_tri_den_ngay)

      // Conflict detection against confirmed events in scheduleData
      if (!v.xac_nhan_bo_qua_canh_bao) {
        const hasConflict = scheduleData.some((ev) => {
          const evStatus = ev.loai || ev.trang_thai
          return evStatus === "CONFIRMED"
        })
        if (hasConflict) {
          throw new Error(
            "Cảnh báo xung đột (409 ROOM_MAINTENANCE_CONFLICT): Phòng có sự kiện đã được phê duyệt trong khoảng thời gian này. Vui lòng tick 'Xác nhận bỏ qua cảnh báo' nếu bạn vẫn muốn đưa phòng vào bảo trì.",
          )
        }
      }
    }

    try {
      await col.save(
        {
          ...base,
          ten_phong: String(v.ten_phong),
          suc_chua: Number(v.suc_chua),
          suc_chua_toi_da: Number(v.suc_chua),
          co_so: v.co_so as RoomPublic["co_so"],
          toa_nha: String(v.toa_nha),
          vi_tri_tang: Number(v.vi_tri_tang),
          trang_thai: trangThai,
          bao_tri_tu_ngay: tuNgay,
          bao_tri_den_ngay: denNgay,
          ly_do_bao_tri:
            trangThai === "BaoTri"
              ? String(v.ly_do_bao_tri || "Bảo trì định kỳ trang thiết bị hội trường")
              : null,
          trang_thiet_bi: {
            may_chieu: Boolean(v.may_chieu ?? true),
            am_thanh: Boolean(v.am_thanh ?? true),
            wifi: Boolean(v.wifi ?? true),
          },
          xac_nhan_bo_qua_canh_bao: Boolean(v.xac_nhan_bo_qua_canh_bao ?? false),
        },
        dialog === "new",
      )
      showToast("Đã lưu thông tin phòng thành công.", "success")
    } catch (e) {
      showToast(getApiErrorMessage(e), "error")
      throw e
    }
  }

  // UC-ROOM-02: Dynamic Gantt Timeline Generator with 15-Minute Safety Buffers
  const { items: timelineEvents, blocks: timelineBlocks } = useMemo(() => {
    const items: Array<{
      id: string | number
      start: number
      end: number
      type: "CONFIRMED" | "PENDING_HOLD" | "BAO_TRI"
      title: string
      unit: string
    }> = []

    // If room is under maintenance covering selectedDate
    if (room?.trang_thai === "BaoTri") {
      const tu = room.bao_tri_tu_ngay ? new Date(room.bao_tri_tu_ngay) : null
      const den = room.bao_tri_den_ngay ? new Date(room.bao_tri_den_ngay) : null
      const curDateStart = new Date(`${selectedDate}T00:00:00`)
      const curDateEnd = new Date(`${selectedDate}T23:59:59`)

      const isMaintToday = !tu || !den || (tu <= curDateEnd && den >= curDateStart)
      if (isMaintToday) {
        items.push({
          id: "maint-block",
          start: 420, // 07:00
          end: 1320,  // 22:00
          type: "BAO_TRI",
          title: "BẢO TRÌ PHÒNG HỘI TRƯỜNG",
          unit: "P. Quản trị Thiết bị",
        })
      }
    }

    scheduleData.forEach((s, idx) => {
      const sMin = Math.max(420, Math.min(1320, parseTimeToMinutes(s.thoi_gian_bat_dau)))
      const eMin = Math.max(420, Math.min(1320, parseTimeToMinutes(s.thoi_gian_ket_thuc)))
      if (eMin > sMin) {
        const type = (s.loai === "BAO_TRI" || s.trang_thai === "BAO_TRI"
          ? "BAO_TRI"
          : s.loai === "PENDING_HOLD" || s.trang_thai === "PENDING"
          ? "PENDING_HOLD"
          : "CONFIRMED") as "CONFIRMED" | "PENDING_HOLD" | "BAO_TRI"

        items.push({
          id: s.ma_dat_phong || s.ma_su_kien || `sched-${idx}`,
          start: sMin,
          end: eMin,
          type,
          title: s.ten_su_kien || s.tieu_de || "Sự kiện",
          unit: s.ten_don_vi_host || "Ban tổ chức",
        })
      }
    })

    items.sort((a, b) => a.start - b.start)

    const blocks: Array<{
      start: number
      end: number
      type: "FREE" | "CONFIRMED" | "PENDING_HOLD" | "BAO_TRI" | "BUFFER"
      title?: string
      unit?: string
    }> = []

    let cursor = 420 // 07:00
    items.forEach((item) => {
      if (item.start > cursor) {
        blocks.push({
          start: cursor,
          end: item.start,
          type: "FREE",
          title: "Khả dụng",
        })
      }
      blocks.push({
        start: item.start,
        end: item.end,
        type: item.type,
        title: item.title,
        unit: item.unit,
      })
      cursor = item.end

      // Insert 15-minute buffer after event (if not end of day)
      if (item.type !== "BAO_TRI" && cursor < 1320) {
        const bufferEnd = Math.min(1320, cursor + 15)
        blocks.push({
          start: cursor,
          end: bufferEnd,
          type: "BUFFER",
          title: "Đệm an toàn 15 phút",
        })
        cursor = bufferEnd
      }
    })

    if (cursor < 1320) {
      blocks.push({
        start: cursor,
        end: 1320,
        type: "FREE",
        title: "Khả dụng",
      })
    }

    return { items, blocks }
  }, [scheduleData, room, selectedDate])

  const conflictInfo = useMemo(() => {
    for (let i = 0; i < timelineEvents.length; i++) {
      for (let j = i + 1; j < timelineEvents.length; j++) {
        const a = timelineEvents[i]
        const b = timelineEvents[j]
        if (a.start < b.end + 15 && a.end + 15 > b.start) {
          return `Phát hiện xung đột giữa "${a.title}" (${formatMinutes(a.start)}–${formatMinutes(a.end)}) và "${b.title}" (${formatMinutes(b.start)}–${formatMinutes(b.end)}) vi phạm đệm 15 phút.`
        }
      }
    }
    return null
  }, [timelineEvents])

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
            className="px-4 py-2.5 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer shadow-xs hover:bg-indigo-600 transition-colors"
          >
            Thêm phòng
          </button>
        </div>
      )}
      {col.loading && <p className="text-sm text-slate-500 mt-4">Đang tải phòng...</p>}
      {col.error && (
        <p role="alert" className="text-sm text-red-600 mt-4">
          {col.error}{" "}
          <button onClick={col.reload} className="underline font-semibold">
            Thử lại
          </button>
        </p>
      )}
      <div className="grid lg:grid-cols-3 gap-6 mt-4">
        <div className="space-y-3">
          {col.items.map((item) => (
            <button
              key={item.ma_phong}
              onClick={() => setSelected(item.ma_phong)}
              className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                selected === item.ma_phong
                  ? "border-indigo bg-indigo-light shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-navy">{item.ten_phong}</p>
                {item.trang_thai === "BaoTri" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Bảo trì
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Khả dụng
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {item.co_so} · {item.toa_nha} · {item.suc_chua} chỗ
              </p>
              {item.trang_thai === "BaoTri" && item.bao_tri_tu_ngay && (
                <p className="text-[10px] text-rose-600 mt-1 font-mono">
                  Bảo trì: {new Date(item.bao_tri_tu_ngay).toLocaleDateString("vi-VN")}
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-xl text-navy">
                  {room?.ten_phong}
                </h2>
                {room?.trang_thai === "BaoTri" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    Đang bảo trì
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Khả dụng
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {room?.toa_nha} · Tầng {room?.vi_tri_tang} · {room?.co_so === "CoSo1" ? "Cơ sở 1 (Thủ Đức)" : "Cơ sở 2"}
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => setDialog("edit")}
                className="px-4 py-2 rounded-xl bg-indigo text-white text-sm font-semibold cursor-pointer shadow-xs hover:bg-indigo-600 transition-colors"
              >
                Cập nhật phòng & Bảo trì
              </button>
            )}
          </div>

          {/* UC-ROOM-01.AC.1: Maintenance Banner if active */}
          {room?.trang_thai === "BaoTri" && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <Wrench className="w-4 h-4 text-rose-600" />
                <span>Phòng đang trong giai đoạn Bảo trì (BaoTri)</span>
              </p>
              <p className="mt-1 text-slate-700">
                Thời gian bảo trì:{" "}
                <b>
                  {room.bao_tri_tu_ngay
                    ? new Date(room.bao_tri_tu_ngay).toLocaleString("vi-VN")
                    : "Chưa thiết lập"}
                </b>{" "}
                đến{" "}
                <b>
                  {room.bao_tri_den_ngay
                    ? new Date(room.bao_tri_den_ngay).toLocaleString("vi-VN")
                    : "Chưa thiết lập"}
                </b>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              ["Sức chứa tối đa", `${room?.suc_chua} chỗ`],
              ["Cơ sở", room?.co_so === "CoSo1" ? "Cơ sở 1" : "Cơ sở 2"],
              ["Trạng thái", room?.trang_thai === "BaoTri" ? "Bảo trì" : "Khả dụng"],
              ["Buffer đệm", "15 phút"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="font-semibold text-navy mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* UC-ROOM-02: Dynamic Gantt & Room Schedule Timeline */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
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

              {/* Date Selector & Quick Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-600">Ngày xem:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-navy bg-white shadow-xs focus:border-indigo outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 font-medium cursor-pointer"
                >
                  Hôm nay
                </button>
              </div>
            </div>

            {/* Timeline Legend */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Confirmed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" /> Soft Hold
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Bảo trì
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Buffer 15m
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Trống
              </span>
            </div>

            {/* Visual Horizontal Timeline Bar (07:00 - 22:00 = 15 hours / 900 minutes) */}
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

              {/* Dynamic Gantt Bar Track */}
              <div className="relative h-12 w-full bg-slate-200/70 rounded-xl overflow-hidden mt-3 flex items-center text-xs">
                {loadingSchedule ? (
                  <div className="w-full text-center text-xs text-slate-500 font-medium animate-pulse">
                    Đang tải lịch phòng...
                  </div>
                ) : (
                  timelineBlocks.map((b, idx) => {
                    const widthPct = Math.max(0.5, ((b.end - b.start) / 900) * 100)
                    const timeLabel = `${formatMinutes(b.start)}–${formatMinutes(b.end)}`

                    if (b.type === "FREE") {
                      return (
                        <div
                          key={`blk-${idx}`}
                          className="h-full bg-emerald-50 hover:bg-emerald-100/80 transition-colors flex items-center justify-center text-[10px] text-emerald-700 font-semibold border-r border-emerald-200"
                          style={{ width: `${widthPct}%` }}
                          title={`${timeLabel}: Khả dụng (Trống)`}
                        >
                          {widthPct > 4 ? "Trống" : ""}
                        </div>
                      )
                    }
                    if (b.type === "BUFFER") {
                      return (
                        <div
                          key={`blk-${idx}`}
                          className="h-full bg-amber-400 hover:bg-amber-500 transition-colors flex items-center justify-center text-[8px] font-bold text-amber-950"
                          style={{ width: `${widthPct}%` }}
                          title={`${timeLabel}: Đệm an toàn 15 phút kỹ thuật`}
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-950" />
                        </div>
                      )
                    }
                    if (b.type === "BAO_TRI") {
                      return (
                        <div
                          key={`blk-${idx}`}
                          className="h-full bg-rose-600 hover:bg-rose-700 text-white transition-colors flex flex-col justify-center px-2 shadow-xs"
                          style={{ width: `${widthPct}%` }}
                          title={`${timeLabel}: ${b.title} (BẢO TRÌ)`}
                        >
                          <span className="font-bold truncate text-[11px]">{b.title}</span>
                          <span className="text-[9px] opacity-80 font-mono">{timeLabel}</span>
                        </div>
                      )
                    }
                    const isConfirmed = b.type === "CONFIRMED"
                    return (
                      <div
                        key={`blk-${idx}`}
                        className={`h-full ${
                          isConfirmed
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-cyan-600 hover:bg-cyan-700"
                        } text-white transition-colors flex flex-col justify-center px-2 shadow-xs`}
                        style={{ width: `${widthPct}%` }}
                        title={`${timeLabel}: ${b.title} (${b.type})`}
                      >
                        <span className="font-bold truncate text-[11px]">{b.title}</span>
                        <span className="text-[9px] opacity-80 font-mono">{timeLabel}</span>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Dynamic Details list */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {timelineEvents.length === 0 ? (
                  <div className="sm:col-span-3 p-4 rounded-xl bg-white border border-slate-200 text-center text-slate-500">
                    Không có lịch đặt phòng hoặc bảo trì nào trong ngày <b>{selectedDate}</b>. Phòng hoàn toàn khả dụng.
                  </div>
                ) : (
                  timelineEvents.map((ev, idx) => (
                    <div key={`ev-card-${idx}`} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-indigo font-bold">
                          {formatMinutes(ev.start)}–{formatMinutes(ev.end)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ev.type === "BAO_TRI"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : ev.type === "CONFIRMED"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                          }`}
                        >
                          {ev.type}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-1 truncate" title={ev.title}>
                        {ev.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ev.unit} · Buffer sau: {formatMinutes(ev.end)}–{formatMinutes(Math.min(1320, ev.end + 15))}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Dynamic Conflict Status Bar */}
              {conflictInfo ? (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <b>Cảnh báo xung đột lịch:</b> {conflictInfo}
                  </span>
                </div>
              ) : (
                <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <b>Kiểm tra xung đột tự động:</b> Không phát hiện trùng lịch. Toàn bộ khoảng cách giữa các ca đều thỏa mãn quy tắc bắt buộc <b>Buffer ≥ 15 phút</b>.
                  </span>
                </div>
              )}
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
          title={dialog === "edit" ? "Cập nhật phòng & Bảo trì" : "Thêm phòng mới"}
          fields={roomFields}
          initial={
            dialog === "edit" && room
              ? {
                  ten_phong: room.ten_phong,
                  suc_chua: room.suc_chua,
                  co_so: room.co_so,
                  toa_nha: room.toa_nha,
                  vi_tri_tang: room.vi_tri_tang,
                  trang_thai: room.trang_thai || "KhaDung",
                  bao_tri_tu_ngay: room.bao_tri_tu_ngay ? room.bao_tri_tu_ngay.slice(0, 16) : "",
                  bao_tri_den_ngay: room.bao_tri_den_ngay ? room.bao_tri_den_ngay.slice(0, 16) : "",
                  xac_nhan_bo_qua_canh_bao: false,
                }
              : {
                  co_so: "CoSo1",
                  vi_tri_tang: 1,
                  suc_chua: 50,
                  trang_thai: "KhaDung",
                  bao_tri_tu_ngay: "",
                  bao_tri_den_ngay: "",
                  xac_nhan_bo_qua_canh_bao: false,
                }
          }
          onClose={() => setDialog(null)}
          onSubmit={saveRoom}
        />
      )}
    </AdminLayout>
  )
}
