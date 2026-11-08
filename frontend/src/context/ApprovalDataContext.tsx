import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { eventsService } from "../api/services/events.service"
import { certificatesService } from "../api/services/certificates.service"
import { getApiErrorMessage } from "../api/errors"

export type ApprovalStatus =
  | "draft"
  | "faculty_pending"
  | "faculty_revision"
  | "faculty_rejected"
  | "faculty_approved"
  | "affairs_pending"
  | "affairs_revision"
  | "affairs_rejected"
  | "approved"

export interface ApprovalHistory {
  id: string
  actor: string
  action: string
  at: string
  note?: string
}

export interface ApprovalCase {
  id: string
  eventId: string
  title: string
  unit: string
  faculty: string
  submitter: string
  submittedAt: string
  eventDate: string
  status: ApprovalStatus
  lifecycle: "draft" | "scheduled" | "registration_open" | "ended"
  description: string
  plan: string
  documents: string[]
  proposedPoints: number
  semester: string
  criteriaCode: string
  maxPoints: number
  validMinutes: number
  thresholds: Array<{ ratio: number; points: number }>
  requiredSessions: string[]
  certificateCondition: string
  ruleBasis: string
  ruleVersion: string
  facultyDecision?: string
  history: ApprovalHistory[]
}

export interface SurveyResponse {
  id: string
  eventId: string
  studentId: string
  overall: number
  content: number
  organization: number
  venue: number
  useful: string
  improvement: string
  joinAgain: boolean
  submittedAt: string
}

export type CertificateStatus = "ineligible" | "pending" | "issued" | "revoked" | "replaced"

export interface Certificate {
  id: string
  code: string
  eventId: string
  eventTitle: string
  recipientName: string
  studentId: string
  issuer: string
  participantRole: string
  eventTime: string
  issuedAt?: string
  status: CertificateStatus
  replacedBy?: string
  replaces?: string
  revokeReason?: string

  ma_hash?: string
  da_thu_hoi?: boolean
  ten_su_kien?: string
  don_vi_to_chuc?: string
  ngay_cap?: string
  ho_ten_che_mo?: string
  mssv_che_mo?: string
  vai_tro?: string
  nguoi_ky?: string
}

export const SEED_APPROVALS: ApprovalCase[] = [
  {
    id: "HS-2026-014",
    eventId: "EVT001",
    title: "Ngày hội nghề nghiệp AI & Kỹ thuật dữ liệu",
    unit: "Khoa Công nghệ Thông tin",
    faculty: "Công nghệ Thông tin",
    submitter: "Nguyễn Minh Anh",
    submittedAt: "24/09/2026 09:30",
    eventDate: "15/10/2026",
    status: "faculty_pending",
    lifecycle: "scheduled",
    description: "Kết nối sinh viên với chuyên gia và doanh nghiệp trong lĩnh vực AI, dữ liệu.",
    plan: "Tổ chức tại Hội trường A, gồm khai mạc, tham luận, tọa đàm và kết nối doanh nghiệp.",
    documents: ["Kế hoạch tổ chức.pdf", "Dự toán kinh phí.xlsx", "Phương án an toàn.pdf"],
    proposedPoints: 5,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-04-HĐ",
    maxPoints: 5,
    validMinutes: 150,
    thresholds: [
      { ratio: 70, points: 3 },
      { ratio: 90, points: 5 },
    ],
    requiredSessions: ["Khai mạc", "Tọa đàm AI trong thực tế"],
    certificateCondition: "Tham gia tối thiểu 90% thời lượng hợp lệ và có đủ check-in/check-out.",
    ruleBasis: "Khung tiêu chí hoạt động sinh viên nội bộ — dữ liệu minh họa",
    ruleVersion: "DK-2026.1",
    history: [
      {
        id: "h1",
        actor: "Nguyễn Minh Anh · Ban tổ chức",
        action: "Gửi hồ sơ đến khoa",
        at: "24/09/2026 09:30",
      },
    ],
  },
  {
    id: "HS-2026-011",
    eventId: "EVT002",
    title: "Hội thảo Điện toán đám mây & DevOps",
    unit: "CLB Điện toán đám mây",
    faculty: "Công nghệ Thông tin",
    submitter: "Trần Quốc Bảo",
    submittedAt: "22/09/2026 15:10",
    eventDate: "22/10/2026",
    status: "faculty_revision",
    lifecycle: "draft",
    description: "Hội thảo chuyên sâu về cloud, CI/CD và DevOps.",
    plan: "Chương trình 3 giờ tại B4.101.",
    documents: ["Kế hoạch tổ chức.pdf"],
    proposedPoints: 3,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-04-HĐ",
    maxPoints: 3,
    validMinutes: 150,
    thresholds: [
      { ratio: 80, points: 2 },
      { ratio: 95, points: 3 },
    ],
    requiredSessions: [],
    certificateCondition: "Tham gia ít nhất 95% thời lượng hợp lệ.",
    ruleBasis: "Khung minh họa cho prototype",
    ruleVersion: "DK-2026.1",
    history: [
      {
        id: "h2",
        actor: "Trần Quốc Bảo · Ban tổ chức",
        action: "Gửi hồ sơ đến khoa",
        at: "22/09/2026 15:10",
      },
    ],
  },
  {
    id: "HS-2026-009",
    eventId: "EVT004",
    title: "Ngày hội Đổi mới sáng tạo & Khởi nghiệp",
    unit: "Innovation Hub",
    faculty: "Công nghệ Thông tin",
    submitter: "Phạm Hoàng Nam",
    submittedAt: "20/09/2026 08:45",
    eventDate: "05/11/2026",
    status: "affairs_pending",
    lifecycle: "scheduled",
    description: "Ngày hội triển lãm, kết nối và thi thuyết trình ý tưởng khởi nghiệp.",
    plan: "Chương trình toàn ngày, có thời gian nghỉ 12:00–13:30 không tính thời lượng.",
    documents: ["Kế hoạch đã ký.pdf", "Quyết định khoa.pdf"],
    proposedPoints: 8,
    semester: "HK1 2026–2027",
    criteriaCode: "TC-05-ST",
    maxPoints: 8,
    validMinutes: 390,
    thresholds: [
      { ratio: 60, points: 3 },
      { ratio: 80, points: 5 },
      { ratio: 95, points: 8 },
    ],
    requiredSessions: ["Khai mạc"],
    certificateCondition: "Đủ 80% thời lượng hợp lệ; điều kiện này tách biệt điều kiện công nhận điểm.",
    ruleBasis: "Đề xuất của đơn vị và quyết định khoa — dữ liệu minh họa",
    ruleVersion: "DK-2026.2",
    history: [],
  },
]

