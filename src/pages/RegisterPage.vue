<template>
  <div class="register-page page-enter-active">
    <!-- 视频背景 -->
    <div class="video-background">
      <video autoplay muted loop playsinline class="background-video">
        <source src="/Amiya2.mp4" type="video/mp4">
        您的浏览器不支持视频标签。
      </video>
      <div class="video-overlay"></div>
    </div>
    
    <div class="form-container">
      <h1 class="page-title">注册账号</h1>
      <form @submit.prevent="handleRegister" class="register-form">
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
          <button type="submit" class="submit-button">注册</button>
          <button type="button" class="back-button" @click="goToHome">返回首页</button>
        </div>
        
        <div class="form-footer">
          <p>已有账号？ <a href="#login" class="login-link">去登录</a></p>
        </div>
      </form>
      
      <div v-if="message" class="message" :class="{ 'error': isError }">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const message = ref('')
const isError = ref(false)

const handleRegister = () => {
  // 验证密码是否匹配
  if (formData.password !== formData.confirmPassword) {
    message.value = '两次输入的密码不一致'
    isError.value = true
    return
  }
  
  // 验证密码长度
  if (formData.password.length < 6) {
    message.value = '密码长度至少为6位'
    isError.value = true
    return
  }
  
  // 从本地存储获取已注册用户
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  
  // 检查用户名是否已存在
  const existingUser = users.find(user => user.username === formData.username)
  if (existingUser) {
    message.value = '用户名已存在'
    isError.value = true
    return
  }
  
  // 检查邮箱是否已存在
  const existingEmail = users.find(user => user.email === formData.email)
  if (existingEmail) {
    message.value = '邮箱已被注册'
    isError.value = true
    return
  }
  
  // 创建新用户
  const newUser = {
    id: Date.now(),
    username: formData.username,
    email: formData.email,
    password: formData.password,
    createdAt: new Date().toISOString()
  }
  
  // 保存到本地存储
  users.push(newUser)
  localStorage.setItem('users', JSON.stringify(users))
  
  // 显示成功消息
  message.value = '注册成功！即将跳转到登录页面...'
  isError.value = false
  
  // 清空表单
  formData.username = ''
  formData.email = ''
  formData.password = ''
  formData.confirmPassword = ''
  
  // 立即跳转到登录页面
  router.push({ name: 'Login' })
}

const goToHome = () => {
  router.push({ name: 'Home' })
}
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

.register-form {
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
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}

.submit-button {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
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

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: bold;
}

.login-link:hover {
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
</style>
