import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import chatHandler from './api/chat.js'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['NVIDIA_API_KEY', 'NVIDIA_MODEL', 'CHAT_ENABLED']) if (env[key] !== undefined) process.env[key] = env[key]
  return {
    base: mode === 'pages' ? '/aureatine/' : '/',
    plugins: [react(), tailwindcss(), { name: 'local-chat-api', configureServer(server) { server.middlewares.use('/api/chat', (req, res) => { chatHandler(req, res).catch(() => { res.statusCode = 500; res.end('{"error":"Chat unavailable."}') }) }) } }],
    server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] }
  }
})