export const SEED_SURVEYS: SurveyResponse[] = [
  {
    id: "SR-001",
    eventId: "EVT001",
    studentId: "anon-01",
    overall: 5,
    content: 5,
    organization: 4,
    venue: 4,
    useful: "Phần tọa đàm thực tế.",
    improvement: "Tăng thời gian hỏi đáp.",
    joinAgain: true,
    submittedAt: "15/10/2026 14:10",
  },
]

export const SEED_CERTIFICATES: Certificate[] = [
  {
    id: "CERT-001",
    code: "CEH-2026-AI-7K9P2",
    eventId: "EVT_PAST",
    eventTitle: "Cuộc thi Lập trình ACM ICPC Qualifier",
    recipientName: "Cao Duy Anh",
    studentId: "22521001",
    issuer: "Trường Đại học Công nghệ Thông tin",
    participantRole: "Thí sinh",
    eventTime: "15/09/2026",
    issuedAt: "18/09/2026",
    status: "issued",
  },
]

export interface ApprovalDataContextType {
  approvalCases: ApprovalCase[]
  surveyResponses: SurveyResponse[]
  certificates: Certificate[]
  saveApprovalDraft: (
    input: Partial<ApprovalCase> & Pick<ApprovalCase, "title">,
    submit: boolean,
  ) => ApprovalCase
  updateApproval: (
    caseId: string,
    action:
      | "faculty_approve"
      | "faculty_approve_by_admin"
      | "affairs_approve"
      | "request_revision"
      | "reject"
      | "resubmit"
      | "withdraw"
      | "reopen",
    reason?: string,
  ) => { success: boolean; error?: string }
  submitSurvey: (
    input: Omit<SurveyResponse, "id" | "submittedAt">,
  ) => { success: boolean; error?: string }
  issueCertificate: (certificateId: string) => { success: boolean; error?: string }
  revokeCertificate: (
    certificateId: string,
    reason: string,
  ) => { success: boolean; error?: string }
  replaceCertificate: (
    certificateId: string,
  ) => { success: boolean; certificate?: Certificate; error?: string }
  verifyCertificate: (code: string) => Certificate | undefined
  refreshReviewQueue: () => Promise<void>
}

const ApprovalDataContext = createContext<ApprovalDataContextType | null>(null)

