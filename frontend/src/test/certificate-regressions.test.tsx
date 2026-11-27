import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  revoke: vi.fn(),
  contextRevoke: vi.fn(),
  toast: vi.fn(),
}))

vi.mock("../api/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/config")>()
  return { ...actual, isApiMode: () => true }
})
vi.mock("../api/services/certificates.service", () => ({
  certificatesService: { adminList: mocks.list, revoke: mocks.revoke },
}))
vi.mock("../context/AppContext", () => ({
  useApp: () => ({
    certificates: [{
      id: "CERT-DEMO", code: "DEMO-DO-NOT-SHOW", recipientName: "DEMO-DO-NOT-SHOW",
      status: "issued",
    }],
    issueCertificate: vi.fn(),
    revokeCertificate: mocks.contextRevoke,
    replaceCertificate: vi.fn(),
  }),
}))
vi.mock("../context/UserContext", () => ({ useUser: () => ({ user: null }) }))
vi.mock("../components/Toast", () => ({ useToast: () => ({ showToast: mocks.toast }) }))

import { Certificates } from "../screens/management/AffairsOperations"

const realCertificate = {
  id: 7,
  ma_su_kien: 123,
  ma_tai_khoan: 222,
  ten_su_kien: "Sự kiện QA",
  ma_hash: "abcdef0123456789abcdef",
  ngay_cap: "2026-11-27T15:00:00+07:00",
  da_thu_hoi: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({ success: true, data: [] })
  mocks.revoke.mockResolvedValue({ success: true, data: {} })
})
afterEach(() => cleanup())

describe("Certificates with real API", () => {
  it("never substitutes demonstration certificates when API returns []", async () => {
    render(<Certificates />)
    await screen.findByText("Chưa có chứng nhận nào.")
    expect(screen.queryByText("DEMO-DO-NOT-SHOW")).toBeNull()
    expect(mocks.list).toHaveBeenCalled()
  })

  it("disables revoke if reason contains fewer than five characters", async () => {
    mocks.list.mockResolvedValue({ success: true, data: [realCertificate] })
    render(<Certificates />)
    await screen.findByText("Sinh viên #222")
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi" }))
    const submit = screen.getByRole("button", { name: "Xác nhận thu hồi" }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
    fireEvent.change(screen.getByPlaceholderText(/Nhập lý do thu hồi/), { target: { value: "1234" } })
    expect(submit.disabled).toBe(true)
    expect(mocks.revoke).not.toHaveBeenCalled()
  })

  it("sends exactly one revoke mutation even on rapid double-click", async () => {
    mocks.list.mockResolvedValue({ success: true, data: [realCertificate] })
    let resolveRequest: (value: unknown) => void = () => {}
    mocks.revoke.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve }))
    render(<Certificates />)
    await screen.findByText("Sinh viên #222")
    fireEvent.click(screen.getByRole("button", { name: "Thu hồi" }))
    fireEvent.change(screen.getByPlaceholderText(/Nhập lý do thu hồi/), {
      target: { value: "Đã xác minh vi phạm quy chế." },
    })
    const submit = screen.getByRole("button", { name: "Xác nhận thu hồi" })
    fireEvent.click(submit)
    fireEvent.click(submit)
    expect(mocks.revoke).toHaveBeenCalledTimes(1)
    expect(mocks.revoke).toHaveBeenCalledWith(7, "Đã xác minh vi phạm quy chế.")
    expect(mocks.contextRevoke).not.toHaveBeenCalled()
    await act(async () => resolveRequest({ success: true, data: {} }))
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled())
  })
})
