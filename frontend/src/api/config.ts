export type AppMode = "demo" | "api"

// Mặc định kết nối qua reverse proxy /api (hỗ trợ cả Docker Nginx và Vite dev server)
// Chỉ sử dụng domain tuyệt đối nếu VITE_API_URL được cấu hình rõ ràng
const apiOrigin = (import.meta.env.VITE_API_URL?.trim() || "").replace(/\/$/, "")

export const apiConfig = {
  // Mặc định là "api" để kết nối HTTP tới Mock Server Prism (cổng 4010) hoặc Backend Laravel
  // Khi cần chạy thử nghiệm độc lập offline thuần túy, có thể đặt VITE_APP_MODE="demo"
  mode: (import.meta.env.VITE_APP_MODE === "demo" ? "demo" : "api") as AppMode,
  origin: apiOrigin,
  baseUrl: apiOrigin ? `${apiOrigin}/api` : "/api",
  timeoutMs: 20_000,
}

export const isApiMode = () => apiConfig.mode === "api"

const TOKEN_KEY = "ceh_jwt"
export const tokenStore = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
}
