import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  // 使用 Vite 环境变量模式文件 (.env.production, .env.development)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // 根据 mode 设置 base 路径（通过 .env 文件覆盖）
    base: env.VITE_BASE_URL || '/',

    plugins: [
      vue(),
      vueDevTools(),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

    // 开发环境代理：将 /api 请求转发到后端服务器
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    }
  }
})
