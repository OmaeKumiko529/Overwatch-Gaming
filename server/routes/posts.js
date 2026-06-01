import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

function mapPost(p) {
  return {
    id: p.id,
    userId: p.user_id,
    username: p.username,
    title: p.title,
    content: p.content,
    category: p.category,
    likes: p.likes,
    context: p.context,
    parentId: p.parent_id,
    mentions: JSON.parse(p.mentions || '[]'),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }
}

// 获取帖子列表
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, category, popular, limit } = req.query
    const maxLimit = Math.min(Number(limit) || 20, 100)

    let sql = 'SELECT * FROM posts WHERE parent_id IS NULL'
    const params = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    if (popular === 'true') {
      sql += ' ORDER BY likes DESC'
    } else {
      sql += ' ORDER BY created_at DESC'
    }

    sql += ' LIMIT ?'
    params.push(maxLimit)

    const posts = getAll(sql, params).map(mapPost)
    res.json({ success: true, posts })
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    res.status(500).json({ success: false, message: '获取帖子列表失败' })
  }
})

// 获取帖子详情（含子帖）
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = Number(req.params.id)
    const post = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    const childPosts = getAll('SELECT * FROM posts WHERE parent_id = ? ORDER BY created_at DESC', [postId])

    res.json({
      success: true,
      post: { ...mapPost(post), childPosts: childPosts.map(mapPost) }
    })
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ success: false, message: '获取帖子详情失败' })
  }
})

// 获取用户的帖子
router.get('/user/:uid', (req, res) => {
  try {
    const uid = Number(req.params.uid)
    const { mainOnly } = req.query

    let sql = 'SELECT * FROM posts WHERE user_id = ?'
    const params = [uid]

    if (mainOnly === 'true') sql += ' AND parent_id IS NULL'

    sql += ' ORDER BY created_at DESC'

    const posts = getAll(sql, params).map(mapPost)
    res.json({ success: true, posts })
  } catch (error) {
    console.error('获取用户帖子失败:', error)
    res.status(500).json({ success: false, message: '获取用户帖子失败' })
  }
})

// 创建帖子
router.post('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id
    const { title, content, category, parentId, mentions } = req.body
    const username = req.user.username
    const context = parentId ? `${parentId}/#` : '#'

    const result = insert(
      'INSERT INTO posts (user_id, username, title, content, category, context, parent_id, mentions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, title, content, category || 'general', context, parentId || null, JSON.stringify(mentions || [])]
    )

    const newPost = {
      id: result.lastInsertRowid,
      userId,
      username,
      title,
      content,
      category: category || 'general',
      likes: 0,
      context,
      parentId: parentId || null,
      mentions: mentions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 通知被@的用户
    if (mentions && mentions.length > 0) {
      for (const m of mentions) {
        if (String(m.userId) !== String(userId)) {
          insert(
            'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
            ['mention', String(userId), newPost.id, String(m.userId)]
          )
        }
      }
    }

    res.json({ success: true, post: newPost })
  } catch (error) {
    console.error('创建帖子失败:', error)
    res.status(500).json({ success: false, message: '发帖失败' })
  }
})

// 更新帖子
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const postId = Number(req.params.id)
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    if (!post) return res.json({ success: false, message: '帖子不存在' })
    if (post.user_id !== userId) return res.json({ success: false, message: '无权更新此帖子' })

    const { title, content, category } = req.body
    const updates = []
    const params = []

    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (content !== undefined) { updates.push('content = ?'); params.push(content) }
    if (category !== undefined) { updates.push('category = ?'); params.push(category) }

    if (updates.length === 0) return res.json({ success: false, message: '没有需要更新的字段' })

    updates.push("updated_at = datetime('now', 'localtime')")
    params.push(postId)

    run(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, params)

    const updated = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    res.json({ success: true, post: mapPost(updated) })
  } catch (error) {
    console.error('更新帖子失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// 删除帖子
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const postId = Number(req.params.id)
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    if (!post) return res.json({ success: false, message: '帖子不存在' })
    if (post.user_id !== userId) return res.json({ success: false, message: '无权删除此帖子' })

    run('DELETE FROM posts WHERE id = ?', [postId])
    run('DELETE FROM posts WHERE parent_id = ?', [postId])

    res.json({ success: true })
  } catch (error) {
    console.error('删除帖子失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// 点赞帖子
router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const postId = Number(req.params.id)
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    run("UPDATE posts SET likes = likes + 1, updated_at = datetime('now', 'localtime') WHERE id = ?", [postId])

    // 通知帖主
    if (String(post.user_id) !== String(userId)) {
      insert(
        'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
        ['like', String(userId), postId, String(post.user_id)]
      )
    }

    const updated = getOne('SELECT likes FROM posts WHERE id = ?', [postId])
    res.json({ success: true, likes: updated.likes })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ success: false, message: '点赞失败' })
  }
})

// 添加评论
router.post('/:id/comment', authMiddleware, (req, res) => {
  try {
    const postId = Number(req.params.id)
    const userId = req.user.id
    const { content } = req.body

    const parentPost = getOne('SELECT * FROM posts WHERE id = ?', [postId])
    if (!parentPost) return res.json({ success: false, message: '帖子不存在' })

    const username = req.user.username
    const title = `回复: ${parentPost.title.substring(0, 30)}...`
    const context = `${postId}/#`

    const result = insert(
      'INSERT INTO posts (user_id, username, title, content, category, context, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, username, title, content, 'comment', context, postId]
    )

    const childPost = {
      id: result.lastInsertRowid,
      userId,
      username,
      title,
      content,
      category: 'comment',
      likes: 0,
      context,
      parentId: postId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 通知帖主
    if (String(parentPost.user_id) !== String(userId)) {
      insert(
        'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
        ['comment', String(userId), postId, String(parentPost.user_id)]
      )
    }

    res.json({ success: true, comment: childPost })
  } catch (error) {
    console.error('评论失败:', error)
    res.status(500).json({ success: false, message: '评论失败' })
  }
})

// 获取分类列表
router.get('/categories/list', (req, res) => {
  try {
    const rows = getAll('SELECT DISTINCT category FROM posts WHERE parent_id IS NULL AND category IS NOT NULL')
    res.json({ success: true, categories: rows.map(r => r.category) })
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ success: false, message: '获取分类失败' })
  }
})

export default router