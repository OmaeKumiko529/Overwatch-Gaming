// 用户管理服务 - 通过后端 API 管理用户数据
import { authApi } from './api.js'

// 缓存用户列表（避免频繁 API 请求）
let cachedUsers = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// 用户管理服务（对接后端 API）
export const userService = {
  // 从后端获取所有用户
  async getAllUsers() {
    try {
      // 如果缓存有效，直接返回
      if (cachedUsers && Date.now() < cacheExpiry) {
        return cachedUsers
      }
      const res = await authApi.getAllUsers()
      if (res.success && Array.isArray(res.users)) {
        cachedUsers = res.users
        cacheExpiry = Date.now() + CACHE_TTL
        return res.users
      }
      return []
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return []
    }
  },

  // 根据用户ID获取用户信息（ID 或 UID）
  async getUserById(userIdOrUid) {
    try {
      const res = await authApi.getUserById(userIdOrUid)
      if (res.success && res.user) {
        return res.user
      }
      // 缓存中查找
      const users = await this.getAllUsers()
      return users.find(u => String(u.id) === String(userIdOrUid) || u.uid === userIdOrUid) || null
    } catch {
      return null
    }
  },

  // 搜索用户（按用户名，前端过滤）
  searchUsers(query) {
    if (!cachedUsers) {
      // 如果缓存未加载，触发异步加载但返回空（调用方会重试）
      this.getAllUsers()
      return []
    }
    const lowerQuery = query.toLowerCase()
    return cachedUsers.filter(user =>
      user.username.toLowerCase().includes(lowerQuery)
    ).map(user => ({
      id: user.id,
      uid: user.uid,
      username: user.username,
      avatar: user.avatar || '/Head.png'
    })).slice(0, 10) // 最多10个建议
  },

  // 强制刷新用户缓存
  refreshUsers() {
    cachedUsers = null
    cacheExpiry = 0
    return this.getAllUsers()
  }
}

// 导出默认实例
export default userService