<template>
  <div class="create-post-page page-enter-active">
    <div class="form-container">
      <h1 class="page-title">发布新帖子</h1>
      <form @submit.prevent="handleCreatePost" class="create-post-form">
        <div class="form-group">
          <label for="title">帖子标题</label>
          <input
            type="text"
            id="title"
            v-model="formData.title"
            required
            placeholder="请输入帖子标题"
            class="form-input"
            maxlength="100"
          />
          <div class="char-count">{{ formData.title.length }}/100</div>
        </div>
        
        <div class="form-group">
          <label for="content">帖子内容</label>
          <RichTextEditor
            v-model="formData.content"
            :placeholder="'请输入帖子内容...'"
            :max-length="5000"
            class="rich-text-editor-wrapper"
            :enable-mention="true"
            @mention="handleMention"
          />
        </div>
        
        <div v-if="mentionedUsers.length > 0" class="mentioned-users">
          <h3 class="mentioned-users-title">提及的用户</h3>
          <div class="mentioned-users-list">
            <div v-for="user in mentionedUsers" :key="user.id" class="mentioned-user-item">
              <img :src="user.avatar" :alt="user.username" class="mentioned-user-avatar" />
              <span class="mentioned-user-name">@{{ user.username }}</span>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            {{ isSubmitting ? '发布中...' : '发布帖子' }}
          </button>
          <button type="button" class="back-button" @click="goBack">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import pop from '../utils/pop.js'
import RichTextEditor from '../components/RichTextEditor.vue'
import { extractMentionsFromHTML } from '../utils/mentionParser.js'
import { authApi } from '../services/api.js'
import postService from '../services/post.js'

const router = useRouter()
const auth = useAuthStore()

const formData = reactive({
  title: '',
  content: ''
})

const isSubmitting = ref(false)
const mentionedUsers = ref([])
const allUsers = ref([])

onMounted(() => {
  if (!auth.isLoggedIn) {
    pop.toast('请先登录后再发帖', 'error')
    router.push({ name: 'Login' })
  }
  loadUsers()
})

async function loadUsers() {
  try {
    const res = await authApi.getAllUsers()
    if (res.success) {
      allUsers.value = res.users
    }
  } catch {}
}

watch(() => formData.content, (newContent) => {
  updateMentionedUsers(newContent)
})

const handleMention = (user) => {
  if (!mentionedUsers.value.some(u => u.id === user.id)) {
    mentionedUsers.value.push({
      id: user.id,
      username: user.username,
      avatar: user.avatar || '/Head.png'
    })
    pop.toast(`已提及用户 @${user.username}`, 'info')
  }
}

const updateMentionedUsers = (htmlContent) => {
  if (!htmlContent) {
    mentionedUsers.value = []
    return
  }
  
  const mentions = extractMentionsFromHTML(htmlContent)
  
  const updatedMentions = mentions.map(mention => {
    const user = allUsers.value.find(u => String(u.id) === mention.id)
    return {
      id: mention.id,
      username: mention.username,
      avatar: user?.avatar || '/Head.png'
    }
  }).filter(user => user.id)
  
  mentionedUsers.value = updatedMentions
}

const handleCreatePost = async () => {
  if (!formData.title.trim()) {
    pop.toast('请输入帖子标题', 'error')
    return
  }
  
  if (!formData.content.trim()) {
    pop.toast('请输入帖子内容', 'error')
    return
  }
  
  if (formData.title.length > 100) {
    pop.toast('标题不能超过100个字符', 'error')
    return
  }
  
  if (formData.content.length > 5000) {
    pop.toast('内容不能超过5000个字符', 'error')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      pop.toast('请先登录后再发帖', 'error')
      router.push({ name: 'Login' })
      return
    }
    
    const postData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: 'general',
      mentions: mentionedUsers.value.map(user => ({
        userId: user.id,
        username: user.username
      }))
    }
    
    const result = await postService.createPost(postData, currentUser.id, currentUser.username)
    
    if (result.success) {
      pop.toast('帖子发布成功！正在跳转...', 'success')
      
      formData.title = ''
      formData.content = ''
      mentionedUsers.value = []
      
      setTimeout(() => {
        router.push('/post/' + encodeURIComponent(result.post.pid))
      }, 500)
    } else {
      pop.toast(result.message || '发布失败，请重试', 'error')
    }
  } catch (error) {
    pop.toast('发布失败：' + error.message, 'error')
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  window.history.back()
}
</script>

<style scoped>
.create-post-page {
  min-height: 100vh;
  padding-top: 80px;
  background: #0f0f1a;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 40px;
  box-sizing: border-box;
}

.form-container {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 36px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border: 1px solid #2a2a4a;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.8rem;
  color: #4facfe;
  text-align: center;
  margin-bottom: 32px;
  font-weight: bold;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-group label {
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
  color: #a0aec0;
  font-weight: 600;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #2a2a4a;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'MapleMono CN Regular', monospace;
  transition: border-color 0.2s;
  background: #0a0a18;
  color: #e0e0e0;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4facfe;
}

.char-count {
  position: absolute;
  right: 12px;
  bottom: -22px;
  font-size: 0.8rem;
  color: #6c757d;
}

.rich-text-editor-wrapper {
  min-height: 250px;
}

.mentioned-users {
  background: #252545;
  border-radius: 10px;
  padding: 16px;
  margin-top: 8px;
}

.mentioned-users-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #a0aec0;
  margin: 0 0 12px 0;
}

.mentioned-users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mentioned-user-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a1a2e;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  border: 1px solid #2a2a4a;
}

.mentioned-user-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.mentioned-user-name {
  color: #4facfe;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.submit-button {
  flex: 1;
  padding: 14px;
  background: linear-gradient(135deg, #4facfe 0%, #667eea 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 172, 254, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-button {
  flex: 1;
  background: transparent;
  color: #a0aec0;
  border: 2px solid #2a2a4a;
  padding: 14px;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #252545;
  border-color: #4facfe;
  color: #e0e0e0;
}
</style>
