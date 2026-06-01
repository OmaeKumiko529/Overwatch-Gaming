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
      mentions: postData.mentions || []
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

  async getChildPosts(postId) {
    const res = await postsApi.getPostById(postId)
    if (res.success && res.post.childPosts) {
      return res.post.childPosts
    }
    return []
  },

  async getPostWithChildren(postId) {
    const res = await postsApi.getPostById(postId)
    return res.success ? res.post : null
  },

  async getPostById(postId) {
    const res = await postsApi.getPostById(postId)
    return res.success ? res.post : null
  },

  async deletePost(postId, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(postId)
    if (res.success) return { success: true }
    return { success: false, message: res.message || '删除失败' }
  },

  async likePost(postId, userId) {
    const res = await postsApi.likePost(postId)
    if (res.success) return { success: true, likes: res.likes }
    return { success: false, message: res.message || '点赞失败' }
  },

  async addComment(postId, commentText, userId, username) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.addComment(postId, commentText)
    if (res.success) return { success: true, comment: res.comment }
    return { success: false, message: res.message || '评论失败' }
  },

  async deleteComment(commentId, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(commentId)
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

  async updatePost(postId, updates, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.updatePost(postId, updates)
    if (res.success) return { success: true, post: res.post }
    return { success: false, message: res.message || '更新失败' }
  }
}

export default postService