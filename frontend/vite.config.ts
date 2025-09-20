import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": "/src" } },
  server: {
    host: true,
    port: 4000,
    open: true,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
