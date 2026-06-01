import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = Router()

// 确保数据库已初始化
router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 检查用户名是否存在
    const existing = getOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    if (existing) {
      return res.json({ success: false, message: '用户名或邮箱已存在' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const result = insert(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    )

    const user = {
      id: result.lastInsertRowid,
      username,
      email,
      role: ['flexible'],
      avatar: '/Head.png'
    }

    const token = generateToken(user)

    res.json({
      success: true,
      user: { ...user, token, loggedIn: true, loginTime: new Date().toISOString(), rememberMe: false }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ success: false, message: '注册失败' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body
    await getDb()

    const user = getOne('SELECT * FROM users WHERE username = ? OR email = ?', [username, username])
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.json({ success: false, message: '密码错误' })
    }

    const token = generateToken(user)

    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: JSON.parse(user.role || '["flexible"]'),
      isAdmin: !!user.is_admin,
      avatar: user.avatar || '/Head.png',
      teamId: user.team_id || null,
      loggedIn: true,
      loginTime: new Date().toISOString(),
      rememberMe: !!rememberMe,
      token
    }

    res.json({ success: true, user: session })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ success: false, message: '登录失败' })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const user = getOne('SELECT * FROM users WHERE id = ?', [req.user.id])
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: JSON.parse(user.role || '["flexible"]'),
        isAdmin: !!user.is_admin,
        avatar: user.avatar || '/Head.png',
        teamId: user.team_id || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败' })
  }
})

// 获取所有用户
router.get('/users', async (req, res) => {
  try {
    await getDb()
    const users = getAll('SELECT id, username, email, role, is_admin, avatar, team_id, created_at, updated_at FROM users')
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: JSON.parse(u.role || '["flexible"]'),
        isAdmin: !!u.is_admin,
        avatar: u.avatar || '/Head.png',
        teamId: u.team_id || null,
        createdAt: u.created_at,
        updatedAt: u.updated_at
      }))
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ success: false, message: '获取用户列表失败' })
  }
})

// 获取单个用户
router.get('/users/:id', async (req, res) => {
  try {
    await getDb()
    const user = getOne('SELECT id, username, email, role, is_admin, avatar, team_id, created_at, updated_at FROM users WHERE id = ?', [Number(req.params.id)])
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: JSON.parse(user.role || '["flexible"]'),
        isAdmin: !!user.is_admin,
        avatar: user.avatar || '/Head.png',
        teamId: user.team_id || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })
  } catch (error) {
    console.error('获取用户失败:', error)
    res.status(500).json({ success: false, message: '获取用户失败' })
  }
})

// 更新用户信息
router.put('/update', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const userId = req.user.id
    const updates = req.body

    const allowedFields = ['email', 'avatar', 'username']
    const setClauses = []
    const params = []

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'email') {
          const existing = getOne('SELECT id FROM users WHERE email = ? AND id != ?', [updates.email, userId])
          if (existing) return res.json({ success: false, message: '邮箱已被使用' })
        }
        if (field === 'username') {
          const existing = getOne('SELECT id FROM users WHERE username = ? AND id != ?', [updates.username, userId])
          if (existing) return res.json({ success: false, message: '用户名已被使用' })
        }
        setClauses.push(`${field} = ?`)
        params.push(updates[field])
      }
    }

    if (setClauses.length === 0) {
      return res.json({ success: false, message: '没有需要更新的字段' })
    }

    setClauses.push("updated_at = datetime('now', 'localtime')")
    params.push(userId)

    run(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params)

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: JSON.parse(user.role || '["flexible"]'),
        avatar: user.avatar || '/Head.png',
        teamId: user.team_id || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// 更新用户职责
router.put('/role', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const userId = req.user.id
    const { roles } = req.body

    const ALL_VALID_ROLES = ['heavy', 'damage', 'support', 'flexible']
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.json({ success: false, message: '至少选择一个职责' })
    }
    for (const role of roles) {
      if (!ALL_VALID_ROLES.includes(role)) {
        return res.json({ success: false, message: `无效的职责选项: ${role}` })
      }
    }
    const hasFlexible = roles.includes('flexible')
    const hasOtherRoles = roles.some(r => r !== 'flexible')
    if (hasFlexible && hasOtherRoles) {
      return res.json({ success: false, message: '灵活选项不能与其他职责同时选择' })
    }
    if (!hasFlexible && roles.length > 2) {
      return res.json({ success: false, message: '最多只能选择2个职责' })
    }

    const roleJson = JSON.stringify(roles)
    run("UPDATE users SET role = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [roleJson, userId])

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: JSON.parse(user.role || '["flexible"]'),
        avatar: user.avatar || '/Head.png',
        teamId: user.team_id || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    })
  } catch (error) {
    console.error('更新职责失败:', error)
    res.status(500).json({ success: false, message: '更新职责失败' })
  }
})

// 删除用户
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    await getDb()
    run('DELETE FROM users WHERE id = ?', [req.user.id])
    res.json({ success: true })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const userId = req.user.id
    const { currentPassword, newPassword } = req.body

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.json({ success: false, message: '当前密码错误' })
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: '密码长度至少为6位' })
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10)
    run("UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [passwordHash, userId])

    res.json({ success: true })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ success: false, message: '修改密码失败' })
  }
})

export default router