<template>
  <div class="browse-page">
    <div class="browse-overlay">
      <!-- 顶部控制栏 -->
      <div class="browse-header">
        <h1 class="page-title">📋 浏览帖子</h1>
        <div class="controls">
          <select v-model="sortBy" class="control-select" @change="applyFilters">
            <option value="latest">最新发布</option>
            <option value="popular">最多点赞</option>
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

      <!-- 帖子网格 -->
      <div v-if="filteredPosts.length > 0" class="posts-grid">
        <div
          v-for="post in displayedPosts"
          :key="post.id"
          class="post-card"
          :class="'postrank-' + (post.postrank || '69')"
          @click="viewPost(post.pid)"
        >
          <!-- 颜色卡片顶部 -->
          <div class="card-accent" :style="{ backgroundColor: getPostRankColor(post.postrank) }"></div>
          
          <div class="card-body">
            <div class="card-header">
              <span v-if="post.postrank && post.postrank !== '69'" class="rank-badge" :style="{ backgroundColor: getPostRankColor(post.postrank) }">
                {{ getPostRankLabel(post.postrank) }}
              </span>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div class="card-pid">PID: {{ post.pid }}</div>
            
            <h3 class="post-title">{{ post.title }}</h3>
            
            <!-- 封禁内容：显示特殊提示 -->
            <p v-if="post.postrank === '00'" class="post-summary black-post">
              <span>此帖已被标记为封禁内容，详情页查看</span>
            </p>
            <p v-else class="post-summary">{{ renderPreview(post.content, 100) }}</p>
            
            <div class="card-footer">
              <div class="post-meta">
                <span class="meta author">
                  <span class="meta-icon">👤</span>
                  {{ post.username }}
                </span>
                <span class="meta likes">
                  <span class="meta-icon">❤️</span>
                  {{ post.likes }}
                </span>
                <span class="meta comments">
                  <span class="meta-icon">💬</span>
                  {{ post.childPosts?.length || 0 }}
                </span>
              </div>
              <span class="card-arrow">→</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">暂无帖子</p>
        <p class="empty-hint">还没有人发布帖子，来做第一个吧！</p>
        <router-link to="/createpost" class="empty-create-btn">📝 发布第一篇帖子</router-link>
      </div>

      <!-- 加载更多 -->
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
import { getPostRankInfo } from '../constants/rankMap.js'
import { buildRouterLinkPost } from '../utils/encode.js'

const router = useRouter()

const allPosts = ref([])
const sortBy = ref('latest')
const selectedPostrank = ref('')
const displayLimit = ref(12)
const perPage = 12

function getPostRankColor(code) {
  return getPostRankInfo(code).color
}

function getPostRankLabel(code) {
  return getPostRankInfo(code).cn
}

const filteredPosts = computed(() => {
  let list = allPosts.value

  if (selectedPostrank.value) {
    list = list.filter(p => p.postrank === selectedPostrank.value)
  }

  if (sortBy.value === 'popular') {
    list = [...list].sort((a, b) => b.likes - a.likes)
  } else {
    list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return list
})

const displayedPosts = computed(() => {
  return filteredPosts.value.slice(0, displayLimit.value)
})

const hasMore = computed(() => {
  return displayLimit.value < filteredPosts.value.length
})

async function loadData() {
  const posts = await postService.getAllPosts()
  allPosts.value = posts
    .filter(p => p.parentId === null || p.parentId === undefined)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function applyFilters() {
  displayLimit.value = perPage
}

function showMore() {
  displayLimit.value += perPage
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

function renderPreview(html, max = 100) {
  if (!html) return ''
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.substring(0, max) + '...' : text
}

function viewPost(pid) {
  router.push(buildRouterLinkPost(pid))
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.browse-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px 40px;
  box-sizing: border-box;
}

.browse-overlay {
  max-width: 1120px;
  margin: 0 auto;
}

/* ============== 顶部控制栏 ============== */
.browse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  padding: 0 4px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.controls {
  display: flex;
  gap: 10px;
}

.control-select {
  padding: 10px 36px 10px 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: 'MapleMono CN Regular', monospace;
  background: rgba(255, 255, 255, 0.15) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23ffffff' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 12px center;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
  backdrop-filter: blur(10px);
}

.control-select option {
  background: #555;
  color: #fff;
}

.control-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.25);
}

/* ============== 帖子网格 ============== */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.post-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.post-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

/* 顶部颜色条 */
.card-accent {
  height: 6px;
  flex-shrink: 0;
  transition: height 0.3s ease;
}

.post-card:hover .card-accent {
  height: 8px;
}

/* 颜色主题 */
.postrank-FF .card-accent { background-color: #dc3545; }
.postrank-69 .card-accent { background-color: #4facfe; }
.postrank-78 .card-accent { background-color: #28a745; }
.postrank-00 .card-accent { background-color: #212529; }

/* 卡片体 */
.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

/* 标记徽章 */
.rank-badge {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  color: #fff;
}

.rank-badge-normal {
  background-color: #e9ecef !important;
  color: #6c757d !important;
  font-weight: 600 !important;
  text-shadow: none !important;
  border: 1px solid #dee2e6 !important;
  box-shadow: none !important;
}

.post-date {
  font-size: 0.78rem;
  color: #888;
  font-family: 'MapleMono CN Regular', monospace;
}

/* PID 提示 */
.card-pid {
  font-size: 0.7rem;
  color: #aaa;
  font-family: 'MapleMono CN Regular', monospace;
  margin-bottom: 10px;
}

.post-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #222;
  margin: 0 0 10px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 内容预览 */
.post-summary {
  color: #666;
  font-size: 0.88rem;
  line-height: 1.55;
  flex: 1;
  margin: 0 0 14px;
}

/* 封禁内容特殊预览 */
.post-summary.black-post {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-style: italic;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.post-meta {
  display: flex;
  gap: 14px;
  font-size: 0.8rem;
  color: #888;
}

.meta {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-icon {
  font-size: 0.9rem;
}

.meta.author {
  font-weight: 600;
  color: #555;
}

.card-arrow {
  color: #ccc;
  font-size: 1.1rem;
  transition: transform 0.3s ease, color 0.3s ease;
}

.post-card:hover .card-arrow {
  transform: translateX(4px);
  color: #667eea;
}

/* ============== 空状态 ============== */
.empty-state {
  max-width: 400px;
  margin: 80px auto;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
  font-family: 'SmileySans Oblique', sans-serif;
}

.empty-hint {
  font-size: 0.95rem;
  color: #888;
  margin: 0 0 24px;
}

.empty-create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.empty-create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

/* ============== 加载更多 ============== */
.load-more {
  margin: 32px auto 0;
  text-align: center;
}

.load-more-btn {
  padding: 12px 36px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);
}

.load-more-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.load-more.end {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}

.end-line {
  display: inline-block;
  width: 60px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.end-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  font-family: 'MapleMono CN Regular', monospace;
  white-space: nowrap;
}

/* ============== 响应式 ============== */
@media (max-width: 640px) {
  .browse-page {
    padding: 80px 12px 40px;
  }

  .browse-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 1.4rem;
    text-align: center;
  }

  .controls {
    width: 100%;
  }

  .control-select {
    flex: 1;
    font-size: 0.82rem;
    padding: 8px 30px 8px 10px;
  }

  .posts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-body {
    padding: 16px;
  }

  .empty-state {
    margin: 40px 10px;
    padding: 40px 24px;
  }
}
</style>