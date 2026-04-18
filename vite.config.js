// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  // 根据环境变量设置 base 路径
  base: process.env.NODE_ENV === 'production' 
    ? '/Overwatch-Gaming/'  // 替换成你的仓库名，例如：'/my-vue-project/'
    : './',
  
  plugins: [
    vue(),
    vueDevTools(),
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})