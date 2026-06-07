import { Router } from 'express'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { authMiddleware, optionalAuth } from '../middleware/auth.js'
import { generatePid } from '../utils/identifiers.js'

const router = Router()

router.use(async (req, res, next) => {
  await getDb()
  next()
})

function mapPost(p) {
  return {
    id: p.id,
    pid: p.pid || String(p.id),
    userId: p.user_id,
    username: p.username,
    title: p.title,
    content: p.content,
    category: p.category,
    likes: p.likes,
    views: p.views || 0,
    context: p.context,
    parentId: p.parent_id,
    postrank: p.postrank || '69',
    mentions: p.mentions ? JSON.parse(typeof p.mentions === 'string' ? p.mentions : '[]') : [],
    tags: p.tags ? JSON.parse(typeof p.tags === 'string' ? p.tags : '[]') : [],
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }
}

// 获取分类列表（必须放在 :pid 路由之前，防止 categories 被捕获为 pid）
router.get('/categories/list', (req, res) => {
  try {
    const rows = getAll('SELECT DISTINCT category FROM posts WHERE parent_id IS NULL AND category IS NOT NULL')
    res.json({ success: true, categories: rows.map(r => r.category) })
  } catch (error) {
    console.error('获取分类失败:', error)
    res.status(500).json({ success: false, message: '获取分类失败' })
  }
})

// 获取帖子列表
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, category, postrank, popular, limit } = req.query
    const maxLimit = Math.min(Number(limit) || 20, 100)
    const userrank = req.user ? Number(req.user.userrank) : 0

    let sql = 'SELECT * FROM posts WHERE parent_id IS NULL'
    const params = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (postrank) {
      sql += ' AND postrank = ?'
      params.push(postrank)
    }

    // 黑帖在列表中所有人可见（标题显示），内容权限由详情接口控制
    // 不再在此处过滤 postrank = '00'
    if (search) {
      // 限制搜索字符串长度防止DoS
      const safeSearch = typeof search === 'string' ? search.substring(0, 200) : ''
      if (safeSearch.length > 0) {
        sql += ' AND (title LIKE ? OR content LIKE ? OR pid LIKE ?)'
        params.push(`%${safeSearch}%`, `%${safeSearch}%`, `%${safeSearch}%`)
      }
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
router.get('/:pid', optionalAuth, (req, res) => {
  try {
    const pid = req.params.pid
    const userrank = req.user ? Number(req.user.userrank) : 0
    const userId = req.user ? req.user.id : null

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    // 黑帖权限检查：content 对无权用户隐藏
    const mappedPost = mapPost(post)
    if (post.postrank === '00' && userrank < 2) {
      mappedPost.content = '[该帖子已被标记为黑帖，您没有权限查看内容]'
    }

    // 检查当前用户是否已点赞主帖
    if (userId) {
      const userLiked = getOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, userId])
      mappedPost.isLikedByUser = !!userLiked
    } else {
      mappedPost.isLikedByUser = false
    }

    // 获取子帖 - 使用 context LIKE 匹配
    const parentContext = post.context
    let childPosts = []
    if (parentContext) {
      childPosts = getAll("SELECT * FROM posts WHERE context LIKE ? AND id != ? ORDER BY created_at ASC", [`${parentContext}/%`, post.id])
        .map(mapPost)
    }

    // 检查当前用户是否已赞每条子帖
    if (userId) {
      childPosts = childPosts.map(c => {
        const liked = getOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [c.id, userId])
        return { ...c, isLikedByUser: !!liked }
      })
    } else {
      childPosts = childPosts.map(c => ({ ...c, isLikedByUser: false }))
    }

    res.json({
      success: true,
      post: { ...mappedPost, childPosts }
    })
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ success: false, message: '获取帖子详情失败' })
  }
})

