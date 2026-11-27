import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { api } from "../api/client"
import { StepUpConfirmDialog } from "../components/security/StepUpConfirmDialog"

const blocked = () => ({
  ok: false,
  status: 428,
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => ({ error: "REAUTHENTICATION_REQUIRED" }),
})

describe("Step-up dialog timeout lifecycle", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it("closes stale dialog after 120 seconds and allows a new request", async () => {
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve(blocked()))
    const { unmount } = render(<StepUpConfirmDialog />)
    try {
      const first = api.post("/attendance/manual-override", {})
      const firstRejection = expect(first).rejects.toMatchObject({ status: 428 })
      await act(async () => {
        for (let i = 0; i < 12; i += 1) await Promise.resolve()
      })
      expect(screen.getByRole("dialog")).toBeInTheDocument()

      await act(async () => { await vi.advanceTimersByTimeAsync(120_001) })
      await firstRejection
      expect(screen.queryByRole("dialog")).toBeNull()

      const second = api.post("/attendance/manual-override", {})
      const secondRejection = expect(second).rejects.toMatchObject({ status: 428 })
      await act(async () => {
        for (let i = 0; i < 12; i += 1) await Promise.resolve()
      })
      expect(screen.getByRole("dialog")).toBeInTheDocument()
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Hủy" }))
        await secondRejection
      })
      expect(screen.queryByRole("dialog")).toBeNull()
    } finally {
      unmount()
    }
  })

  it("can reconfirm another operation after the first confirmation", async () => {
    let mutationCalls = 0
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/confirm-sensitive-action")) {
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        })
      }
      mutationCalls += 1
      return Promise.resolve(mutationCalls % 2 === 1 ? blocked() : {
        ok: true, status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      })
    })
    const { unmount } = render(<StepUpConfirmDialog />)
    try {
      for (let i = 0; i < 2; i += 1) {
        const pending = api.post("/attendance/manual-override", {})
        const completed = expect(pending).resolves.toMatchObject({ success: true })
        await act(async () => {
          for (let j = 0; j < 12; j += 1) await Promise.resolve()
        })
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "SecretTest#2026" } })
        await act(async () => {
          fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))
          await completed
        })
        expect(screen.queryByRole("dialog")).toBeNull()
      }
      expect(mutationCalls).toBe(4)
    } finally {
      unmount()
    }
  })
})
