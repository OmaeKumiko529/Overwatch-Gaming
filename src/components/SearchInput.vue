<template>
  <div class="search-wrap" :class="{ active: isActive }">
    <!-- 搜索按钮（未激活时显示） -->
    <button v-if="!isActive" class="search-trigger" @click="openSearch">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </button>

    <!-- 搜索条（激活时展开） -->
    <div v-if="isActive" class="search-bar">
      <input
        ref="searchInput"
        v-model="query"
        class="search-input"
        placeholder="搜索用户 / UID / 帖子..."
        @keyup.enter="handleSearch"
        @blur="onBlur"
      />
      <button class="search-close" @click="closeSearch">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- 实时搜索结果 -->
    <div class="search-dropdown" v-if="isActive && query.trim()">
      <div class="dropdown-inner">
        <div v-if="searchResults.length > 0">
          <div class="dropdown-title">搜索结果 ({{ searchResults.length }})</div>
          <div class="dropdown-results">
            <div v-if="userResults.length > 0" class="dropdown-section">
              <div class="dropdown-section-title">用户</div>
              <div
                v-for="user in userResults"
                :key="'u-' + user.id"
                class="dropdown-item"
                @click="goToUser(user.id)"
              >
                <div class="dropdown-avatar">
              <img :src="user.avatar || '/default-avatar.png'" :alt="user.username" />
                </div>
                <div class="dropdown-info">
                  <div class="dropdown-name">{{ user.username }}</div>
                  <div class="dropdown-sub">{{ user.email }}</div>
                </div>
              </div>
            </div>
            <div v-if="postResults.length > 0" class="dropdown-section">
              <div class="dropdown-section-title">帖子</div>
              <div
                v-for="post in postResults"
                :key="'p-' + post.id"
                class="dropdown-item"
                @click="goToPost(post.id)"
              >
                <div class="dropdown-icon">📝</div>
                <div class="dropdown-info">
                  <div class="dropdown-name">{{ post.title }}</div>
                  <div class="dropdown-sub">作者: {{ post.username }} · {{ formatDate(post.createdAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="query.trim() && !searchTimeout" class="dropdown-empty">未找到匹配的用户或帖子</div>
        <div v-else class="dropdown-empty">搜索中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import userService from '../services/user'
import postService from '../services/post'

const router = useRouter()

const isActive = ref(false)
const query = ref('')
const searchInput = ref(null)
const searchResults = ref([])
const searchTimeout = ref(null)

const userResults = computed(() => searchResults.value.filter(i => i.type === 'user'))
const postResults = computed(() => searchResults.value.filter(i => i.type === 'post'))

const performSearch = async () => {
  const q = query.value.trim()
  if (!q) { searchResults.value = []; return }
  try {
    const [users, posts] = await Promise.all([
      userService.searchUsers(q),
      postService.searchPosts(q)
    ])
    searchResults.value = [
      ...users.map(u => ({ ...u, type: 'user' })).slice(0, 5),
      ...posts.map(p => ({ ...p, type: 'post' })).slice(0, 5)
    ]
  } catch {
    searchResults.value = []
  }
}

watch(query, (n) => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (n.trim()) {
    searchTimeout.value = setTimeout(performSearch, 300)
  } else {
    searchResults.value = []
  }
})

const openSearch = () => {
  isActive.value = true
  nextTick(() => searchInput.value?.focus())
}

const closeSearch = () => {
  isActive.value = false
  query.value = ''
  searchResults.value = []
  if (searchTimeout.value) { clearTimeout(searchTimeout.value); searchTimeout.value = null }
}

const handleSearch = () => {
  const q = query.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  closeSearch()
}

const goToUser = (id) => { router.push(`/user/${id}`); closeSearch() }
const goToPost = (id) => { router.push(`/post/${id}`); closeSearch() }

const formatDate = (d) => new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

const onBlur = (e) => {
  setTimeout(() => {
    if (!e.relatedTarget || !e.relatedTarget.closest('.search-wrap')) closeSearch()
  }, 120)
}

const handleKey = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch() }
  if (e.key === 'Escape') closeSearch()
}

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})
</script>

<style scoped>
/* ── 容器：跟随 nav-actions flex 流布局 ── */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  flex-shrink: 0;
}

/* ── 搜索触发按钮（圆形） ── */
.search-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.search-trigger:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: scale(1.05);
}

/* ── 搜索条（激活时 inline 展开） ── */
.search-bar {
  display: flex;
  align-items: center;
  height: 36px;
  width: 220px;
  padding: 0 4px 0 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  animation: barIn 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 28px;
  border: none;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-size: 0.85rem;
  font-family: 'MapleMono CN Regular', monospace;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.search-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.search-close:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

/* ── 下拉搜索建议 ── */
.search-dropdown {
  position: absolute;
  top: 44px;
  right: 0;
  width: 280px;
  max-width: calc(100vw - 24px);
  background: rgba(30, 35, 50, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 10px;
  animation: fadeIn 0.2s ease;
}

.dropdown-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.dropdown-results {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-section {
  margin-bottom: 10px;
}

.dropdown-section:last-child {
  margin-bottom: 0;
}

.dropdown-section-title {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dropdown-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.dropdown-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 15px;
}

.dropdown-info {
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-sub {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.dropdown-empty {
  text-align: center;
  padding: 18px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.85rem;
}

/* ── 动画 ── */
@keyframes barIn {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ── 手机适配 ── */
@media (max-width: 480px) {
  .search-bar {
    width: calc(100vw - 90px);
  }
  .search-dropdown {
    right: 0;
    left: auto;
    width: calc(100vw - 50px);
  }
}
</style>