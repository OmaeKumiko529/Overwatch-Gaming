// 帖子 Store - 管理帖子 CRUD、评论、搜索等操作
import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEYS = {
  POSTS: 'posts'
}

export const usePostStore = defineStore('post', () => {
  // ========== 状态 ==========
  const posts = ref([])

  // ========== LocalStorage 操作 ==========
  function getFromStorage(key) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`读取 ${key} 数据失败:`, error)
      return []
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error(`保存 ${key} 数据失败:`, error)
      return false
    }
  }

  // ========== 帖子方法 ==========
  function getAllPosts() {
    posts.value = getFromStorage(STORAGE_KEYS.POSTS)
    return posts.value
  }

  function saveAllPosts(data) {
    const result = saveToStorage(STORAGE_KEYS.POSTS, data)
    if (result) posts.value = data
    return result
  }

  function createPost(postData, userId, username) {
    const allPosts = getAllPosts()
    if (!userId) return { success: false, message: '请先登录' }

    const newPost = {
      id: Date.now(),
      userId,
      username,
      title: postData.title,
      content: postData.content,
      category: postData.category || 'general',
      likes: 0,
      comments: [],
      context: postData.parentId ? `${postData.parentId}/#` : '#',
      parentId: postData.parentId || null,
      mentions: postData.mentions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    allPosts.unshift(newPost)
    if (saveAllPosts(allPosts)) return { success: true, post: newPost }
    return { success: false, message: '发帖失败，请重试' }
  }

  function getPostById(postId) {
    const allPosts = getAllPosts()
    const post = allPosts.find(p => p.id === Number(postId))
    return post ? JSON.parse(JSON.stringify(post)) : null
  }

  function getUserPosts(userId) {
    const allPosts = getAllPosts()
    return allPosts.filter(post => post.userId === userId)
  }

  function getUserMainPosts(userId) {
    const allPosts = getAllPosts()
    return allPosts.filter(post => post.userId === userId && (post.parentId === null || post.parentId === undefined))
  }

  function getChildPosts(postId) {
    const allPosts = getAllPosts()
    const numericPostId = Number(postId)
    return allPosts.filter(post => post.parentId === numericPostId)
  }

  function getPostWithChildren(postId) {
    const post = getPostById(postId)
    if (!post) return null
    post.childPosts = getChildPosts(postId)
    return post
  }

  function deletePost(postId, userId) {
    const allPosts = getAllPosts()
    if (!userId) return { success: false, message: '请先登录' }

    const numericPostId = Number(postId)
    const postIndex = allPosts.findIndex(post => post.id === numericPostId)

    if (postIndex === -1) return { success: false, message: '帖子不存在' }
    if (allPosts[postIndex].userId !== userId) return { success: false, message: '无权删除此帖子' }

    allPosts.splice(postIndex, 1)
    if (saveAllPosts(allPosts)) return { success: true }
    return { success: false, message: '删除失败' }
  }

  function updatePost(postId, updates, userId) {
    const allPosts = getAllPosts()
    const numericPostId = Number(postId)
    const postIndex = allPosts.findIndex(post => post.id === numericPostId)

    if (postIndex === -1) return { success: false, message: '帖子不存在' }
    if (allPosts[postIndex].userId !== userId) return { success: false, message: '无权更新此帖子' }

    allPosts[postIndex] = { ...allPosts[postIndex], ...updates, updatedAt: new Date().toISOString() }

    if (saveAllPosts(allPosts)) return { success: true, post: allPosts[postIndex] }
    return { success: false, message: '更新失败' }
  }

  function likePost(postId) {
    const allPosts = getAllPosts()
    const numericPostId = Number(postId)
    const postIndex = allPosts.findIndex(post => post.id === numericPostId)

    if (postIndex === -1) return { success: false, message: '帖子不存在' }

    allPosts[postIndex].likes += 1
    allPosts[postIndex].updatedAt = new Date().toISOString()

    if (saveAllPosts(allPosts)) return { success: true, likes: allPosts[postIndex].likes }
    return { success: false, message: '点赞失败' }
  }

  function addComment(postId, commentText, userId, username) {
    const allPosts = getAllPosts()
    if (!userId) return { success: false, message: '请先登录' }

    const numericPostId = Number(postId)
    const parentPostIndex = allPosts.findIndex(post => post.id === numericPostId)
    if (parentPostIndex === -1) return { success: false, message: '帖子不存在' }

    const childPost = {
      id: Date.now(),
      userId,
      username,
      title: `回复: ${allPosts[parentPostIndex].title.substring(0, 30)}...`,
      content: commentText,
      category: 'comment',
      likes: 0,
      comments: [],
      context: `${numericPostId}/#`,
      parentId: numericPostId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    allPosts.unshift(childPost)
    if (saveAllPosts(allPosts)) return { success: true, comment: childPost }
    return { success: false, message: '评论失败' }
  }

  function deleteComment(commentId, userId) {
    const allPosts = getAllPosts()
    if (!userId) return { success: false, message: '请先登录' }

    const numericCommentId = Number(commentId)
    const commentIndex = allPosts.findIndex(post => post.id === numericCommentId)
    if (commentIndex === -1) return { success: false, message: '评论不存在' }

    const comment = allPosts[commentIndex]
    const isCommentAuthor = comment.userId === userId

    let isPostAuthor = false
    if (comment.parentId) {
      const parentPost = allPosts.find(post => post.id === comment.parentId)
      if (parentPost && parentPost.userId === userId) isPostAuthor = true
    }

    if (!isCommentAuthor && !isPostAuthor) return { success: false, message: '无权删除此评论' }

    allPosts.splice(commentIndex, 1)
    if (saveAllPosts(allPosts)) return { success: true }
    return { success: false, message: '删除失败' }
  }

  function searchPosts(query) {
    const allPosts = getAllPosts()
    const lowerQuery = query.toLowerCase()
    return allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(lowerQuery)
      let contentText = post.content
      if (contentText.includes('<') && contentText.includes('>')) {
        contentText = contentText.replace(/<[^>]*>/g, ' ')
      }
      const contentMatch = contentText.toLowerCase().includes(lowerQuery)
      return titleMatch || contentMatch
    })
  }

  function getPopularPosts(limit = 10) {
    const allPosts = getAllPosts()
    return allPosts
      .filter(post => !post.parentId)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit)
  }

  function getLatestPosts(limit = 20) {
    const allPosts = getAllPosts()
    return allPosts
      .filter(post => !post.parentId)
      .slice(0, limit)
  }

  function getPostCategories() {
    const allPosts = getAllPosts()
    const categories = new Set()
    allPosts.forEach(post => {
      if (post.category && !post.parentId) categories.add(post.category)
    })
    return Array.from(categories)
  }

  function getPostsByCategory(category, limit = 20) {
    const allPosts = getAllPosts()
    return allPosts
      .filter(post => post.category === category && !post.parentId)
      .slice(0, limit)
  }

  return {
    posts,
    getAllPosts,
    saveAllPosts,
    createPost,
    getPostById,
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
    getPostsByCategory
  }
})

export default usePostStore