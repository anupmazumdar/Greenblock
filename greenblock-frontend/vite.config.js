import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000'  // local dev ke liye
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://greenblock-production.up.railway.app')
  }
})