export function ApprovalDataProvider({ children }: { children: ReactNode }) {
  const [approvalCases, setApprovalCases] = useState<ApprovalCase[]>(SEED_APPROVALS)
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>(SEED_SURVEYS)
  const [certificates, setCertificates] = useState<Certificate[]>(SEED_CERTIFICATES)

  async function refreshReviewQueue() {
    try {
      const res = await eventsService.reviewQueue()
      if (res.data && Array.isArray(res.data)) {
        const apiCases: ApprovalCase[] = res.data.map((card) => {
          const isPendingFaculty = card.trang_thai === "PENDING_FACULTY"
          const existing = SEED_APPROVALS.find(
            (s) =>
              s.eventId === String(card.ma_su_kien) ||
              s.id === `HS-${card.ma_su_kien}`,
          )
          return {
            id: `HS-${card.ma_su_kien}`,
            eventId: String(card.ma_su_kien),
            title: card.ten_su_kien,
            unit: card.ten_don_vi_host || existing?.unit || "Khoa Hệ thống Thông tin",
            faculty: (card.ten_don_vi_host || "").includes("Khoa")
              ? card.ten_don_vi_host
              : existing?.faculty || "Khoa Công nghệ Thông tin",
            submitter: card.dien_gia || existing?.submitter || "Ban tổ chức",
            submittedAt: (card.thoi_gian_bat_dau || "").slice(0, 10),
            eventDate: (card.thoi_gian_bat_dau || "").slice(0, 10),
            status: isPendingFaculty ? "faculty_pending" : "affairs_pending",
            lifecycle: "scheduled",
            description: card.ten_su_kien,
            plan: existing?.plan || "Kế hoạch tổ chức chi tiết được đính kèm.",
            documents: existing?.documents || ["Ke_hoach_to_chuc.pdf"],
            proposedPoints: card.diem_drl_du_kien ?? 5,
            semester: "HK1 2026–2027",
            criteriaCode:
              card.dieu_khoan_drl === "Dieu4" ? "TC-04-HĐ" : "TC-03-HT",
            maxPoints: card.diem_drl_du_kien ?? 5,
            validMinutes: 120,
            thresholds: [{ ratio: 80, points: card.diem_drl_du_kien ?? 5 }],
            requiredSessions: ["Khai mạc"],
            certificateCondition: "Tham dự tối thiểu 80% thời lượng",
            ruleBasis: "Quy chế CTSV",
            ruleVersion: "DK-2026.2",
            history: existing?.history || [],
          }
        })

        setApprovalCases(apiCases)
      }
    } catch {
      // Keep static
    }
  }

  useEffect(() => {
    void refreshReviewQueue()
  }, [])

  function saveApprovalDraft(
    input: Partial<ApprovalCase> & Pick<ApprovalCase, "title">,
    submit: boolean,
  ): ApprovalCase {
    const id = `HS-2026-${String(approvalCases.length + 15).padStart(3, "0")}`
    const created: ApprovalCase = {
      id,
      eventId: input.eventId || `EVT-${Date.now()}`,
      title: input.title,
      unit: input.unit || "CLB WebDev UIT",
      faculty: input.faculty || "Khoa Hệ thống Thông tin",
      submitter: input.submitter || "Ban tổ chức",
      submittedAt: new Date().toLocaleDateString("vi-VN"),
      eventDate: input.eventDate || "2026-11-20",
      status: submit ? "faculty_pending" : "draft",
      lifecycle: "draft",
      description: input.description || "",
      plan: input.plan || "",
      documents: input.documents || ["Ke_hoach_to_chuc.pdf"],
      proposedPoints: input.proposedPoints || 5,
      semester: input.semester || "HK1 2026–2027",
      criteriaCode: input.criteriaCode || "TC-04-HĐ",
      maxPoints: input.maxPoints || 5,
      validMinutes: input.validMinutes || 150,
      thresholds: input.thresholds || [{ ratio: 80, points: 5 }],
      requiredSessions: input.requiredSessions || [],
      certificateCondition: input.certificateCondition || "",
      ruleBasis: input.ruleBasis || "",
      ruleVersion: "DK-2026.1",
      history: [
        {
          id: `h-${Date.now()}`,
          actor: input.submitter || "Ban tổ chức",
          action: submit ? "Nộp hồ sơ phê duyệt" : "Lưu bản nháp",
          at: new Date().toLocaleString("vi-VN"),
        },
      ],
    }

    setApprovalCases((prev) => [created, ...prev])
    return created
  }

  function updateApproval(
    caseId: string,
    action:
      | "faculty_approve"
      | "faculty_approve_by_admin"
      | "affairs_approve"
      | "request_revision"
      | "reject"
      | "resubmit"
      | "withdraw"
      | "reopen",
    reason?: string,
  ): { success: boolean; error?: string } {
    let nextStatus: ApprovalStatus = "draft"
    switch (action) {
      case "faculty_approve":
      case "faculty_approve_by_admin":
        nextStatus = "affairs_pending"
        break
      case "affairs_approve":
        nextStatus = "approved"
        break
      case "request_revision":
        nextStatus = "faculty_revision"
        break
      case "reject":
        nextStatus = "faculty_rejected"
        break
      case "resubmit":
        nextStatus = "faculty_pending"
        break
      case "withdraw":
      case "reopen":
        nextStatus = "draft"
        break
    }

    setApprovalCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: nextStatus,
              history: [
                ...c.history,
                {
                  id: `h-${Date.now()}`,
                  actor: "Người dùng hệ thống",
                  action,
                  at: new Date().toLocaleString("vi-VN"),
                  note: reason,
                },
              ],
            }
          : c,
      ),
    )

    const targetCase = approvalCases.find((c) => c.id === caseId)
    if (targetCase) {
      const eventNum = Number(targetCase.eventId.replace(/\D/g, "")) || 101
      let mappedHanhDong: "APPROVE_FACULTY" | "APPROVE_ADMIN" | "APPROVE_FACULTY_BY_ADMIN" | "REJECT_FACULTY" | "REJECT_ADMIN" | "REQUEST_EDIT" = "REQUEST_EDIT"
      if (action === "faculty_approve") mappedHanhDong = "APPROVE_FACULTY"
      else if (action === "faculty_approve_by_admin") mappedHanhDong = "APPROVE_FACULTY_BY_ADMIN"
      else if (action === "affairs_approve") mappedHanhDong = "APPROVE_ADMIN"
      else if (action === "request_revision") mappedHanhDong = "REQUEST_EDIT"
      else if (action === "reject") mappedHanhDong = "REJECT_FACULTY"

      if (action === "withdraw") {
        eventsService.withdraw(eventNum, reason || "Rút đề xuất sự kiện").catch(() => {})
      } else if (action === "reopen") {
        eventsService.reopen(eventNum, reason || "Tái mở sửa lại").catch(() => {})
      } else if (action === "resubmit") {
        eventsService.submitApproval(eventNum).catch(() => {})
      } else {
        eventsService
          .review(eventNum, {
            hanh_dong: mappedHanhDong,
            ly_do: reason,
            ghi_chu: reason,
          })
          .catch(() => {})
      }
    }

    return { success: true }
  }

  function submitSurvey(input: Omit<SurveyResponse, "id" | "submittedAt">) {
    const response: SurveyResponse = {
      ...input,
      id: `SR-${Date.now()}`,
      submittedAt: new Date().toLocaleString("vi-VN"),
    }
    setSurveyResponses((prev) => [response, ...prev])
    return { success: true }
  }

  function issueCertificate(certificateId: string) {
    const cert = certificates.find((c) => c.id === certificateId)
    const ticketId = cert ? Number(cert.id.replace(/\D/g, "")) || 1 : 1
    certificatesService.issue(ticketId).catch(() => {})
    setCertificates((prev) =>
      prev.map((c) => (c.id === certificateId ? { ...c, status: "issued" } : c)),
    )
    return { success: true }
  }

  function revokeCertificate(certificateId: string, reason: string) {
    const cert = certificates.find((c) => c.id === certificateId)
    const numId = cert ? Number(cert.id.replace(/\D/g, "")) || 1 : 1
    certificatesService.revoke(numId, reason).catch(() => {})
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === certificateId
          ? { ...c, status: "revoked", revokeReason: reason, da_thu_hoi: true }
          : c,
      ),
    )
    return { success: true }
  }

  function replaceCertificate(certificateId: string) {
    const old = certificates.find((c) => c.id === certificateId)
    if (!old) return { success: false, error: "Không tìm thấy chứng nhận." }
    const newCode = `CEH-2026-REPLACE-${Date.now().toString().slice(-4)}`
    const replaced: Certificate = {
      ...old,
      id: `CERT-${Date.now()}`,
      code: newCode,
      status: "issued",
      replaces: old.code,
    }
    setCertificates((prev) => [
      replaced,
      ...prev.map((c) =>
        c.id === certificateId
          ? { ...c, status: "replaced" as CertificateStatus, replacedBy: newCode }
          : c,
      ),
    ])
    return { success: true, certificate: replaced }
  }

  function verifyCertificate(code: string) {
    return certificates.find(
      (c) => c.code === code || c.ma_hash === code || c.id === code,
    )
  }

  return (
    <ApprovalDataContext.Provider
      value={{
        approvalCases,
        surveyResponses,
        certificates,
        saveApprovalDraft,
        updateApproval,
        submitSurvey,
        issueCertificate,
        revokeCertificate,
        replaceCertificate,
        verifyCertificate,
        refreshReviewQueue,
      }}
    >
      {children}
    </ApprovalDataContext.Provider>
  )
}

export function useApprovalData(): ApprovalDataContextType {
  const ctx = useContext(ApprovalDataContext)
  if (!ctx) {
    throw new Error("useApprovalData must be used within an ApprovalDataProvider")
  }
  return ctx
}
