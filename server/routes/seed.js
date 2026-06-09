import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { generateUid, generatePid } from '../utils/identifiers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 注入种子数据
router.post('/inject', adminMiddleware, async (req, res) => {
  try {
    // 读取种子数据 JSON
    const seedPath = path.join(__dirname, '../../tools/seed-data.json')
    if (!fs.existsSync(seedPath)) {
      return res.status(404).json({ success: false, message: '种子数据文件不存在' })
    }
    const raw = fs.readFileSync(seedPath, 'utf8')
    const seedData = JSON.parse(raw)

    const result = { users: [], posts: [] }

    // === 阶段一：生成用户 ===
    for (const userData of seedData.users) {
      // 检查用户名是否已存在
      const existing = getOne('SELECT id FROM users WHERE username = ?', [userData.username])
      if (existing) {
        result.users.push({ username: userData.username, status: '已存在，跳过' })
        continue
      }

      const uid = generateUid(getOne)
      const passwordHash = bcrypt.hashSync(userData.password, 10)

      const insertResult = insert(
        `INSERT INTO users (username, email, password_hash, role, is_admin, uid, userrank, avatar)
         VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
        [userData.username, userData.email, passwordHash, userData.role, uid, userData.userrank, userData.avatar]
      )

      result.users.push({
        username: userData.username,
        uid,
        id: insertResult.lastInsertRowid,
        status: '已创建'
      })
    }

    // 获取所有已存在的用户映射：username -> { id, uid }
    const allUsers = getAll('SELECT id, username, uid FROM users')
    const userMap = {}
    for (const u of allUsers) {
      userMap[u.username] = { id: u.id, uid: u.uid }
    }

    // === 阶段二：生成帖子 ===
    for (const postData of seedData.posts) {
      const author = userMap[seedData.users[postData.authorIndex].username]
      if (!author) {
        result.posts.push({ title: postData.title, status: '跳过：作者不存在' })
        continue
      }

      // 检查标题是否已存在（粗略去重）
      const existing = getOne('SELECT id FROM posts WHERE title = ?', [postData.title])
      if (existing) {
        result.posts.push({ title: postData.title, status: '已存在，跳过' })
        continue
      }

      const pid = generatePid(getOne, author.uid)
      const tagsJson = JSON.stringify(postData.tags)

      const insertResult = insert(
        `INSERT INTO posts (user_id, username, title, content, category, likes, views, context, pid, postrank, mentions, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          author.id,
          seedData.users[postData.authorIndex].username,
          postData.title,
          postData.content,
          postData.category,
          postData.likes,
          postData.views,
          `#/${pid}`,
          pid,
          postData.postrank || '69',
          '[]',
          tagsJson
        ]
      )

      result.posts.push({
        title: postData.title,
        pid,
        id: insertResult.lastInsertRowid,
        status: '已创建'
      })
    }

    res.json({
      success: true,
      message: `种子数据注入完成：${result.users.filter(u => u.status === '已创建').length} 个用户, ${result.posts.filter(p => p.status === '已创建').length} 篇帖子`,
      detail: result
    })
  } catch (error) {
    console.error('种子数据注入失败:', error)
    res.status(500).json({ success: false, message: '种子数据注入失败: ' + error.message })
  }
})

export default router