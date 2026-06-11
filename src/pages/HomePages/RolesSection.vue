<template>
  <div class="section roles-page" ref="sectionRef">
    <!-- 背景光晕粒子 -->
    <div class="glow-orb glow-orb--1"></div>
    <div class="glow-orb glow-orb--2"></div>
    <div class="glow-orb glow-orb--3"></div>

    <div class="content roles-content">
      <h1 class="main-title1" ref="titleRef">英雄职责</h1>
      <p class="subtitle1" ref="subtitleRef">三种核心职责</p>
      
      <div class="roles-container" ref="cardsRef">
        <!-- 输出卡片 -->
        <div class="role-card role-card--damage">
          <div class="role-icon role-icon--damage">
            <img src="/96px-职责：输出_图标.webp" alt="输出角色">
          </div>
          <h3 class="role-title">输出</h3>
          <p class="role-description">
            高伤害输出角色，负责消灭敌方英雄。<br>
            拥有灵活的移动能力和强大的攻击技能。
          </p>
        </div>
        
        <!-- 支援卡片 -->
        <div class="role-card role-card--support">
          <div class="role-icon role-icon--support">
            <img src="/96px-职责：支援_图标.webp" alt="支援角色">
          </div>
          <h3 class="role-title">支援</h3>
          <p class="role-description">
            治疗和辅助队友，提供生存保障。<br>
            拥有控制技能和团队增益效果。
          </p>
        </div>
        
        <!-- 重装卡片 -->
        <div class="role-card role-card--tank">
          <div class="role-icon role-icon--tank">
            <img src="/96px-职责：重装_图标.webp" alt="重装角色">
          </div>
          <h3 class="role-title">重装</h3>
          <p class="role-description">
            吸收伤害，保护队友，控制战场。<br>
            拥有高生命值和强大的防御能力。
          </p>
        </div>
      </div>
      
      <p class="role-tip" ref="tipRef">选择自身所擅长职责</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sectionRef = ref(null)
const titleRef = ref(null)
const subtitleRef = ref(null)
const cardsRef = ref(null)
const tipRef = ref(null)

let observer = null

function setupObserver() {
  const el = sectionRef.value
  if (!el) return

  // 初始隐藏
  if (titleRef.value) titleRef.value.classList.add('ah')
  if (subtitleRef.value) subtitleRef.value.classList.add('ah')
  if (tipRef.value) tipRef.value.classList.add('ah')
  if (cardsRef.value) {
    cardsRef.value.classList.add('ah')
    const cards = cardsRef.value.querySelectorAll('.role-card')
    cards.forEach(c => c.classList.add('ah-card'))
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 标题
        if (titleRef.value) {
          titleRef.value.classList.remove('ah')
          titleRef.value.classList.add('av')
        }
        // 副标题 150ms
        setTimeout(() => {
          if (subtitleRef.value) {
            subtitleRef.value.classList.remove('ah')
            subtitleRef.value.classList.add('av')
          }
        }, 150)
        // 卡片 stagger
        setTimeout(() => {
          if (cardsRef.value) {
            cardsRef.value.classList.remove('ah')
            cardsRef.value.classList.add('av')
            const cards = cardsRef.value.querySelectorAll('.role-card')
            cards.forEach((c, i) => {
              setTimeout(() => {
                c.classList.remove('ah-card')
                c.classList.add('av-card')
              }, i * 120)
            })
          }
        }, 400)
        // 底部提示
        setTimeout(() => {
          if (tipRef.value) {
            tipRef.value.classList.remove('ah')
            tipRef.value.classList.add('av')
          }
        }, 1000)

        if (observer) observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.2 })

  observer.observe(el)
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
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

.roles-page {
  background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 30%, #16213e 60%, #0f0f1f 100%);
}

/* ── 光晕粒子 ── */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.glow-orb--1 {
  width: 45%;
  height: 45%;
  background: radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%);
  top: 10%;
  left: 5%;
  animation: orbFloat 12s ease-in-out infinite;
}
.glow-orb--2 {
  width: 40%;
  height: 40%;
  background: radial-gradient(circle, rgba(234,179,8,0.07), transparent 70%);
  bottom: 15%;
  right: 10%;
  animation: orbFloat 14s ease-in-out infinite reverse;
}
.glow-orb--3 {
  width: 35%;
  height: 35%;
  background: radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat 10s ease-in-out infinite 2s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(25px, -35px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
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

.roles-content {
  align-items: center;
  text-align: center;
  padding-left: 0;
}

.main-title1 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(2.5rem, 4.17vw, 5rem);
  margin: 0;
  color: #ffffff;
}

.subtitle1 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(1rem, 1.5vw, 1.8rem);
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1.389vh;
  font-weight: bold;
}

