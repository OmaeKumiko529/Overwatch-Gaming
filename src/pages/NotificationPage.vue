<template>
  <div class="notification-page">
    <div class="notification-container">
      <div class="notification-header">
        <h1>🔔 通知</h1>
        <button v-if="unreadCount > 0" class="mark-all-btn" @click="handleMarkAllRead">
          全部标记已读
        </button>
      </div>

      <div class="notification-content">
        <div v-if="notifications.length === 0" class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>暂无通知</h3>
          <p>当有人评论、点赞或 @提及 您时，通知会显示在这里。</p>
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            class="notification-item"
            :class="{ unread: !notif.IsRead }"
            @click="handleClick(notif)"
          >
            <div class="notif-dot" :class="{ active: !notif.IsRead }"></div>
            <div class="notif-body">
              <div class="notif-message">
                <template v-if="notif.type === 'announcement'">
                  📢 <strong>{{ notif.title || '系统公告' }}</strong>
                </template>
                <template v-else-if="notif.type === 'like'">
                  <strong>{{ authorName(notif.Author) }}</strong> 赞了您的帖子
                </template>
                <template v-else-if="notif.type === 'comment'">
                  <strong>{{ authorName(notif.Author) }}</strong> 评论了您的帖子
                </template>
                <template v-else-if="notif.type === 'mention'">
                  <strong>{{ authorName(notif.Author) }}</strong> 在帖子中 @了您
                </template>
                <template v-else>
                  <strong>{{ authorName(notif.Author) }}</strong> 与您互动
                </template>
              </div>
              <div class="notif-time">{{ formatTime(notif.createdAt) }}</div>
            </div>
            <div v-if="notif.Root" class="notif-goto">→</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification.js'
import { useAuthStore } from '../stores/auth.js'
import userService from '../services/user.js'

const router = useRouter()
const notifStore = useNotificationStore()
const authStore = useAuthStore()

const notifications = computed(() => notifStore.notifications)
const unreadCount = computed(() => notifStore.unreadCount)

function authorName(uid) {
  if (!uid) return '未知用户'
  const user = userService.getUserById(uid)
  return user ? user.username : '未知用户'
}

function formatTime(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const now = Date.now()
    const diff = now - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return d.toLocaleDateString('zh-CN')
  } catch {
    return ''
  }
}

function handleClick(notif) {
  if (!notif.IsRead) {
    notifStore.markRead(notif.id)
  }
  // 跳转到关联内容（Root 现为 PID 字符串）
  if (notif.Root) {
    router.push('/post/' + encodeURIComponent(notif.Root))
  }
}

function handleMarkAllRead() {
  notifStore.markAllRead()
}

onMounted(() => {
  const cu = authStore.currentUser
  if (cu && cu.id) {
    notifStore.load(String(cu.id))
  }
})
</script>

<style scoped>
.notification-page {
  padding-top: 80px;
  min-height: 100vh;
  background: #f0f2f5;
}

.notification-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notification-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0;
}

.mark-all-btn {
  padding: 8px 16px;
  border: 2px solid #4facfe;
  border-radius: 8px;
  background: white;
  color: #4facfe;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.mark-all-btn:hover {
  background: #4facfe;
  color: white;
}

.notification-content {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-state h3 {
  font-size: 1.3rem;
  color: #495057;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.95rem;
  color: #6c757d;
  max-width: 360px;
  margin: 0 auto;
  line-height: 1.5;
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item.unread:hover {
  background: #e6f0ff;
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}

.notif-dot.active {
  background: #4facfe;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-message {
  font-size: 0.95rem;
  color: #333;
  line-height: 1.4;
}

.notif-time {
  font-size: 0.8rem;
  color: #adb5bd;
  margin-top: 4px;
}

.notif-goto {
  color: #adb5bd;
  font-size: 1.1rem;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>