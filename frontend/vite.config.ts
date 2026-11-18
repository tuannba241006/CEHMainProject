import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/sanctum": {
        target:
          process.env.VITE_BACKEND_URL ||
          process.env.VITE_MOCK_URL ||
          "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target:
          process.env.VITE_BACKEND_URL ||
          process.env.VITE_MOCK_URL ||
          "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router"],
          "vendor-charts": ["recharts"],
          "vendor-qr": ["qrcode.react"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/test/",
        "**/*.d.ts",
      ],
    },
  },
})
