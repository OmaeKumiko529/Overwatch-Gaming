import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '.env')

  console.log('         _______                   _____                    _____                    _____                    _____                   _______                   _____  ')
  console.log('        /::\\    \\                 /\\    \\                  /\\    \\                  /\\    \\                  /\\    \\                 /::\\    \\                 /\\    \\ ')
  console.log('       /::::\\    \\               /::\\____\\                /::\\    \\                /::\\    \\                /::\\    \\               /::::\\    \\               /::\\____\\')
  console.log('      /::::::\\    \\             /::::|   |               /::::\\    \\              /::::\\    \\              /::::\\    \\             /::::::\\    \\             /:::/    /')
  console.log('     /::::::::\\    \\           /:::::|   |              /::::::\\    \\            /::::::\\    \\            /::::::\\    \\           /::::::::\\    \\           /:::/    / ')
  console.log('    /:::/~~\\:::\\    \\         /::::::|   |             /:::/\\:::\\    \\          /:::/\\:::\\    \\          /:::/\\:::\\    \\         /:::/~~\\:::\\    \\         /:::/    /  ')
  console.log('   /:::/    \\:::\\    \\       /:::/|::|   |            /:::/__\\:::\\    \\        /:::/__\\:::\\    \\        /:::/__\\:::\\    \\       /:::/    \\:::\\    \\       /:::/    /   ')
  console.log('  /:::/    / \\:::\\    \\     /:::/ |::|   |           /::::\\   \\:::\\    \\      /::::\\   \\:::\\    \\       \\:::\\   \\:::\\    \\     /:::/    / \\:::\\    \\     /:::/    /    ')
  console.log(' /:::/____/   \\:::\\____\\   /:::/  |::|___|______    /::::::\\   \\:::\\    \\    /::::::\\   \\:::\\    \\    ___\\:::\\   \\:::\\    \\   /:::/____/   \\:::\\____\\   /:::/    /     ')
  console.log('|:::|    |     |:::|    | /:::/   |::::::::\\    \\  /:::/\\:::\\   \\:::\\    \\  /:::/\\:::\\   \\:::\\    \\  /\\   \\:::\\   \\:::\\    \\ |:::|    |     |:::|    | /:::/    /      ')
  console.log("|:::|____|     |:::|    |/:::/    |:::::::::\\____\\/:::/  \\:::\\   \\:::\\____\\/:::/__\\:::\\   \\:::\\____\\/::\\   \\:::\\   \\:::\\____\\|:::|____|     |:::|____|/:::/____/       ")
  console.log(' \\:::\\    \\   /:::/    / \\::/    / ~~~~~/:::/    /\\::/    \\:::\\  /:::/    /\\:::\\   \\:::\\   \\::/    /\\:::\\   \\:::\\   \\::/    / \\:::\\   _\\___/:::/    / \\:::\\    \\       ')
  console.log('  \\:::\\    \\ /:::/    /   \\/____/      /:::/    /  \\/____/ \\:::\\/:::/    /  \\:::\\   \\:::\\   \\/____/  \\:::\\   \\:::\\   \\/____/   \\:::\\ |::| /:::/    /   \\:::\\    \\      ')
  console.log('   \\:::\\    /:::/    /                /:::/    /            \\::::::/    /    \\:::\\   \\:::\\    \\       \\:::\\   \\:::\\    \\        \\:::\\|::|/:::/    /     \\:::\\    \\     ')
  console.log('    \\:::\\__/:::/    /                /:::/    /              \\::::/    /      \\:::\\   \\:::\\____\\       \\:::\\   \\:::\\____\\        \\::::::::::/    /       \\:::\\    \\    ')
  console.log('     \\::::::::/    /                /:::/    /               /:::/    /        \\:::\\   \\::/    /        \\:::\\  /:::/    /         \\::::::::/    /         \\:::\\    \\   ')
  console.log('      \\::::::/    /                /:::/    /               /:::/    /          \\:::\\   \\/____/          \\:::\\/:::/    /           \\::::::/    /           \\:::\\    \\  ')
  console.log('       \\::::/    /                /:::/    /               /:::/    /            \\:::\\    \\               \\::::::/    /             \\::::/____/             \\:::\\    \\ ')
  console.log('        \\::/____/                /:::/    /               /:::/    /              \\:::\\____\\               \\::::/    /               |::|    |               \\:::\\____\\')
  console.log('         ~~                      \\::/    /                \\::/    /                \\::/    /                \\::/    /                |::|____|                \\::/    /')
  console.log('                                  \\/____/                  \\/____/                  \\/____/                  \\/____/                  ~~                       \\/____/')


// 如果 .env 文件不存在，引导用户交互式创建
if (!fs.existsSync(envPath)) {

  // 动态导入 setup-env（ESM 中 await import 可同步风格使用）
  const { setupEnv } = await import('./setup-env.js')
  await setupEnv()

  // 重新加载环境变量
  dotenv.config({ path: envPath, override: true })
  console.log('环境变量已重新加载')
  console.log('')
} else {
  dotenv.config({ path: envPath })
}

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
import heroesRoutes from './routes/heroes.js'

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
app.use('/api/heroes', heroesRoutes)

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
    console.log('数据库已初始化')
    app.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`)
      console.log(`SQL server data on: server/data.db`)
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    process.exit(1)
  }
}

start()