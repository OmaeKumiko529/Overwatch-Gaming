import express from 'express'
import cors from 'cors'
import { getDb } from './db.js'
import authRoutes from './routes/auth.js'
import postsRoutes from './routes/posts.js'
import teamsRoutes from './routes/teams.js'
import notificationsRoutes from './routes/notifications.js'
import announcementsRoutes from './routes/announcements.js'
import migrateRoutes from './routes/migrate.js'

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 路由（各路由内部自行初始化数据库）
app.use('/api/auth', authRoutes)
app.use('/api/posts', postsRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/migrate', migrateRoutes)

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