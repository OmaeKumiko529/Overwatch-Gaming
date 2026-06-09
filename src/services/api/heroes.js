// Heroes API (OW 英雄图鉴)
import { request } from './core.js'

export const heroesApi = {
  getAllHeroes(role = '') {
    const params = role ? { role } : {}
    return request('/heroes', { params })
  },

  getHeroDetail(key) {
    return request(`/heroes/${encodeURIComponent(key)}`)
  },

  // 管理员手动同步英雄数据（从 OverFast API 拉取到 SQLite）
  syncHeroes() {
    return request('/heroes/sync', {
      method: 'POST',
      auth: true
    })
  }
}