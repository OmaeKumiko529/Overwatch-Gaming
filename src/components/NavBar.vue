<template>
  <nav class="navbar">
    <router-link to="/" class="brand">
      <span class="brand-inner">
        <img src="/ow_icon.svg" alt="OW" class="brand-logo">
        <span class="brand-text">E426</span>
      </span>
    </router-link>

    <ul class="nav-links">
      <li><router-link to="/browse" active-class="active">浏览</router-link></li>
      <li v-if="auth.isLoggedIn"><router-link to="/createpost" active-class="active">发帖</router-link></li>
      <li v-if="auth.isLoggedIn"><router-link to="/user" active-class="active">用户面板</router-link></li>
      <li v-if="auth.isAdmin || auth.isTrustedPlayer"><router-link to="/announcements" active-class="active">发布公告</router-link></li>
      <li><router-link to="/heroes" active-class="active">英雄图鉴</router-link></li>
      <li><a href="https://www.owmod.net/" target="_blank" rel="noopener noreferrer">熔火工坊</a></li>
    </ul>

    <div class="nav-actions">
      <router-link to="/notifications" class="notif-btn" title="通知">
        <span class="notif-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>
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
  height: 56px;
  padding: 0 24px;
  background: rgba(13, 15, 25, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  box-sizing: border-box;
}

/* ── 品牌 ── */
.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 14px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.brand-inner:hover {
  background: rgba(255, 255, 255, 0.11);
  border-color: rgba(255, 255, 255, 0.16);
}

.brand-logo {
  height: 24px;
  width: auto;
  opacity: 0.95;
}

.brand-text {
  font-family: "Fugaz One", sans-serif;
  font-size: 1.1rem;
  letter-spacing: 0.04em;
  color: #ffffff;
}

/* ── 导航链接 ── */
.nav-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-links li {
  margin: 0;
}

.nav-links a {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  border-radius: 6px;
  transition: color 0.25s ease, background 0.25s ease;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-links a:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.nav-links a:hover::after {
  transform: scaleX(1);
}

.nav-links a.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-links a.active::after {
  transform: scaleX(1);
}

/* ── 右侧操作区 ── */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ── 通知按钮 ── */
.notif-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.notif-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: scale(1.05);
}

.notif-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-badge {
  position: absolute;
  top: -1px;
  right: -1px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 9px;
  background: #dc3545;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 17px;
  text-align: center;
  font-family: sans-serif;
  box-shadow: 0 0 6px rgba(220, 53, 69, 0.4);
}

/* ── 无用旧样式保留兼容 ── */
.nav-button,
.register-nav,
.login-nav {
  /* 不再使用 */
}
</style>