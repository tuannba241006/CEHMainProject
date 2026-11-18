import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { OrgLayout } from "./OrgLayout"
import { useApp } from "../../context/AppContext"
import { useToast } from "../../components/Toast"
import { CONTRACT_TOPICS, ROOMS, ORGANIZATIONS } from "../../data/mock"
import type { RoomPublic, Topic } from "../../data/contract"
import { formatCalendarDate } from "../../utils/date"
import { eventsService } from "../../api/services/events.service"
import { getApiErrorMessage } from "../../api/errors"
import { organizationsService } from "../../api/services/organizations.service"
import { roomsService } from "../../api/services/rooms.service"
import { reportsService } from "../../api/services/reports.service"
import { api } from "../../api/client"
import { Sparkles, Calendar, MapPin, Users, X } from "lucide-react"

interface Props {
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export default function EventForm({ onNavigate, onLogout }: Props) {
  const { id } = useParams<{ id?: string }>()
  const isEditMode = Boolean(id)
  const { saveApprovalDraft } = useApp()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [orgList, setOrgList] = useState(ORGANIZATIONS)
  const [roomList, setRoomList] = useState<RoomPublic[]>(ROOMS)
  const [topicList, setTopicList] = useState<Topic[]>(CONTRACT_TOPICS)

  useEffect(() => {
    let cancelled = false
    organizationsService
      .publicList()
      .then((res) => {
        if (!cancelled && res.data && res.data.length > 0) {
          setOrgList(res.data)
        }
      })
      .catch(() => {
        // Fallback to default ORGANIZATIONS
      })

    roomsService
      .list()
      .then((res) => {
        if (!cancelled && res.data && res.data.length > 0) {
          const rawList = res.data as Array<Partial<RoomPublic> & { suc_chua_toi_da?: number; trang_thiet_bi?: { may_chieu?: boolean; am_thanh?: boolean; wifi?: boolean } }>
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
            trang_thai: r.trang_thai,
            bao_tri_tu_ngay: r.bao_tri_tu_ngay,
            bao_tri_den_ngay: r.bao_tri_den_ngay,
          }))
          setRoomList(mapped)
        }
      })
      .catch(() => {
        // Fallback to default ROOMS
      })

