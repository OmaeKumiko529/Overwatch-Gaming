<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-header">
        <h1 class="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          搜索
        </h1>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="search-tabs">
        <button :class="['tab-btn', { active: activeTab === 'posts' }]" @click="activeTab = 'posts'">帖子</button>
        <button :class="['tab-btn', { active: activeTab === 'users' }]" @click="activeTab = 'users'">用户</button>
      </div>

      <div class="search-results">
        <div v-if="loading" class="loading">搜索中...</div>
        
        <div v-else-if="!searchQuery.trim()" class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p>请输入搜索关键词</p>
        </div>
        
        <div v-else-if="activeTab === 'posts' && posts.length === 0" class="empty-state">
          <p>未找到相关帖子</p>
        </div>
        
        <div v-else-if="activeTab === 'users' && users.length === 0" class="empty-state">
          <p>未找到相关用户</p>
        </div>
        
        <div v-else>
          <div v-if="activeTab === 'posts'" class="posts-results">
            <div v-for="post in posts" :key="post.id" class="result-card" @click="viewPostDetail(post.pid)">
              <div class="result-header">
                <span class="result-rank">{{ post.rankInfo?.icon || '🔵' }}</span>
                <span class="result-pid">PID: {{ post.pid || '#' + post.id }}</span>
              </div>
              <div class="result-title">{{ post.title }}</div>
              <div class="result-excerpt">{{ post.content.substring(0, 120) }}...</div>
              <div class="result-footer">
                <span>作者: {{ post.author }}</span>
                <span>{{ post.date }}</span>
              </div>
            </div>
          </div>
          
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
              <button class="view-profile-btn" @click="viewProfile(user.uid || user.id)">查看资料</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { debounce } from '../utils/helpers.js'
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
  if (route.query.q) { searchQuery.value = route.query.q; performSearch() }
  if (searchInput.value) searchInput.value.focus()
})

const debouncedUpdateUrl = debounce(() => {
  router.replace({ query: { ...route.query, q: searchQuery.value } })
}, 300)

watch(searchQuery, (n) => { if (n.trim()) debouncedUpdateUrl() })

const updateUrl = () => { router.replace({ query: { ...route.query, q: searchQuery.value } }) }

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  loading.value = true
  updateUrl()
  const q = searchQuery.value.toLowerCase().trim()
  try {
    if (activeTab.value === 'posts') {
      const allPosts = await postService.getAllPosts()
      posts.value = allPosts.filter(p => (p.parentId === null || p.parentId === undefined) && (
        (p.pid && p.pid.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q))
      )).map(p => ({
        id: p.id, pid: p.pid, title: p.title, content: p.content,
        author: p.displayName || p.username,
        date: new Date(p.createdAt).toLocaleDateString('zh-CN'),
        rankInfo: { icon: ({ 'FF': '🔴', '69': '🔵', '78': '🟢', '00': '⚫' })[p.postrank] || '🔵' }
      }))
    } else {
      const res = await authApi.getAllUsers()
      const allUsers = res.success ? res.users : []
      users.value = allUsers.filter(u => (u.uid && u.uid.toLowerCase().includes(q)) || u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)))
        .map(u => ({ id: u.id, uid: u.uid, name: u.username, bio: '守望先锋玩家' }))
    }
  } catch { posts.value = []; users.value = [] }
  finally { loading.value = false }
}

const viewProfile = (uid) => router.push('/user/' + encodeURIComponent(String(uid)))
const viewPostDetail = (pid) => { if (pid) router.push('/post/' + encodeURIComponent(pid)) }

watch(activeTab, () => { if (searchQuery.value.trim()) performSearch() })
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  padding-top: 76px;
  background: #0f0f1a;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0 0 20px;
}

.search-input-wrapper {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'MapleMono CN Regular', monospace;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  outline: none;
}

.search-input::placeholder { color: rgba(255, 255, 255, 0.3); }

.search-input:focus {
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.search-button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }

.search-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: none;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.25s ease;
}

.tab-btn.active { color: #4facfe; border-bottom-color: #4facfe; font-weight: 600; }
.tab-btn:hover { color: rgba(255, 255, 255, 0.7); }

.search-results { min-height: 200px; }

.loading, .empty-state {
  text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.35);
  font-size: 1rem;
}

.empty-icon { margin-bottom: 12px; color: rgba(255, 255, 255, 0.1); display: flex; justify-content: center; }

.result-card {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 172, 254, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.result-header { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
.result-rank { font-size: 0.9rem; }
.result-pid { font-size: 0.78rem; color: rgba(255, 255, 255, 0.3); font-family: 'MapleMono CN Regular', monospace; }
.result-title { font-size: 1rem; font-weight: 600; color: rgba(255, 255, 255, 0.85); margin-bottom: 6px; }
.result-excerpt { font-size: 0.85rem; color: rgba(255, 255, 255, 0.45); margin-bottom: 10px; line-height: 1.5; }
.result-footer { display: flex; gap: 16px; font-size: 0.78rem; color: rgba(255, 255, 255, 0.25); }

.user-card {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 172, 254, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.user-info { flex: 1; }
.user-name { font-weight: 600; color: rgba(255, 255, 255, 0.85); margin-bottom: 2px; }
.user-uid { font-size: 0.78rem; color: rgba(255, 255, 255, 0.3); margin-bottom: 2px; }
.user-bio { font-size: 0.82rem; color: rgba(255, 255, 255, 0.45); }

.view-profile-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.view-profile-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }
</style>