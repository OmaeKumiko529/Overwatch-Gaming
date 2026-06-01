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
          <label for="category">分类</label>
          <select
            id="category"
            v-model="formData.category"
            class="form-select"
          >
            <option value="general">一般讨论</option>
            <option value="team">战队招募</option>
            <option value="strategy">战术攻略</option>
            <option value="highlight">精彩集锦</option>
            <option value="question">问题求助</option>
            <option value="announcement">公告通知</option>
          </select>
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
import RichTextEditor from '../components/RichTextEditor.vue'
import { extractMentionsFromHTML } from '../utils/mentionParser.js'
import userService from '../services/user.js'

const router = useRouter()
import auth from '../services/auth.js'
import postService from '../services/post.js'

const formData = reactive({
  title: '',
  category: 'general',
  content: ''
})

const message = ref('')
const isError = ref(false)
const isSubmitting = ref(false)
const mentionedUsers = ref([])

// 检查用户是否已登录
onMounted(() => {
  const currentUser = auth.getCurrentUser()
  if (!currentUser) {
    message.value = '请先登录后再发帖'
    isError.value = true
    // 立即跳转到登录页面
    router.push({ name: 'Login' })
  }
})

// 监听内容变化，更新提及用户列表
watch(() => formData.content, (newContent) => {
  updateMentionedUsers(newContent)
})

// 处理提及事件
const handleMention = (user) => {
  // 添加用户到提及列表（避免重复）
  if (!mentionedUsers.value.some(u => u.id === user.id)) {
    mentionedUsers.value.push({
      id: user.id,
      username: user.username,
      avatar: user.avatar || '/Head.png'
    })
    
    // 显示提示消息
    message.value = `已提及用户 @${user.username}`
    isError.value = false
    
    // 3秒后清除消息
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
  
  // 从HTML中提取提及
  const mentions = extractMentionsFromHTML(htmlContent)
  
  // 获取完整的用户信息
  const updatedMentions = mentions.map(mention => {
    const user = userService.getUserById(mention.id)
    return {
      id: mention.id,
      username: mention.username,
      avatar: user?.avatar || '/Head.png'
    }
  }).filter(user => user.id) // 过滤掉无效的用户
  
  // 更新提及用户列表
  mentionedUsers.value = updatedMentions
}

const handleCreatePost = async () => {
  // 验证表单
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
    const currentUser = auth.getCurrentUser()
    if (!currentUser) {
      message.value = '请先登录后再发帖'
      isError.value = true
      router.push({ name: 'Login' })
      return
    }
    
    // 创建帖子数据，包含提及用户信息
    const postData = {
      title: formData.title.trim(),
      category: formData.category,
      content: formData.content.trim(),
      mentions: mentionedUsers.value.map(user => ({
        userId: user.id,
        username: user.username
      }))
    }
    
    const result = postService.createPost(postData, currentUser.id, currentUser.username)
    
    if (result.success) {
      message.value = '帖子发布成功！正在跳转到用户面板...'
      isError.value = false
      
      // 清空表单和提及列表
      formData.title = ''
      formData.content = ''
      mentionedUsers.value = []
      
      // 立即跳转到用户面板
      router.push({ name: 'User' })
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
  text-align: center;
  color: #333;
  margin-bottom: 28px;
  font-size: 1.8rem;
  font-weight: 700;
  font-family: 'SmileySans Oblique', sans-serif;
  padding-bottom: 12px;
  border-bottom: 2px solid #4facfe;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
  font-family: 'SmileySans Oblique', sans-serif;
}

.form-input,
.form-select {
  padding: 10px 14px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'SmileySans Oblique', sans-serif;
  transition: all 0.3s ease;
  background: white;
  color: #333;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4facfe;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.form-input::placeholder {
  color: #adb5bd;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='%236c757d' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 14px;
  padding-right: 40px;
}

.char-count {
  text-align: right;
  font-size: 0.82rem;
  color: #adb5bd;
  margin-top: 2px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.submit-button,
.back-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'SmileySans Oblique', sans-serif;
}

.submit-button {
  background: linear-gradient(135deg, #4facfe 0%, #667eea 100%);
  color: white;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 172, 254, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-button {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.back-button:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.message {
  margin-top: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 富文本编辑器样式 */
.rich-text-editor-wrapper {
  margin-top: 4px;
}

/* 提及用户样式 */
.mentioned-users {
  margin-top: 4px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.mentioned-users-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.mentioned-users-title::before {
  content: '@';
  font-size: 1.1rem;
  color: #4facfe;
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
  padding: 4px 12px;
  background-color: white;
  border-radius: 20px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.mentioned-user-item:hover {
  background-color: #e9ecef;
  transform: translateY(-1px);
}

.mentioned-user-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.mentioned-user-name {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-container {
    padding: 24px 20px;
    margin: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>