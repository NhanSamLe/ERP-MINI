import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path'
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Quan trọng nhất
    },
  },
})
