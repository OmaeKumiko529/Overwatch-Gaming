<template>
  <div class="login-page page-enter-active">
    <!-- 视频背景 -->
    <div class="video-background">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/Amiya2.mp4" type="video/mp4">
        您的浏览器不支持视频标签。
      </video>
      <div class="video-overlay"></div>
    </div>
    
    <div class="form-container">
      <h1 class="page-title">登录账号</h1>
      <form @submit.prevent="handleLogin" class="login-form">
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
          <p>还没有账号？ <router-link to="/register" class="register-link">立即注册</router-link></p>
        </div>
      </form>
      
      <div v-if="message" class="message" :class="{ 'error': isError }">
        {{ message }}
      </div>
      
      <!-- 忘记密码模态框 -->
      <div v-if="showForgotPassword" class="modal-overlay" @click.self="showForgotPassword = false">
        <div class="modal-content">
          <h3>重置密码</h3>
          <p>请联系管理员或使用注册邮箱找回密码。</p>
          <div class="modal-actions">
            <button @click="showForgotPassword = false" class="modal-button">关闭</button>
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

const loginData = reactive({
  username: '',
  password: ''
})

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
      
      // 清空表单
      loginData.username = ''
      loginData.password = ''
      
      // 跳转到首页
      setTimeout(() => router.push({ name: 'Home' }), 500)
    } else {
      message.value = result.message || '登录失败'
      isError.value = true
    }
  } catch (err) {
    message.value = '登录失败，请检查网络连接'
    isError.value = true
  } finally {
    isSubmitting.value = false
  }
}

const goToHome = () => {
  router.push({ name: 'Home' })
}
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
  width: auto;
  height: auto;
  transform: translate(-50%, -50%);
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.form-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.page-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 2.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 30px;
  font-weight: bold;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.1rem;
  color: #555;
  font-weight: 500;
}

.form-input {
  padding: 14px 16px;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  font-family: 'SmileySans Oblique', sans-serif;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #f5576c;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  color: #555;
  cursor: pointer;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.forgot-password {
  font-family: 'SmileySans Oblique', sans-serif;
  color: #f5576c;
  text-decoration: none;
  font-size: 0.95rem;
}

.forgot-password:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.submit-button {
  flex: 1;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 10px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(245, 87, 108, 0.4);
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
  padding: 16px;
  border-radius: 10px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.form-footer p {
  font-family: 'SmileySans Oblique', sans-serif;
  color: #666;
  font-size: 1rem;
}

.register-link {
  color: #f5576c;
  text-decoration: none;
  font-weight: bold;
}

.register-link:hover {
  text-decoration: underline;
}

.message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
}

.message:not(.error) {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 15px;
}

.modal-content p {
  font-family: 'SmileySans Oblique', sans-serif;
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.modal-button {
  background-color: #f5576c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.modal-button:hover {
  background-color: #e04a5f;
}
</style>