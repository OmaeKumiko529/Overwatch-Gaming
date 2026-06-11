<template>
  <div class="notification-page">
    <div class="notification-container">
      <div class="notification-header">
        <h1 class="page-title">
          <span class="title-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </span>
          通知
        </h1>
        <button v-if="unreadCount > 0" class="mark-all-btn" @click="handleMarkAllRead">
          全部标记已读
        </button>
      </div>

      <div class="notification-content">
        <div v-if="notifications.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
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
                  <span class="notif-icon">📢</span>
                  <strong>{{ notif.title || '系统公告' }}</strong>
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
            <div v-if="notif.Root" class="notif-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification.js'
import { useAuthStore } from '../stores/auth.js'
import userService from '../services/user.js'

const router = useRouter()
const notifStore = useNotificationStore()
const authStore = useAuthStore()

const notifications = computed(() => notifStore.notifications)
const unreadCount = computed(() => notifStore.unreadCount)
const userCache = ref({})

async function preloadUsers() {
  const users = await userService.getAllUsers()
  const map = {}
  for (const u of users) {
    map[String(u.id)] = u
    if (u.uid) map[u.uid] = u
  }
  userCache.value = map
}

function authorName(uid) {
  if (!uid) return '未知用户'
  const user = userCache.value[String(uid)]
  if (user) return user.username
  userService.getUserById(uid).then(u => {
    if (u) { userCache.value[String(u.id)] = u; if (u.uid) userCache.value[u.uid] = u }
  })
  return uid || '未知用户'
}

function formatTime(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const diff = Date.now() - d.getTime()
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    return d.toLocaleDateString('zh-CN')
  } catch { return '' }
}

function handleClick(notif) {
  if (!notif.IsRead) notifStore.markRead(notif.id)
  if (notif.Root) {
    if (notif.type === 'announcement') router.push('/announcements')
    else router.push('/post/' + encodeURIComponent(notif.Root))
  }
}

function handleMarkAllRead() { notifStore.markAllRead() }

onMounted(async () => {
  const cu = authStore.currentUser
  if (cu && cu.id) notifStore.load(String(cu.id))
  await preloadUsers()
})
</script>

<style scoped>
.notification-page {
  padding-top: 76px;
  min-height: 100vh;
  background: #0f0f1a;
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

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #e0e0e0;
  font-family: 'SmileySans Oblique', sans-serif;
  margin: 0;
}

.title-icon {
  display: flex;
  color: #4facfe;
}

.mark-all-btn {
  padding: 8px 18px;
  border: 1.5px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  background: rgba(79, 172, 254, 0.08);
  color: rgba(79, 172, 254, 0.8);
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mark-all-btn:hover {
  background: rgba(79, 172, 254, 0.15);
  color: #4facfe;
  border-color: #4facfe;
}

.notification-content {
  background: rgba(20, 25, 45, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.15);
  display: flex;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.35);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.2s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.notification-item.unread {
  background: rgba(79, 172, 254, 0.04);
}

.notification-item.unread:hover {
  background: rgba(79, 172, 254, 0.07);
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
  box-shadow: 0 0 6px rgba(79, 172, 254, 0.5);
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-message {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
}

.notif-message strong {
  color: rgba(255, 255, 255, 0.9);
}

.notif-icon {
  margin-right: 4px;
}

.notif-time {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}

.notif-arrow {
  color: rgba(255, 255, 255, 0.2);
  font-size: 1rem;
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