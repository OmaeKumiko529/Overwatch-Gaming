<template>
  <div class="profile-cover">
    <div class="cover-bg"></div>
    <div class="cover-overlay">
      <div class="profile-header-content">
        <div class="profile-avatar">
          <img
            :src="user.avatar || '/default-avatar.webp'"
            :alt="user.username"
            class="avatar-image"
            @error="handleAvatarError"
          />
        </div>
        <div class="profile-header-info">
          <div class="profile-name-row">
            <userrankBadge :userId="user.id" />
          <h1 class="profile-name">{{ user.displayName || user.username }}</h1>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ postCount }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalLikes }}</span>
              <span class="stat-label">获赞</span>
            </div>
            <div class="stat-item" v-if="teamName">
              <span class="stat-value">{{ memberCount }}</span>
              <span class="stat-label">{{ teamName }} 成员</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: { type: Object, required: true },
  postCount: { type: Number, default: 0 },
  totalLikes: { type: Number, default: 0 },
  teamName: { type: String, default: '' },
  memberCount: { type: Number, default: 0 }
})

function handleAvatarError(e) {
  e.target.src = '/default-avatar.webp'
}
</script>

<style scoped>
.profile-cover {
  position: relative;
  height: 240px;
  overflow: hidden;
}

.cover-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #e94560 100%);
  position: relative;
}

.cover-bg::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 80%, rgba(233, 69, 96, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(79, 172, 254, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.cover-bg::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 40px,
    rgba(255, 255, 255, 0.015) 40px,
    rgba(255, 255, 255, 0.015) 41px
  );
  pointer-events: none;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.profile-header-content {
  display: flex;
  align-items: flex-end;
  gap: 28px;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 0 0 2px rgba(255, 255, 255, 0.1);
  background-color: #f0f2f5;
  transition: transform 0.3s ease;
}

.avatar-image:hover {
  transform: scale(1.05);
}

.profile-header-info {
  flex: 1;
  color: white;
  padding-bottom: 4px;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  letter-spacing: 1px;
  margin: 0;
}

.profile-stats {
  display: flex;
  gap: 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 70px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
  letter-spacing: 0.5px;
}
</style>