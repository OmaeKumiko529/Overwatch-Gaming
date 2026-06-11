/**
 * 服务端输入校验工具
 * 与前端 src/constants/roles.js 保持同步
 */

export const ROLE_OPTIONS = {
  HEAVY: 'heavy',
  DAMAGE: 'damage',
  SUPPORT: 'support',
  FLEXIBLE: 'flexible'
}

export const ALL_VALID_ROLES = Object.values(ROLE_OPTIONS)

/**
 * 验证角色数组
 * @param {string[]} roles
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return { valid: false, message: '至少选择一个职责' }
  }
  for (const role of roles) {
    if (!ALL_VALID_ROLES.includes(role)) {
      return { valid: false, message: `无效的职责选项: ${role}` }
    }
  }
  const hasFlexible = roles.includes(ROLE_OPTIONS.FLEXIBLE)
  const hasOtherRoles = roles.some(r => r !== ROLE_OPTIONS.FLEXIBLE)
  if (hasFlexible && hasOtherRoles) {
    return { valid: false, message: '灵活选项不能与其他职责同时选择' }
  }
  if (!hasFlexible && roles.length > 2) {
    return { valid: false, message: '最多只能选择2个职责' }
  }
  return { valid: true }
}

/**
 * 验证用户名格式
 * @param {string} username
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: '用户名不能为空' }
  }
  if (username.length < 2 || username.length > 20) {
    return { valid: false, message: '用户名长度必须在2-20个字符之间' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: '用户名只能包含数字、字母、下划线' }
  }
  return { valid: true }
}

/**
 * 验证邮箱格式
 * @param {string} email
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: '邮箱不能为空' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: '邮箱格式不正确' }
  }
  if (email.length > 100) {
    return { valid: false, message: '邮箱长度不能超过100个字符' }
  }
  return { valid: true }
}

/**
 * 验证密码格式
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: '密码不能为空' }
  }
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少为6位' }
  }
  if (password.length > 128) {
    return { valid: false, message: '密码长度不能超过128位' }
  }
  return { valid: true }
}