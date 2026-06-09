<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const errorCode = computed(() => {
  const code = Number(route.params.code) || 404
  return [401, 402, 403, 404].includes(code) ? code : 404
})

const errorInfo = computed(() => {
  const map = {
    401: {
      icon: '🔐',
      title: '未授权访问',
      message: '请先登录后再访问此页面',
      hint: '您可能需要登录或会话已过期',
      action: '前往登录',
      actionLink: '/login'
    },
    402: {
      icon: '💳',
      title: '需要付费',
      message: '此功能需要付费订阅',
      hint: '请完成订阅后即可使用此功能',
      action: '返回首页',
      actionLink: '/'
    },
    403: {
      icon: '🚫',
      title: '禁止访问',
      message: '您没有权限访问此页面',
      hint: '当前账户权限不足，请联系管理员',
      action: '返回首页',
      actionLink: '/'
    },
    404: {
      icon: '🔍',
      title: '页面未找到',
      message: '页面不存在或已被移除',
      hint: '请检查输入的网址是否正确',
      action: '返回首页',
      actionLink: '/'
    }
  }
  return map[errorCode.value] || map[404]
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="error-page">
    <div class="error-overlay">
      <div class="error-card">
        <div class="error-code">{{ errorCode }}</div>
        <div class="error-icon">{{ errorInfo.icon }}</div>
        <h1 class="error-title">{{ errorInfo.title }}</h1>
        <p class="error-message">{{ errorInfo.message }}</p>
        <p class="error-hint">{{ errorInfo.hint }}</p>

        <div class="error-actions">
          <router-link :to="errorInfo.actionLink" class="btn btn-primary">
            {{ errorInfo.action }}
          </router-link>
          <button class="btn btn-secondary" @click="goBack">返回上一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  background: #0f0f1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.error-overlay {
  width: 100%;
  max-width: 520px;
}

.error-card {
  background: #1a1a2e;
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  border: 1px solid #2a2a4a;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.error-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #4facfe, #667eea, #4facfe);
}

.error-code {
  font-size: 6rem;
  font-weight: 900;
  font-family: 'MapleMono CN Regular', monospace;
  color: #4facfe;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 0 40px rgba(79, 172, 254, 0.2);
  opacity: 0.5;
  letter-spacing: 4px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.error-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0 0 12px;
}

.error-message {
  font-size: 1rem;
  color: #a0aec0;
  margin: 0 0 8px;
  line-height: 1.5;
}

.error-hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 32px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-family: 'MapleMono CN Regular', monospace;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #4facfe 0%, #667eea 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.btn-secondary {
  background: transparent;
  color: #a0aec0;
  border: 2px solid #2a2a4a;
}
.btn-secondary:hover {
  border-color: #4facfe;
  color: #4facfe;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .error-card {
    padding: 40px 24px;
  }
  .error-code {
    font-size: 4rem;
  }
  .error-icon {
    font-size: 3rem;
  }
  .error-title {
    font-size: 1.3rem;
  }
  .btn {
    padding: 10px 20px;
    font-size: 0.88rem;
  }
}
</style>