// 获取用户的帖子
router.get('/user/:uid', (req, res) => {
  try {
    const param = req.params.uid
    const { mainOnly } = req.query

    // 获取用户 id - 支持 uid 或数字 id
    let user = getOne('SELECT id FROM users WHERE uid = ?', [param])
    if (!user) {
      const id = Number(param)
      if (!isNaN(id)) {
        user = getOne('SELECT id FROM users WHERE id = ?', [id])
      }
    }
    if (!user) return res.json({ success: false, posts: [] })

    let sql = 'SELECT * FROM posts WHERE user_id = ?'
    const params = [user.id]

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
    const { title, content, parentId, mentions, tags } = req.body
    const username = req.user.username

    // 服务端校验
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.json({ success: false, message: '标题不能为空' })
    }
    if (title.length > 200) {
      return res.json({ success: false, message: '标题长度不能超过200个字符' })
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.json({ success: false, message: '内容不能为空' })
    }
    if (content.length > 50000) {
      return res.json({ success: false, message: '内容长度不能超过50000个字符' })
    }

    // 获取用户 UID
    const user = getOne('SELECT uid, userrank FROM users WHERE id = ?', [userId])
    if (!user) return res.json({ success: false, message: '用户不存在' })
    const userUid = user.uid

    // 生成 PID
    const pid = generatePid(getOne, userUid)

    // 构建 context
    let context
    if (parentId) {
      // 子帖：查找父帖 context，追加当前用户 UID
      const parentPost = getOne('SELECT pid, context, postrank FROM posts WHERE pid = ?', [parentId])
      if (!parentPost) return res.json({ success: false, message: '父帖子不存在' })

      // 检查父帖评论权限
      const userrank = Number(user.userrank)
      if (parentPost.postrank === 'FF' && userrank < 1) {
        return res.json({ success: false, message: '您的等级不足，无法评论此红帖' })
      }
      if (parentPost.postrank === '00' && userrank < 3) {
        return res.json({ success: false, message: '您的等级不足，无法评论此黑帖' })
      }

      context = `${parentPost.context}/${userUid}`
    } else {
      context = `#/${pid}`
    }

    const result = insert(
      'INSERT INTO posts (user_id, username, title, content, category, context, parent_id, pid, postrank, mentions, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, title, content, parentId ? 'comment' : 'general', context, parentId || null, pid, '69', JSON.stringify(mentions || []), JSON.stringify(tags || [])]
    )

    const newPost = {
      id: result.lastInsertRowid,
      pid,
      userId,
      username,
      title,
      content,
      category: parentId ? 'comment' : 'general',
      likes: 0,
      context,
      parentId: parentId || null,
      postrank: '69',
      mentions: mentions || [],
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 通知被@的用户（校验用户存在）
    if (mentions && mentions.length > 0) {
      const seenUserIds = new Set()
      for (const m of mentions) {
        const targetUserId = String(m.userId)
        if (targetUserId === String(userId)) continue
        if (seenUserIds.has(targetUserId)) continue
        seenUserIds.add(targetUserId)
        
        // 验证被@的用户存在
        const mentionedUser = getOne('SELECT id FROM users WHERE id = ?', [Number(targetUserId)])
        if (mentionedUser) {
          insert(
            'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
            ['mention', String(userId), pid, targetUserId]
          )
        }
      }
    }

    // 通知帖主（如果是评论）
    if (parentId) {
      const parentPost = getOne('SELECT user_id FROM posts WHERE pid = ?', [parentId])
      if (parentPost && String(parentPost.user_id) !== String(userId)) {
        insert(
          'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
          ['comment', String(userId), pid, String(parentPost.user_id)]
        )
      }
    }

    res.json({ success: true, post: newPost })
  } catch (error) {
    console.error('创建帖子失败:', error)
    res.status(500).json({ success: false, message: '发帖失败' })
  }
})

// 更新帖子
router.put('/:pid', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })
    if (post.user_id !== userId) return res.json({ success: false, message: '无权更新此帖子' })

    const { title, content, tags } = req.body
    const updates = []
    const params = []

    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (content !== undefined) { updates.push('content = ?'); params.push(content) }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)) }

    if (updates.length === 0) return res.json({ success: false, message: '没有需要更新的字段' })

    updates.push("updated_at = datetime('now', 'localtime')")
    params.push(post.id)

    run(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, params)

    const updated = getOne('SELECT * FROM posts WHERE id = ?', [post.id])
    res.json({ success: true, post: mapPost(updated) })
  } catch (error) {
    console.error('更新帖子失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// 设置帖子标记 (仅 OP)
router.put('/:pid/rank', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id
    const { postrank } = req.body

    // 检查是否为 OP
    const user = getOne('SELECT userrank FROM users WHERE id = ?', [userId])
    if (!user || Number(user.userrank) < 3) {
      return res.json({ success: false, message: '仅管理员可设置帖子标记' })
    }

    const validRanks = ['FF', '69', '78', '00']
    if (!validRanks.includes(postrank)) {
      return res.json({ success: false, message: '无效的帖子标记 (FF/69/78/00)' })
    }

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    run("UPDATE posts SET postrank = ?, updated_at = datetime('now', 'localtime') WHERE pid = ?", [postrank, pid])

    const updated = getOne('SELECT * FROM posts WHERE id = ?', [post.id])
    res.json({ success: true, post: mapPost(updated) })
  } catch (error) {
    console.error('设置帖子标记失败:', error)
    res.status(500).json({ success: false, message: '设置失败' })
  }
})

// 删除帖子
router.delete('/:pid', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })
    if (post.user_id !== userId) return res.json({ success: false, message: '无权删除此帖子' })

    // 删除该帖子及其所有子帖（通过 context LIKE）
    run('DELETE FROM posts WHERE context = ? OR context LIKE ?', [post.context, `${post.context}/%`])

    res.json({ success: true })
  } catch (error) {
    console.error('删除帖子失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// 取消点赞
router.delete('/:pid/like', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    const existingLike = getOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, userId])
    if (!existingLike) return res.json({ success: false, message: '您还没有点赞' })

    try {
      run('BEGIN TRANSACTION')
      run('DELETE FROM post_likes WHERE id = ?', [existingLike.id])
      run("UPDATE posts SET likes = MAX(likes - 1, 0), updated_at = datetime('now', 'localtime') WHERE id = ?", [post.id])
      run('COMMIT')
    } catch {
      run('ROLLBACK')
      return res.json({ success: false, message: '取消点赞失败' })
    }

    const updated = getOne('SELECT likes FROM posts WHERE pid = ?', [pid])
    res.json({ success: true, likes: updated.likes })
  } catch (error) {
    console.error('取消点赞失败:', error)
    res.status(500).json({ success: false, message: '取消点赞失败' })
  }
})

