import { printBanner } from './utils/banner.js'
import { ensureEnv } from './bootstrap/env.js'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getDb } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载环境变量（首次运行自动引导创建 .env）
await ensureEnv()

const app = express()
const PORT = process.env.PORT || 3001

// CORS 白名单
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',')
app.use(cors({
  origin: function (origin, callback) {
    // 允许没有 origin 的请求（如同源请求、curl等）
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  }
}))

// 全局速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))

// 路由自动注册 - 扫描 routes 目录，按文件名自动挂载 /api/{name}
const routesDir = path.join(__dirname, 'routes')
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'))
for (const file of routeFiles) {
  const routeName = file.replace('.js', '')
  const { default: router } = await import(`./routes/${file}`)
  app.use(`/api/${routeName}`, router)
  console.log(`[Routes] 已挂载 /api/${routeName}`)
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理（匹配所有未定义的路由）
app.use((req, res) => {
  res.status(404).json({ success: false, message: '请求的资源不存在' })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

// 启动服务器前初始化数据库
async function start() {
  try {
    await getDb()
    console.log('数据库已初始化')
    app.listen(PORT, () => {
      printBanner()
      console.log(`\nServer is running on: http://localhost:${PORT}`)
      console.log(`SQL server data on: server/data.db`)
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

start()