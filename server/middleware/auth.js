import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置！请在 server/.env 中配置 JWT_SECRET')
  }
  return secret
}

export function generateToken(user) {
  return jwt.sign(
    { uid: user.uid, id: user.id, username: user.username, userrank: Number(user.userrank || 0) },
    getJwtSecret(),
    { expiresIn: '30d' }
  )
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ success: false, message: '请先登录' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, message: '无效的认证令牌' })
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret())
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: '认证已过期，请重新登录' })
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret())
        req.user = decoded
      } catch {}
    }
  }
  next()
}