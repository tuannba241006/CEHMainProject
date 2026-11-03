export type AppMode = "demo" | "api"

// Mặc định kết nối qua reverse proxy /api (hỗ trợ cả Docker Nginx và Vite dev server)
// Chỉ sử dụng domain tuyệt đối nếu VITE_API_URL được cấu hình rõ ràng
const apiOrigin = (import.meta.env.VITE_API_URL?.trim() || "").replace(/\/$/, "")

export const apiConfig = {
  // MẶC ĐỊNH LÀ "demo" để bạn chạy test độc lập 100% Frontend (chưa cần bật PHP/Database)
  // Khi nào bạn sẵn sàng nối Backend, chỉ cần đổi giá trị này thành "api"
  mode: (import.meta.env.VITE_APP_MODE === "api" ? "api" : "demo") as AppMode,
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
