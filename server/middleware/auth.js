import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'owgaming-dev-secret-key-change-in-production'

export function generateToken(user) {
  return jwt.sign(
    { uid: user.uid, id: user.id, username: user.username, userrank: Number(user.userrank || 0) },
    JWT_SECRET,
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
    const decoded = jwt.verify(token, JWT_SECRET)
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
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
      } catch {}
    }
  }
  next()
}