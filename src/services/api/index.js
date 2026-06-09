/**
 * API 服务 - 统一封装 HTTP 请求
 * 核心请求模块从 core.js 导入，重新导出所有 API 子模块
 */
export { request, persistLoginSession, clearLoginSession } from './core.js'

// 重新导出所有 API 子模块
export { authApi } from './auth.js'
export { postsApi } from './posts.js'
export { teamsApi } from './teams.js'
export { heroesApi } from './heroes.js'
export { notificationsApi } from './notifications.js'
export { announcementsApi } from './announcements.js'
export { preferenceApi } from './preference.js'
export { adminApi } from './admin.js'
export { gitApi } from './git.js'

export default {
  authApi, postsApi, teamsApi, notificationsApi,
  preferenceApi, adminApi, gitApi, heroesApi,
  announcementsApi
}
