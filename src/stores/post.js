// 帖子 Store - 管理帖子 CRUD、评论、搜索等操作
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { postsApi } from '../services/api.js'
import { useNotificationStore } from './notification.js'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])

  async function getAllPosts() {
    const res = await postsApi.getPosts()
    if (res.success) {
      posts.value = res.posts
    }
    return posts.value
  }

  async function createPost(postData, userId, username) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.createPost({
      title: postData.title,
      content: postData.content,
      category: postData.category || 'general',
      parentId: postData.parentId || null,
      mentions: postData.mentions || []
    })

    if (res.success) {
      // 通知被@的用户
      if (postData.mentions && postData.mentions.length > 0) {
        const notifStore = useNotificationStore()
        postData.mentions.forEach(m => {
          if (String(m.userId) !== String(userId)) {
            notifStore.push({
              type: 'mention',
              Author: String(userId),
              Root: res.post.pid,
              To: String(m.userId)
            })
          }
        })
      }
      posts.value.unshift(res.post)
      return { success: true, post: res.post }
    }
    return { success: false, message: res.message || '发帖失败，请重试' }
  }

  async function getPostByPid(pid) {
    const res = await postsApi.getPostByPid(pid)
    return res.success ? res.post : null
  }

  async function getUserPosts(userId) {
    const res = await postsApi.getUserPosts(userId)
    return res.success ? res.posts : []
  }

  async function getUserMainPosts(userId) {
    const res = await postsApi.getUserPosts(userId, true)
    return res.success ? res.posts : []
  }

  async function getChildPosts(pid) {
    const res = await postsApi.getPostByPid(pid)
    if (res.success && res.post.childPosts) {
      return res.post.childPosts
    }
    return []
  }

  async function getPostWithChildren(pid) {
    const res = await postsApi.getPostByPid(pid)
    return res.success ? res.post : null
  }

  async function deletePost(pid, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(pid)
    if (res.success) {
      posts.value = posts.value.filter(p => p.pid !== pid)
      return { success: true }
    }
    return { success: false, message: res.message || '删除失败' }
  }

  async function updatePost(pid, updates, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.updatePost(pid, updates)
    if (res.success) {
      const idx = posts.value.findIndex(p => p.pid === pid)
      if (idx !== -1) posts.value[idx] = res.post
      return { success: true, post: res.post }
    }
    return { success: false, message: res.message || '更新失败' }
  }

  async function likePost(pid) {
    const res = await postsApi.likePost(pid)
    if (res.success) {
      // 通知帖主
      const post = posts.value.find(p => p.pid === pid)
      if (post) {
        post.likes = res.likes
        const posterId = post.userId
        const notifStore = useNotificationStore()
        if (String(posterId) !== String(notifStore.currentUid)) {
          notifStore.push({
            type: 'like',
            Author: String(notifStore.currentUid || ''),
            Root: pid,
            To: String(posterId)
          })
        }
      }
      return { success: true, likes: res.likes }
    }
    return { success: false, message: res.message || '点赞失败' }
  }

  async function addComment(pid, commentText, userId, username) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.addComment(pid, commentText)
    if (res.success) {
      // 通知帖主
      const notifStore = useNotificationStore()
      notifStore.push({
        type: 'comment',
        Author: String(userId),
        Root: pid,
        To: String(notifStore.currentUid)
      })
      return { success: true, comment: res.comment }
    }
    return { success: false, message: res.message || '评论失败' }
  }

  async function deleteComment(commentPid, userId) {
    if (!userId) return { success: false, message: '请先登录' }

    const res = await postsApi.deletePost(commentPid)
    return res.success
      ? { success: true }
      : { success: false, message: res.message || '删除失败' }
  }

  async function searchPosts(query) {
    const res = await postsApi.getPosts({ search: query, limit: 100 })
    return res.success ? res.posts : []
  }

  async function getPopularPosts(limit = 10) {
    const res = await postsApi.getPosts({ popular: 'true', limit })
    return res.success ? res.posts : []
  }

  async function getLatestPosts(limit = 20) {
    const res = await postsApi.getPosts({ limit })
    return res.success ? res.posts : []
  }

  async function getPostCategories() {
    const res = await postsApi.getCategories()
    return res.success ? res.categories : []
  }

  async function getPostsByCategory(category, limit = 20) {
    const res = await postsApi.getPosts({ category, limit })
    return res.success ? res.posts : []
  }

  async function getPostsByPostrank(postrank, limit = 20) {
    const res = await postsApi.getPosts({ postrank, limit })
    return res.success ? res.posts : []
  }

  return {
    posts,
    getAllPosts,
    createPost,
    getPostByPid,
    getUserPosts,
    getUserMainPosts,
    getChildPosts,
    getPostWithChildren,
    deletePost,
    updatePost,
    likePost,
    addComment,
    deleteComment,
    searchPosts,
    getPopularPosts,
    getLatestPosts,
    getPostCategories,
    getPostsByCategory,
    getPostsByPostrank
  }
})

export default usePostStore