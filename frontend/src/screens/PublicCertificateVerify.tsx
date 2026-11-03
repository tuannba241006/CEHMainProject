import { useState } from "react"
import { useApp } from "../context/AppContext"
import { CertificateBadge } from "./management/AffairsOperations"

export default function PublicCertificateVerify({
  onBack,
  initialCode = "CEH-2026-AI-7K9P2",
}: {
  onBack: () => void
  initialCode?: string
}) {
  const { verifyCertificate } = useApp()
  const [code, setCode] = useState(initialCode)
  const [searched, setSearched] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const certificate =
    searched && !connectionError ? verifyCertificate(code.trim()) : undefined

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans">
      {/* Web Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-display font-bold text-sm shadow-xs">
              CEH
            </div>
            <div>
              <p className="font-display font-bold text-base text-slate-900 leading-tight">
                Cổng Xác thực Chứng chỉ Số Công khai
              </p>
              <p className="text-xs text-slate-500">
                Campus Event Hub · ĐHQG-HCM
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ← Quay lại đăng nhập / Cổng sinh viên
          </button>
        </div>
      </header>

      {/* Main Verification Body */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
              <span>Hệ thống đối soát & xác thực chứng chỉ số</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              Kiểm tra tính hợp lệ của chứng nhận
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Nhập mã định danh duy nhất (Certificate Code) in trên chứng nhận
              hoặc mã đọc từ QR để xác thực thông tin người nhận, đơn vị cấp và
              tính toàn vẹn của hồ sơ.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setSearched(false)
                }}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 font-mono text-sm sm:text-base uppercase outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 tracking-wider bg-slate-50/50 focus:bg-white"
                placeholder="VD: CEH-2026-AI-7K9P2"
              />
            </div>
            <button
              onClick={() => {
                setConnectionError(false)
                setSearched(true)
              }}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer flex-shrink-0"
            >
              Xác thực ngay
            </button>
          </div>

          {/* Quick sample code chips for easy testing */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">
              Mã mẫu thử nghiệm:
            </span>
            <button
              onClick={() => {
                setCode("CEH-2026-AI-7K9P2")
                setConnectionError(false)
                setSearched(true)
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono text-[11px] cursor-pointer"
            >
              CEH-2026-AI-7K9P2 (Hợp lệ)
            </button>
            <button
              onClick={() => {
                setCode("CEH-2026-AI-8B2X1")
                setConnectionError(false)
                setSearched(true)
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono text-[11px] cursor-pointer"
            >
              CEH-2026-AI-8B2X1 (Thay thế)
            </button>
            <button
              onClick={() => {
                setConnectionError(true)
                setSearched(true)
              }}
              className="text-slate-400 hover:text-slate-600 underline ml-auto text-[11px] cursor-pointer"
            >
              Mô phỏng lỗi mạng
            </button>
          </div>

          {/* Verification Results Panel */}
          {searched && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in duration-200">
              {connectionError ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <h3 className="font-display font-bold text-base text-rose-800">
                    Không thể kết nối đến máy chủ xác thực
                  </h3>
                  <p className="text-xs text-rose-600 mt-1">
                    Hệ thống tạm thời không phản hồi. Vui lòng kiểm tra lại kết
                    nối mạng và thử lại sau.
                  </p>
                </div>
              ) : !certificate ? (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <h3 className="font-display font-bold text-base text-amber-800">
                    Không tìm thấy mã chứng nhận
                  </h3>
                  <p className="text-xs text-amber-700 mt-1">
                    Mã chứng nhận “{code}” không tồn tại trong hệ thống lưu trữ
                    hoặc đã bị xóa.
                  </p>
                </div>
              ) : (
                <div
                  className={`p-6 sm:p-8 rounded-3xl border ${
                    certificate.status === "issued"
                      ? "bg-emerald-50/50 border-emerald-200"
                      : certificate.status === "revoked"
                        ? "bg-rose-50/50 border-rose-200"
                        : "bg-indigo-50/50 border-indigo-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          certificate.status === "issued"
                            ? "bg-emerald-100 text-emerald-700"
                            : certificate.status === "revoked"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        ✓
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-xl text-slate-900">
                          {certificate.status === "issued"
                            ? "Chứng nhận hợp lệ & chính thức"
                            : certificate.status === "revoked"
                              ? "Chứng nhận này đã bị thu hồi"
                              : "Chứng nhận đã được cấp lại với mã mới"}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Mã số: {certificate.code}
                        </p>
                      </div>
                    </div>

                    <CertificateBadge status={certificate.status} />
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6 text-xs">
                    {[
                      [
                        "Họ tên người nhận",
                        certificate.ho_ten_che_mo ||
                          certificate.recipientName ||
                          "—",
                      ],
                      [
                        "Mã số sinh viên",
                        certificate.mssv_che_mo || certificate.studentId || "—",
                      ],
                      [
                        "Sự kiện đã tham gia",
                        certificate.ten_su_kien ||
                          certificate.eventTitle ||
                          "—",
                      ],
                      [
                        "Đơn vị cấp phát",
                        certificate.don_vi_to_chuc || certificate.issuer || "—",
                      ],
                      [
                        "Ngày phát hành",
                        certificate.ngay_cap || certificate.issuedAt || "—",
                      ],
                      [
                        "Mã chứng thực (HMAC / Code)",
                        certificate.ma_hash || certificate.code,
                      ],
                      ...(certificate.replacedBy
                        ? [["Mã thay thế hợp lệ", certificate.replacedBy]]
                        : []),
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="p-3 bg-white/70 rounded-xl border border-slate-100"
                      >
                        <dt className="text-slate-400 font-medium">{label}</dt>
                        <dd className="text-sm font-semibold text-slate-800 mt-1">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {certificate.revokeReason && (
                    <div className="mt-5 p-4 rounded-2xl bg-rose-100/70 border border-rose-200 text-xs text-rose-900">
                      <strong>Lý do thu hồi:</strong> {certificate.revokeReason}
                    </div>
                  )}

                  <div className="mt-6 pt-5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Xác thực bởi: Phòng Công tác Sinh viên (CTSV) · ĐHQG-HCM
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      In bản xác thực
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-center text-slate-400 mt-8">
          Trang tra cứu thông tin chứng nhận số chính thức · Đại học Quốc gia
          TP.HCM.
        </p>
      </main>
    </div>
  )
}
