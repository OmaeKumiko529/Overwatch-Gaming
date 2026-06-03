<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-header">
        <h1>搜索</h1>
        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索用户名、UID、帖子编号或帖子标题..."
            @keyup.enter="performSearch"
            class="search-input"
            ref="searchInput"
          />
          <button @click="performSearch" class="search-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="search-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'posts' }]"
          @click="activeTab = 'posts'"
        >
          帖子
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          用户
        </button>
      </div>

      <div class="search-results">
        <div v-if="loading" class="loading">搜索中...</div>
        
        <div v-else-if="searchQuery.trim() === ''" class="empty-state">
          <p>请输入搜索关键词</p>
        </div>
        
        <div v-else-if="activeTab === 'posts' && posts.length === 0" class="empty-state">
          <p>未找到相关帖子</p>
        </div>
        
        <div v-else-if="activeTab === 'users' && users.length === 0" class="empty-state">
          <p>未找到相关用户</p>
        </div>
        
        <div v-else>
          <!-- 帖子搜索结果 -->
          <div v-if="activeTab === 'posts'" class="posts-results">
            <div v-for="post in posts" :key="post.id" class="post-card" @click="viewPostDetail(post.pid)">
              <div class="post-header">
                <span class="post-rank-icon">{{ post.rankInfo?.icon || '🔵' }}</span>
                <span class="post-pid">{{ post.pid ? 'PID: ' + post.pid : '#' + post.id }}</span>
                <span class="post-title">{{ post.title }}</span>
              </div>
              <div class="post-content">{{ post.content.substring(0, 100) }}...</div>
              <div class="post-footer">
                <span class="post-author">作者: {{ post.author }}</span>
                <span class="post-date">{{ post.date }}</span>
              </div>
            </div>
          </div>
          
          <!-- 用户搜索结果 -->
          <div v-if="activeTab === 'users'" class="users-results">
            <div v-for="user in users" :key="user.id" class="user-card">
              <div class="user-avatar">
                <div class="avatar-placeholder">{{ user.name.charAt(0) }}</div>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-uid">UID: {{ user.uid || user.id }}</div>
                <div class="user-bio">{{ user.bio || '暂无简介' }}</div>
              </div>
              <button class="view-profile-button" @click="viewProfile(user.uid || user.id)">
                查看资料
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import postService from '../services/post.js'
import { authApi } from '../services/api.js'

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const activeTab = ref('posts')
const loading = ref(false)
const posts = ref([])
const users = ref([])
const searchInput = ref(null)

onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q
    performSearch()
  }
  
  if (searchInput.value) {
    searchInput.value.focus()
  }
})

watch(searchQuery, (newQuery) => {
  if (newQuery.trim() !== '') {
    updateUrl()
  }
})

const updateUrl = () => {
  const query = { ...route.query, q: searchQuery.value }
  router.replace({ query })
}

const performSearch = async () => {
  if (searchQuery.value.trim() === '') return
  
  loading.value = true
  updateUrl()
  
  const query = searchQuery.value.toLowerCase().trim()
  
  try {
    if (activeTab.value === 'posts') {
      // 通过 API 搜索帖子
      const allPosts = await postService.getAllPosts()
      posts.value = allPosts.filter(post => {
        const isMainPost = post.parentId === null || post.parentId === undefined
        return isMainPost && (
          (post.pid && post.pid.toLowerCase().includes(query)) ||
          (post.title && post.title.toLowerCase().includes(query)) ||
          (post.username && post.username.toLowerCase().includes(query)) ||
          (post.content && post.content.toLowerCase().includes(query))
        )
      }).map(post => ({
        id: post.id,
        pid: post.pid,
        title: post.title,
        content: post.content,
        author: post.username,
        date: new Date(post.createdAt).toLocaleDateString('zh-CN'),
        rankInfo: { icon: getPostRankIcon(post.postrank) }
      }))
    } else {
      // 通过 API 搜索用户
      const res = await authApi.getAllUsers()
      const allUsers = res.success ? res.users : []
      users.value = allUsers.filter(user => {
        return (
          (user.uid && user.uid.toLowerCase().includes(query)) ||
          user.username.toLowerCase().includes(query) ||
          (user.email && user.email.toLowerCase().includes(query))
        )
      }).map(user => ({
        id: user.id,
        uid: user.uid,
        name: user.username,
        bio: '守望先锋玩家'
      }))
    }
  } catch (err) {
    console.error('搜索失败:', err)
    posts.value = []
    users.value = []
  } finally {
    loading.value = false
  }
}

function getPostRankIcon(postrank) {
  const icons = { 'FF': '🔴', '69': '🔵', '78': '🟢', '00': '⚫' }
  return icons[postrank] || '🔵'
}

const viewProfile = (uid) => {
  router.push('/user/' + encodeURIComponent(String(uid)))
}

const viewPostDetail = (pid) => {
  if (pid) {
    router.push('/post/' + encodeURIComponent(pid))
  }
}

watch(activeTab, () => {
  if (searchQuery.value.trim() !== '') {
    performSearch()
  }
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  padding-top: 80px;
  background: #f0f2f5;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.search-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
}

.search-input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 1rem;
  font-family: 'MapleMono CN Regular', monospace;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #4facfe;
}

.search-button {
  padding: 12px 20px;
  background: #4facfe;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.3s;
}

.search-button:hover {
  background: #3d8bda;
}

.search-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #dee2e6;
}

.tab-button {
  padding: 10px 24px;
  border: none;
  background: none;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  color: #6c757d;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab-button.active {
  color: #4facfe;
  border-bottom-color: #4facfe;
  font-weight: 600;
}

.tab-button:hover {
  color: #333;
}

.search-results {
  min-height: 200px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 1.1rem;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e9ecef;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.post-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.post-id {
  font-size: 0.85rem;
  color: #adb5bd;
  font-weight: 600;
}

.post-title {
  font-weight: 600;
  color: #333;
}

.post-content {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.post-footer {
  display: flex;
  gap: 16px;
  font-size: 0.82rem;
  color: #adb5bd;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e9ecef;
  transition: all 0.3s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.user-uid {
  font-size: 0.82rem;
  color: #adb5bd;
  margin-bottom: 2px;
}

.user-bio {
  font-size: 0.85rem;
  color: #6c757d;
}

.view-profile-button {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  transition: background 0.3s;
}

.view-profile-button:hover {
  background: #5a6fd6;
}
</style>