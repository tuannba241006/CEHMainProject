import { useState, useEffect } from "react"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import {
  CertificateBadge,
  CertificatePreview,
} from "../management/AffairsOperations"
import type { Certificate } from "../../context/AppContext"
import { certificatesService } from "../../api/services/certificates.service"
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  Printer,
  Eye,
  Info,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react"

interface Props {
  onBack: () => void
  onVerify: () => void
}

export default function Achievements({ onBack, onVerify }: Props) {
  const { user } = useUser()
  const { attendanceRecords, certificates } = useApp()
  const [preview, setPreview] = useState<Certificate | null>(null)
  const [remoteCertificates, setRemoteCertificates] = useState<Certificate[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    async function loadAchievements() {
      setLoading(true)
      try {
        const certRes = await certificatesService.mine().catch(() => null)
        if (certRes?.data && Array.isArray(certRes.data) && active) {
          setRemoteCertificates(certRes.data as unknown as Certificate[])
        }
      } catch {
        // keep local context fallback
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadAchievements()
    return () => {
      active = false
    }
  }, [])

  const myResults = attendanceRecords.filter(
    (row) => row.studentId === user.studentId,
  )
  const activeCertList = remoteCertificates || certificates
  const myCertificates = activeCertList.filter(
    (item) => item.studentId === user.studentId,
  )
  const officialContribution = myResults.reduce(
    (sum, row) => sum + (row.officialPoints || 0),
    0,
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Web Breadcrumb */}
      <nav className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            onClick={onBack}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Trang chủ
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold">
            Bảng điểm Rèn luyện & Chứng nhận
          </span>
        </div>

        <button
          onClick={onVerify}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Tra cứu chứng chỉ số công khai</span>
        </button>
      </nav>

      {/* Official Academic Transcript Header */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-slate-800 mb-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-indigo-300 border border-slate-700/80">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Hồ sơ tích lũy học vụ</span>
              <span>·</span>
              <span className="font-mono text-white">
                {user.name} ({user.studentId})
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Sổ theo dõi Điểm rèn luyện & Chứng chỉ số
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bảng đối soát thời lượng tham gia thực tế, tỷ lệ hiện diện sự kiện (&Delta;t), 
              điểm rèn luyện được Phòng CTSV công nhận và kho chứng nhận số ký mã hash định danh.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-4 text-center min-w-[140px]">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Điểm ĐRL Tích Lũy
              </p>
              <div className="font-display font-bold text-3xl sm:text-4xl text-emerald-400 mt-1">
                +{officialContribution}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Đã được CTSV phê duyệt
              </p>
            </div>

            <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-4 text-center min-w-[140px]">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Chứng nhận số
              </p>
              <div className="font-display font-bold text-3xl sm:text-4xl text-indigo-300 mt-1">
                {myCertificates.length}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Bản ghi chính thức
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Quy định: Điểm hoạt động này được đối soát tự động từ hệ thống check-in/out hai chiều và chuyển định kỳ vào bảng điểm rèn luyện chính thức của nhà trường.
          </span>
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Column 1: Attendance Verification Records */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>Đối soát tham gia sự kiện</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu thời lượng tham gia thực tế và điểm rèn luyện từ cổng soát vé
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {myResults.length} bản ghi
            </span>
          </div>

          {myResults.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Chưa có bản ghi đối soát
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy tham gia các sự kiện đã đăng ký và thực hiện đủ cả Check-in lẫn Check-out để hệ thống ghi nhận thời lượng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myResults.map((row) => (
                <div
                  key={row.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                        Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Thời lượng: <strong className="text-slate-800">{row.validMinutes} phút</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Tỷ lệ (&Delta;t): <strong className="text-slate-800">{row.participationRatio}%</strong>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        row.status === "recognized"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {row.status === "recognized"
                        ? `+${row.officialPoints} điểm chính thức`
                        : "Đang thẩm định"}
                    </span>
                  </div>

                  {row.approvedBy && (
                    <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã duyệt bởi: <strong className="text-slate-700">{row.approvedBy}</strong></span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Quy tắc {row.ruleVersion} · {row.approvedAt}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Column 2: Digital Certificates Library */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Kho chứng nhận số</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chứng chỉ kỹ năng và giấy chứng nhận điện tử có mã định danh số
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {myCertificates.length} chứng nhận
            </span>
          </div>

          {myCertificates.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-100">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Chưa có chứng nhận số
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Chứng nhận số chính thức sẽ được Phòng CTSV ban hành sau khi sự kiện kết thúc và duyệt kết quả đối soát.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                        {cert.ten_su_kien || cert.eventTitle}
                      </h3>
                      <p className="text-[11px] font-mono text-indigo-700 font-medium break-all">
                        Mã hash: {cert.ma_hash || cert.code}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Đơn vị cấp:{" "}
                        <span className="font-medium text-slate-800">
                          {cert.don_vi_to_chuc ||
                            cert.issuer ||
                            "Trường ĐH Công nghệ Thông tin"}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ngày cấp: {cert.ngay_cap || cert.issuedAt || "Đang xử lý"}
                      </p>
                    </div>
                    <CertificateBadge status={cert.status} />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => setPreview(cert)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem chứng nhận</span>
                    </button>
                    {cert.status === "issued" && (
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>In / Lưu PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {preview && (
        <CertificatePreview
          certificate={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  )
}