/* ── 入场动画 ── */
.ah {
  opacity: 0;
  transform: translateY(25px);
  transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.av {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.ah-card {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.av-card {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
}

.ah.role-tip {
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* ── 卡片容器 ── */
.roles-container {
  display: flex;
  justify-content: center;
  gap: 3.125vw;
  margin-top: 3.704vh;
  flex-wrap: wrap;
}

/* ── 基础卡片 ── */
.role-card {
  border-radius: 1.042vw;
  padding: 1.563vw;
  width: 14.583vw;
  min-width: 240px;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
}

/* 卡片光晕遮罩（hover 时亮起） */
.role-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1.042vw;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

/* ── 输出卡片 - 橙 ── */
.role-card--damage {
  background: rgba(249, 115, 22, 0.06);
  border: 1px solid rgba(249, 115, 22, 0.25);
}
.role-card--damage::after {
  background: radial-gradient(circle at 50% 50%, rgba(249,115,22,0.08), transparent 70%);
}
.role-card--damage:hover {
  transform: translateY(-0.926vh) scale(1.03);
  box-shadow: 0 0 30px rgba(249, 115, 22, 0.2), 0 1.389vh 2.778vh rgba(0, 0, 0, 0.3);
  border-color: rgba(249, 115, 22, 0.5);
}
.role-card--damage:hover::after {
  opacity: 1;
}

/* ── 支援卡片 - 金 ── */
.role-card--support {
  background: rgba(234, 179, 8, 0.06);
  border: 1px solid rgba(234, 179, 8, 0.25);
}
.role-card--support::after {
  background: radial-gradient(circle at 50% 50%, rgba(234,179,8,0.08), transparent 70%);
}
.role-card--support:hover {
  transform: translateY(-0.926vh) scale(1.03);
  box-shadow: 0 0 30px rgba(234, 179, 8, 0.2), 0 1.389vh 2.778vh rgba(0, 0, 0, 0.3);
  border-color: rgba(234, 179, 8, 0.5);
}
.role-card--support:hover::after {
  opacity: 1;
}

/* ── 重装卡片 - 蓝 ── */
.role-card--tank {
  background: rgba(59, 130, 246, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.25);
}
.role-card--tank::after {
  background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08), transparent 70%);
}
.role-card--tank:hover {
  transform: translateY(-0.926vh) scale(1.03);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.2), 0 1.389vh 2.778vh rgba(0, 0, 0, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}
.role-card--tank:hover::after {
  opacity: 1;
}

/* ── 职责图标 ── */
.role-icon {
  width: 6.25vmin;
  height: 6.25vmin;
  margin: 0 auto 1.852vh;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 1.042vw;
  transition: transform 0.4s ease, background 0.4s ease;
}
.role-icon--damage {
  background: rgba(249, 115, 22, 0.1);
}
.role-icon--support {
  background: rgba(234, 179, 8, 0.1);
}
.role-icon--tank {
  background: rgba(59, 130, 246, 0.1);
}
.role-card:hover .role-icon {
  transform: rotate(6deg) scale(1.1);
}

.role-icon img {
  width: 4.167vmin;
  height: 4.167vmin;
  object-fit: contain;
}

.role-title {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(1.2rem, 1.5vw, 1.8rem);
  color: #ffffff;
  margin: 0 0 1.389vh 0;
}

.role-description {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(0.8rem, 0.92vw, 1.1rem);
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

/* ── 底部提示 - 脉冲动效 ── */
.role-tip {
  font-family: 'SmileySans Oblique', sans-serif;
  text-align: center;
  max-width: 41.667vw;
  margin-left: auto;
  margin-right: auto;
  margin-top: 4.63vh;
  font-size: clamp(0.875rem, 1vw, 1.2rem);
  color: rgba(255, 255, 255, 0.5);
  animation: pulse 2.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>