// 增加浏览量
router.post('/:pid/views', (req, res) => {
  try {
    const pid = req.params.pid

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    run("UPDATE posts SET views = views + 1, updated_at = datetime('now', 'localtime') WHERE pid = ?", [pid])

    const updated = getOne('SELECT views FROM posts WHERE pid = ?', [pid])
    res.json({ success: true, views: updated.views })
  } catch (error) {
    console.error('增加浏览量失败:', error)
    res.status(500).json({ success: false, message: '增加浏览量失败' })
  }
})

// 点赞帖子（带去重）
router.post('/:pid/like', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id

    const post = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!post) return res.json({ success: false, message: '帖子不存在' })

    // 检查是否已点赞
    const existingLike = getOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, userId])
    if (existingLike) {
      return res.json({ success: false, message: '您已经点过赞了' })
    }

    try {
      run('BEGIN TRANSACTION')
      insert('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post.id, userId])
      run("UPDATE posts SET likes = likes + 1, updated_at = datetime('now', 'localtime') WHERE id = ?", [post.id])
      run('COMMIT')
    } catch {
      run('ROLLBACK')
      return res.json({ success: false, message: '点赞失败' })
    }

    // 通知帖主
    if (String(post.user_id) !== String(userId)) {
      insert(
        'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
        ['like', String(userId), pid, String(post.user_id)]
      )
    }

    const updated = getOne('SELECT likes FROM posts WHERE pid = ?', [pid])
    res.json({ success: true, likes: updated.likes })
  } catch (error) {
    console.error('点赞失败:', error)
    res.status(500).json({ success: false, message: '点赞失败' })
  }
})

// 添加评论（支持提及）
router.post('/:pid/comment', authMiddleware, (req, res) => {
  try {
    const pid = req.params.pid
    const userId = req.user.id
    const { content, mentions } = req.body

    const parentPost = getOne('SELECT * FROM posts WHERE pid = ?', [pid])
    if (!parentPost) return res.json({ success: false, message: '帖子不存在' })

    // 检查评论权限
    const user = getOne('SELECT uid, userrank FROM users WHERE id = ?', [userId])
    const userrank = user ? Number(user.userrank) : 0

    if (parentPost.postrank === 'FF' && userrank < 1) {
      return res.json({ success: false, message: '您的等级不足 (需要玩家以上)，无法评论此红帖' })
    }
    if (parentPost.postrank === '00' && userrank < 3) {
      return res.json({ success: false, message: '您的等级不足 (需要管理员)，无法评论此黑帖' })
    }

    const username = req.user.username
    const userUid = user.uid
    const title = `回复: ${parentPost.title.substring(0, 30)}...`

    // 生成 PID（评论也有独立 PID）
    const commentPid = generatePid(getOne, userUid)

    // 构建 context
    const context = `${parentPost.context}/${userUid}`

    const result = insert(
      'INSERT INTO posts (user_id, username, title, content, category, context, parent_id, pid, postrank, mentions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, title, content, 'comment', context, parentPost.id, commentPid, '69', JSON.stringify(mentions || [])]
    )

    const childPost = {
      id: result.lastInsertRowid,
      pid: commentPid,
      userId,
      username,
      title,
      content,
      category: 'comment',
      likes: 0,
      context,
      parentId: parentPost.id,
      postrank: '69',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 通知被@的用户（校验用户存在）
    if (mentions && mentions.length > 0) {
      const seenUserIds = new Set()
      for (const m of mentions) {
        const targetUserId = String(m.userId)
        if (targetUserId === String(userId)) continue
        if (seenUserIds.has(targetUserId)) continue
        seenUserIds.add(targetUserId)
        
        const mentionedUser = getOne('SELECT id FROM users WHERE id = ?', [Number(targetUserId)])
        if (mentionedUser) {
          insert(
            'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
            ['mention', String(userId), commentPid, targetUserId]
          )
        }
      }
    }

    // 通知帖主
    if (String(parentPost.user_id) !== String(userId)) {
      insert(
        'INSERT INTO notifications (type, author, root, to_user) VALUES (?, ?, ?, ?)',
        ['comment', String(userId), commentPid, String(parentPost.user_id)]
      )
    }

    res.json({ success: true, comment: childPost })
  } catch (error) {
    console.error('评论失败:', error)
    res.status(500).json({ success: false, message: '评论失败' })
  }
})

export default router
