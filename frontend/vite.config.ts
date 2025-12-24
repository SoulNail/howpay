// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 默认前端端口可能是 5173，这里配置代理
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 你的 Rust 后端地址
        changeOrigin: true,
        secure: false,
        // 可选：如果你后端路径没有 /api 前缀，需要用 rewrite 去掉它
        // 但你的 Rust 路由明确写了 .route("/api/devices", ...)，所以这里不需要 rewrite
      }
    }
  }
})