import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { api } from "../api/client"
import { StepUpConfirmDialog } from "../components/security/StepUpConfirmDialog"

const respond = (status: number, body: Record<string, unknown>) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => body,
})

describe("Step-up HTTP 428 handling", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("does not clear the login token on an incorrect step-up password", async () => {
    const { tokenStore } = await import("../api/config")
    tokenStore.set("example-token-kept-for-session")
    global.fetch = vi.fn().mockResolvedValue(respond(401, {
      error: "INVALID_CREDENTIALS",
    }))
    await expect(api.post("/auth/confirm-sensitive-action", { mat_khau: "wrong" }))
      .rejects.toMatchObject({ status: 401 })
    expect(tokenStore.get()).toBe("example-token-kept-for-session")
    tokenStore.clear()
  })

  it("does not hang when no prompt listener is mounted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(428, {
      error: "REAUTHENTICATION_REQUIRED",
    }))
    global.fetch = fetchMock
    await expect(api.post("/attendance/manual-override", {}))
      .rejects.toMatchObject({ status: 428 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries exactly once after successful password reconfirmation", async () => {
    let sensitiveCount = 0
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/confirm-sensitive-action")) {
        return Promise.resolve(respond(200, { success: true }))
      }
      sensitiveCount += 1
      return Promise.resolve(sensitiveCount === 1
        ? respond(428, { error: "REAUTHENTICATION_REQUIRED" })
        : respond(200, { success: true, data: { changed: true } }))
    })
    global.fetch = fetchMock
    const { unmount } = render(<StepUpConfirmDialog />)
    const pending = api.post<{ success: boolean }>("/attendance/manual-override", {})
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "SecretTest#2026" },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))
      await expect(pending).resolves.toMatchObject({ success: true })
    })
    expect(sensitiveCount).toBe(2)
    unmount()
  })

  it("cancellation rejects the protected request without retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(428, {
      error: "REAUTHENTICATION_REQUIRED",
    }))
    global.fetch = fetchMock
    const { unmount } = render(<StepUpConfirmDialog />)
    const pending = api.post("/attendance/manual-override", {})
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hủy" }))
      await expect(pending).rejects.toMatchObject({ status: 428 })
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("does not replay concurrent mutations after one password confirmation", async () => {
    let sensitiveCount = 0
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/confirm-sensitive-action")) {
        return Promise.resolve(respond(200, { success: true }))
      }
      sensitiveCount += 1
      return Promise.resolve(sensitiveCount <= 2
        ? respond(428, { error: "REAUTHENTICATION_REQUIRED" })
        : respond(200, { success: true }))
    })
    global.fetch = fetchMock
    const { unmount } = render(<StepUpConfirmDialog />)
    const first = api.post("/attendance/manual-override", {})
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    const secondResult = api.post("/attendance/manual-override", {})
      .then(() => ({ status: 200 }), (error: { status: number }) => ({ status: error.status }))
    await waitFor(() => expect(sensitiveCount).toBe(2))
    fireEvent.change(screen.getByLabelText("Mật khẩu"), {
      target: { value: "SecretTest#2026" },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))
      await expect(first).resolves.toMatchObject({ success: true })
      expect(await secondResult).toEqual({ status: 428 })
    })
    expect(sensitiveCount).toBe(3)
    unmount()
  })
})
