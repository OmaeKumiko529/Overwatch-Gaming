<template>
  <div class="generate-page">
    <div class="generate-container">
      <h1 class="page-title">🧬 数据生成器</h1>
      <p class="page-desc">从种子数据文件生成测试用户和帖子，直接注入数据库。</p>

      <div class="info-card">
        <h3>📋 种子数据概况</h3>
        <div class="info-list">
          <div class="info-item"><span class="label">用户数量</span><span class="value">{{ seedStats.users }}</span></div>
          <div class="info-item"><span class="label">帖子数量</span><span class="value">{{ seedStats.posts }}</span></div>
          <div class="info-item"><span class="label">密码</span><span class="value">123123</span></div>
          <div class="info-item"><span class="label">权限</span><span class="value tag-admin">需管理员登录</span></div>
        </div>
      </div>

      <div class="action-area">
        <button class="generate-btn" :disabled="injecting || !isAdmin" @click="injectSeed">
          <span v-if="injecting" class="spinner"></span>
          <span v-else>🚀</span>
          {{ injecting ? '注入中...' : '注入种子数据' }}
        </button>
        <p v-if="!isAdmin" class="hint-text">⚠️ 需要管理员权限才能执行此操作</p>
      </div>

      <div v-if="result" class="result-card" :class="{ success: result.success, error: !result.success }">
        <h3>{{ result.success ? '✅ 注入成功' : '❌ 注入失败' }}</h3>
        <p>{{ result.message }}</p>
        <div v-if="result.detail" class="result-detail">
          <div v-if="result.detail.users" class="detail-section">
            <h4>👤 用户 ({{ result.detail.users.filter(u => u.status === '已创建').length }} 新建)</h4>
            <div v-for="u in result.detail.users" :key="u.username" class="detail-item">
              <span :class="u.status === '已创建' ? 'created' : 'skipped'">{{ u.status === '已创建' ? '✓' : '—' }}</span>
              {{ u.username }} <small v-if="u.uid">({{ u.uid }})</small>
            </div>
          </div>
          <div v-if="result.detail.posts" class="detail-section">
            <h4>📝 帖子 ({{ result.detail.posts.filter(p => p.status === '已创建').length }} 新建)</h4>
            <div v-for="p in result.detail.posts" :key="p.title" class="detail-item">
              <span :class="p.status === '已创建' ? 'created' : 'skipped'">{{ p.status === '已创建' ? '✓' : '—' }}</span>
              {{ p.title.substring(0, 30) }}{{ p.title.length > 30 ? '...' : '' }} <small v-if="p.pid">({{ p.pid }})</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const injecting = ref(false)
const result = ref(null)

const seedStats = ref({ users: 0, posts: 0 })

onMounted(async () => {
  try {
    const resp = await fetch('/seed-data.json')
    const data = await resp.json()
    seedStats.value = { users: data.users.length, posts: data.posts.length }
  } catch {}
})

const isAdmin = computed(() => auth.isAdmin || Number(auth.currentUser?.userrank || 0) >= 3)

function getBearerToken() {
  try {
    const json = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser')
    if (json) {
      const session = JSON.parse(json)
      return session.token || ''
    }
  } catch {}
  return ''
}

async function injectSeed() {
  injecting.value = true
  result.value = null
  try {
    const response = await fetch('/api/seed/inject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getBearerToken()}`
      }
    })
    const data = await response.json()
    result.value = data
  } catch (e) {
    result.value = { success: false, message: '请求失败：' + e.message }
  } finally {
    injecting.value = false
  }
}
</script>

<style scoped>
.generate-page {
  min-height: 100vh;
  background: #0f0f1a;
  padding: 80px 20px 40px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}

.generate-container {
  width: 100%;
  max-width: 680px;
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2rem;
  color: #4facfe;
  text-align: center;
  margin-bottom: 8px;
}

.page-desc {
  color: #a0aec0;
  text-align: center;
  margin-bottom: 32px;
  font-size: 0.95rem;
}

.info-card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 24px;
  border: 1px solid #2a2a4a;
  margin-bottom: 24px;
}

.info-card h3 {
  font-size: 1rem;
  color: #e0e0e0;
  margin: 0 0 16px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #252545;
  border-radius: 8px;
}

.label {
  color: #a0aec0;
  font-size: 0.9rem;
}

.value {
  color: #e0e0e0;
  font-weight: 600;
  font-family: 'MapleMono CN Regular', monospace;
}

.tag-admin {
  color: #fa9e4b;
  font-size: 0.82rem;
}

.action-area {
  text-align: center;
  margin-bottom: 24px;
}

.generate-btn {
  padding: 14px 40px;
  background: linear-gradient(135deg, #fa9e4b, #f87e2e);
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(248, 126, 46, 0.3);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(248, 126, 46, 0.4);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-text {
  color: #fa9e4b;
  font-size: 0.85rem;
  margin-top: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 24px;
  border: 1px solid #2a2a4a;
}

.result-card.success {
  border-color: #28a745;
}

.result-card.error {
  border-color: #dc3545;
}

.result-card h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
}

.result-card p {
  color: #a0aec0;
  margin: 0 0 16px;
}

.result-detail {
  max-height: 400px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  color: #e0e0e0;
  font-size: 0.95rem;
  margin: 0 0 8px;
}

.detail-item {
  color: #a0aec0;
  font-size: 0.85rem;
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item .created {
  color: #28a745;
  font-weight: bold;
}

.detail-item .skipped {
  color: #6c757d;
}

.detail-item small {
  color: #4a5568;
}
</style>