    api
      .get<{ data: Topic[] }>("/topics")
      .then((res) => {
        if (!cancelled && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setTopicList(res.data)
        }
      })
      .catch(() => {
        // Fallback to default CONTRACT_TOPICS
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    eventsService
      .organizerDetail(id)
      .then((res) => {
        if (cancelled || !res.data) return
        const ev: any = res.data
        const start = ev.thoi_gian_bat_dau
          ? new Date(ev.thoi_gian_bat_dau)
          : null
        const end = ev.thoi_gian_ket_thuc
          ? new Date(ev.thoi_gian_ket_thuc)
          : null
        const dateStr = start ? start.toISOString().slice(0, 10) : ""
        const startTimeStr = start ? start.toTimeString().slice(0, 5) : ""
        const endTimeStr = end ? end.toTimeString().slice(0, 5) : ""

        setForm((prev) => ({
          ...prev,
          title: ev.ten_su_kien || ev.title || prev.title,
          topic: ev.ma_chuyen_de ? String(ev.ma_chuyen_de) : prev.topic,
          description: ev.mo_ta || prev.description,
          regStart: ev.ngay_cong_bo
            ? String(ev.ngay_cong_bo).slice(0, 16)
            : prev.regStart,
          regEnd: ev.thoi_gian_dong_dang_ky
            ? String(ev.thoi_gian_dong_dang_ky).slice(0, 16)
            : prev.regEnd,
          eventDate: dateStr || prev.eventDate,
          startTime: startTimeStr || prev.startTime,
          endTime: endTimeStr || prev.endTime,
          room: ev.ma_phong ? String(ev.ma_phong) : prev.room,
          location: ev.dia_diem || ev.ten_phong || prev.location,
          capacity: ev.so_luong_toi_da
            ? String(ev.so_luong_toi_da)
            : prev.capacity,
          unlimited: ev.khong_gioi_han_slot ? "true" : "false",
          drlRule: ev.dieu_khoan_drl || prev.drlRule,
          proposedPoints: ev.diem_drl_du_kien
            ? String(ev.diem_drl_du_kien)
            : prev.proposedPoints,
          volunteerHours: ev.gio_tinh_nguyen
            ? String(ev.gio_tinh_nguyen)
            : prev.volunteerHours,
        }))
      })
      .catch((err) => {
        showToast(
          "Không thể tải thông tin sự kiện: " + getApiErrorMessage(err),
          "error",
        )
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const [form, setForm] = useState({
    title: "",
    topic: "",
    description: "",
    regStart: "",
    regEnd: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    room: "",
    capacity: "",
    unlimited: "false",
    drlRule: "Dieu3",
    volunteerHours: "0",
    cohostIds: "",
    proposedPoints: "5",
    validMinutes: "150",
    certificateCondition:
      "Tham gia tối thiểu 90% thời lượng hợp lệ và có đủ check-in/check-out.",
    ruleBasis: "Đề xuất của đơn vị — dữ liệu minh họa",
  })

  // AI Content Copilot state (UC-AI-01)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{
    title: string
    description: string
    agenda: string
  } | null>(null)

  async function handleGenerateAi() {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    try {
      const res = await reportsService.generateEventContent({
        chu_de: aiPrompt.trim(),
        doi_tuong_muc_tieu: "Sinh viên Đại học Công nghệ Thông tin (UIT)",
        thoi_luong_phut: 120,
        muc_tieu: `Trang bị kiến thức và kỹ năng thực tế về ${aiPrompt.trim()} cho sinh viên`,
        phong_cach: "HaoHuc",
      })

      if (res && res.data) {
        const title =
          res.data.tieu_de_goi_y?.[0] ||
          `Hội thảo Chuyên đề: ${aiPrompt.trim()} — Ứng dụng & Xu hướng 2026`
        const description = res.data.mo_ta_de_xuat || ""
        const agenda = Array.isArray(res.data.lo_trinh_de_xuat)
          ? res.data.lo_trinh_de_xuat
              .map(
                (item, idx) =>
                  `${idx + 1}. ${item.thoi_gian_bat_dau} - ${item.thoi_gian_ket_thuc}: ${item.tieu_de}${item.dien_gia ? ` (Diễn giả: ${item.dien_gia})` : ""}`,
              )
              .join("\n")
          : ""

        setAiResult({
          title,
          description,
          agenda,
        })
      }
    } catch {
      // Graceful fallback when backend AI service is offline
      setAiResult({
        title: `Hội thảo Chuyên đề: ${aiPrompt.trim()} — Ứng dụng & Xu hướng 2026`,
        description: `Chương trình hội thảo chuyên sâu về ${aiPrompt.trim()} nhằm trang bị cho sinh viên UIT các kiến thức thực chiến, phương pháp tiếp cận mới nhất cùng sự tham gia của các chuyên gia đầu ngành. Sinh viên tham dự đầy đủ sẽ được cấp Giấy chứng nhận điện tử và cộng Điểm rèn luyện.`,
        agenda: `1. 08:00 - 08:30: Đón tiếp đại biểu & Check-in qua mã Dynamic Kiosk\n2. 08:30 - 10:00: Diễn giả trình bày chuyên đề ${aiPrompt.trim()}\n3. 10:00 - 11:00: Thảo luận, Q&A và kết nối doanh nghiệp\n4. 11:00 - 11:30: Check-out và hướng dẫn làm bài khảo sát nhận chứng nhận.`,
      })
    } finally {
      setAiGenerating(false)
    }
  }

  function applyAiResult() {
    if (!aiResult) return
    setForm((f) => ({
      ...f,
      title: aiResult.title,
      description: `${aiResult.description}\n\n[LỊCH TRÌNH AGENDA]\n${aiResult.agenda}`,
    }))
    setShowAiModal(false)
    showToast(
      "Đã áp dụng nội dung do AI gợi ý vào biểu mẫu sự kiện!",
      "success",
    )
  }

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: "" }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = "Vui lòng nhập tên sự kiện."
    if (!form.topic) e.topic = "Vui lòng chọn chủ đề."
    if (
      form.unlimited === "false" &&
      (!form.capacity ||
        isNaN(Number(form.capacity)) ||
        Number(form.capacity) <= 0)
    )
      e.capacity = "Sức chứa phải là số nguyên dương."
    if (!form.room) e.room = "Vui lòng chọn phòng từ danh mục."
    const room = roomList.find((item) => String(item.ma_phong) === form.room)
    if (
      room &&
      form.unlimited === "false" &&
      Number(form.capacity) > room.suc_chua
    )
      e.capacity = `Vượt sức chứa tối đa của phòng (${room.suc_chua}).`
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime)
      e.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu."
    if (form.regEnd && form.eventDate && form.regEnd > form.eventDate)
      e.regEnd = "Thời gian đóng đăng ký không được sau ngày diễn ra sự kiện."
    return e
  }

