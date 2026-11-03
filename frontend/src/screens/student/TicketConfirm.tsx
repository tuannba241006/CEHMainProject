import type { Ticket } from "../../data/mock"
import { parseCalendarDate } from "../../utils/date"

interface Props {
  ticket: Ticket
  onViewTickets: () => void
  onGoHome: () => void
}

export default function TicketConfirm({
  ticket,
  onViewTickets,
  onGoHome,
}: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Web Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium mb-6">
        <button
          onClick={onGoHome}
          className="hover:text-indigo-600 transition-colors cursor-pointer"
        >
          Trang chủ
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Xác nhận giữ chỗ</span>
      </nav>

      {/* Main Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
          Đăng ký giữ chỗ thành công!
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Mã vé điện tử và QR check-in đã được hệ thống tạo và lưu trữ an toàn
          trong ví vé cá nhân của bạn.
        </p>

        {/* Structured Ticket Card */}
        <div className="mt-8 max-w-lg mx-auto bg-slate-50/70 rounded-3xl border border-slate-200 overflow-hidden text-left shadow-xs">
          {/* Header band */}
          <div className="bg-indigo-600 text-white p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              Vé điện tử chính thức
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg mt-2 leading-snug">
              {ticket.eventTitle}
            </h2>
          </div>

          {/* Details */}
          <div className="p-6 space-y-3.5 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-400">Thời gian diễn ra:</span>
              <span className="font-semibold text-slate-800 text-right">
                {(
                  parseCalendarDate(ticket.eventDate) ?? new Date()
                ).toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                · {ticket.eventTime}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-400">Địa điểm:</span>
              <span className="font-semibold text-slate-800 text-right">
                {ticket.eventLocation}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-400">Người tham dự:</span>
              <span className="font-semibold text-slate-800 text-right">
                {ticket.studentName} ({ticket.studentId})
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-slate-400">Đơn vị đào tạo:</span>
              <span className="font-semibold text-slate-800 text-right">
                {ticket.faculty}
              </span>
            </div>

            <div className="flex items-start justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-mono">Mã vé UUID:</span>
              <span className="font-mono font-bold text-indigo-600 break-all text-right max-w-[240px]">
                {ticket.ma_ve_uuid || ticket.id}
              </span>
            </div>
          </div>

          {/* Mini QR Pattern */}
          <div className="p-6 pt-0 flex flex-col items-center">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs mb-2">
              <MiniQR seed={hashCode(ticket.id)} />
            </div>
            <p className="text-[11px] text-slate-400">
              Xuất trình mã này cho Ban tổ chức khi đến sự kiện
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={onViewTickets}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Xem trong mục Vé của tôi
          </button>
          <button
            onClick={onGoHome}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
          >
            Khám phá thêm sự kiện
          </button>
        </div>
      </div>
    </div>
  )
}

function hashCode(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++)
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function MiniQR({ seed }: { seed: number }) {
  return (
    <svg width={140} height={140} viewBox="0 0 180 180">
      {[
        [0, 0],
        [126, 0],
        [0, 126],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect
            x={x + 2}
            y={y + 2}
            width={52}
            height={52}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={6}
            rx={4}
          />
          <rect
            x={x + 16}
            y={y + 16}
            width={24}
            height={24}
            fill="#1a1a2e"
            rx={2}
          />
        </g>
      ))}
      {Array.from({ length: 200 }, (_, i) => {
        const v = Math.sin(seed + i * 7.3 + 1)
        if (v * 0.5 + 0.5 < 0.45) return null
        const col = (i % 16) * 10 + 20
        const row = Math.floor(i / 16) * 10 + 20
        if (col < 70 && (row < 70 || row > 110)) return null
        if (col > 110 && row < 70) return null
        return (
          <rect
            key={i}
            x={col}
            y={row}
            width={8}
            height={8}
            fill="#1a1a2e"
            rx={1}
          />
        )
      })}
    </svg>
  )
}
