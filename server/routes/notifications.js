import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 获取当前用户的通知
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = String(req.user.id)

    const notifications = getAll(
      'SELECT * FROM notifications WHERE to_user = ? ORDER BY created_at DESC LIMIT 100',
      [userId]
    )

    res.json({
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        Author: n.author,
        Root: n.root,
        To: n.to_user,
        IsRead: !!n.is_read,
        title: n.title,
        createdAt: n.created_at
      }))
    })
  } catch (error) {
    console.error('获取通知失败:', error)
    res.status(500).json({ success: false, message: '获取通知失败' })
  }
})

// 获取未读通知数量
router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const userId = String(req.user.id)

    const result = getOne(
      'SELECT COUNT(*) as count FROM notifications WHERE to_user = ? AND is_read = 0',
      [userId]
    )

    res.json({ success: true, count: result.count })
  } catch (error) {
    console.error('获取未读数量失败:', error)
    res.status(500).json({ success: false, message: '获取未读数量失败' })
  }
})

// 标记单条通知已读
router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const notifId = Number(req.params.id)
    const userId = String(req.user.id)

    run('UPDATE notifications SET is_read = 1 WHERE id = ? AND to_user = ?', [notifId, userId])
    res.json({ success: true })
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ success: false, message: '标记已读失败' })
  }
})

// 标记全部已读
router.put('/read-all', authMiddleware, (req, res) => {
  try {
    const userId = String(req.user.id)

    run('UPDATE notifications SET is_read = 1 WHERE to_user = ? AND is_read = 0', [userId])
    res.json({ success: true })
  } catch (error) {
    console.error('标记全部已读失败:', error)
    res.status(500).json({ success: false, message: '标记全部已读失败' })
  }
})

// 创建通知
router.post('/', authMiddleware, (req, res) => {
  try {
    const { type, Author, Root, To, title } = req.body

    const result = insert(
      'INSERT INTO notifications (type, author, root, to_user, title) VALUES (?, ?, ?, ?, ?)',
      [type, String(Author), Root, String(To), title || null]
    )

    const notif = {
      id: result.lastInsertRowid,
      type,
      Author: String(Author),
      Root,
      To: String(To),
      IsRead: false,
      title: title || null,
      createdAt: new Date().toISOString()
    }

    res.json({ success: true, notification: notif })
  } catch (error) {
    console.error('创建通知失败:', error)
    res.status(500).json({ success: false, message: '创建通知失败' })
  }
})

export default router