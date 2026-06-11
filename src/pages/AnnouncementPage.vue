<template>
  <div class="announcement-page">
    <div class="page-header">
      <h1 class="page-title">📢 全站公告</h1>
      <div v-if="auth.isAdmin" class="admin-actions">
        <button @click="showForm = !showForm" class="btn-publish">
          {{ showForm ? '收起表单' : '发布新公告' }}
        </button>
      </div>
    </div>

    <div v-if="showForm && auth.isAdmin" class="publish-form">
      <h2 class="form-title">发布新公告</h2>
      <div class="form-group">
        <label for="title">公告标题</label>
        <input id="title" v-model="form.title" type="text" placeholder="请输入公告标题" maxlength="100" class="form-input" />
      </div>
      <div class="form-group">
        <label for="content">公告内容</label>
        <textarea id="content" v-model="form.content" placeholder="请输入公告内容..." rows="6" class="form-textarea"></textarea>
      </div>
      <div v-if="error" class="error-msg">{{ error }}</div>
      <div class="form-actions">
        <button @click="submitAnnouncement" :disabled="submitting" class="btn-submit">
          {{ submitting ? '发布中...' : '发布公告' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-else-if="announcements.length === 0" class="loading-state">暂无公告</div>
    <div v-else class="announcement-list">
      <div v-for="item in announcements" :key="item.id" class="announcement-card">
        <div class="card-accent"></div>
        <div class="card-body">
          <h3 class="card-title">{{ item.title }}</h3>
          <div class="card-meta">
            <span class="card-author">{{ item.username || '管理员' }}</span>
            <span class="card-date">{{ formatDate(item.created_at) }}</span>
          </div>
          <div class="card-content">{{ item.content }}</div>
          <div v-if="auth.isAdmin" class="card-actions">
            <button @click="deleteAnnouncement(item.id)" class="btn-delete">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { announcementsApi } from '../services/api.js'
import pop from '../utils/pop.js'

const auth = useAuthStore()

const announcements = ref([])
const loading = ref(true)
const submitting = ref(false)
const showForm = ref(false)
const error = ref('')
const form = ref({ title: '', content: '' })

onMounted(async () => { await loadAnnouncements() })

async function loadAnnouncements() {
  loading.value = true
  try {
    const res = await announcementsApi.getAll()
    if (res.success) announcements.value = res.announcements || []
  } catch (err) { console.error('获取公告失败:', err) }
  finally { loading.value = false }
}

async function submitAnnouncement() {
  error.value = ''
  if (!form.value.title.trim()) { error.value = '请输入公告标题'; return }
  if (!form.value.content.trim()) { error.value = '请输入公告内容'; return }
  submitting.value = true
  try {
    const res = await announcementsApi.create(form.value.title.trim(), form.value.content.trim())
    if (res.success) {
      form.value.title = ''; form.value.content = ''; showForm.value = false
      await loadAnnouncements()
    } else { error.value = res.message || '发布失败' }
  } catch { error.value = '发布失败，请稍后重试' }
  finally { submitting.value = false }
}

async function deleteAnnouncement(id) {
  const ok = await pop.confirm('确定要删除此公告吗？')
  if (!ok) return
  try {
    const res = await announcementsApi.delete(id)
    if (res.success) { announcements.value = announcements.value.filter(a => a.id !== id); pop.up('删除成功', '公告已删除', 'success') }
  } catch { pop.up('删除失败', '无法删除公告，请稍后重试', 'error') }
}

function formatDate(d) { if (!d) return ''; return d.replace('T', ' ').substring(0, 19) }
</script>

<style scoped>
.announcement-page {
  min-height: 100vh;
  background: #0f0f1a;
  max-width: 900px;
  margin: 0 auto;
  padding: 80px 20px 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
}

.btn-publish {
  padding: 10px 24px;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-publish:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }

.publish-form {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 28px;
  margin-bottom: 28px;
}

.form-title {
  margin: 0 0 20px 0;
  font-size: 1.15rem;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
}

.form-group { margin-bottom: 16px; }

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65);
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'MapleMono CN Regular', monospace;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition: all 0.25s ease;
}

.form-input::placeholder, .form-textarea::placeholder { color: rgba(255, 255, 255, 0.3); }

.form-input:focus, .form-textarea:focus {
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.form-textarea { resize: vertical; min-height: 120px; }

.form-actions { display: flex; justify-content: flex-end; }

.btn-submit {
  padding: 10px 28px;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.error-msg { color: #ef4444; margin-bottom: 12px; font-size: 0.9rem; }

.loading-state { text-align: center; padding: 60px 20px; color: rgba(255, 255, 255, 0.35); font-size: 1rem; }

.announcement-list { display: flex; flex-direction: column; gap: 16px; }

.announcement-card {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.announcement-card:hover {
  border-color: rgba(79, 172, 254, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, #4facfe, #667eea);
}

.card-body { padding: 20px 24px; }

.card-title {
  margin: 0 0 8px 0;
  font-size: 1.15rem;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
}

.card-meta { display: flex; gap: 16px; font-size: 0.82rem; color: rgba(255, 255, 255, 0.35); margin-bottom: 14px; }

.card-content {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 0.92rem;
}

.card-actions { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.04); }

.btn-delete {
  padding: 6px 16px;
  background: rgba(220, 53, 69, 0.15);
  color: #ef4444;
  border: 1px solid rgba(220, 53, 69, 0.25);
  border-radius: 8px;
  cursor: pointer;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.25s ease;
}

.btn-delete:hover { background: #dc3545; color: white; border-color: #dc3545; }
</style>