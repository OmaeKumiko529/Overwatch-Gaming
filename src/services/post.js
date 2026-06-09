import { postsApi } from './api.js'

// 帖子管理服务 - 通过 API 管理帖子数据
export const postService = {
  async getAllPosts() {
    const res = await postsApi.getPosts()
    return res.success ? res.posts : []
  },

  async createPost(postData, userId, username) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.createPost({
      title: postData.title,
      content: postData.content,
      category: postData.category || 'general',
      parentId: postData.parentId || null,
      mentions: postData.mentions || [],
      tags: postData.tags || []
    })

    if (res.success) {
      return { success: true, post: res.post }
    }
    return { success: false, message: res.message || '发帖失败' }
  },

  async getUserPosts(userId) {
    const res = await postsApi.getUserPosts(userId)
    return res.success ? res.posts : []
  },

  async getUserMainPosts(userId) {
    const res = await postsApi.getUserPosts(userId, true)
    return res.success ? res.posts : []
  },

  async getChildPosts(pid) {
    const res = await postsApi.getPostByPid(pid)
    if (res.success && res.post.childPosts) {
      return res.post.childPosts
    }
    return []
  },

  async getPostWithChildren(pid) {
    const res = await postsApi.getPostByPid(pid)
    return res.success ? res.post : null
  },

  async getPostByPid(pid) {
    const res = await postsApi.getPostByPid(pid)
    return res.success ? res.post : null
  },

  async deletePost(pid, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(pid)
    if (res.success) return { success: true }
    return { success: false, message: res.message || '删除失败' }
  },

  async likePost(pid, userId) {
    const res = await postsApi.likePost(pid)
    if (res.success) return { success: true, likes: res.likes }
    return { success: false, message: res.message || '点赞失败' }
  },

  async unlikePost(pid) {
    const res = await postsApi.unlikePost(pid)
    if (res.success) return { success: true, likes: res.likes }
    return { success: false, message: res.message || '取消点赞失败' }
  },

  async addComment(pid, commentText, userId, username) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.addComment(pid, commentText)
    if (res.success) return { success: true, comment: res.comment }
    return { success: false, message: res.message || '评论失败' }
  },

  async deleteComment(commentPid, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(commentPid)
    if (res.success) return { success: true }
    return { success: false, message: res.message || '删除失败' }
  },

  async searchPosts(query) {
    const res = await postsApi.getPosts({ search: query, limit: 100 })
    return res.success ? res.posts : []
  },

  async getPopularPosts(limit = 10) {
    const res = await postsApi.getPosts({ popular: 'true', limit })
    return res.success ? res.posts : []
  },

  async getLatestPosts(limit = 20) {
    const res = await postsApi.getPosts({ limit })
    return res.success ? res.posts : []
  },

  async getPostCategories() {
    const res = await postsApi.getCategories()
    return res.success ? res.categories : []
  },

  async getPostsByCategory(category, limit = 20) {
    const res = await postsApi.getPosts({ category, limit })
    return res.success ? res.posts : []
  },

  async getPostsByPostrank(postrank, limit = 20) {
    const res = await postsApi.getPosts({ postrank, limit })
    return res.success ? res.posts : []
  },

  async updatePost(pid, updates, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.updatePost(pid, updates)
    if (res.success) return { success: true, post: res.post }
    return { success: false, message: res.message || '更新失败' }
  },

  async setPostRank(pid, postrank) {
    const res = await postsApi.setPostRank(pid, postrank)
    return res
  },

  async incrementView(pid) {
    const res = await postsApi.incrementView(pid)
    return res
  }
}

export default postService