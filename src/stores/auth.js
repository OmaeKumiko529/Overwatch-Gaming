// 认证 Store - 管理用户认证、会话和基础数据操作
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, persistLoginSession, clearLoginSession } from '../services/api.js'

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
  const currentDisplayName = computed(() => currentUser.value?.displayName || currentUser.value?.username || null)
  const currentUid = computed(() => currentUser.value?.uid || null)
  const userrank = computed(() => Number(currentUser.value?.userrank ?? 0))
  const isAdmin = computed(() => userrank.value >= 3)
  const isPlayer = computed(() => userrank.value >= 1)
  const isTrustedPlayer = computed(() => userrank.value >= 2)

  // ========== 会话管理 ==========
  function loadSession() {
    try {
      const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
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
        // 如果有 token，尝试验证
        if (session.token) {
          currentUser.value = session
          // 后台验证 token 是否有效（静默更新用户信息）
          authApi.getMe().then(res => {
            if (res.success && res.user) {
              const merged = { ...session, ...res.user, token: session.token, loggedIn: true, loginTime: session.loginTime, rememberMe: session.rememberMe }
              currentUser.value = merged
              persistLoginSession(merged)
            } else {
              // token 失效，清除会话
              console.warn('会话已过期，请重新登录')
              clearLoginSession()
              currentUser.value = null
            }
          }).catch(() => {})
          return session
        }
        // 无 token，清除无效会话
        clearLoginSession()
        currentUser.value = null
        return null
      }
      return null
    } catch (error) {
      console.error('获取当前用户失败:', error)
      return null
    }
  }

  // ========== 认证方法 ==========
  async function registerUser(userData) {
    const res = await authApi.register(userData.username, userData.email, userData.password)
    if (res.success) {
      const session = res.user
      persistLoginSession(session)
      currentUser.value = session
      return { success: true, user: session }
    }
    return { success: false, message: res.message || '注册失败' }
  }

  async function login(username, password, rememberMe = false) {
    const res = await authApi.login(username, password, rememberMe)
    if (res.success) {
      const session = res.user
      session.rememberMe = rememberMe
      session.loginTime = new Date().toISOString()
      persistLoginSession(session)
      currentUser.value = session
      return { success: true, user: session }
    }
    return { success: false, message: res.message || '登录失败' }
  }

  function logout() {
    clearLoginSession()
    currentUser.value = null
    return true
  }

  function validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: '密码长度至少为6位' }
    }
    return { valid: true }
  }

  async function getAllUsers() {
    const res = await authApi.getAllUsers()
    return res.success ? res.users : []
  }

  async function getUserById(userIdOrUid) {
    const res = await authApi.getUserById(userIdOrUid)
    if (res.success) {
      return res.user
    }
    return null
  }

  async function updateUser(userId, updates) {
    const res = await authApi.updateUser(updates)
    if (res.success) {
      if (currentUser.value && currentUser.value.id === userId) {
        const merged = { ...currentUser.value, ...res.user }
        currentUser.value = merged
        persistLoginSession(merged)
      }
      return { success: true, user: res.user }
    }
    return { success: false, message: res.message || '更新失败' }
  }

  async function deleteUser(userId) {
    const res = await authApi.deleteUser()
    if (res.success) {
      if (currentUser.value && currentUser.value.id === userId) {
        logout()
      }
      return { success: true }
    }
    return { success: false, message: res.message || '删除失败' }
  }

  async function updateUserRole(userId, roleOrRoles) {
    const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
    const validation = validateRoles(roles)
    if (!validation.valid) return { success: false, message: validation.message }

    const res = await authApi.updateRole(roles)
    if (res.success) {
      if (currentUser.value && currentUser.value.id === userId) {
        currentUser.value.role = roles
        persistLoginSession(currentUser.value)
      }
      return { success: true, user: res.user }
    }
    return { success: false, message: res.message || '更新职责失败' }
  }

  // 提升用户等级（仅 OP）
  async function promoteUser(targetUid, newRank) {
    const res = await authApi.promoteUser(targetUid, newRank)
    return res
  }

  function initTestData() {
    console.log('测试数据由后端管理')
  }

  // 监听 auth:unauthorized 事件（来自 api.js 的 401 拦截），自动登出
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:unauthorized', () => {
      if (currentUser.value) {
        clearLoginSession()
        currentUser.value = null
        console.warn('认证已过期，已自动登出')
      }
    })
  }

  // 初始化时加载会话
  loadSession()

  return {
    currentUser,
    isLoggedIn,
    currentUsername,
    currentUid,
    userrank,
    isAdmin,
    isPlayer,
    isTrustedPlayer,
    ROLE_OPTIONS,
    loadSession,
    getAllUsers,
    registerUser,
    login,
    logout,
    validatePassword,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    promoteUser,
    initTestData
  }
})

export default useAuthStore