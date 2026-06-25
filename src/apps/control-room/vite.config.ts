import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const apiTarget = process.env.AIDEN_API_TARGET ?? "http://localhost:8787"
const port = Number(process.env.VITE_PORT ?? 5173)

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    proxy: {
      "/api": apiTarget
    }
  }
})
