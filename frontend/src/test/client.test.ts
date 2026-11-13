import { describe, it, expect, beforeEach, vi } from "vitest"
import { api, request } from "../api/client"
import { tokenStore, apiConfig } from "../api/config"
import { ApiError } from "../api/errors"

describe("API Client & TokenStore (frontend/src/api/client.ts)", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("should set, get, and clear token in tokenStore", () => {
    expect(tokenStore.get()).toBeNull()
    tokenStore.set("sample-jwt-token-123")
    expect(tokenStore.get()).toBe("sample-jwt-token-123")
    tokenStore.clear()
    expect(tokenStore.get()).toBeNull()
  })

  it("should attach Authorization header when token is stored", async () => {
    tokenStore.set("test-token-bearer")

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: { id: 1 } }),
    })
    global.fetch = mockFetch

    const result = await api.get<{ success: boolean; data: { id: number } }>("/events")
    expect(result.success).toBe(true)
    expect(result.data.id).toBe(1)

    const passedHeaders = mockFetch.mock.calls[0][1].headers as Headers
    expect(passedHeaders.get("Authorization")).toBe("Bearer test-token-bearer")
    expect(passedHeaders.get("Accept")).toBe("application/json")
  })

  it("should throw ApiError with status and clear token on 401 Unauthorized", async () => {
    tokenStore.set("expired-token")

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: false, message: "Phiên đăng nhập đã hết hạn." }),
    })
    global.fetch = mockFetch

    await expect(request("/user/profile")).rejects.toThrow(ApiError)
    expect(tokenStore.get()).toBeNull() // Cleared on 401
  })

  it("should pass query parameters formatted correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: [] }),
    })
    global.fetch = mockFetch

    await api.get("/events", { query: { page: 2, status: "open", empty: null } })
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain("page=2")
    expect(calledUrl).toContain("status=open")
    expect(calledUrl).not.toContain("empty=")
  })

  it("should attach X-XSRF-TOKEN header when XSRF-TOKEN cookie exists", async () => {
    document.cookie = "XSRF-TOKEN=mock-sanctum-xsrf-token-xyz; path=/"

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: { test: true } }),
    })
    global.fetch = mockFetch

    await api.post("/test-mutation", { action: "submit" })
    const passedHeaders = mockFetch.mock.calls[0][1].headers as Headers
    expect(passedHeaders.get("X-XSRF-TOKEN")).toBe("mock-sanctum-xsrf-token-xyz")
  })

  it("should automatically retry mutation on 419 CSRF mismatch after refreshing cookie", async () => {
    let callCount = 0
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      callCount++
      if (url.includes("/sanctum/csrf-cookie")) {
        document.cookie = "XSRF-TOKEN=refreshed-xsrf-token-999; path=/"
        return Promise.resolve({
          ok: true,
          status: 204,
          headers: new Headers(),
          text: async () => "",
        })
      }
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 419,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: false, message: "CSRF token mismatch." }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true, data: { recovered: true } }),
      })
    })
    global.fetch = mockFetch

    const res = await api.post<{ success: boolean; data: { recovered: boolean } }>(
      "/events/1/kiosk/start",
    )
    expect(res.success).toBe(true)
    expect(res.data.recovered).toBe(true)
    expect(callCount).toBe(3) // 1st failed attempt (419) -> csrf-cookie fetch -> 2nd retry (200)
  })
})

