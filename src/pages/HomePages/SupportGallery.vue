<template>
  <div class="support-gallery">
    <div class="container">

      <!-- 左侧角色插图区域（不动） -->
      <div class="character-section">
        <img src="/public/ow_icon.svg" alt="守望先锋标志" class="logo-bg">
        <img src="/Nsc/hn.png" alt="左侧辅助角色" class="char-left">
        <img src="/Nsc/ylr.png" alt="右侧辅助角色" class="char-right">
      </div>

      <!-- 右侧信息区域（重写） -->
      <div class="info-section">

        <div class="english-title">
             <img src="/Nsc/96px-职责：支援_图标.png">
             <span>Supports</span>
        </div>
        <div class="cn-title">辅助</div>
        <div class="desc-text">
          集治疗与增益于一体的角色<br>
          负责对友方的保护与强化
        </div>

        <!-- 英雄网格 -->
        <div class="hero-grid">
          <div 
            v-for="hero in supportHeroes"
            :key="hero.name"
            class="hero-item"
          >
            <img 
              :src="getHeroImage(hero)"
              :alt="hero.name"
              @error="handleImageError"
            >
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>

// ✅ 完全沿用你的数据
const supportHeroes = [
  { name: "飞天猫", imageIndex: 1 },
  { name: "瑞稀", imageIndex: 2 },
  { name: "无漾", imageIndex: 3 },
  { name: "安娜", imageIndex: 4 },
  { name: "朱诺", imageIndex: 5 },
  { name: "伊拉锐", imageIndex: 6 },
  { name: "雾子", imageIndex: 7 },
  { name: "莫伊拉", imageIndex: 8 },
  { name: "生命之梭", imageIndex: 9 },
  { name: "天使", imageIndex: 10 },
  { name: "卢西奥", imageIndex: 11 },
  { name: "禅雅塔", imageIndex: 12 },
  { name: "布丽吉塔", imageIndex: 13 },
  { name: "巴蒂斯特", imageIndex: 14 }
]

// ✅ 完全沿用你的路径规则
function getHeroImage(hero) {
  const fileName = `0w+ (${hero.imageIndex}).png`
  return `/Nsc/${encodeURI(fileName)}`
}

// 简单兜底（避免破图）
function handleImageError(e) {
  e.target.style.opacity = 0.3
}
</script>

<style scoped>
.support-gallery {
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
  left: 0;
  height: 95%;
}

.char-right {
  position: absolute;
  bottom: 0;
  right: 10%;
  height: 80%;
}

/* 右侧 */
.info-section {
  width: 55%;
  padding: 40px;
  margin-right: 80px;
  box-sizing: border-box;
  overflow-y: auto;
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