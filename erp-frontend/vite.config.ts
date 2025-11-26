import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,

    // 👇👇👇 THÊM PHẦN NÀY
    proxy: {
      "/api": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
