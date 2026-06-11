<template>
  <div class="tank-gallery" ref="galleryRef">
    <div class="container">

      <!-- 左侧角色插图区域 -->
      <div class="character-section">
        <div class="glow-orb glow-orb--1"></div>
        <div class="glow-orb glow-orb--2"></div>
        <img src="/ow_icon.svg" alt="守望先锋标志" class="logo-bg">
        <div class="char-wrapper char-wrapper--left" ref="charLeftRef">
          <img src="/t/dc.png" alt="左侧重装角色" class="char-left">
        </div>
        <div class="char-wrapper char-wrapper--right" ref="charRightRef">
          <img src="/t/lb.png" alt="右侧重装角色" class="char-right">
        </div>
        <div class="scan-line"></div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="info-section">
        <div class="info-content">
          <div class="english-title" ref="titleRef">
            <img src="/96px-职责：重装_图标.webp">
            <span>Tanks</span>
          </div>
          <div class="cn-title" ref="cnTitleRef">重装</div>
          <div class="divider" ref="dividerRef"></div>
          <div class="desc-text" ref="descRef">
            集防御与推进于一体的角色<br>
            负责对敌方的压制与战线维持
          </div>

          <!-- 英雄网格 -->
          <div class="hero-grid" ref="gridRef">
            <div 
              v-for="(hero, index) in tankHeroes"
              :key="hero.imageIndex"
              class="hero-item"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              <div class="hero-card">
                <img 
                  :src="getHeroImage(hero)"
                  :alt="`Tank ${hero.imageIndex}`"
                  @error="handleImageError"
                >
                <div class="hero-card-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// ✅ 完全沿用你的数据
const tankHeroes = [
  { imageIndex: 1 },
  { imageIndex: 2 },
  { imageIndex: 3 },
  { imageIndex: 4 },
  { imageIndex: 5 },
  { imageIndex: 6 },
  { imageIndex: 7 },
  { imageIndex: 8 },
  { imageIndex: 9 },
  { imageIndex: 10 },
  { imageIndex: 11 },
  { imageIndex: 12 },
  { imageIndex: 13 },
  { imageIndex: 14 }
]

// ✅ 完全沿用你的路径规则
function getHeroImage(hero) {
  const fileName = `0wt (${hero.imageIndex}).jpg`
  return `/t/${encodeURI(fileName)}`
}

// 简单兜底（避免破图）
function handleImageError(e) {
  e.target.style.opacity = 0.3
}

// ── refs ──
const galleryRef = ref(null)
const titleRef = ref(null)
const cnTitleRef = ref(null)
const dividerRef = ref(null)
const descRef = ref(null)
const gridRef = ref(null)
const charLeftRef = ref(null)
const charRightRef = ref(null)

// ── Intersection Observer 入场动画 ──
let observer = null

function setupObserver() {
  const el = galleryRef.value
  if (!el) return

  const elements = [
    { ref: titleRef.value, name: 'title' },
    { ref: cnTitleRef.value, name: 'cnTitle' },
    { ref: dividerRef.value, name: 'divider' },
    { ref: descRef.value, name: 'desc' },
    { ref: gridRef.value, name: 'grid' },
    { ref: charLeftRef.value, name: 'charLeft' },
    { ref: charRightRef.value, name: 'charRight' }
  ].filter(item => item.ref)

  // 初始状态：隐藏
  elements.forEach(item => {
    item.ref.classList.add('anim-hidden')
    if (item.name === 'charLeft' || item.name === 'charRight') {
      item.ref.classList.add('anim-slide')
    }
  })

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 角色滑入
        if (charLeftRef.value) {
          charLeftRef.value.classList.remove('anim-hidden')
          charLeftRef.value.classList.add('anim-visible')
        }
        if (charRightRef.value) {
          charRightRef.value.classList.remove('anim-hidden')
          charRightRef.value.classList.add('anim-visible')
        }

        // 标题序列
        if (titleRef.value) {
          titleRef.value.classList.remove('anim-hidden')
          titleRef.value.classList.add('anim-visible')
        }
        setTimeout(() => {
          if (cnTitleRef.value) {
            cnTitleRef.value.classList.remove('anim-hidden')
            cnTitleRef.value.classList.add('anim-visible')
          }
        }, 200)
        setTimeout(() => {
          if (dividerRef.value) {
            dividerRef.value.classList.remove('anim-hidden')
            dividerRef.value.classList.add('anim-visible')
          }
        }, 350)
        setTimeout(() => {
          if (descRef.value) {
            descRef.value.classList.remove('anim-hidden')
            descRef.value.classList.add('anim-visible')
          }
        }, 500)
        setTimeout(() => {
          if (gridRef.value) {
            gridRef.value.classList.remove('anim-hidden')
            gridRef.value.classList.add('anim-visible')
          }
        }, 700)

        // 触发一次后停止观察
        if (observer) {
          observer.unobserve(entry.target)
        }
      }
    })
  }, { threshold: 0.15 })

  observer.observe(el)
}

