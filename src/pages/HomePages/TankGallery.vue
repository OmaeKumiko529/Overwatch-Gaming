<template>
  <div class="tank-gallery">
    <div class="container">

      <!-- 左侧角色插图区域（不动） -->
      <div class="character-section">
        <img src="/public/ow_icon.svg" alt="守望先锋标志" class="logo-bg">
        <img src="/t/dc.png" alt="左侧重装角色" class="char-left">
        <img src="/t/lb.png" alt="右侧重装角色" class="char-right">
      </div>

      <!-- 右侧信息区域（重写） -->
      <div class="info-section">

        <div class="english-title">
             <img src="/t/96px-职责：重装_图标.png">
             <span>Tanks</span>
        </div>
        <div class="cn-title">重装</div>
        <div class="desc-text">
          集防御与推进于一体的角色<br>
          负责对敌方的压制与战线维持
        </div>

        <!-- 英雄网格 -->
        <div class="hero-grid">
          <div 
            v-for="hero in tankHeroes"
            :key="hero.imageIndex"
            class="hero-item"
          >
            <img 
              :src="getHeroImage(hero)"
              :alt="`Tank ${hero.imageIndex}`"
              @error="handleImageError"
            >
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

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

// 视差移动 - 左右上下浮动效果
function handleMouseMove(e) {
  const x = e.clientX
  const y = e.clientY
  const w = window.innerWidth
  const h = window.innerHeight
  const xOffset = (x / w - 0.5) * 20
  const yOffset = (y / h - 0.5) * 20

  const leftChar = document.querySelector('.tank-gallery .char-left')
  const rightChar = document.querySelector('.tank-gallery .char-right')

  if (leftChar) {
    leftChar.style.transform =
      `translateX(${xOffset * 2}px) translateY(${yOffset}px)`
  }
  if (rightChar) {
    rightChar.style.transform =
      `translateX(${xOffset * 1}px) translateY(${yOffset * 0.5}px)`
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.tank-gallery {
  height: 100vh;
  background: #ffffff;
  color: rgb(0, 0, 0);
}

.container {
  display: flex;
  height: 100%;
}

/* 左侧 */
.character-section {
  position: relative;
  width: 45%;
  height: 100%;
  overflow: hidden;
}

.logo-bg {
  position: absolute;
  width: 60%;
  opacity: 0.8;
  top: 5%;
  left: 45%;
}

.char-left {
  position: absolute;
  bottom: 0;
  left: -10%;
  height: 90%;
  z-index: 2;
}

.char-right {
  position: absolute;
  bottom: 0;
  right: -10%;
  height: 75%;
  z-index: 2;
}

/* 右侧 */
.info-section {
  width: 55%;
  height: calc(100vh - 60px + 100px);
  padding: 40px;
  margin-right: 100px;
  margin-top: -100px;
  box-sizing: border-box;
  overflow: hidden;
}

/*字体*/
@font-face {
  font-family: "SmileySans-Oblique";
  src: url("/public/SmileySans-Oblique.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}

/* 标题 */
.english-title {
  font-size: 96px;
  font-family: "SmileySans-Oblique", sans-serif;
  font-weight: 700;
  margin-top: 100px;
  justify-content: flex-end;
  display: flex;
  align-items: center; /* 关键：垂直居中 */
  gap: 10px; /* 图片和文字间距 */
}

.cn-title {
  font-size: 24px;
  margin-top: 10px;
  color: #000000;
  text-align: right;
}

.desc-text {
  margin-top: 0px;
  margin-bottom: 30px;
  line-height: 1.6;
  color: #818181;
  text-align: right;
}

/* ✅ 核心：网格布局 */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 20px 50px;
}

/* 单个英雄 */
.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.hero-item:hover {
  transform: translateY(-5px);
}

/* 头像 */
.hero-item img {
  width: 120px;
  height: auto;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.hero-item:hover img {
  border-color: #f59e0b;
}

/* 名字 现在不用 图片自带*/
.hero-name {
  margin-top: 8px;
  font-size: 12px;
  color: #ddd;
}
</style>
