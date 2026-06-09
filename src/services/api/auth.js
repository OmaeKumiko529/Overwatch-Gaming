// Auth API
import { request } from './core.js'

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
    return request(`/auth/users/${encodeURIComponent(id)}`)
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
  },

  // 提升用户等级 (仅 OP)
  promoteUser(targetUid, newRank) {
    return request('/auth/promote', {
      method: 'PUT',
      body: { targetUid, newRank },
      auth: true
    })
  },

  // 验证密码（用于注销账户等场景的密码确认，不修改密码）
  verifyPassword(password) {
    return request('/auth/verify-password', {
      method: 'POST',
      body: { password },
      auth: true
    })
  }
}