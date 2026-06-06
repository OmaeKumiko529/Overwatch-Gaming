<template>
  <div class="announcement-page">
    <div class="page-header">
      <h1>全站公告</h1>
      <div v-if="auth.isAdmin" class="admin-actions">
        <button @click="showForm = !showForm" class="btn-publish">
          {{ showForm ? '收起表单' : '发布新公告' }}
        </button>
      </div>
    </div>

    <!-- 发布公告表单（仅管理员可见） -->
    <div v-if="showForm && auth.isAdmin" class="publish-form">
      <h2>发布新公告</h2>
      <div class="form-group">
        <label for="title">公告标题</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="请输入公告标题"
          maxlength="100"
        />
      </div>
      <div class="form-group">
        <label for="content">公告内容</label>
        <textarea
          id="content"
          v-model="form.content"
          placeholder="请输入公告内容..."
          rows="6"
        ></textarea>
      </div>
      <div v-if="error" class="error-msg">{{ error }}</div>
      <div class="form-actions">
        <button @click="submitAnnouncement" :disabled="submitting" class="btn-submit">
          {{ submitting ? '发布中...' : '发布公告' }}
        </button>
      </div>
    </div>

    <!-- 公告列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="announcements.length === 0" class="empty">
      暂无公告
    </div>
    <div v-else class="announcement-list">
      <div v-for="item in announcements" :key="item.id" class="announcement-card">
        <div class="announcement-header">
          <h3 class="announcement-title">{{ item.title }}</h3>
          <div class="announcement-meta">
            <span class="author">{{ item.username || '管理员' }}</span>
            <span class="date">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
        <div class="announcement-content">{{ item.content }}</div>
        <div v-if="auth.isAdmin" class="announcement-actions">
          <button @click="deleteAnnouncement(item.id)" class="btn-delete">删除</button>
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
const form = ref({
  title: '',
  content: ''
})

onMounted(async () => {
  await loadAnnouncements()
})

async function loadAnnouncements() {
  loading.value = true
  try {
    const res = await announcementsApi.getAll()
    if (res.success) {
      announcements.value = res.announcements || []
    }
  } catch (err) {
    console.error('获取公告失败:', err)
  } finally {
    loading.value = false
  }
}

async function submitAnnouncement() {
  error.value = ''
  if (!form.value.title.trim()) {
    error.value = '请输入公告标题'
    return
  }
  if (!form.value.content.trim()) {
    error.value = '请输入公告内容'
    return
  }

  submitting.value = true
  try {
    const res = await announcementsApi.create(form.value.title.trim(), form.value.content.trim())
    if (res.success) {
      form.value.title = ''
      form.value.content = ''
      showForm.value = false
      await loadAnnouncements()
    } else {
      error.value = res.message || '发布失败'
    }
  } catch (err) {
    error.value = '发布失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

async function deleteAnnouncement(id) {
  const ok = await pop.confirm('确定要删除此公告吗？')
  if (!ok) return
  try {
    const res = await announcementsApi.delete(id)
    if (res.success) {
      announcements.value = announcements.value.filter(a => a.id !== id)
      pop.up('删除成功', '公告已删除', 'success')
    }
  } catch (err) {
    console.error('删除公告失败:', err)
    pop.up('删除失败', '无法删除公告，请稍后重试', 'error')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}
</script>

<style scoped>
.announcement-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.8em;
  color: #333;
}

.btn-publish {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.3s;
}

.btn-publish:hover {
  background: #5a6fd6;
}

.publish-form {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.publish-form h2 {
  margin: 0 0 20px 0;
  font-size: 1.3em;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-submit {
  padding: 10px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #218838;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc3545;
  margin-bottom: 12px;
  font-size: 0.9em;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 1.1em;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.3s;
}

.announcement-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.announcement-header {
  margin-bottom: 12px;
}

.announcement-title {
  margin: 0 0 8px 0;
  font-size: 1.2em;
  color: #222;
}

.announcement-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85em;
  color: #888;
}

.announcement-content {
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.announcement-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.btn-delete {
  padding: 6px 14px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.3s;
}

.btn-delete:hover {
  background: #c82333;
}
</style>