// 认证 Store - 管理用户认证、会话和基础数据操作
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 本地存储键名
const STORAGE_KEYS = {
  USERS: 'users',
  CURRENT_USER: 'currentUser',
  TEAMS: 'teams',
  POSTS: 'posts'
}

// 职责选项
const ROLE_OPTIONS = {
  HEAVY: 'heavy',
  DAMAGE: 'damage',
  SUPPORT: 'support',
  FLEXIBLE: 'flexible'
}

const ALL_VALID_ROLES = Object.values(ROLE_OPTIONS)

const validateRoles = (roles) => {
  if (!Array.isArray(roles)) {
    return { valid: false, message: '职责必须是数组' }
  }
  if (roles.length === 0) {
    return { valid: false, message: '至少选择一个职责' }
  }
  for (const role of roles) {
    if (!ALL_VALID_ROLES.includes(role)) {
      return { valid: false, message: `无效的职责选项: ${role}` }
    }
  }
  const hasFlexible = roles.includes(ROLE_OPTIONS.FLEXIBLE)
  const hasOtherRoles = roles.some(role => role !== ROLE_OPTIONS.FLEXIBLE)
  if (hasFlexible && hasOtherRoles) {
    return { valid: false, message: '灵活选项不能与其他职责同时选择' }
  }
  if (!hasFlexible && roles.length > 2) {
    return { valid: false, message: '最多只能选择2个职责' }
  }
  return { valid: true }
}

export const useAuthStore = defineStore('auth', () => {
  // ========== 状态 ==========
  const currentUser = ref(null)

  // ========== 计算属性 ==========
  const isLoggedIn = computed(() => currentUser.value !== null)
  const currentUsername = computed(() => currentUser.value?.username || null)

  // ========== LocalStorage 工具方法 ==========
  function getFromStorage(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`读取 ${key} 数据失败:`, error)
      return []
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error(`保存 ${key} 数据失败:`, error)
      return false
    }
  }

  // ========== 认证方法 ==========
  function loadSession() {
    try {
      let sessionJson = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (!sessionJson) {
        sessionJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      }
      if (sessionJson) {
        const session = JSON.parse(sessionJson)
        if (session.rememberMe) {
          const loginTime = new Date(session.loginTime)
          const now = new Date()
          const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24)
          if (daysDiff > 30) {
            logout()
            return null
          }
        }
        currentUser.value = session
        return session
      }
      return null
    } catch (error) {
      console.error('获取当前用户失败:', error)
      return null
    }
  }

  function saveSession(session, rememberMe = false) {
    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session))
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session))
      }
      return true
    } catch (error) {
      console.error('保存会话失败:', error)
      return false
    }
  }

  function getAllUsers() {
    return getFromStorage(STORAGE_KEYS.USERS)
  }

  function saveAllUsers(users) {
    return saveToStorage(STORAGE_KEYS.USERS, users)
  }

  function registerUser(userData) {
    const users = getAllUsers()
    if (users.some(user => user.username === userData.username)) {
      return { success: false, message: '用户名已存在' }
    }
    if (users.some(user => user.email === userData.email)) {
      return { success: false, message: '邮箱已被注册' }
    }

    const newUser = {
      id: Date.now(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: [ROLE_OPTIONS.FLEXIBLE],
      avatar: '/Head.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    users.push(newUser)
    if (saveAllUsers(users)) {
      return { success: true, user: newUser }
    }
    return { success: false, message: '注册失败，请重试' }
  }

  function login(username, password, rememberMe = false) {
    const users = getAllUsers()
    const user = users.find(u => u.username === username || u.email === username)

    if (!user) return { success: false, message: '用户不存在' }
    if (user.password !== password) return { success: false, message: '密码错误' }

    const session = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: Array.isArray(user.role) ? user.role : [user.role || 'flexible'],
      avatar: user.avatar || '/Head.png',
      loggedIn: true,
      loginTime: new Date().toISOString(),
      rememberMe
    }

    saveSession(session, rememberMe)
    currentUser.value = session
    return { success: true, user: session }
  }

  function logout() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
      currentUser.value = null
      return true
    } catch (error) {
      console.error('注销失败:', error)
      return false
    }
  }

  function validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少为6位' }
    }
    return { valid: true }
  }

  function getUserById(userId) {
    const users = getAllUsers()
    const user = users.find(u => u.id === Number(userId))
    if (!user) return null
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: Array.isArray(user.role) ? user.role : [user.role || 'flexible'],
      avatar: user.avatar || '/Head.png',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      teamId: user.teamId || null
    }
  }

  function updateUser(userId, updates) {
    const users = getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    if (userIndex === -1) return { success: false, message: '用户不存在' }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    if (saveAllUsers(users)) {
      if (currentUser.value && currentUser.value.id === userId) {
        currentUser.value = { ...currentUser.value, ...updates }
        saveSession(currentUser.value, currentUser.value.rememberMe)
      }
      return { success: true, user: users[userIndex] }
    }
    return { success: false, message: '更新失败' }
  }

  function deleteUser(userId) {
    const users = getAllUsers()
    const filteredUsers = users.filter(user => user.id !== userId)
    if (filteredUsers.length === users.length) return { success: false, message: '用户不存在' }

    if (saveAllUsers(filteredUsers)) {
      if (currentUser.value && currentUser.value.id === userId) {
        logout()
      }
      return { success: true }
    }
    return { success: false, message: '删除失败' }
  }

  function updateUserRole(userId, roleOrRoles) {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
    const users = getAllUsers()
    const userIndex = users.findIndex(user => user.id === userId)
    if (userIndex === -1) return { success: false, message: '用户不存在' }

    const validation = validateRoles(roles)
    if (!validation.valid) return { success: false, message: validation.message }

    users[userIndex].role = roles
    users[userIndex].updatedAt = new Date().toISOString()

    if (saveAllUsers(users)) {
      if (currentUser.value && currentUser.value.id === userId) {
        currentUser.value.role = roles
        saveSession(currentUser.value, currentUser.value.rememberMe)
      }
      return { success: true, user: users[userIndex] }
    }
    return { success: false, message: '更新职责失败' }
  }

  function initTestData() {
    const users = getAllUsers()
    if (users.length === 0) {
      const testUsers = [
        { id: 1, username: 'testuser', email: 'test@example.com', password: 'password123', role: 'flexible', avatar: '/Head.png', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
        { id: 2, username: 'demo', email: 'demo@example.com', password: 'demo123', role: 'flexible', avatar: '/Head.png', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' }
      ]
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(testUsers))
      console.log('测试数据已初始化')
    }
  }

  // 初始化时加载会话
  loadSession()

  return {
    currentUser,
    isLoggedIn,
    currentUsername,
    ROLE_OPTIONS,
    loadSession,
    getAllUsers,
    saveAllUsers,
    registerUser,
    login,
    logout,
    validatePassword,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    initTestData
  }
})

export default useAuthStore