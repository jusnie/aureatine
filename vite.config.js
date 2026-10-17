import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import chatHandler from './api/chat.js'
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build' && (!env.VITE_SUPABASE_URL?.trim() || !env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || env.VITE_SUPABASE_URL.includes('YOUR-PROJECT'))) {
    throw new Error('Missing public Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building. Never use a service-role key.')
  }
  for (const key of ['NVIDIA_API_KEY', 'NVIDIA_MODEL', 'CHAT_ENABLED']) if (env[key] !== undefined) process.env[key] = env[key]
  return {
    base: mode === 'pages' ? '/aureatine/' : '/',
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return 'supabase'
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
            return 'vendor'
          }
        }
      }
    },
    plugins: [react(), tailwindcss(), { name: 'local-chat-api', configureServer(server) { server.middlewares.use('/api/chat', (req, res) => { chatHandler(req, res).catch(() => { res.statusCode = 500; res.end('{"error":"Chat unavailable."}') }) }) } }],
    server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] }
  }
})
