import { preferenceApi } from './api.js'

// 偏好服务 - 记录用户兴趣标签并按偏好排序帖子
export const preferenceService = {
  /**
   * 记录用户浏览帖子的标签到偏好中
   * @param {string[]} tags - 帖子的标签数组
   */
  async recordTags(tags) {
    if (!tags || tags.length === 0) return
    try {
      await preferenceApi.record(tags)
    } catch {
      // 静默失败，避免干扰用户体验
    }
  },

  /**
   * 获取指定用户的偏好数据
   * @param {string|number} uid - 用户 uid 或数字 id
   * @returns {Promise<object>} - 偏好 JSON，格式 { 标签名: 次数, total: 总次数 }
   */
  async getUserPreference(uid) {
    if (!uid) return { total: 0 }
    try {
      const res = await preferenceApi.get(uid)
      if (res.success && res.preference) {
        return res.preference
      }
    } catch {}
    return { total: 0 }
  },

  /**
   * 根据用户偏好对帖子列表排序
   * 算法：每个帖子的得分 = Σ (pref[tag] / total) for tag in post.tags
   * 即命中标签的用户偏好权重之和
   * @param {object} preference - 偏好数据 { 标签: 次数, total: 总次数 }
   * @param {object[]} posts - 帖子列表，每个帖子需有 tags 数组
   * @returns {object[]} - 按偏好相似度降序排列的帖子列表
   */
  sortByPreference(preference, posts) {
    if (!preference || !preference.total || preference.total <= 0) {
      return posts
    }

    const total = preference.total

    // 计算每个标签的权重比例
    const weights = {}
    for (const key of Object.keys(preference)) {
      if (key === 'total') continue
      if (typeof preference[key] === 'number' && preference[key] > 0) {
        weights[key] = preference[key] / total
      }
    }

    // 没有有效权重时返回原顺序
    if (Object.keys(weights).length === 0) return posts

    // 对帖子计算得分并排序
    return [...posts].sort((a, b) => {
      const scoreA = this._calcScore(weights, a.tags)
      const scoreB = this._calcScore(weights, b.tags)
      return scoreB - scoreA
    })
  },

  /**
   * 计算单个帖子的偏好得分
   * @private
   */
  _calcScore(weights, tags) {
    if (!tags || tags.length === 0) return 0
    let score = 0
    for (const tag of tags) {
      if (weights[tag]) {
        score += weights[tag]
      }
    }
    return score
  }
}

export default preferenceService