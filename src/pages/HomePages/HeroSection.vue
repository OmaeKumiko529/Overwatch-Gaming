<template>
  <div class="section" ref="sectionRef">
    <div class="video-background">
      <video autoplay muted loop playsinline>
        <source src="/Amiya.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
    </div>

    <div class="content hero-content">
      <h1 class="main-title enter-hidden" ref="titleRef">E426 Overwatch</h1>

      <p class="subtitle enter-hidden" ref="subtitleRef">
        基于Vue.js开发的轻量级守望先锋®论坛
      </p>

      <!-- 未登录：两个图标展开按钮 -->
      <div v-if="!isLoggedIn" class="button-container enter-hidden" ref="btnRef">
        <!-- 注册按钮 -->
        <button class="hero-btn" @click.prevent="navigateTo('Register')">
          <span class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </span>
          <span class="btn-text">注册</span>
        </button>
        <!-- 登录按钮 -->
        <button class="hero-btn" @click.prevent="navigateTo('Login')">
          <span class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </span>
          <span class="btn-text">登录</span>
        </button>
      </div>

      <!-- 已登录：单个图标展开按钮 -->
      <div v-else class="button-container enter-hidden" ref="btnRef">
        <button class="hero-btn" @click.prevent="navigateTo('User')">
          <span class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <span class="btn-text">用户面板</span>
        </button>
      </div>
    </div>

    <!-- 滚动引导箭头 -->
    <div class="scroll-indicator">
      <span class="scroll-arrow"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const isLoggedIn = auth.isLoggedIn

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}

// ── 入场动画 ──
const sectionRef = ref(null)
const titleRef = ref(null)
const subtitleRef = ref(null)
const btnRef = ref(null)

onMounted(() => {
  // 级联移除隐藏类，触发 CSS transition 自动过渡到可见态
  const animateEl = (el, delay) => {
    if (!el) return
    setTimeout(() => el.classList.remove('enter-hidden'), delay)
  }

  animateEl(titleRef.value, 0)
  animateEl(subtitleRef.value, 200)
  animateEl(btnRef.value, 450)
})
</script>

<style scoped>
.section {
  height: 100vh;
  overflow: hidden;
  position: relative;
  padding-top: 5.556vh;
  box-sizing: border-box;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.video-background video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 渐变遮罩 */
.video-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.55) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 9.375vw;
  box-sizing: border-box;
  color: white;
  z-index: 1001;
  position: relative;
  padding-top: 7.407vh;
}

.hero-content {
  justify-content: flex-start;
  padding-top: 29.63vh;
}

/* ── 入场动画 ── */
.enter-hidden {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.enter-hidden.button-container {
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── 标题 ── */
.main-title {
  font-family: "Fugaz One", sans-serif;
  font-size: clamp(2rem, 3.33vw, 4rem);
  margin: 0;
  color: #ffffff;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.6),
    0 4px 20px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(255, 255, 255, 0.15),
    0 0 60px rgba(96, 165, 250, 0.08);
  letter-spacing: 0.02em;
}

.subtitle {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(0.875rem, 1vw, 1.2rem);
  color: rgba(255, 255, 255, 0.75);
  margin-top: 1.5vh;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  padding-left: 0.521vw;
}

/* ── 按钮容器 ── */
.button-container {
  display: flex;
  gap: 1vw;
  margin-top: 2.5vh;
}

/* ── 图标展开按钮（缩小版） ── */
.hero-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-width: 36px;
  padding: 0 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  background: transparent;
  border-radius: 36px;
  cursor: pointer;
  color: #ffffff;
  font-family: 'MapleMono CN Regular', monospace;
  font-size: 0.85rem;
  overflow: hidden;
  transition:
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    background 0.3s ease;
}

.hero-btn:hover {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.12), 0 0 40px rgba(255, 255, 255, 0.04);
}

/* ── 图标 ── */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.btn-icon svg {
  display: block;
}

/* ── 文字（展开核心） ── */
.btn-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 0;
  opacity: 0;
  transform: translateX(-6px);
  transition:
    max-width 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.3s ease 0.05s,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    margin-left 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-btn:hover .btn-text {
  max-width: 100px;
  opacity: 1;
  transform: translateX(0);
  margin-left: 6px;
}

/* ── 滚动引导箭头 ── */
.scroll-indicator {
  position: absolute;
  bottom: 4vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002;
  animation: bounce 2.5s ease-in-out infinite;
}

.scroll-arrow {
  display: block;
  width: 24px;
  height: 24px;
  border-right: 2px solid rgba(255, 255, 255, 0.5);
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  transform: rotate(45deg);
  opacity: 0.6;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}
</style>