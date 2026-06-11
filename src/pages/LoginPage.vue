<template>
  <div class="login-page">
    <div class="video-background">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/Amiya2.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
    </div>
    
    <div class="form-container">
      <div class="form-card">
        <h1 class="page-title">登录账号</h1>
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="loginUsername">用户名或邮箱</label>
            <input
              type="text"
              id="loginUsername"
              v-model="loginData.username"
              required
              placeholder="请输入用户名或邮箱"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="loginPassword">密码</label>
            <input
              type="password"
              id="loginPassword"
              v-model="loginData.password"
              required
              placeholder="请输入密码"
              class="form-input"
            />
          </div>
          
          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" />
              <span>记住我</span>
            </label>
            <a href="#" class="forgot-password" @click.prevent="showForgotPassword = true">忘记密码？</a>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="submit-button" :disabled="isSubmitting">{{ isSubmitting ? '登录中...' : '登录' }}</button>
            <button type="button" class="back-button" @click="goToHome">返回首页</button>
          </div>
          
          <div class="form-footer">
            <p>还没有账号？ <router-link to="/register" class="alt-link">立即注册</router-link></p>
          </div>
        </form>
        
        <div v-if="message" class="message" :class="{ 'error': isError }">
          {{ message }}
        </div>
        
        <div v-if="showForgotPassword" class="modal-overlay" @click.self="showForgotPassword = false">
          <div class="modal-content">
            <h3>重置密码</h3>
            <p>请联系管理员或使用注册邮箱找回密码。</p>
            <button @click="showForgotPassword = false" class="modal-btn">关闭</button>
          </div>
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

const loginData = reactive({ username: '', password: '' })
const rememberMe = ref(false)
const showForgotPassword = ref(false)
const message = ref('')
const isError = ref(false)
const isSubmitting = ref(false)

const handleLogin = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  message.value = ''
  isError.value = false
  try {
    const result = await auth.login(loginData.username, loginData.password, rememberMe.value)
    if (result.success) {
      message.value = '登录成功！'
      isError.value = false
      loginData.username = ''
      loginData.password = ''
      setTimeout(() => router.push({ name: 'Home' }), 500)
    } else {
      message.value = result.message || '登录失败'
      isError.value = true
    }
  } catch {
    message.value = '登录失败，请检查网络连接'
    isError.value = true
  } finally {
    isSubmitting.value = false
  }
}

const goToHome = () => router.push({ name: 'Home' })
</script>

<style scoped>
.login-page {
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

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'MapleMono CN Regular', monospace;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-size: 0.88rem;
}

.remember-me input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4facfe;
  cursor: pointer;
}

.forgot-password {
  font-family: 'MapleMono CN Regular', monospace;
  color: rgba(79, 172, 254, 0.7);
  text-decoration: none;
  font-size: 0.88rem;
  transition: color 0.2s;
}

.forgot-password:hover {
  color: #4facfe;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  padding: 28px;
  border-radius: 16px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.modal-content h3 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.5rem;
  color: #e0e0e0;
  margin-bottom: 12px;
}

.modal-content p {
  color: #a0aec0;
  margin-bottom: 20px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.modal-btn {
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}
</style>