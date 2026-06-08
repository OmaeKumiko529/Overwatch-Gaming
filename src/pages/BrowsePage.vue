<template>
  <div class="browse-page">
    <div class="browse-overlay">
      <div class="browse-header">
        <h1 class="page-title">📋 浏览帖子</h1>
        <div class="controls">
          <select v-model="sortBy" class="control-select" @change="applyFilters">
            <option value="latest">最新发布</option>
            <option value="popular">最多点赞</option>
            <option value="preference">偏好推荐</option>
          </select>
          <select v-model="selectedPostrank" class="control-select" @change="applyFilters">
            <option value="">全部帖子</option>
            <option value="FF">受警告内容</option>
            <option value="69">一般帖子</option>
            <option value="78">精华内容</option>
            <option value="00">封禁内容</option>
          </select>
        </div>
      </div>

      <div v-if="filteredPosts.length > 0" class="posts-grid">
        <div v-for="post in displayedPosts" :key="post.id" class="post-card" :class="'postrank-' + (post.postrank || '69')" @click="viewPost(post.pid)">
          <div class="card-accent" :style="{ backgroundColor: getPostRankColor(post.postrank) }"></div>
          <div class="card-body">
            <div class="card-header">
              <span v-if="post.postrank && post.postrank !== '69'" class="rank-badge" :style="{ backgroundColor: getPostRankColor(post.postrank) }">{{ getPostRankLabel(post.postrank) }}</span>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div class="card-pid">PID: {{ post.pid }}</div>
            <h3 class="post-title">{{ post.title }}</h3>
            <p v-if="post.postrank === '00'" class="post-summary black-post"><span>此帖已被标记为封禁内容，详情页查看</span></p>
            <p v-else class="post-summary">{{ renderPreview(post.content, 100) }}</p>
            <div class="card-footer">
              <div class="post-meta">
                <span class="meta author"><span class="meta-icon">👤</span> {{ post.displayName || post.username }}</span>
                <span class="meta likes"><span class="meta-icon">❤️</span> {{ post.likes }}</span>
                <span class="meta views"><span class="meta-icon">👁️</span> {{ post.views || 0 }}</span>
                <span class="meta comments"><span class="meta-icon">💬</span> {{ post.childPosts?.length || 0 }}</span>
              </div>
              <span class="card-arrow">→</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无帖子</p>
        <p class="empty-hint">还没有人发布帖子，来做第一个吧！</p>
        <router-link to="/createpost" class="empty-create-btn">📝 发布第一篇帖子</router-link>
      </div>

      <div v-if="hasMore" class="load-more">
        <button class="load-more-btn" @click="showMore">显示更多帖子</button>
      </div>
      <div v-else-if="filteredPosts.length > 0" class="load-more end">
        <span class="end-line"></span>
        <span class="end-text">— 已经到底了 —</span>
        <span class="end-line"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import postService from '../services/post.js'
import { preferenceService } from '../services/preference.js'
import { getPostRankInfo } from '../constants/rankMap.js'
import { buildRouterLinkPost } from '../utils/encode.js'

const router = useRouter()
const allPosts = ref([])
const sortBy = ref('preference')
const selectedPostrank = ref('')
const displayLimit = ref(12)
const perPage = 12
const userPreference = ref(null)

function getPostRankColor(code) { return getPostRankInfo(code).color }
function getPostRankLabel(code) { return getPostRankInfo(code).cn }

// 获取当前登录用户的 UID
function getCurrentUserUid() {
  try {
    const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
    if (sessionJson) {
      const session = JSON.parse(sessionJson)
      return session.uid || session.id || null
    }
  } catch {}
  return null
}

const filteredPosts = computed(() => {
  let list = allPosts.value
  if (selectedPostrank.value) list = list.filter(p => p.postrank === selectedPostrank.value)
  if (sortBy.value === 'popular') list = [...list].sort((a, b) => b.likes - a.likes)
  else if (sortBy.value === 'preference' && userPreference.value) {
    list = preferenceService.sortByPreference(userPreference.value, list)
  } else {
    list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  return list
})

const displayedPosts = computed(() => filteredPosts.value.slice(0, displayLimit.value))
const hasMore = computed(() => displayLimit.value < filteredPosts.value.length)

async function loadData() {
  const posts = await postService.getAllPosts()
  allPosts.value = posts.filter(p => p.parentId === null || p.parentId === undefined).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  // 加载当前用户的偏好数据
  const uid = getCurrentUserUid()
  if (uid) {
    userPreference.value = await preferenceService.getUserPreference(uid)
  }
}
function applyFilters() { displayLimit.value = perPage }
function showMore() { displayLimit.value += perPage }
function formatDate(dateString) {
  if (!dateString) return ''
  try { return new Date(dateString).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) }
  catch { return '' }
}
function renderPreview(html, max = 100) {
  if (!html) return ''
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.substring(0, max) + '...' : text
}
function viewPost(pid) { router.push(buildRouterLinkPost(pid)) }
onMounted(() => loadData())
</script>

