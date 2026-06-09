// Announcements API
import { request } from './core.js'

export const announcementsApi = {
  getAll() {
    return request('/announcements')
  },

  getById(id) {
    return request(`/announcements/${id}`)
  },

  create(title, content) {
    return request('/announcements', {
      method: 'POST',
      body: { title, content },
      auth: true
    })
  },

  delete(id) {
    return request(`/announcements/${id}`, {
      method: 'DELETE',
      auth: true
    })
  }
}