import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,       // 👈 ép port 3000
    strictPort: true, // 👈 nếu port bận thì báo lỗi, không tự nhảy sang 5173/5174
  },
})
