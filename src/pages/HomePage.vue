<script setup>
// 导入Vue Composition API
import { onMounted, onUnmounted, nextTick } from 'vue'
// 导入Vue Router相关函数
import { useRouter, useRoute } from 'vue-router'
// 导入认证 Store
import { useAuthStore } from '../stores/auth.js'
// 导入首页各屏组件
import HeroSection from './HomePages/HeroSection.vue'
import RolesSection from './HomePages/RolesSection.vue'
import SupportGallery from './HomePages/SupportGallery.vue'
import DamageGallery from './HomePages/DamageGallery.vue'
import TankGallery from './HomePages/TankGallery.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 视差移动
let leftChar = null
let rightChar = null

function handleMouseMove(e) {
  const x = e.clientX
  const w = window.innerWidth
  const baseMultiplier = w / 160  // 1920px->12px, 缩放时自动适应
  const offset = (x / w - 0.5) * baseMultiplier

  if (leftChar && rightChar) {
    leftChar.style.transform =
      `translateX(${offset * 2}px) translateY(${offset * 1}px)`
    rightChar.style.transform =
      `translateX(${offset * 1}px) translateY(${offset * 1}px)`
  }
}

// 目标section跳转：使用原生平滑滚动
const scrollToSection = (index) => {
  const sections = document.querySelectorAll('.home-section')
  if (sections[index - 1]) {
    sections[index - 1].scrollIntoView({ behavior: 'smooth' })
  }
}

// 组件挂载时的生命周期钩子
onMounted(() => {
  // 初始检查登录状态
  auth.loadSession()
  // 监听storage事件
  window.addEventListener('storage', auth.loadSession)

  // 获取视差元素
  leftChar = document.querySelector('.char-left')
  rightChar = document.querySelector('.char-right')
  // 监听鼠标移动
  window.addEventListener('mousemove', handleMouseMove)

  // 如果路由有targetSection，跳转到对应屏
  nextTick(() => {
    if (route.meta.targetSection) {
      setTimeout(() => {
        scrollToSection(route.meta.targetSection)
      }, 800)
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('storage', auth.loadSession)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="home-wrapper">
    <!-- 第一屏 -->
    <section class="home-section">
      <HeroSection />
    </section>

    <!-- 第二屏 -->
    <section class="home-section">
      <RolesSection />
    </section>

    <!-- 第三屏 -->
    <section class="home-section">
      <SupportGallery />
    </section>

    <!-- 第四屏 -->
    <section class="home-section">
      <TankGallery />
    </section>

    <!-- 第五屏 -->
    <section class="home-section">
      <DamageGallery />
    </section>
  </div>
</template>

<style scoped>
.home-wrapper {
  width: 100%;
}

.home-section {
  min-height: 100vh;
  position: relative;
}
</style>