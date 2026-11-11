import { apiConfig, tokenStore, isApiMode } from "./config"
import { ApiError, isApiError, type ApiErrorPayload } from "./errors"
import { handleMockRequest } from "./mockAdapter"

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, QueryValue>
  body?: unknown
  kioskToken?: string
  idempotencyKey?: string
  timeoutMs?: number
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  // Sanctum web routes are served at root domain (/sanctum/csrf-cookie), not under /api
  const isSanctum = normalizedPath.startsWith("/sanctum/")
  const fullPath = isSanctum
    ? (apiConfig.origin ? `${apiConfig.origin}${normalizedPath}` : normalizedPath)
    : `${apiConfig.baseUrl}${normalizedPath}`
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"
  const url = new URL(fullPath, base)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

let csrfPromise: Promise<void> | null = null

export function getXsrfToken(): string | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const trimmed = cookie.trim()
    if (trimmed.startsWith("XSRF-TOKEN=")) {
      const val = trimmed.slice("XSRF-TOKEN=".length)
      return val ? decodeURIComponent(val) : null
    }
  }
  return null
}

export async function ensureCsrfToken(force = false): Promise<void> {
  // If we already have the XSRF token or if an authenticated session exists, do not overwrite session
  const hasAuth =
    typeof window !== "undefined" &&
    (Boolean(sessionStorage.getItem("ceh_demo_role")) ||
      Boolean(sessionStorage.getItem("ceh_demo_email")))

  if (!force && (getXsrfToken() || hasAuth)) {
    return
  }
  if (csrfPromise) {
    return csrfPromise
  }
  csrfPromise = (async () => {
    try {
      await request<void>("/sanctum/csrf-cookie", { method: "GET" })
    } catch (err) {
      if (typeof process === "undefined" || process.env?.NODE_ENV !== "test") {
        console.warn("Sanctum CSRF pre-fetch note:", err)
      }
    } finally {
      csrfPromise = null
    }
  })()
  return csrfPromise
}

async function parseBody(response: Response) {
  if (response.status === 204) return undefined
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      // Fallback to text parsing below if body had leading whitespace or formatting issues
    }
  }
  if (
    contentType.includes("application/pdf") ||
    contentType.includes("spreadsheet") ||
    contentType.includes("application/octet-stream")
  ) {
    return response.blob()
  }
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  // In demo mode, route directly to the service-level mock adapter without leaking into UI
  if (!isApiMode()) {
    const mockResponse = await handleMockRequest<T>(path, options)
    if (mockResponse !== undefined) {
      return mockResponse
    }
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? apiConfig.timeoutMs,
  )
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  const token = tokenStore.get()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (options.kioskToken) headers.set("X-Kiosk-Token", options.kioskToken)
  if (options.idempotencyKey)
    headers.set("Idempotency-Key", options.idempotencyKey)

  // Laravel Sanctum XSRF-TOKEN handling
  const xsrfToken = getXsrfToken()
  if (xsrfToken && !headers.has("X-XSRF-TOKEN")) {
    headers.set("X-XSRF-TOKEN", xsrfToken)
  }

  const method = (options.method || "GET").toUpperCase()

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(buildUrl(path, options.query), {
      ...options,
      credentials: options.credentials ?? "include",
      body,
      headers,
      signal: controller.signal,
    })
    const payload = await parseBody(response)

    // For authenticated GET requests, retry once after a short delay (200ms) to accommodate
    // transient session cookie propagation in local dev / single-threaded environments
    const hasAuth =
      typeof window !== "undefined" &&
      (Boolean(sessionStorage.getItem("ceh_demo_role")) ||
        Boolean(sessionStorage.getItem("ceh_demo_email")))

    if (response.status === 401 && !isRetry && method === "GET" && hasAuth) {
      await new Promise((r) => setTimeout(r, 200))
      return request<T>(path, options, true)
    }

    if (response.status === 401) {
      tokenStore.clear()
      const normalizedPath = path.startsWith("/") ? path : `/${path}`
      const isIdentityEndpoint =
        normalizedPath === "/auth/me" ||
        normalizedPath === "/api/auth/me" ||
        normalizedPath === "/v1/auth/me"

      // Only dispatch session expiration if the primary user identity endpoint (/auth/me) fails
      // Secondary data endpoints (waitlist, tickets, reviews) must NOT wipe the active session
      if (isIdentityEndpoint && hasAuth && typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("ceh_demo_role")
          sessionStorage.removeItem("ceh_demo_email")
          sessionStorage.removeItem("ceh_user_data")
        } catch {}
        window.dispatchEvent(
          new CustomEvent("ceh:session_expired", {
            detail: { path: normalizedPath },
          }),
        )
      }
    }

    // Automatic 419 CSRF Token Mismatch Recovery (UC-AUTH-02)
    if (response.status === 419 && !isRetry) {
      if (!hasAuth) {
        await ensureCsrfToken(true)
        return request<T>(path, options, true)
      }
    }

    if (!response.ok)
      throw new ApiError(response.status, (payload || {}) as ApiErrorPayload)
    return payload as T
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(503, { message: "Yêu cầu quá thời gian chờ." })
    }
    // Fallback to mock adapter if server/mock container is offline or unreachable
    if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
      const mockResponse = await handleMockRequest<T>(path, options)
      if (mockResponse !== undefined) {
        return mockResponse
      }
    }
    // For read-only GET requests that encounter 404 (endpoint not yet created in backend),
    // gracefully fall back to contract mock data if available to prevent UI breakdown
    if (
      method === "GET" &&
      isApiError(error) &&
      error.status === 404
    ) {
      const mockResponse = await handleMockRequest<T>(path, options)
      if (mockResponse !== undefined) {
        return mockResponse
      }
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
}
