import { Router } from 'express'
import { getDb, getOne, run } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 记录用户偏好标签
router.post('/record', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const { tags } = req.body

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.json({ success: true, message: '无标签需要记录' })
    }

    // 读取当前偏好
    const user = getOne('SELECT preference FROM users WHERE id = ?', [userId])
    if (!user) return res.json({ success: false, message: '用户不存在' })

    let pref = {}
    try {
      pref = JSON.parse(user.preference || '{"total":0}')
    } catch {
      pref = { total: 0 }
    }

    // 确保 total 存在
    if (typeof pref.total !== 'number') pref.total = 0

    // 每个标签计数 +1
    for (const tag of tags) {
      if (!tag || typeof tag !== 'string') continue
      if (typeof pref[tag] !== 'number') pref[tag] = 0
      pref[tag] += 1
      pref.total += 1
    }

    // 写回数据库
    run('UPDATE users SET preference = ? WHERE id = ?', [JSON.stringify(pref), userId])

    res.json({ success: true, preference: pref })
  } catch (error) {
    console.error('记录偏好失败:', error)
    res.status(500).json({ success: false, message: '记录偏好失败' })
  }
})

// 获取用户偏好数据
router.get('/:uid', (req, res) => {
  try {
    const param = req.params.uid

    // 支持 uid 字符串或数字 id
    let user = getOne('SELECT id, preference FROM users WHERE uid = ?', [param])
    if (!user) {
      const id = Number(param)
      if (!isNaN(id)) {
        user = getOne('SELECT id, preference FROM users WHERE id = ?', [id])
      }
    }
    if (!user) return res.json({ success: false, message: '用户不存在' })

    let pref = {}
    try {
      pref = JSON.parse(user.preference || '{"total":0}')
    } catch {
      pref = { total: 0 }
    }

    res.json({ success: true, preference: pref })
  } catch (error) {
    console.error('获取偏好失败:', error)
    res.status(500).json({ success: false, message: '获取偏好失败' })
  }
})

export default router