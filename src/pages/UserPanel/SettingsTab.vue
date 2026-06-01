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
  padding: 20px 0;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #e9ecef;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
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
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-icon {
  font-size: 1.4rem;
}

.logout-btn {
  background: rgba(255, 193, 7, 0.1);
  border-color: #ffc107;
  color: #856404;
}
.logout-btn:hover {
  background: #ffc107;
  color: white;
}

.password-btn {
  background: rgba(0, 123, 255, 0.1);
  border-color: #007bff;
  color: #004085;
}
.password-btn:hover {
  background: #007bff;
  color: white;
}

.delete-btn {
  background: rgba(220, 53, 69, 0.1);
  border-color: #dc3545;
  color: #721c24;
}
.delete-btn:hover {
  background: #dc3545;
  color: white;
}
</style>