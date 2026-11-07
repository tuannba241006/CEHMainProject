import { apiConfig, tokenStore, isApiMode } from "./config"
import { ApiError, type ApiErrorPayload } from "./errors"
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
  const fullPath = `${apiConfig.baseUrl}${normalizedPath}`
  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"
  const url = new URL(fullPath, base)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
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
  if (typeof document !== "undefined") {
    const xsrfCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1]
    if (xsrfCookie && !headers.has("X-XSRF-TOKEN")) {
      headers.set("X-XSRF-TOKEN", decodeURIComponent(xsrfCookie))
    }
  }

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(buildUrl(path, options.query), {
      credentials: options.credentials ?? "include",
      ...options,
      body,
      headers,
      signal: controller.signal,
    })
    const payload = await parseBody(response)
    if (response.status === 401) tokenStore.clear()
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
