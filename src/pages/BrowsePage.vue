<template>
  <div class="browse-page">
    <!-- 顶部控制栏 -->
    <div class="browse-header">
      <h1 class="page-title">📋 浏览帖子</h1>
      <div class="controls">
        <select v-model="sortBy" class="control-select" @change="applyFilters">
          <option value="latest">最新发布</option>
          <option value="popular">最多点赞</option>
        </select>
        <select v-model="selectedCategory" class="control-select" @change="applyFilters">
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.key" :value="cat.key">{{ cat.label }}</option>
        </select>
      </div>
    </div>

    <!-- 帖子网格 -->
    <div v-if="filteredPosts.length > 0" class="posts-grid">
      <div
        v-for="post in displayedPosts"
        :key="post.id"
        class="post-card"
        :class="'post-category-' + post.category"
        @click="viewPost(post.id)"
      >
        <div class="card-header">
          <span class="category-badge">{{ categoryName(post.category) }}</span>
          <span class="post-date">{{ formatDate(post.createdAt) }}</span>
        </div>
        <h3 class="post-title">{{ post.title }}</h3>
        <p class="post-summary">{{ renderPreview(post.content, 100) }}</p>
        <div class="card-footer">
          <div class="post-meta">
            <span class="meta author">{{ post.username }}</span>
            <span class="meta likes">❤️ {{ post.likes }}</span>
            <span class="meta comments">💬 {{ post.comments?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <p>暂无帖子</p>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <button class="load-more-btn" @click="showMore">显示更多帖子</button>
    </div>
    <div v-else-if="filteredPosts.length > 0" class="load-more end">
      <span>— 已经到底了 —</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import postService from '../services/post.js'

const router = useRouter()

const allPosts = ref([])
const categories = ref([])
const sortBy = ref('latest')
const selectedCategory = ref('')
const displayLimit = ref(12)
const perPage = 12

const CATEGORY_MAP = {
  'general': '一般讨论',
  'team': '战队招募',
  'strategy': '战术攻略',
  'highlight': '精彩集锦',
  'question': '问题求助',
  'announcement': '公告通知'
}

const filteredPosts = computed(() => {
  let list = allPosts.value

  // 分类筛选
  if (selectedCategory.value) {
    list = list.filter(p => p.category === selectedCategory.value)
  }

  // 排序
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

function loadData() {
  // 只取主帖子 (parentId === null)
  allPosts.value = postService
    .getAllPosts()
    .filter(p => p.parentId === null || p.parentId === undefined)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // 提取分类列表
  const catSet = new Set()
  allPosts.value.forEach(p => {
    if (p.category) catSet.add(p.category)
  })
  categories.value = Array.from(catSet).map(key => ({
    key,
    label: CATEGORY_MAP[key] || key
  }))
}

function applyFilters() {
  displayLimit.value = perPage
}

function showMore() {
  displayLimit.value += perPage
}

function categoryName(cat) {
  return CATEGORY_MAP[cat] || '其他'
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('zh-CN')
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

function viewPost(id) {
  router.push({ name: 'PostDetail', params: { id } })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.browse-page {
  min-height: 100vh;
  padding-top: 80px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 40px;
  background: #f0f2f5;
  box-sizing: border-box;
}

/* 顶部 */
.browse-header {
  max-width: 1100px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0;
}

.controls {
  display: flex;
  gap: 10px;
}

.control-select {
  padding: 8px 32px 8px 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'SmileySans Oblique', sans-serif;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.3s;
  color: #495057;
}

.control-select:focus {
  outline: none;
  border-color: #4facfe;
}

/* 帖子网格 */
.posts-grid {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  border-left: 4px solid #4facfe;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.post-category-general { border-left-color: #6c757d; }
.post-category-team { border-left-color: #28a745; }
.post-category-strategy { border-left-color: #17a2b8; }
.post-category-highlight { border-left-color: #ffc107; }
.post-category-question { border-left-color: #fd7e14; }
.post-category-announcement { border-left-color: #dc3545; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.category-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f8f9fa;
  color: #495057;
}

.post-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.post-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-summary {
  color: #6c757d;
  font-size: 0.88rem;
  line-height: 1.5;
  flex: 1;
  margin: 0 0 14px;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.post-meta {
  display: flex;
  gap: 14px;
  font-size: 0.82rem;
  color: #6c757d;
}

.meta.author {
  font-weight: 600;
  color: #495057;
}

/* 空状态 */
.empty-state {
  max-width: 1100px;
  margin: 60px auto;
  text-align: center;
  color: #6c757d;
  font-size: 1.1rem;
}

/* 加载更多 */
.load-more {
  max-width: 1100px;
  margin: 32px auto 0;
  text-align: center;
}

.load-more-btn {
  padding: 10px 32px;
  border: 2px solid #4facfe;
  border-radius: 8px;
  background: white;
  color: #4facfe;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-btn:hover {
  background: #4facfe;
  color: white;
}

.load-more.end span {
  color: #adb5bd;
  font-size: 0.9rem;
}

/* 响应式 */
@media (max-width: 640px) {
  .browse-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .controls {
    width: 100%;
  }

  .control-select {
    flex: 1;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>