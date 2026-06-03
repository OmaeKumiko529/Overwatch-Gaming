<template>
  <nav class="navbar">
    <router-link to="/" class="brand">首页</router-link>
    <ul class="nav-links">
      <li><router-link to="/browse">浏览</router-link></li>
      <li v-if="auth.isLoggedIn"><router-link to="/createpost">发帖</router-link></li>
      <li v-if="auth.isLoggedIn"><router-link to="/user">用户面板</router-link></li>
      <li v-if="auth.isAdmin"><router-link to="/announcements">发布公告</router-link></li>
      <li><a href="https://www.owmod.net/" target="_blank" rel="noopener noreferrer">熔火工坊</a></li>
    </ul>
    <div class="nav-actions">
      <router-link to="/notifications" class="notification-button" title="通知">
        🔔
        <span v-if="auth.isLoggedIn && unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </router-link>
      <SearchInput />
    </div>
  </nav>
</template>

<script setup>
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationStore } from '../stores/notification.js'
import SearchInput from './SearchInput.vue'

const auth = useAuthStore()
const notif = useNotificationStore()
const unreadCount = computed(() => notif.unreadCount)

onMounted(() => {
  auth.loadSession()
  window.addEventListener('storage', auth.loadSession)
  if (auth.currentUser && auth.currentUser.id) {
    notif.load(String(auth.currentUser.id))
  }
})

watch(() => auth.currentUser, (val) => {
  if (val && val.id) {
    notif.load(String(val.id))
  }
}, { immediate: true })

onUnmounted(() => {
  window.removeEventListener('storage', auth.loadSession)
})
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 10px 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}
.brand {
  color: white;
  text-decoration: none;
  font-size: 1em;
}
.nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
}
.nav-links li {
  margin-right: 20px;
}
.nav-links a {
  color: white;
  text-decoration: none;
}
.nav-links a:hover {
  text-decoration: underline;
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.notification-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 20px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}
.notification-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}
.notif-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #dc3545;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  font-family: sans-serif;
}
.nav-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.3s ease;
  font-family: 'SmileySans Oblique', sans-serif;
}
.register-nav {
  background-color: rgba(102, 126, 234, 0.2);
  border: 2px solid #667eea;
}
.register-nav:hover {
  background-color: #667eea;
  text-decoration: none;
}
.login-nav {
  background-color: rgba(245, 87, 108, 0.2);
  border: 2px solid #f5576c;
}
.login-nav:hover {
  background-color: #f5576c;
  text-decoration: none;
}
</style>