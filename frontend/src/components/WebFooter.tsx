export default function WebFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-xs">
                CEH
              </div>
              <span className="font-display font-bold text-white text-base">
                Campus Event Hub
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Cổng thông tin và quản lý sự kiện đại học thống nhất: giải pháp số
              hóa toàn diện từ đề xuất, kiểm duyệt quy tắc điểm, tổ chức điểm
              danh hai chiều đến công nhận điểm rèn luyện và phát hành chứng
              nhận số.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>Hệ thống vận hành chính thức · Phiên bản 2026</span>
            </div>
          </div>

          {/* Fast Links */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-sm">
              Phân hệ sinh viên
            </p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Khám phá & đăng ký sự kiện</li>
              <li>Ví vé điện tử cá nhân & QR check-in</li>
              <li>Tra cứu đối soát điểm rèn luyện</li>
              <li>Kho chứng nhận số & xác thực mã</li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-sm">Liên hệ & Hỗ trợ</p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Phòng Công tác Sinh viên (CTSV)</li>
              <li>Email: ctsv@demo.edu.vn</li>
              <li>Hotline hỗ trợ: (028) 3725 2002</li>
              <li>Thời gian: 07:30 - 17:00 (Thứ 2 - Thứ 6)</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>
            © 2026 Campus Event Hub. Mọi quyền được bảo lưu trong khuôn khổ
            trường đại học.
          </p>
          <p>Thiết kế theo chuẩn giao diện ứng dụng web đại học hiện đại.</p>
        </div>
      </div>
    </footer>
  )
}
