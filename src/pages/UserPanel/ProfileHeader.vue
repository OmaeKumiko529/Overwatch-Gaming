<template>
  <div class="profile-cover">
    <div class="cover-image"></div>
    <div class="cover-overlay">
      <div class="profile-header-content">
        <div class="profile-avatar">
          <img
            :src="user.avatar || '/Head.png'"
            :alt="user.username"
            class="avatar-image"
            @error="handleAvatarError"
          />
        </div>
        <div class="profile-header-info">
          <h1 class="profile-name">{{ user.username }}</h1>
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

const emit = defineEmits(['update:avatar'])

function handleAvatarError(e) {
  e.target.src = '/Head.png'
}
</script>

<style scoped>
.profile-cover {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)),
              url('/public/Heading.png') center/cover no-repeat;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.profile-header-content {
  display: flex;
  align-items: flex-end;
  flex: 1;
  gap: 24px;
  padding-bottom: 0;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-image {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background-color: #f0f2f5;
}

.profile-header-info {
  flex: 1;
  color: white;
}

.profile-name {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profile-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}
</style>