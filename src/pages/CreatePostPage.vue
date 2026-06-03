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
        
        <!-- 提及用户显示 -->
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
        
        <div v-if="message" class="message" :class="{ 'error': isError, 'success': !isError }">
          {{ message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
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

const message = ref('')
const isError = ref(false)
const isSubmitting = ref(false)
const mentionedUsers = ref([])
const allUsers = ref([])

// 检查用户是否已登录
onMounted(() => {
  if (!auth.isLoggedIn) {
    message.value = '请先登录后再发帖'
    isError.value = true
    router.push({ name: 'Login' })
  }
  // 加载用户列表用于提及
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

// 监听内容变化，更新提及用户列表
watch(() => formData.content, (newContent) => {
  updateMentionedUsers(newContent)
})

// 处理提及事件
const handleMention = (user) => {
  if (!mentionedUsers.value.some(u => u.id === user.id)) {
    mentionedUsers.value.push({
      id: user.id,
      username: user.username,
      avatar: user.avatar || '/Head.png'
    })
    
    message.value = `已提及用户 @${user.username}`
    isError.value = false
    
    setTimeout(() => {
      if (message.value === `已提及用户 @${user.username}`) {
        message.value = ''
      }
    }, 3000)
  }
}

// 从内容中更新提及用户列表
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
    message.value = '请输入帖子标题'
    isError.value = true
    return
  }
  
  if (!formData.content.trim()) {
    message.value = '请输入帖子内容'
    isError.value = true
    return
  }
  
  if (formData.title.length > 100) {
    message.value = '标题不能超过100个字符'
    isError.value = true
    return
  }
  
  if (formData.content.length > 5000) {
    message.value = '内容不能超过5000个字符'
    isError.value = true
    return
  }
  
  isSubmitting.value = true
  message.value = ''
  
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      message.value = '请先登录后再发帖'
      isError.value = true
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
      message.value = '帖子发布成功！正在跳转...'
      isError.value = false
      
      formData.title = ''
      formData.content = ''
      mentionedUsers.value = []
      
      // 跳转到新帖子详情（使用 PID）
      setTimeout(() => {
        router.push('/post/' + encodeURIComponent(result.post.pid))
      }, 500)
    } else {
      message.value = result.message || '发布失败，请重试'
      isError.value = true
    }
  } catch (error) {
    message.value = '发布失败：' + error.message
    isError.value = true
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
  background: #f0f2f5;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 40px;
  box-sizing: border-box;
}

.form-container {
  background: white;
  border-radius: 16px;
  padding: 36px;
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
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
  color: #333;
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
  color: #495057;
  font-weight: 600;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'MapleMono CN Regular', monospace;
  transition: border-color 0.2s;
  background: white;
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
  color: #adb5bd;
}

.rich-text-editor-wrapper {
  min-height: 250px;
}

.mentioned-users {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px;
  margin-top: 8px;
}

.mentioned-users-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
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
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
  background-color: #f1f1f1;
  color: #333;
  border: 2px solid #ddd;
  padding: 14px;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.message {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1rem;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>