// API 服务 - 统一封装 HTTP 请求
const API_BASE = '/api'

function getToken() {
  try {
    const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
    if (sessionJson) {
      const session = JSON.parse(sessionJson)
      return session.token || null
    }
  } catch {}
  return null
}

function saveSessionToStorage(session) {
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

async function request(endpoint, options = {}) {
  const { method = 'GET', body, auth = false, params } = options

  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
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

    const data = await res.json()
    return data
  } catch (error) {
    console.error(`API 请求失败 [${method} ${url}]:`, error)
    return { success: false, message: '网络错误，请检查服务器是否正在运行' }
  }
}

// ========== Auth API ==========
export const authApi = {
  register(username, email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    })
  },

  login(username, password, rememberMe = false) {
    return request('/auth/login', {
      method: 'POST',
      body: { username, password, rememberMe }
    })
  },

  getMe() {
    return request('/auth/me', { auth: true })
  },

  getAllUsers() {
    return request('/auth/users')
  },

  getUserById(id) {
    return request(`/auth/users/${id}`)
  },

  updateUser(updates) {
    return request('/auth/update', {
      method: 'PUT',
      body: updates,
      auth: true
    })
  },

  updateRole(roles) {
    return request('/auth/role', {
      method: 'PUT',
      body: { roles },
      auth: true
    })
  },

  deleteUser() {
    return request('/auth/delete', {
      method: 'DELETE',
      auth: true
    })
  },

  changePassword(currentPassword, newPassword) {
    return request('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
      auth: true
    })
  }
}

// ========== Posts API ==========
export const postsApi = {
  getPosts(params = {}) {
    return request('/posts', { params })
  },

  getPostById(id) {
    return request(`/posts/${id}`)
  },

  getUserPosts(uid, mainOnly = false) {
    return request(`/posts/user/${uid}`, {
      params: { mainOnly: mainOnly ? 'true' : undefined }
    })
  },

  createPost(postData) {
    return request('/posts', {
      method: 'POST',
      body: postData,
      auth: true
    })
  },

  updatePost(id, updates) {
    return request(`/posts/${id}`, {
      method: 'PUT',
      body: updates,
      auth: true
    })
  },

  deletePost(id) {
    return request(`/posts/${id}`, {
      method: 'DELETE',
      auth: true
    })
  },

  likePost(id) {
    return request(`/posts/${id}/like`, {
      method: 'POST',
      auth: true
    })
  },

  addComment(postId, content) {
    return request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: { content },
      auth: true
    })
  },

  getCategories() {
    return request('/posts/categories/list')
  }
}

// ========== Teams API ==========
export const teamsApi = {
  getAllTeams() {
    return request('/teams')
  },

  createTeam(teamName) {
    return request('/teams', {
      method: 'POST',
      body: { teamName },
      auth: true
    })
  },

  joinTeam(teamName) {
    return request('/teams/join', {
      method: 'POST',
      body: { teamName },
      auth: true
    })
  },

  leaveTeam() {
    return request('/teams/leave', {
      method: 'POST',
      auth: true
    })
  },

  getTeamById(id) {
    return request(`/teams/${id}`)
  }
}

// ========== Notifications API ==========
export const notificationsApi = {
  getNotifications() {
    return request('/notifications', { auth: true })
  },

  getUnreadCount() {
    return request('/notifications/unread-count', { auth: true })
  },

  markRead(id) {
    return request(`/notifications/${id}/read`, {
      method: 'PUT',
      auth: true
    })
  },

  markAllRead() {
    return request('/notifications/read-all', {
      method: 'PUT',
      auth: true
    })
  },

  create(data) {
    return request('/notifications', {
      method: 'POST',
      body: data,
      auth: true
    })
  }
}

// ========== Announcements API ==========
export const announcementsApi = {
  getAll() {
    return request('/announcements')
  },

  getById(id) {
    return request(`/announcements/${id}`)
  },

  create(title, content) {
    return request('/announcements', {
      method: 'POST',
      body: { title, content },
      auth: true
    })
  },

  delete(id) {
    return request(`/announcements/${id}`, {
      method: 'DELETE',
      auth: true
    })
  }
}

// 辅助：保存登录会话到本地存储（兼容现有代码）
export function persistLoginSession(session) {
  saveSessionToStorage(session)
}

// 辅助：清除登录会话
export function clearLoginSession() {
  try {
    sessionStorage.removeItem('currentUser')
    localStorage.removeItem('currentUser')
  } catch {}
}

export default { authApi, postsApi, teamsApi, notificationsApi, persistLoginSession, clearLoginSession }