// ── 视差移动 ──
function handleMouseMove(e) {
  const x = e.clientX
  const y = e.clientY
  const w = window.innerWidth
  const h = window.innerHeight
  const xOffset = (x / w - 0.5) * 20
  const yOffset = (y / h - 0.5) * 20

  const leftChar = document.querySelector('.tank-gallery .char-wrapper--left')
  const rightChar = document.querySelector('.tank-gallery .char-wrapper--right')

  if (leftChar) {
    leftChar.style.setProperty('--parallax-x', `${xOffset * 2}px`)
    leftChar.style.setProperty('--parallax-y', `${yOffset}px`)
  }
  if (rightChar) {
    rightChar.style.setProperty('--parallax-x', `${xOffset * 1}px`)
    rightChar.style.setProperty('--parallax-y', `${yOffset * 0.5}px`)
  }
}

onMounted(() => {
  setupObserver()
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
/* ========================================
   重装 Gallery - Overwatch 风格优化
   ======================================== */

.tank-gallery {
  height: 100vh;
  background: linear-gradient(135deg, #0a0f1e 0%, #111827 30%, #1a2a40 60%, #0f172a 100%);
  color: rgb(0, 0, 0);
  overflow: hidden;
  position: relative;
}

.container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ── 左侧角色插图区域 ── */
.character-section {
  position: relative;
  width: 45%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
}

/* 光晕粒子 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.glow-orb--1 {
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%);
  top: 20%;
  left: 30%;
  animation: orbFloat 8s ease-in-out infinite;
}
.glow-orb--2 {
  width: 40%;
  height: 40%;
  background: radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%);
  bottom: 10%;
  right: 10%;
  animation: orbFloat 10s ease-in-out infinite reverse;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -30px) scale(1.1); }
  66% { transform: translate(-15px, 15px) scale(0.95); }
}

/* 扫描线装饰 */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(59,130,246,0.03) 2px,
    rgba(59,130,246,0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* LOGO 背景 */
.logo-bg {
  position: absolute;
  width: 60%;
  opacity: 0.12;
  top: 5%;
  left: 45%;
  z-index: 0;
  animation: logoRotate 30s linear infinite;
}

@keyframes logoRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 角色外层容器 - 浮动动画 */
.char-wrapper {
  position: absolute;
  z-index: 2;
  transition: transform 0.15s ease-out;
}
.char-wrapper--left {
  bottom: 0;
  left: -10%;
  height: 90%;
  animation: floatLeft 4s ease-in-out infinite;
}
.char-wrapper--right {
  bottom: 0;
  right: -10%;
  height: 75%;
  animation: floatRight 5s ease-in-out infinite;
}

@keyframes floatLeft {
  0%, 100% { transform: translateY(0) translateX(var(--parallax-x, 0)) translateY(var(--parallax-y, 0)); }
  50% { transform: translateY(-12px) translateX(var(--parallax-x, 0)) translateY(var(--parallax-y, 0)); }
}
@keyframes floatRight {
  0%, 100% { transform: translateY(0) translateX(var(--parallax-x, 0)) translateY(var(--parallax-y, 0)); }
  50% { transform: translateY(-8px) translateX(var(--parallax-x, 0)) translateY(var(--parallax-y, 0)); }
}

.char-wrapper--left img,
.char-wrapper--right img {
  height: 100%;
  width: auto;
  filter: drop-shadow(0 20px 40px rgba(59,130,246,0.3));
}

/* 入场动画 - 角色滑入 */
.char-wrapper.anim-hidden {
  opacity: 0;
  transform: translateX(-80px) !important;
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.char-wrapper--right.anim-hidden {
  transform: translateX(80px) !important;
}
.char-wrapper.anim-visible {
  opacity: 1;
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── 右侧信息区域 ── */
.info-section {
  width: 55%;
  height: 100vh;
  padding: 4vh 3vw;
  margin-right: 3vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.info-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
}

/* 字体 */
@font-face {
  font-family: "SmileySans-Oblique";
  src: url("/SmileySans-Oblique.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

/* 标题 */
.english-title {
  font-size: clamp(2rem, 5vw, 6rem);
  font-family: "SmileySans-Oblique", sans-serif;
  font-weight: 700;
  justify-content: flex-end;
  display: flex;
  align-items: center;
  gap: 0.5vw;
  color: #ffffff;
  text-shadow: 0 0 40px rgba(59,130,246,0.3);
}

.english-title img {
  height: clamp(1.8rem, 4vw, 5rem);
  width: auto;
}

.cn-title {
  font-size: clamp(0.9rem, 1.3vw, 1.6rem);
  margin-top: 0.5vh;
  color: #93c5fd;
  text-align: right;
  font-weight: 500;
  letter-spacing: 0.1em;
}

/* 分隔线 */
.divider {
  height: 2px;
  width: 60%;
  margin-top: 1.2vh;
  margin-bottom: 1.2vh;
  margin-left: auto;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent);
  border-radius: 2px;
}

.desc-text {
  line-height: 1.6;
  color: #94a3b8;
  text-align: right;
  font-size: clamp(0.75rem, 0.9vw, 1.05rem);
  margin-bottom: 2vh;
  text-shadow: 0 0 20px rgba(59,130,246,0.1);
}

/* ── 入场动画系统 ── */
.anim-hidden {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.anim-hidden.divider {
  transform: scaleX(0);
  transform-origin: right center;
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.anim-hidden.hero-grid {
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.anim-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
.anim-visible.divider {
  transform: scaleX(1) !important;
}

/* ── 英雄网格 ── */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(60px, 6vw, 100px), 1fr));
  gap: clamp(8px, 1.2vh, 1.5vh) clamp(12px, 2.5vw, 3vw);
}

/* 单个英雄 */
.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(15px) scale(0.9);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hero-grid.anim-visible .hero-item {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* stagger 由 inline style transitionDelay 控制 */
.hero-item:nth-child(n) {
  transition-delay: calc(var(--order, 0) * 50ms);
}

/* 英雄卡片 */
.hero-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.hero-card img {
  width: 100%;
  max-width: clamp(60px, 7vw, 110px);
  height: auto;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(59,130,246,0.2);
  transition: all 0.3s ease;
  display: block;
}

/* 卡片光晕 */
.hero-card-glow {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  opacity: 0;
  background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.25), transparent 70%);
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* Hover 增强 */
.hero-item:hover {
  z-index: 10;
}
.hero-item:hover .hero-card {
  transform: scale(1.08);
}
.hero-item:hover .hero-card img {
  border-color: #60a5fa;
  box-shadow: 0 0 20px rgba(59,130,246,0.4), 0 8px 30px rgba(59,130,246,0.2);
  filter: brightness(1.1);
}
.hero-item:hover .hero-card-glow {
  opacity: 1;
}

/* 名字（现在不用 图片自带） */
.hero-name {
  margin-top: 8px;
  font-size: 12px;
  color: #ddd;
}
</style>