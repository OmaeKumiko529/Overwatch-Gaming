// 通知服务 - 通过 API 管理通知数据
import { notificationsApi } from './api.js'

export const notificationService = {
  async getAll() {
    const res = await notificationsApi.getNotifications()
    return res.success ? res.notifications : []
  },

  async create(data) {
    const res = await notificationsApi.create(data)
    return res.success ? res.notification : null
  },

  async getByUser(uid) {
    const res = await notificationsApi.getNotifications()
    return res.success
      ? res.notifications.filter(n => n.To === uid)
      : []
  },

  async getUnreadCount(uid) {
    const res = await notificationsApi.getUnreadCount()
    return res.success ? res.count : 0
  },

  async markRead(id) {
    await notificationsApi.markRead(id)
  },

  async markAllRead(uid) {
    await notificationsApi.markAllRead()
  },

  async seedAnnouncement(title) {
    // 种子数据功能由后端初始化处理
    return { success: false, message: '功能已迁移到后端' }
  }
}

export default notificationService