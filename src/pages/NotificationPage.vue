<template>
  <div class="notification-page">
    <div class="notification-container">
      <div class="notification-header">
        <h1>通知</h1>
        <p class="notification-subtitle">这里是您的通知中心</p>
      </div>

      <div class="notification-content">
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>暂无通知</h3>
          <p>当您有新的通知时，它们会显示在这里。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 导入Vue Composition API
import { ref, onMounted } from 'vue'
// 导入认证服务
import auth from '../services/auth.js'

// 响应式变量：用户登录状态
const isLoggedIn = ref(false)

// 检查登录状态函数
const checkLoginStatus = () => {
  isLoggedIn.value = auth.isLoggedIn()
}

// 组件挂载时的生命周期钩子
onMounted(() => {
  // 初始检查登录状态
  checkLoginStatus()
})
</script>

<style scoped>
.notification-page {
  padding-top: 70px; /* 为固定导航栏留出空间 */
  min-height: 100vh;
  background-color: #f5f5f5;
}

.notification-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.notification-header {
  text-align: center;
  margin-bottom: 40px;
}

.notification-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.notification-subtitle {
  font-size: 1.1rem;
  color: #666;
}

.notification-content {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.8rem;
  color: #555;
  margin-bottom: 10px;
}

.empty-state p {
  font-size: 1.1rem;
  color: #777;
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .notification-container {
    padding: 15px;
  }
  
  .notification-header h1 {
    font-size: 2rem;
  }
  
  .notification-content {
    padding: 30px 20px;
  }
  
  .empty-icon {
    font-size: 3rem;
  }
}
</style>