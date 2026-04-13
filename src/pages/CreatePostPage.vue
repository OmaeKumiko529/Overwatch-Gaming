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
          />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RichTextEditor from '../components/RichTextEditor.vue'

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
    
    const result = postService.createPost({
      title: formData.title.trim(),
      category: formData.category,
      content: formData.content.trim()
    }, currentUser.id, currentUser.username)
    
    if (result.success) {
      message.value = '帖子发布成功！正在跳转到用户面板...'
      isError.value = false
      
      // 清空表单
      formData.title = ''
      formData.content = ''
      
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
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.form-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5em;
  font-weight: bold;
  font-family: 'SmileySans Oblique', sans-serif;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: bold;
  color: #555;
  font-size: 1.1em;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23333' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 40px;
}

.char-count {
  text-align: right;
  font-size: 0.9em;
  color: #888;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.submit-button,
.back-button {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'SmileySans Oblique', sans-serif;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-button {
  background: #f0f0f0;
  color: #666;
}

.back-button:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
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
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-container {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .page-title {
    font-size: 2em;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>