/**
 * 守望先锋职责选项常量
 * 前后端共享的角色定义
 */

/** @enum {string} */
export const ROLE_OPTIONS = {
  HEAVY: 'heavy',      // 重装
  DAMAGE: 'damage',    // 输出
  SUPPORT: 'support',  // 支援
  FLEXIBLE: 'flexible' // 全能
}

/** 所有有效职责值 */
export const ALL_VALID_ROLES = Object.values(ROLE_OPTIONS)

/**
 * 验证角色数组是否有效
 * @param {string[]} roles - 职责数组
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateRoles(roles) {
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

export default ROLE_OPTIONS