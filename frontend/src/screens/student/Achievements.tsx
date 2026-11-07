import { useState, useEffect } from "react"
import { useApp } from "../../context/AppContext"
import { useUser } from "../../context/UserContext"
import {
  CertificateBadge,
  CertificatePreview,
} from "../management/AffairsOperations"
import type { Certificate } from "../../context/AppContext"
import { certificatesService } from "../../api/services/certificates.service"
import { drlService } from "../../api/services/drl.service"

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
      <nav className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
          <button
            onClick={onBack}
            className="hover:text-indigo-600 transition-colors cursor-pointer"
          >
            Trang chủ
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold">
            Điểm & Chứng nhận
          </span>
        </div>

        <button
          onClick={onVerify}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12.75 11.25 15 15 9.75m-6 6.75-3 3v-4.5m12 4.5 3 3v-4.5M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
            />
          </svg>
          <span>Tra cứu chứng chỉ số công khai</span>
        </button>
      </nav>

      {/* Summary Score Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-300 border border-white/10">
              <span>Hồ sơ tích lũy cá nhân</span>
              <span>·</span>
              <span>
                {user.name} ({user.studentId})
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl">
              Điểm rèn luyện & Chứng nhận số
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tổng hợp điểm hoạt động đã được Phòng Công tác Sinh viên (CTSV)
              thẩm định và các chứng nhận kỹ năng số đã phát hành chính thức.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-5 text-center min-w-[200px] flex-shrink-0">
            <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">
              Điểm hoạt động tích lũy
            </p>
            <div className="font-display font-bold text-4xl sm:text-5xl text-white mt-1">
              {officialContribution}
              <span className="text-lg font-medium text-indigo-200 ml-1.5">
                điểm
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Công nhận từ {myResults.length} sự kiện
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
          <span className="text-indigo-400">ℹ️</span>
          <span>
            Lưu ý: Điểm này là điểm đóng góp từ các sự kiện trong hệ thống, được
            chuyển vào bảng điểm rèn luyện định kỳ của nhà trường.
          </span>
        </div>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Column 1: Attendance Verification Records */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Đối soát tham gia sự kiện
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu đối soát thời lượng và điểm từ các sự kiện
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {myResults.length} bản ghi
            </span>
          </div>

          {myResults.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Chưa có kết quả ghi nhận
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy tham gia sự kiện và check-in/out đầy đủ để tích lũy điểm.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myResults.map((row) => (
                <div
                  key={row.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">
                        Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Thời lượng:{" "}
                        <span className="font-bold text-slate-800">
                          {row.validMinutes} phút
                        </span>{" "}
                        · Tỷ lệ:{" "}
                        <span className="font-bold text-slate-800">
                          {row.participationRatio}%
                        </span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        row.status === "recognized"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}
                    >
                      {row.status === "recognized"
                        ? `+${row.officialPoints} điểm chính thức`
                        : "Đang thẩm định"}
                    </span>
                  </div>

                  {row.approvedBy && (
                    <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                      <span>
                        ✓ Đã duyệt bởi:{" "}
                        <strong className="text-slate-700">
                          {row.approvedBy}
                        </strong>
                      </span>
                      <span className="text-slate-400">
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
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Kho chứng nhận số
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chứng chỉ kỹ năng và tham gia có mã định danh
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {myCertificates.length} chứng nhận
            </span>
          </div>

          {myCertificates.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Chưa có chứng nhận số
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Chứng nhận số sẽ được cấp sau khi sự kiện kết thúc và duyệt kết
                quả.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-slate-900">
                        {cert.ten_su_kien || cert.eventTitle}
                      </h3>
                      <p className="text-xs font-mono text-indigo-600 font-medium mt-1 break-all">
                        Mã hash: {cert.ma_hash || cert.code}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                        Đơn vị cấp:{" "}
                        {cert.don_vi_to_chuc ||
                          cert.issuer ||
                          "Trường ĐH Công nghệ Thông tin"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Cấp ngày:{" "}
                        {cert.ngay_cap || cert.issuedAt || "Đang xử lý"}
                      </p>
                    </div>
                    <CertificateBadge status={cert.status} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPreview(cert)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Xem chứng nhận
                    </button>
                    {cert.status === "issued" && (
                      <button
                        onClick={() => window.print()}
                        className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        In / Lưu PDF
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
