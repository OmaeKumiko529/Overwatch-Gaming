/**
 * API 核心请求模块
 * 与子模块无循环依赖
 */

const API_BASE = '/api'

export function getToken() {
  try {
    const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
    if (sessionJson) {
      const session = JSON.parse(sessionJson)
      return session.token || null
    }
  } catch {}
  return null
}

export function saveSessionToStorage(session) {
  try {
    if (session.rememberMe) {
      localStorage.setItem('currentUser', JSON.stringify(session))
    } else {
      sessionStorage.setItem('currentUser', JSON.stringify(session))
    }
  } catch (e) {
    console.error('保存会话失败:', e)
  }
}

export function clearLoginSession() {
  try {
    sessionStorage.removeItem('currentUser')
    localStorage.removeItem('currentUser')
  } catch {}
}

export function persistLoginSession(session) {
  saveSessionToStorage(session)
}

export async function request(endpoint, options = {}) {
  const { method = 'GET', body, auth = false, params } = options

  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // 可选认证：如果 token 存在就带上，不存在也不报错
  if (auth === 'optional') {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  let url = `${API_BASE}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    // 统一处理 401 未授权：清除本地会话
    if (res.status === 401) {
      clearLoginSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error(`API 请求失败 [${method} ${url}]:`, error)
    return { success: false, message: '网络错误，请检查服务器是否正在运行' }
  }
}