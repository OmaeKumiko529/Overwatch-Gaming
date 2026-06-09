// Posts API
import { request } from './core.js'

export const postsApi = {
  getPosts(params = {}) {
    return request('/posts', { params })
  },

  getPostByPid(pid) {
    return request(`/posts/${encodeURIComponent(pid)}`, { auth: 'optional' })
  },

  getUserPosts(uid, mainOnly = false) {
    return request(`/posts/user/${encodeURIComponent(uid)}`, {
      params: { mainOnly: mainOnly ? 'true' : undefined }
    })
  },

  createPost(postData) {
    return request('/posts', {
      method: 'POST',
      body: postData,
      auth: true
    })
  },

  updatePost(pid, updates) {
    return request(`/posts/${encodeURIComponent(pid)}`, {
      method: 'PUT',
      body: updates,
      auth: true
    })
  },

  setPostRank(pid, postrank) {
    return request(`/posts/${encodeURIComponent(pid)}/rank`, {
      method: 'PUT',
      body: { postrank },
      auth: true
    })
  },

  deletePost(pid) {
    return request(`/posts/${encodeURIComponent(pid)}`, {
      method: 'DELETE',
      auth: true
    })
  },

  likePost(pid) {
    return request(`/posts/${encodeURIComponent(pid)}/like`, {
      method: 'POST',
      auth: true
    })
  },

  unlikePost(pid) {
    return request(`/posts/${encodeURIComponent(pid)}/like`, {
      method: 'DELETE',
      auth: true
    })
  },

  incrementView(pid) {
    return request(`/posts/${encodeURIComponent(pid)}/views`, {
      method: 'POST'
    })
  },

  addComment(pid, content) {
    return request(`/posts/${encodeURIComponent(pid)}/comment`, {
      method: 'POST',
      body: { content },
      auth: true
    })
  },

  getCategories() {
    return request('/posts/categories/list')
  }
}