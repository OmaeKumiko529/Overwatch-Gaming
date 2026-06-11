<template>
  <div class="register-page">
    <div class="video-background">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/Amiya2.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
    </div>
    
    <div class="form-container">
      <div class="form-card">
        <h1 class="page-title">注册账号</h1>
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              type="text"
              id="username"
              v-model="formData.username"
              required
              placeholder="请输入用户名"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              required
              placeholder="请输入邮箱"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input
              type="password"
              id="password"
              v-model="formData.password"
              required
              placeholder="请输入密码"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              required
              placeholder="请再次输入密码"
              class="form-input"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting">{{ isSubmitting ? '注册中...' : '注册' }}</button>
            <button type="button" class="back-button" @click="goToHome">返回首页</button>
          </div>
          
          <div class="form-footer">
            <p>已有账号？ <router-link to="/login" class="alt-link">去登录</router-link></p>
          </div>
        </form>
        
        <div v-if="message" class="message" :class="{ 'error': isError }">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const message = ref('')
const isError = ref(false)
const isSubmitting = ref(false)

const handleRegister = async () => {
  if (isSubmitting.value) return
  
  if (formData.password !== formData.confirmPassword) {
    message.value = '两次输入的密码不一致'
    isError.value = true
    return
  }
  
  if (formData.password.length < 6) {
    message.value = '密码长度至少为6位'
    isError.value = true
    return
  }

  isSubmitting.value = true
  message.value = ''
  isError.value = false

  try {
    const result = await auth.registerUser({
      username: formData.username,
      email: formData.email,
      password: formData.password
    })
    
    if (result.success) {
      message.value = '注册成功！正在跳转...'
      isError.value = false
      formData.username = ''
      formData.email = ''
      formData.password = ''
      formData.confirmPassword = ''
      setTimeout(() => router.push({ name: 'Home' }), 1000)
    } else {
      message.value = result.message || '注册失败'
      isError.value = true
    }
  } catch {
    message.value = '注册失败，请检查网络连接'
    isError.value = true
  } finally {
    isSubmitting.value = false
  }
}

const goToHome = () => router.push({ name: 'Home' })
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

.background-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
}

.form-container {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  animation: formIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes formIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.form-card {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2rem;
  color: #ffffff;
  text-align: center;
  margin-bottom: 28px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.auth-form {
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
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
}

.form-input {
  padding: 12px 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: 'MapleMono CN Regular', monospace;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  outline: none;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:focus {
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.submit-button {
  flex: 1;
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.25);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 172, 254, 0.35);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-button {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  padding: 14px;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.2);
}

.form-footer {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.form-footer p {
  font-family: 'MapleMono CN Regular', monospace;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
}

.alt-link {
  color: rgba(79, 172, 254, 0.8);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.alt-link:hover {
  color: #4facfe;
}

.message {
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: center;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.9rem;
}

.message:not(.error) {
  background: rgba(40, 167, 69, 0.12);
  color: #4ade80;
  border: 1px solid rgba(40, 167, 69, 0.2);
}

.message.error {
  background: rgba(220, 53, 69, 0.12);
  color: #ef4444;
  border: 1px solid rgba(220, 53, 69, 0.2);
}
</style>