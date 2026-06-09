// Notifications API
import { request } from './core.js'

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