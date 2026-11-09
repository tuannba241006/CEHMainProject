import { useState, useEffect } from "react"
import { useApp } from "../context/AppContext"
import { CertificateBadge } from "./management/AffairsOperations"
import { certificatesService } from "../api/services/certificates.service"
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Building2,
  Calendar,
  User,
  Hash,
} from "lucide-react"

export interface VerifiedCertificateDisplay {
  id: string | number
  code: string
  eventTitle: string
  studentName: string
  studentId: string
  issuedAt: string
  organizer: string
  status: string
}

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
  const [loading, setLoading] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [certificate, setCertificate] = useState<VerifiedCertificateDisplay | undefined>(undefined)

  const handleVerify = async (codeToVerify: string) => {
    const trimmed = codeToVerify.trim()
    if (!trimmed) return
    setSearched(true)
    setLoading(true)
    setConnectionError(false)
    try {
      const res = await certificatesService.verify(trimmed).catch(() => null)
      if (res?.data) {
        const d = res.data
        setCertificate({
          id: 1,
          code: trimmed,
          eventTitle: d.ten_su_kien || "Sự kiện học thuật",
          studentName: d.ho_ten_che_mo || "Sinh viên",
          studentId: d.mssv_che_mo || "",
          issuedAt: d.ngay_cap || new Date().toISOString(),
          organizer: d.don_vi_to_chuc || "Đại học Công nghệ Thông tin",
          status: d.da_thu_hoi ? "revoked" : (d.trang_thai?.toLowerCase() || "valid"),
        })
      } else {
        const local = verifyCertificate(trimmed)
        if (local) {
          setCertificate({
            id: local.id,
            code: local.code,
            eventTitle: local.eventTitle,
            studentName: local.ho_ten_che_mo || local.recipientName || "Sinh viên",
            studentId: local.mssv_che_mo || local.studentId || "",
            issuedAt: local.issuedAt,
            organizer: local.issuer || "Đại học Công nghệ Thông tin",
            status: local.status,
          })
        } else {
          setCertificate(undefined)
        }
      }
    } catch {
      const local = verifyCertificate(trimmed)
      if (local) {
        setCertificate({
          id: local.id,
          code: local.code,
          eventTitle: local.eventTitle,
          studentName: local.ho_ten_che_mo || local.recipientName || "Sinh viên",
          studentId: local.mssv_che_mo || local.studentId || "",
          issuedAt: local.issuedAt,
          organizer: local.issuer || "Đại học Công nghệ Thông tin",
          status: local.status,
        })
      } else {
        setCertificate(undefined)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCode) {
      void handleVerify(initialCode)
    }
  }, [initialCode])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans">
      {/* Web Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-sm">
              CEH
            </div>
            <div>
              <p className="font-display font-bold text-base text-slate-900 leading-tight flex items-center gap-1.5">
                <span>Cổng Xác thực Chứng chỉ Số Công khai</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </p>
              <p className="text-xs text-slate-500">
                Campus Event Hub · Trường Đại học Công nghệ Thông tin (ĐHQG-HCM)
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Quay lại Cổng sinh viên</span>
          </button>
        </div>
      </header>

      {/* Main Verification Body */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-2xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hệ thống đối soát & xác thực chứng chỉ số</span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Tra cứu & Kiểm tra Tính Toàn Vẹn Chứng nhận
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Nhập mã định danh duy nhất (Certificate Code) in trên chứng nhận hoặc mã quét từ QR để đối soát chữ ký số điện tử, thông tin người nhận và đơn vị ban hành theo chuẩn Nghị định 13/2023/NĐ-CP.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value)
                  setSearched(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleVerify(code)
                }}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 font-mono text-sm sm:text-base uppercase outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 tracking-wider bg-slate-50/50 focus:bg-white transition-all"
                placeholder="VD: CEH-2026-AI-7K9P2"
              />
            </div>
            <button
              onClick={() => void handleVerify(code)}
              disabled={loading}
              className="px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-2xs cursor-pointer flex-shrink-0 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{loading ? "Đang xác thực..." : "Tra cứu chứng chỉ"}</span>
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
                void handleVerify("CEH-2026-AI-7K9P2")
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono text-[11px] cursor-pointer transition-colors"
            >
              CEH-2026-AI-7K9P2 (Hợp lệ)
            </button>
            <button
              onClick={() => {
                setCode("CEH-2026-AI-8B2X1")
                void handleVerify("CEH-2026-AI-8B2X1")
              }}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono text-[11px] cursor-pointer transition-colors"
            >
              CEH-2026-AI-8B2X1 (Thay thế)
            </button>
            <button
              onClick={() => {
                setConnectionError(true)
                setSearched(true)
                setCertificate(undefined)
              }}
              className="text-slate-400 hover:text-slate-600 underline ml-auto text-[11px] cursor-pointer"
            >
              Mô phỏng lỗi mạng
            </button>
          </div>

          {/* Verification Results Panel */}
          {searched && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              {loading ? (
                <div className="p-8 text-center flex flex-col items-center gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <p className="text-sm font-medium text-slate-500">Đang truy vấn sổ chứng chỉ số...</p>
                </div>
              ) : connectionError ? (
                <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1">
                  <h3 className="font-display font-bold text-base text-rose-800 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Không thể kết nối đến máy chủ xác thực</span>
                  </h3>
                  <p className="text-xs text-rose-600">
                    Hệ thống tạm thời không phản hồi. Vui lòng kiểm tra lại kết nối mạng và thử lại sau.
                  </p>
                </div>
              ) : !certificate ? (
                <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                  <h3 className="font-display font-bold text-base text-amber-800 flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Không tìm thấy mã chứng nhận</span>
                  </h3>
                  <p className="text-xs text-amber-700">
                    Mã chứng nhận “{code}” không tồn tại trong hệ thống lưu trữ hoặc đã bị xóa.
                  </p>
                </div>
              ) : (
                <div
                  className={`p-6 sm:p-7 rounded-2xl border ${
                    certificate.status === "issued" || certificate.status === "valid"
                      ? "bg-emerald-50/40 border-emerald-200"
                      : certificate.status === "revoked"
                        ? "bg-rose-50/40 border-rose-200"
                        : "bg-indigo-50/40 border-indigo-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                          certificate.status === "issued" || certificate.status === "valid"
                            ? "bg-emerald-100 text-emerald-700"
                            : certificate.status === "revoked"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {certificate.status === "issued" || certificate.status === "valid" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : certificate.status === "revoked" ? (
                          <XCircle className="w-6 h-6" />
                        ) : (
                          <AlertTriangle className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-lg text-slate-900 leading-snug">
                          {certificate.status === "issued" || certificate.status === "valid"
                            ? "Chứng nhận hợp lệ & chính thức"
                            : certificate.status === "revoked"
                              ? "Chứng nhận này đã bị thu hồi"
                              : "Chứng nhận đã được cấp lại với mã mới"}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>Mã số: {certificate.code}</span>
                        </p>
                      </div>
                    </div>

                    <CertificateBadge status={certificate.status} />
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-5 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Người thụ hưởng</span>
                      </p>
                      <p className="font-semibold text-slate-900">
                        {certificate.studentName}
                        {certificate.studentId ? ` (${certificate.studentId})` : ""}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sự kiện học thuật</span>
                      </p>
                      <p className="font-semibold text-slate-900">
                        {certificate.eventTitle}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đơn vị ban hành</span>
                      </p>
                      <p className="font-medium text-slate-700">
                        {certificate.organizer || "Trường ĐH Công nghệ Thông tin - ĐHQG-HCM"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium flex items-center gap-1.5 text-xs">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Thời điểm cấp chứng chỉ</span>
                      </p>
                      <p className="font-medium text-slate-700">
                        {certificate.issuedAt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/70 flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Dữ liệu cá nhân (Họ tên, MSSV) được che mờ theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