<style scoped>
.browse-page { min-height: 100vh; background: #0f0f1a; padding: 80px 20px 40px; box-sizing: border-box; }
.browse-overlay { max-width: 1120px; margin: 0 auto; }

.browse-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; padding: 0 4px; }
.page-title { font-size: 1.8rem; font-weight: 700; color: #4facfe; font-family: 'SmileySans Oblique', sans-serif; margin: 0; }
.controls { display: flex; gap: 10px; }

.control-select {
  padding: 10px 36px 10px 14px; border: 2px solid #2a2a4a; border-radius: 10px; font-size: 0.9rem;
  font-family: 'MapleMono CN Regular', monospace;
  background: #1a1a2e url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23a0aec0' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 12px center;
  appearance: none; cursor: pointer; transition: all 0.3s ease; color: #e0e0e0;
}
.control-select option { background: #1a1a2e; color: #e0e0e0; }
.control-select:focus { outline: none; border-color: #4facfe; background-color: #252545; }

.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

.post-card {
  background: #1a1a2e; border-radius: 16px; cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2); border: 1px solid #2a2a4a;
}
.post-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); border-color: #4facfe; }

.card-accent { height: 6px; flex-shrink: 0; transition: height 0.3s ease; }
.post-card:hover .card-accent { height: 8px; }
.postrank-FF .card-accent { background-color: #dc3545; }
.postrank-69 .card-accent { background-color: #4facfe; }
.postrank-78 .card-accent { background-color: #28a745; }
.postrank-00 .card-accent { background-color: #212529; }

.card-body { padding: 20px; display: flex; flex-direction: column; flex: 1; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }

.rank-badge {
  font-family: 'MapleMono CN Regular', monospace; font-size: 0.78rem; font-weight: 700;
  padding: 4px 14px; border-radius: 20px; display: inline-flex; align-items: center;
  letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 1px 4px rgba(0,0,0,0.1); color: #fff;
}

.post-date { font-size: 0.78rem; color: #6c757d; font-family: 'MapleMono CN Regular', monospace; }
.card-pid { font-size: 0.7rem; color: #6c757d; font-family: 'MapleMono CN Regular', monospace; margin-bottom: 10px; }

.post-title { font-size: 1.1rem; font-weight: 700; color: #e0e0e0; margin: 0 0 10px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-summary { color: #a0aec0; font-size: 0.88rem; line-height: 1.55; flex: 1; margin: 0 0 14px; }
.post-summary.black-post { display: flex; align-items: center; gap: 6px; color: #6c757d; font-style: italic; padding: 8px 12px; background: #252545; border-radius: 8px; }

.card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #2a2a4a; }
.post-meta { display: flex; gap: 14px; font-size: 0.8rem; color: #a0aec0; }
.meta { display: flex; align-items: center; gap: 3px; }
.meta.author { font-weight: 600; color: #a0aec0; }
.meta-icon { font-size: 0.9rem; }
.card-arrow { color: #4a5568; font-size: 1.1rem; transition: transform 0.3s ease, color 0.3s ease; }
.post-card:hover .card-arrow { transform: translateX(4px); color: #4facfe; }

.empty-state { max-width: 400px; margin: 80px auto; text-align: center; background: #1a1a2e; border-radius: 20px; padding: 60px 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); border: 1px solid #2a2a4a; }
.empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 1.4rem; font-weight: 700; color: #e0e0e0; margin: 0 0 8px; font-family: 'SmileySans Oblique', sans-serif; }
.empty-hint { font-size: 0.95rem; color: #a0aec0; margin: 0 0 24px; }
.empty-create-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: linear-gradient(135deg, #4facfe 0%, #667eea 100%); color: white; border: none; border-radius: 10px; font-family: 'MapleMono CN Regular', monospace; font-weight: 600; font-size: 1rem; text-decoration: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(79,172,254,0.3); }
.empty-create-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79,172,254,0.4); }

.load-more { margin: 32px auto 0; text-align: center; }
.load-more-btn { padding: 12px 36px; border: 2px solid #2a2a4a; border-radius: 10px; background: #1a1a2e; color: #e0e0e0; font-family: 'MapleMono CN Regular', monospace; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
.load-more-btn:hover { background: #252545; border-color: #4facfe; color: #4facfe; transform: translateY(-2px); }
.load-more.end { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 20px 0; }
.end-line { display: inline-block; width: 60px; height: 1px; background: #2a2a4a; }
.end-text { color: #6c757d; font-size: 0.85rem; font-family: 'MapleMono CN Regular', monospace; white-space: nowrap; }

@media (max-width: 640px) {
  .browse-page { padding: 80px 12px 40px; }
  .browse-header { flex-direction: column; align-items: stretch; }
  .page-title { font-size: 1.4rem; text-align: center; }
  .controls { width: 100%; }
  .control-select { flex: 1; font-size: 0.82rem; padding: 8px 30px 8px 10px; }
  .posts-grid { grid-template-columns: 1fr; gap: 16px; }
  .card-body { padding: 16px; }
  .empty-state { margin: 40px 10px; padding: 40px 24px; }
}
</style>
