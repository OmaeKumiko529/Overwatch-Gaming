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
  overflow: hidden;
}

.container {
  display: flex;
  height: 100%;
  overflow: hidden;
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
  height: 100vh;
  padding: 4vh 3vw;
  margin-right: 3vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  font-size: clamp(2rem, 5vw, 6rem);
  font-family: "SmileySans-Oblique", sans-serif;
  font-weight: 700;
  margin-top: 2vh;
  justify-content: flex-end;
  display: flex;
  align-items: center;
  gap: 0.5vw;
}

.english-title img {
  height: clamp(1.8rem, 4vw, 5rem);
  width: auto;
}

.cn-title {
  font-size: clamp(0.9rem, 1.3vw, 1.6rem);
  margin-top: 0.5vh;
  color: #000000;
  text-align: right;
}

.desc-text {
  margin-top: 0px;
  margin-bottom: 2vh;
  line-height: 1.6;
  color: #818181;
  text-align: right;
  font-size: clamp(0.75rem, 0.9vw, 1.05rem);
}

/* ✅ 核心：网格布局 */
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
  transition: transform 0.2s ease;
}

.hero-item:hover {
  transform: translateY(-5px);
}

/* 头像 */
.hero-item img {
  width: 100%;
  max-width: clamp(60px, 7vw, 110px);
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
