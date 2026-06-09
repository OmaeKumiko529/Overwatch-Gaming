/**
 * API 服务 - 统一封装 HTTP 请求
 * 核心请求模块从 core.js 导入，重新导出所有 API 子模块
 */
export { request, persistLoginSession, clearLoginSession } from './core.js'

// 导入所有 API 子模块
import { authApi } from './auth.js'
import { postsApi } from './posts.js'
import { teamsApi } from './teams.js'
import { heroesApi } from './heroes.js'
import { notificationsApi } from './notifications.js'
import { announcementsApi } from './announcements.js'
import { preferenceApi } from './preference.js'
import { adminApi } from './admin.js'
import { gitApi } from './git.js'

// 重新命名导出所有 API 子模块
export { authApi, postsApi, teamsApi, heroesApi, notificationsApi, announcementsApi, preferenceApi, adminApi, gitApi }

export default {
  authApi, postsApi, teamsApi, notificationsApi,
  preferenceApi, adminApi, gitApi, heroesApi,
  announcementsApi
}
