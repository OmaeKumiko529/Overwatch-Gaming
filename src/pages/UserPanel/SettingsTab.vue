<template>
  <div class="settings-tab">
    <div class="settings-card">
      <h3 class="card-title">账户操作</h3>
      <div class="action-grid">
        <button class="action-btn logout-btn" @click="$emit('logout')">
          <span class="btn-icon">🚪</span>
          <span class="btn-text">退出登录</span>
        </button>
        <button class="action-btn password-btn" @click="$emit('change-password')">
          <span class="btn-icon">🔒</span>
          <span class="btn-text">修改密码</span>
        </button>
        <button class="action-btn delete-btn" @click="$emit('delete-account')">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">注销账户</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['logout', 'change-password', 'delete-account'])
</script>

<style scoped>
.settings-tab {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 0;
}

.settings-card {
  background: #1a1a2e;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid #2a2a4a;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #4facfe;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-icon {
  font-size: 1.5rem;
}

.logout-btn {
  background: rgba(255, 193, 7, 0.1);
  border-color: #ffc107;
  color: #ffc107;
}
.logout-btn:hover {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: #1a1a2e;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 193, 7, 0.3);
}

.password-btn {
  background: rgba(79, 172, 254, 0.1);
  border-color: #4facfe;
  color: #4facfe;
}
.password-btn:hover {
  background: linear-gradient(135deg, #4facfe, #667eea);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 172, 254, 0.3);
}

.delete-btn {
  background: rgba(220, 53, 69, 0.15);
  border-color: #ef4444;
  color: #ef4444;
}
.delete-btn:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(220, 53, 69, 0.3);
}
</style>
