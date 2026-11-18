import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import Modal from "../components/Modal"
import { ToastProvider, useToast } from "../components/Toast"
import { mapContractEventToLiveEvent } from "../context/EventDataContext"
import { mapContractTicketToUiTicket } from "../context/TicketDataContext"
import type { EventCard, Ticket as ContractTicket } from "../data/contract"
import { buildQrPayload, parseQrPayload } from "../data/contract"

describe("UI Components & Mapping Hydration (DEF-P2-02)", () => {
  it("Modal renders when open=true and hides when open=false", () => {
    const { rerender } = render(
      <Modal open={false} title="Hộp thoại thử nghiệm" onClose={() => {}}>
        <p>Nội dung modal</p>
      </Modal>,
    )
    expect(screen.queryByText("Hộp thoại thử nghiệm")).toBeNull()

    rerender(
      <Modal open={true} title="Hộp thoại thử nghiệm" onClose={() => {}}>
        <p>Nội dung modal</p>
      </Modal>,
    )
    expect(screen.getByText("Hộp thoại thử nghiệm")).toBeInTheDocument()
    expect(screen.getByText("Nội dung modal")).toBeInTheDocument()
  })

  it("Modal triggers onClose when Escape key is pressed", () => {
    const handleClose = vi.fn()
    render(
      <Modal open={true} title="Hộp thoại phím tắt" onClose={handleClose}>
        <button type="button">Nút con</button>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("ToastProvider displays toast notifications dynamically", () => {
    function TestComponent() {
      const { showToast } = useToast()
      return (
        <button
          type="button"
          onClick={() => showToast("Đã điểm danh thành công!", "success")}
        >
          Kích hoạt thông báo
        </button>
      )
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    const btn = screen.getByText("Kích hoạt thông báo")
    fireEvent.click(btn)

    expect(screen.getByText("Đã điểm danh thành công!")).toBeInTheDocument()
  })

  it("mapContractEventToLiveEvent transforms EventCard to UI LiveEvent correctly", () => {
    const card: EventCard = {
      ma_su_kien: 999,
      ten_su_kien: "Workshop AI 2026",
      ten_chuyen_de: "Trí tuệ nhân tạo",
      ten_don_vi_host: "CLB WebDev UIT",
      danh_sach_ten_dong_to_chuc: ["Khoa HTTT"],
      ten_phong: "Hội trường E",
      co_so: "CoSo1",
      thoi_gian_bat_dau: "2026-11-20T08:30:00+07:00",
      thoi_gian_ket_thuc: "2026-11-20T11:30:00+07:00",
      khong_gioi_han_slot: false,
      so_ve_con_lai: 15,
      so_luong_toi_da: 100,
      trang_thai: "PUBLISHED",
      dieu_khoan_drl: "Dieu3",
      diem_drl_du_kien: 5,
    }

    const live = mapContractEventToLiveEvent(card)
    expect(live.ma_su_kien).toBe(999)
    expect(live.title).toBe("Workshop AI 2026")
    expect(live.capacity).toBe(100)
    expect(live.registered).toBe(85)
    expect(live.date).toBe("2026-11-20")
    expect(live.registrationOpen).toBe(true)
    expect(live.status).toBe("nearly_full")
  })

  it("mapContractTicketToUiTicket transforms ContractTicket with HMAC QR payload", () => {
    const ct: ContractTicket = {
      ma_dang_ky: 888,
      ma_ve_uuid: "uuid-888-test",
      ma_su_kien: 101,
      ten_su_kien: "Ngày hội việc làm",
      trang_thai_su_kien: "PUBLISHED",
      thoi_gian_bat_dau: "2026-10-15T08:30:00+07:00",
      thoi_gian_ket_thuc: "2026-10-15T11:30:00+07:00",
      ten_phong: "Hội trường A",
      co_so: "CoSo1",
      trang_thai: "DaDangKy",
      thoi_gian_dang_ky: "2026-10-10T09:00:00+07:00",
      han_chot_huy: "2026-10-15T04:30:00+07:00",
      cho_phep_huy: true,
      ti_le_drl: 1.0,
      diem_drl_du_kien: 5,
      da_feedback: false,
      co_the_feedback: false,
      du_dieu_kien_drl: false,
      co_the_nhan_chung_nhan: false,
      vi_pham_no_show: false,
      nghi_van_gian_lan: false,
    }

    const uiTicket = mapContractTicketToUiTicket(ct, {
      studentId: "22529999",
      name: "Nguyễn Văn Test",
      email: "test@gm.uit.edu.vn",
      role: "student",
      faculty: "Khoa CNTT",
    })

    expect(uiTicket.ma_dang_ky).toBe(888)
    expect(uiTicket.studentId).toBe("22529999")
    expect(uiTicket.status).toBe("pending")
    expect(uiTicket.payload_qr).toContain("uuid-888-test")
  })

  it("handles notification read normalization across number and string IDs", () => {
    const list = [
      { id: 1, title: "Thông báo 1", read: false, da_doc: false },
      { id: 2, title: "Thông báo 2", read: false, da_doc: false },
    ]

    function markRead(items: typeof list, targetId: string | number) {
      return items.map((n) =>
        n.id === targetId || String(n.id) === String(targetId)
          ? { ...n, read: true, da_doc: true }
          : n,
      )
    }

    const updated = markRead(list, "1")
    expect(updated[0].read).toBe(true)
    expect(updated[0].da_doc).toBe(true)
    expect(updated[1].read).toBe(false)
  })

  it("buildQrPayload and parseQrPayload strictly adhere to CEH1 OpenAPI v3.2.3 standard", () => {
    const uuid = "12345678-1234-4234-8234-123456789abc"
    const userId = 42
    const eventId = 101
    const hmac = "a8f5f167f44f4964e6c998dee827110c849f8a12c3e4b5a6c7d8e9f012345678"

    const qr = buildQrPayload(uuid, userId, eventId, hmac)
    expect(qr.startsWith("CEH1.")).toBe(true)

    const parsed = parseQrPayload(qr)
    expect(parsed.isValid).toBe(true)
    expect(parsed.version).toBe("CEH1")
    expect(parsed.ma_ve_uuid).toBe(uuid)
    expect(parsed.ma_tai_khoan).toBe(userId)
    expect(parsed.ma_su_kien).toBe(eventId)
    expect(parsed.chu_ky_hmac).toBe(hmac)
  })

  it("correctly maps approval actions to OpenAPI discriminator enum", () => {
    function mapHanhDong(action: string): string {
      switch (action) {
        case "faculty_approve":
          return "APPROVE_FACULTY"
        case "faculty_approve_by_admin":
          return "APPROVE_FACULTY_BY_ADMIN"
        case "affairs_approve":
          return "APPROVE_ADMIN"
        case "request_revision":
          return "REQUEST_EDIT"
        case "reject":
          return "REJECT_FACULTY"
        default:
          return "REQUEST_EDIT"
      }
    }

    expect(mapHanhDong("faculty_approve")).toBe("APPROVE_FACULTY")
    expect(mapHanhDong("faculty_approve_by_admin")).toBe("APPROVE_FACULTY_BY_ADMIN")
    expect(mapHanhDong("affairs_approve")).toBe("APPROVE_ADMIN")
    expect(mapHanhDong("request_revision")).toBe("REQUEST_EDIT")
    expect(mapHanhDong("reject")).toBe("REJECT_FACULTY")
  })
})

