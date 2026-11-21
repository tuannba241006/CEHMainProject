import { describe, it, expect, beforeEach, vi } from "vitest"
import { certificatesService } from "../api/services/certificates.service"
import { api } from "../api/client"

describe("CertificatesService Unit Tests (frontend/src/api/services/certificates.service.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * @test
   * Target: UC-CRT-01 (Public Certificate Verification)
   * Course: Normal Flow
   * Expected: GET /certificates/verify/{hash}, returns public certificate detail
   */
  it("should verify public certificate by code/hash", async () => {
    const mockCert = {
      trang_thai: "HOP_LE" as const,
      da_thu_hoi: false,
      ho_ten_che_mo: "Nguyễn V** A",
      ten_su_kien: "Hội thảo UIT AI",
      don_vi_to_chuc: "CLB WebDev",
      ngay_cap: "2026-11-20T10:00:00Z",
    }

    const spy = vi.spyOn(api, "get").mockResolvedValue({
      success: true,
      data: mockCert,
    })

    const res = await certificatesService.verify("CEH-2026-AI-101")

    expect(spy).toHaveBeenCalledWith("/certificates/verify/CEH-2026-AI-101")
    expect(res.success).toBe(true)
    expect(res.data.da_thu_hoi).toBe(false)
  })

  /**
   * @test
   * Target: UC-CRT-02 (Issue Certificate for Ticket)
   * Course: Normal Flow
   * Expected: POST /tickets/{id}/certificate, returns issued certificate
   */
  it("should issue certificate for an eligible ticket", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: {
        id: 10,
        ma_dang_ky: 501,
        ma_su_kien: 101,
        ten_su_kien: "Hội thảo UIT AI",
        don_vi_to_chuc: "CLB WebDev",
        ngay_cap: "2026-11-20T10:00:00Z",
        ma_hash: "CEH-2026-NEW",
        ty_le_tham_du_pct: 100,
        diem_drl_thuc_nhan: 5,
        file_pdf_url: "https://cert.uit.edu.vn/10.pdf",
        da_thu_hoi: false,
      },
    })

    const res = await certificatesService.issue(501)

    expect(spy).toHaveBeenCalledWith("/tickets/501/certificate")
    expect(res.success).toBe(true)
    expect(res.data.ma_hash).toBe("CEH-2026-NEW")
  })

  /**
   * @test
   * Target: UC-CRT-03 (Revoke Certificate with Reason)
   * Course: Normal Flow
   * Expected: POST /admin/certificates/{id}/revoke, returns updated certificate
   */
  it("should revoke certificate with mandatory reason", async () => {
    const spy = vi.spyOn(api, "post").mockResolvedValue({
      success: true,
      data: {
        id: 99,
        ma_dang_ky: 501,
        ma_su_kien: 101,
        ten_su_kien: "Hội thảo UIT AI",
        don_vi_to_chuc: "CLB WebDev",
        ngay_cap: "2026-11-20T10:00:00Z",
        ma_hash: "CEH-REVOKED",
        ty_le_tham_du_pct: 100,
        diem_drl_thuc_nhan: 0,
        file_pdf_url: "https://cert.uit.edu.vn/99.pdf",
        da_thu_hoi: true,
      },
    })

    const res = await certificatesService.revoke(99, "Sinh viên gian lận điểm danh đối soát")

    expect(spy).toHaveBeenCalledWith("/admin/certificates/99/revoke", {
      ly_do: "Sinh viên gian lận điểm danh đối soát",
      ly_do_thu_hoi: "Sinh viên gian lận điểm danh đối soát",
    })
    expect(res.success).toBe(true)
    expect(res.data.da_thu_hoi).toBe(true)
  })
})