  async function handleSubmit(submitForApproval: boolean) {
    if (saving) return
    const errors = submitForApproval ? validate() : {}
    if (Object.keys(errors).length) {
      setErrors(errors)
      return
    }
    setSaving(true)
    try {
      const title = form.title.trim() || "Bản nháp chưa đặt tên"
      if (
        form.eventDate &&
        form.startTime &&
        form.endTime &&
        form.topic &&
        form.room
      ) {
        const payload = {
          ten_su_kien: title,
          mo_ta: form.description,
          ma_chuyen_de: Number(form.topic),
          ma_phong: Number(form.room),
          ngay_cong_bo: form.regStart || new Date().toISOString().slice(0, 10),
          thoi_gian_bat_dau: `${form.eventDate}T${form.startTime}:00`,
          thoi_gian_ket_thuc: `${form.eventDate}T${form.endTime}:00`,
          khong_gioi_han_slot: form.unlimited === "true",
          so_luong_toi_da:
            form.unlimited === "true" ? null : Number(form.capacity),
          dieu_khoan_drl: form.drlRule,
          diem_drl_du_kien: Number(form.proposedPoints),
          gio_tinh_nguyen: Number(form.volunteerHours),
          ...(form.cohostIds.trim()
            ? {
                danh_sach_co_host_ids: form.cohostIds
                  .split(",")
                  .map(Number)
                  .filter(Number.isFinite),
              }
            : {}),
        }
        let eventTargetId = id ? Number(id) : undefined
        if (id) {
          const updated = await eventsService.updateDraft(id, payload)
          if (!updated.success)
            throw new Error(updated.message || "Không thể cập nhật bản nháp")
        } else {
          const created = await eventsService.createDraft(payload)
          if (!created.success)
            throw new Error(created.message || "Không thể tạo bản nháp")
          const event = (created.data ?? {}) as {
            ma_su_kien?: number
            id?: number
          }
          eventTargetId = event.ma_su_kien ?? event.id
        }

        if (submitForApproval && eventTargetId) {
          await eventsService.submitApproval(eventTargetId)
        }
      }
      saveApprovalDraft(
        {
          title,
          eventDate: form.eventDate,
          description: form.description,
          plan: "Nội dung chương trình được lưu từ biểu mẫu sự kiện.",
          proposedPoints: Number(form.proposedPoints) || 0,
          maxPoints: Number(form.proposedPoints) || 0,
          validMinutes: Number(form.validMinutes) || 0,
          certificateCondition: form.certificateCondition,
          ruleBasis: form.ruleBasis,
          thresholds: [
            {
              ratio: 70,
              points: Math.max(1, (Number(form.proposedPoints) || 0) - 2),
            },
            { ratio: 90, points: Number(form.proposedPoints) || 0 },
          ],
        },
        submitForApproval,
      )
      showToast(
        submitForApproval ? "Đã gửi duyệt sự kiện." : "Đã lưu bản nháp.",
        "success",
      )
      onNavigate("org-events")
    } catch (error) {
      showToast(getApiErrorMessage(error), "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <OrgLayout current="org-events" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="p-6 lg:p-8 max-w-screen-xl">
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-2 text-sm mb-2"
          style={{ color: "#94a3b8" }}
        >
          <button
            onClick={() => onNavigate("org-events")}
            className="hover:underline"
          >
            Quản lý sự kiện
          </button>
          <span>/</span>
          <span style={{ color: "#1a1a2e" }}>
            {isEditMode ? "Chỉnh sửa sự kiện nháp" : "Tạo sự kiện mới"}
          </span>
        </div>

        <h1
          className="font-display font-bold text-2xl mb-6"
          style={{ color: "#1a1a2e" }}
        >
          {isEditMode ? "Chỉnh sửa sự kiện nháp" : "Tạo sự kiện mới"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form — 2/3 width */}
          <div className="lg:col-span-2 space-y-5">
            {/* Soft Hold 48h Warning Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <span className="text-base">⏳</span>
              <div>
                <p className="font-bold">
                  Chính sách giữ chỗ phòng Soft Hold 48h:
                </p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Khi bạn nhấn "Gửi phê duyệt", phòng hội trường được chọn sẽ
                  được hệ thống giữ tạm thời (Soft Hold) tối đa 48 giờ để chờ
                  Khoa và CTSV thẩm định. Slot sẽ tự giải phóng nếu không được
                  duyệt trước thời hạn.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <Section title="Thông tin chung">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">
                  Nhập tiêu đề hoặc dùng trợ lý AI:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trợ lý gợi ý nội dung & Agenda</span>
                </button>
              </div>
              <FormField label="Tên sự kiện" required error={errors.title}>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="VD: Hội thảo Trí tuệ nhân tạo 2026"
                  className={inputClass(!!errors.title)}
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Chủ đề" required error={errors.topic}>
                  <select
                    value={form.topic}
                    onChange={(e) => set("topic", e.target.value)}
                    className={inputClass(!!errors.topic)}
                  >
                    <option value="">Chọn chủ đề</option>
                    {topicList.map((topic) => (
                      <option
                        key={topic.ma_chuyen_de}
                        value={topic.ma_chuyen_de}
                      >
                        {topic.ten_chuyen_de}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Ảnh banner">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer hover:bg-slate-50 transition-colors"
                      style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      Tải lên banner
                    </label>
                  </div>
                </FormField>
              </div>
              <FormField label="Mô tả sự kiện">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Mô tả chi tiết về sự kiện, chương trình và mục tiêu..."
                  className={inputClass(false)}
                  style={{ resize: "vertical" }}
                />
              </FormField>
            </Section>

            {/* Co-host selection */}
            <Section title="Đơn vị Đồng tổ chức (Co-hosts)">
              <p className="text-xs text-slate-500 mb-3">
                Chọn các Câu lạc bộ, Khoa hoặc Phòng ban phối hợp tổ chức. Khi
                gửi duyệt, hệ thống sẽ chuyển sự kiện sang trạng thái{" "}
                <strong>WAITING_COHOST_CONFIRM</strong> để các đơn vị đồng tổ
                chức xác nhận.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {orgList.map((org) => {
                  const selectedIds = form.cohostIds
                    ? form.cohostIds.split(",").map((s) => s.trim())
                    : []
                  const isChecked = selectedIds.includes(String(org.ma_don_vi))
                  return (
                    <label
                      key={org.ma_don_vi}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const nextIds = e.target.checked
                            ? [...selectedIds, String(org.ma_don_vi)]
                            : selectedIds.filter(
                                (id) => id !== String(org.ma_don_vi),
                              )
                          set("cohostIds", nextIds.join(","))
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-medium text-slate-800">
                        {org.ten_don_vi}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({org.loai_don_vi})
                      </span>
                    </label>
                  )
                })}
              </div>
            </Section>

            {/* Section 2 */}
            <Section title="Thời gian đăng ký">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Thời gian mở đăng ký">
                  <input
                    type="datetime-local"
                    value={form.regStart}
                    onChange={(e) => set("regStart", e.target.value)}
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField label="Thời gian đóng đăng ký" error={errors.regEnd}>
                  <input
                    type="datetime-local"
                    value={form.regEnd}
                    onChange={(e) => set("regEnd", e.target.value)}
                    className={inputClass(!!errors.regEnd)}
                  />
                </FormField>
              </div>
            </Section>

            {/* Section 3 */}
            <Section title="Thời gian tổ chức">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Ngày tổ chức">
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField label="Giờ bắt đầu">
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField label="Giờ kết thúc" error={errors.endTime}>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={inputClass(!!errors.endTime)}
                  />
                </FormField>
              </div>
            </Section>

            {/* Section 4 */}
            <Section title="Địa điểm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tên địa điểm / Trường">
                  <input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="VD: Trường ĐH Công nghệ Thông tin"
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField
                  label="Phòng / Hội trường"
                  required
                  error={errors.room}
                >
                  <select
                    value={form.room}
                    onChange={(e) => set("room", e.target.value)}
                    className={inputClass(!!errors.room)}
                  >
                    <option value="">Chọn phòng từ danh mục</option>
                    {roomList.map((room) => (
                      <option
                        key={room.ma_phong}
                        value={room.ma_phong}
                        disabled={room.trang_thai === "BaoTri"}
                      >
                        {room.ten_phong} · {room.co_so} · {room.suc_chua} chỗ
                        {room.trang_thai === "BaoTri" ? " [ĐANG BẢO TRÌ]" : ""}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </Section>

            {/* Section 5 */}
            <Section title="Sức chứa">
              <label className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <input
                  type="checkbox"
                  checked={form.unlimited === "true"}
                  onChange={(event) =>
                    set("unlimited", event.target.checked ? "true" : "false")
                  }
                />
                Sự kiện mở tự do, không giới hạn slot
              </label>
              <FormField
                label="Số lượng tham gia tối đa"
                required={form.unlimited === "false"}
                error={errors.capacity}
              >
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => set("capacity", e.target.value)}
                  disabled={form.unlimited === "true"}
                  placeholder="VD: 200"
                  className={`${inputClass(!!errors.capacity)} max-w-xs`}
                />
              </FormField>
              <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                Sau khi đạt giới hạn, hệ thống sẽ tự động đóng đăng ký và hiển
                thị trạng thái "Hết chỗ".
              </p>
            </Section>

            {/* Section 6 */}
            <Section title="Nội dung chương trình">
              <textarea
                rows={5}
                placeholder="Mô tả lịch trình, các tiết mục và hoạt động trong sự kiện..."
                className={inputClass(false)}
                style={{ resize: "vertical" }}
              />
            </Section>

            <Section title="Đề xuất điểm & chứng nhận">
              <div className="rounded-xl p-3 bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-700">
                  Đây là quy tắc điểm dự kiến. Điểm thực tế chỉ được công nhận
                  sau khi đối soát và Phòng CTSV phê duyệt.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Điều khoản ĐRL">
                  <select
                    value={form.drlRule}
                    onChange={(event) => set("drlRule", event.target.value)}
                    className={inputClass(false)}
                  >
                    <option value="KhongCo">Không có</option>
                    <option value="Dieu3">Điều 3</option>
                    <option value="Dieu4">Điều 4</option>
                  </select>
                </FormField>
                <FormField label="Điểm đề xuất tối đa">
                  <input
                    type="number"
                    min={0}
                    value={form.proposedPoints}
                    onChange={(e) => set("proposedPoints", e.target.value)}
                    className={inputClass(false)}
                  />
                </FormField>
                <FormField label="Thời lượng hợp lệ (phút)">
                  <input
                    type="number"
                    min={0}
                    value={form.validMinutes}
                    onChange={(e) => set("validMinutes", e.target.value)}
                    className={inputClass(false)}
                  />
                </FormField>
              </div>
              <FormField label="Điều kiện chứng nhận (tách riêng điều kiện điểm)">
                <textarea
                  value={form.certificateCondition}
                  onChange={(e) => set("certificateCondition", e.target.value)}
                  rows={3}
                  className={inputClass(false)}
                />
              </FormField>
              <FormField label="Căn cứ đề xuất">
                <input
                  value={form.ruleBasis}
                  onChange={(e) => set("ruleBasis", e.target.value)}
                  className={inputClass(false)}
                />
              </FormField>
            </Section>
          </div>

          {/* Preview sidebar — desktop only */}
          <div className="hidden lg:block">
            <div className="sticky top-8">
              <div
                className="bg-white rounded-2xl p-5 shadow-sm border"
                style={{ borderColor: "#f1f5f9" }}
              >
                <h3
                  className="font-display font-semibold text-sm mb-3"
                  style={{ color: "#1a1a2e" }}
                >
                  Xem trước
                </h3>
                <div
                  className="rounded-xl overflow-hidden mb-3"
                  style={{ background: "#f8fafc", height: 120 }}
                >
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: "#cbd5e1" }}
                  >
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={0.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  </div>
                </div>
                <h4
                  className="font-display font-semibold text-sm leading-snug mb-2"
                  style={{ color: form.title ? "#1a1a2e" : "#cbd5e1" }}
                >
                  {form.title || "Tên sự kiện sẽ hiển thị ở đây"}
                </h4>
                <div className="space-y-1.5">
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{form.eventDate ? formatCalendarDate(form.eventDate) : "Chưa chọn ngày"}</span>
                  </p>
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{form.room || form.location || "Chưa có địa điểm"}</span>
                  </p>
                  <p className="text-xs flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{form.capacity ? `0/${form.capacity} chỗ` : "Chưa có sức chứa"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap gap-3 mt-6 pt-6 border-t"
          style={{ borderColor: "#e2e8f0" }}
        >
          <button
            onClick={() => onNavigate("org-events")}
            className="px-6 py-2.5 rounded-xl text-sm font-medium border"
            style={{
              borderColor: "#e2e8f0",
              color: "#475569",
              background: "white",
            }}
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border"
            style={{
              borderColor: "#e2e8f0",
              color: "#4f46e5",
              background: "#eef2ff",
            }}
          >
            Lưu bản nháp
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#4f46e5" }}
          >
            Gửi khoa duyệt
          </button>
          <p className="w-full text-xs text-slate-400">
            Gửi duyệt không đồng nghĩa công bố. Sự kiện chỉ đủ điều kiện công bố
            sau khi Khoa và Phòng CTSV phê duyệt.
          </p>
        </div>

        {/* UC-AI-01: AI Content Copilot Modal */}
        {showAiModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAiModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900">
                      Gợi ý Nội dung & Timeline Sự kiện
                    </h3>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ soạn thảo khung chương trình chuẩn CTSV
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Nhập từ khóa hoặc ý tưởng chủ đề sự kiện của bạn (ví dụ:{" "}
                <em>"Workshop AI Agent & React cho sinh viên UIT"</em>,{" "}
                <em>"Giải bóng đá tân sinh viên 2026"</em>). Hệ thống sẽ tự động sinh
                tiêu đề thu hút, mô tả chi tiết và khung timeline chương trình.
              </p>

              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Nhập ý tưởng chủ đề sự kiện..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-600 font-medium"
                />
                <button
                  onClick={handleGenerateAi}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo nội dung đề xuất...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tạo nội dung & Agenda ngay</span>
                    </>
                  )}
                </button>
              </div>

              {aiResult && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3 mb-5 max-h-60 overflow-y-auto text-xs">
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Tiêu đề gợi ý:
                    </p>
                    <p className="font-semibold text-slate-900 bg-white p-2.5 rounded-xl border border-purple-200">
                      {aiResult.title}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Mô tả chương trình:
                    </p>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200 leading-relaxed">
                      {aiResult.description}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 uppercase text-[10px] tracking-wider mb-1">
                      Lịch trình Agenda:
                    </p>
                    <pre className="text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200 font-sans whitespace-pre-wrap leading-relaxed">
                      {aiResult.agenda}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                {aiResult && (
                  <button
                    onClick={applyAiResult}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 cursor-pointer"
                  >
                    Áp dụng vào form
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

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border"
      style={{ borderColor: "#f1f5f9" }}
    >
      <h2
        className="font-display font-semibold text-base mb-4 pb-3 border-b"
        style={{ color: "#1a1a2e", borderColor: "#f1f5f9" }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#475569" }}
      >
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "#dc2626" }}>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
    hasError
      ? "border-red-400 bg-red-50"
      : "border-slate-200 focus:border-indigo-500"
  }`
}
