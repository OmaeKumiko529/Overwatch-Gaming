import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 获取公告列表
router.get('/', (req, res) => {
  try {
    const announcements = getAll(
      'SELECT a.*, u.username FROM announcements a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC'
    )
    res.json({ success: true, announcements })
  } catch (error) {
    console.error('获取公告列表失败:', error)
    res.status(500).json({ success: false, message: '获取公告列表失败' })
  }
})

// 获取单条公告
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    const announcement = getOne(
      'SELECT a.*, u.username FROM announcements a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?',
      [id]
    )
    if (!announcement) return res.json({ success: false, message: '公告不存在' })
    res.json({ success: true, announcement })
  } catch (error) {
    console.error('获取公告失败:', error)
    res.status(500).json({ success: false, message: '获取公告失败' })
  }
})

// 创建公告（仅管理员）
router.post('/', authMiddleware, (req, res) => {
  try {
    // 检查是否为管理员
    const user = getOne('SELECT is_admin FROM users WHERE id = ?', [req.user.id])
    if (!user || !user.is_admin) {
      return res.json({ success: false, message: '无权发布公告' })
    }

    const { title, content } = req.body
    if (!title || !title.trim()) return res.json({ success: false, message: '公告标题不能为空' })
    if (!content || !content.trim()) return res.json({ success: false, message: '公告内容不能为空' })

    const result = insert(
      'INSERT INTO announcements (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), content.trim()]
    )

    const newAnnouncement = {
      id: result.lastInsertRowid,
      user_id: req.user.id,
      username: req.user.username,
      title: title.trim(),
      content: content.trim(),
      created_at: new Date().toISOString()
    }

    res.json({ success: true, announcement: newAnnouncement })
  } catch (error) {
    console.error('创建公告失败:', error)
    res.status(500).json({ success: false, message: '创建公告失败' })
  }
})

// 删除公告（仅管理员）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const user = getOne('SELECT is_admin FROM users WHERE id = ?', [req.user.id])
    if (!user || !user.is_admin) {
      return res.json({ success: false, message: '无权删除公告' })
    }

    const id = Number(req.params.id)
    const announcement = getOne('SELECT * FROM announcements WHERE id = ?', [id])
    if (!announcement) return res.json({ success: false, message: '公告不存在' })

    run('DELETE FROM announcements WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('删除公告失败:', error)
    res.status(500).json({ success: false, message: '删除公告失败' })
  }
})

export default router