import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { getDb, getOne, getAll, insert, run } from '../db.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import { generateUid } from '../utils/identifiers.js'
import { validateUsername, validateEmail, validatePassword, validateRoles } from '../utils/validators.js'

const router = Router()

// 登录限流：每个IP每分钟最多5次登录尝试
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '登录尝试过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

// 注册限流：每个IP每小时最多3次注册
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: '注册过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
})

// 确保数据库已初始化
router.use(async (req, res, next) => {
  await getDb()
  next()
})

// 辅助：脱敏邮箱（仅显示前两位字符和域名）
function maskEmail(email) {
  if (!email) return null
  const parts = email.split('@')
  if (parts.length !== 2) return email
  const name = parts[0]
  const domain = parts[1]
  const maskedName = name.length <= 2 ? name.substring(0, 1) + '***' : name.substring(0, 2) + '***'
  return `${maskedName}@${domain}`
}

// 辅助：将数据库行映射为前端用户对象
function mapUser(user) {
  return {
    id: user.id,
    uid: user.uid || null,
    username: user.username,
    nickname: user.nickname || null,
    displayName: user.nickname || user.username,
    email: user.email,
    role: JSON.parse(user.role || '["flexible"]'),
    userrank: user.userrank !== undefined ? Number(user.userrank) : 0,
    isAdmin: Number(user.userrank || 0) >= 3,
    avatar: user.avatar || '/Head.png',
    teamId: user.team_id || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}

// 返回 session 格式
function buildSession(user, token, rememberMe = false) {
  const mapped = mapUser(user)
  return {
    ...mapped,
    token,
    loggedIn: true,
    loginTime: new Date().toISOString(),
    rememberMe
  }
}

// 注册（带限流和服务端校验）
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body

    // 服务端输入校验
    const usernameCheck = validateUsername(username)
    if (!usernameCheck.valid) return res.json(usernameCheck)

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) return res.json(emailCheck)

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) return res.json(passwordCheck)

    // 检查用户名是否存在
    const existing = getOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    if (existing) {
      return res.json({ success: false, message: '用户名或邮箱已存在' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // 生成本地时间字符串用于 UID
    const now = new Date()
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

    // 生成 UID
    const uid = generateUid(getOne, localDateStr)

    const result = insert(
      'INSERT INTO users (username, email, password_hash, role, uid, userrank) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, '["flexible"]', uid, 0]
    )

    const user = {
      id: result.lastInsertRowid,
      uid,
      username,
      email,
      role: '["flexible"]',
      avatar: '/Head.png',
      userrank: 0
    }

    const token = generateToken(user)

    res.json({
      success: true,
      user: buildSession(user, token)
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ success: false, message: '注册失败' })
  }
})

// 登录（带限流）
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body
    await getDb()

    const user = getOne('SELECT * FROM users WHERE username = ? OR email = ?', [username, username])
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }

    if (!await bcrypt.compare(password, user.password_hash)) {
      return res.json({ success: false, message: '密码错误' })
    }

    const token = generateToken(user)

    res.json({
      success: true,
      user: buildSession(user, token, !!rememberMe)
    })
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
        ...mapUser(user)
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败' })
  }
})

// 获取所有用户（公开API，邮箱脱敏）
router.get('/users', async (req, res) => {
  try {
    await getDb()
    const users = getAll('SELECT id, uid, username, nickname, email, role, userrank, avatar, team_id, created_at, updated_at FROM users')
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        uid: u.uid || null,
        username: u.username,
        nickname: u.nickname || null,
        displayName: u.nickname || u.username,
        email: maskEmail(u.email),
        role: JSON.parse(u.role || '["flexible"]'),
        userrank: Number(u.userrank || 0),
        isAdmin: Number(u.userrank || 0) >= 3,
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

// 获取单个用户 - 支持 uid 字符串或数字 id（公开API，邮箱脱敏）
router.get('/users/:uid', async (req, res) => {
  try {
    await getDb()
    const param = req.params.uid
    // 尝试按 uid 查询（字符串），否则按 id 查询（数字）
    let user = getOne('SELECT id, uid, username, nickname, email, role, userrank, avatar, team_id, created_at, updated_at FROM users WHERE uid = ?', [param])
    if (!user) {
      const id = Number(param)
      if (!isNaN(id)) {
        user = getOne('SELECT id, uid, username, nickname, email, role, userrank, avatar, team_id, created_at, updated_at FROM users WHERE id = ?', [id])
      }
    }
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }
    res.json({
      success: true,
      user: {
        ...mapUser(user),
        email: maskEmail(user.email)
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

    const allowedFields = ['email', 'avatar', 'username', 'nickname']
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
      user: mapUser(user)
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

    const rolesCheck = validateRoles(roles)
    if (!rolesCheck.valid) return res.json(rolesCheck)

    const roleJson = JSON.stringify(roles)
    run("UPDATE users SET role = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [roleJson, userId])

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    res.json({
      success: true,
      user: mapUser(user)
    })
  } catch (error) {
    console.error('更新职责失败:', error)
    res.status(500).json({ success: false, message: '更新职责失败' })
  }
})

// 提升用户等级 (仅 OP)
router.put('/promote', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const operatorId = req.user.id
    const { targetUid, newRank } = req.body

    // 检查操作者是否为 OP
    const operator = getOne('SELECT userrank FROM users WHERE id = ?', [operatorId])
    if (!operator || Number(operator.userrank) < 3) {
      return res.json({ success: false, message: '仅管理员可提升用户等级' })
    }

    // 检查目标用户
    const target = getOne('SELECT id, uid, username, userrank FROM users WHERE uid = ? OR id = ?', [targetUid, Number(targetUid) || 0])
    if (!target) {
      return res.json({ success: false, message: '目标用户不存在' })
    }

    const rank = Number(newRank)
    if (isNaN(rank) || rank < 0 || rank > 3) {
      return res.json({ success: false, message: '无效的用户等级 (0-3)' })
    }

    run('UPDATE users SET userrank = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?', [rank, target.id])

    res.json({
      success: true,
      message: `已将用户 ${target.username} 的等级更新为 ${rank}`
    })
  } catch (error) {
    console.error('提升等级失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
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
    if (!await bcrypt.compare(currentPassword, user.password_hash)) {
      return res.json({ success: false, message: '当前密码错误' })
    }

    if (newPassword.length < 6) {
      return res.json({ success: false, message: '密码长度至少为6位' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    run("UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?", [passwordHash, userId])

    res.json({ success: true })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({ success: false, message: '修改密码失败' })
  }
})

// 验证密码（用于注销账户等场景的密码确认，不修改密码）
router.post('/verify-password', authMiddleware, async (req, res) => {
  try {
    await getDb()
    const userId = req.user.id
    const { password } = req.body

    if (!password) {
      return res.json({ success: false, message: '密码不能为空' })
    }

    const user = getOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }

    if (!await bcrypt.compare(password, user.password_hash)) {
      return res.json({ success: false, message: '密码错误' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('验证密码失败:', error)
    res.status(500).json({ success: false, message: '验证密码失败' })
  }
})

export default router