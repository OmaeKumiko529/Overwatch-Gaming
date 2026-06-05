import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { getDb } from './db.js'
import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import teamsRoutes from './routes/teams.js'
import notificationsRoutes from './routes/notifications.js'
import announcementsRoutes from './routes/announcements.js'
import migrateRoutes from './routes/migrate.js'
import adminRoutes from './routes/admin.js'

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
    return callback(null, false)
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

// 路由（各路由内部自行初始化数据库）
app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/migrate', migrateRoutes)
app.use('/api/admin', adminRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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
    console.log('📦 数据库已初始化')
    app.listen(PORT, () => {
      console.log(`🚀 服务器已启动: http://localhost:${PORT}`)
      console.log(`📂 数据库文件: server/data.db`)
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

start()