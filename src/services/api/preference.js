// Preference API
import { request } from './core.js'

export const preferenceApi = {
  record(tags) {
    return request('/preference/record', {
      method: 'POST',
      body: { tags },
      auth: true
    })
  },
  get(uid) {
    return request(`/preference/${encodeURIComponent(uid)}`)
  }
}