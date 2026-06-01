<template>
  <div class="overview-tab">
    <!-- 数据面板 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ postCount }}</div>
        <div class="stat-desc">发布帖子</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ totalLikes }}</div>
        <div class="stat-desc">获得点赞</div>
      </div>
      <div class="stat-card" v-if="teamName">
        <div class="stat-number">{{ memberCount }}</div>
        <div class="stat-desc">{{ teamName }} 成员</div>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="info-card">
      <h3 class="card-title">基本信息</h3>
      <div class="info-list">
        <div class="info-row">
          <span class="info-label">用户名</span>
          <span class="info-value">{{ user.username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ user.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">注册时间</span>
          <span class="info-value">{{ formatDate(user.createdAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">最后登录</span>
          <span class="info-value">{{ formatDate(user.loginTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  user: { type: Object, required: true },
  postCount: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  teamName: { type: String, default: '' },
  memberCount: { type: Number, default: 0 }
})

function formatDate(dateString) {
  if (!dateString) return '未知'
  try {
    return new Date(dateString).toLocaleString('zh-CN')
  } catch {
    return '日期格式错误'
  }
}
</script>

<style scoped>
.overview-tab {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #4facfe;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 0.95rem;
  color: #6c757d;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4facfe;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.95rem;
}

.info-value {
  font-weight: 500;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}
</style>