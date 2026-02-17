import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 1. Konfigurasi Alias (Agar import "@/..." terbaca sebagai folder src)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 2. Konfigurasi Server & Proxy (Agar localhost Frontend bisa bicara ke Backend)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Pastikan port ini sesuai dengan backend Anda
        changeOrigin: true,
        secure: false, // Tambahan keamanan agar tidak error saat dev
      },
    },
  },
})