// Admin API
import { request } from './core.js'

export const adminApi = {
  getTables() {
    return request('/admin/tables', { auth: true })
  },

  getTableData(tableName, params = {}) {
    return request(`/admin/table/${encodeURIComponent(tableName)}`, {
      params,
      auth: true
    })
  },

  insertRow(tableName, data) {
    return request(`/admin/table/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      body: data,
      auth: true
    })
  },

  updateRow(tableName, id, data) {
    return request(`/admin/table/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: data,
      auth: true
    })
  },

  deleteRow(tableName, id) {
    return request(`/admin/table/${encodeURIComponent(tableName)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      auth: true
    })
  },

  executeSql(query) {
    return request('/admin/sql', {
      method: 'POST',
      body: { query },
      auth: true
    })
  },

  getStats() {
    return request('/admin/stats', { auth: true })
  }
}