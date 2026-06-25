import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The backend (Bun) runs on :8787 by default. In dev we proxy /api -> backend
// so the SSE stream and REST routes work without CORS headaches. The frontend
// itself never needs the Aiven token; the server holds the secrets.
const SERVER_ORIGIN = process.env.SERVER_ORIGIN ?? "http://localhost:8787";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: SERVER_ORIGIN,
        changeOrigin: true,
        // SSE needs buffering disabled so events flush immediately.
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            proxyRes.headers["cache-control"] = "no-cache, no-transform";
          });
        },
      },
    },
  },
});
