import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeProxyTarget(raw) {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  // Proxy target should be origin/base, not /api endpoint.
  return trimmed.replace(/\/api$/i, '')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    normalizeProxyTarget(env.VITE_BACKEND_PROXY_TARGET) ||
    normalizeProxyTarget(env.VITE_API_URL) ||
    'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts'],
          },
        },
      },
    },
  }
})