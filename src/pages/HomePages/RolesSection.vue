<template>
  <div class="section roles-page">
    <div class="content roles-content">
      <h1 class="main-title1">英雄职责</h1>
      <p class="subtitle1" style="padding-left: 0.521vw; margin-bottom: 3.704vh;">
        三种核心职责
      </p>
      
      <div class="roles-container">
        <div class="role-card">
          <div class="role-icon">
            <img src="/96px-职责：输出_图标.webp" alt="输出角色">
          </div>
          <h3 class="role-title">输出</h3>
          <p class="role-description">
            高伤害输出角色，负责消灭敌方英雄。<br>
            拥有灵活的移动能力和强大的攻击技能。
          </p>
        </div>
        
        <div class="role-card">
          <div class="role-icon">
            <img src="/96px-职责：支援_图标.webp" alt="支援角色">
          </div>
          <h3 class="role-title">支援</h3>
          <p class="role-description">
            治疗和辅助队友，提供生存保障。<br>
            拥有控制技能和团队增益效果。
          </p>
        </div>
        
        <div class="role-card">
          <div class="role-icon">
            <img src="/96px-职责：重装_图标.webp" alt="重装角色">
          </div>
          <h3 class="role-title">重装</h3>
          <p class="role-description">
            吸收伤害，保护队友，控制战场。<br>
            拥有高生命值和强大的防御能力。
          </p>
        </div>
      </div>
      
      <p class="role-tip" style="margin-top: 4.63vh; font-size: clamp(0.875rem, 1vw, 1.2rem); color: rgba(255,255,255,0.7);">
        选择自身所擅长职责
      </p>
    </div>
  </div>
</template>

<style scoped>
.section {
  height: 100vh;
  overflow: hidden;
  position: relative;
  padding-top: 5.556vh;
  box-sizing: border-box;
}

.roles-page {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
  color: #ffffff;
}

.subtitle1 {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(1rem, 1.5vw, 1.8rem);
  color: rgba(255, 255, 255, 0.9);
  margin-top: 1.389vh;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
  font-weight: bold;
}

.roles-container {
  display: flex;
  justify-content: center;
  gap: 3.125vw;
  margin-top: 3.704vh;
  flex-wrap: wrap;
}

.role-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.042vw;
  padding: 1.563vw;
  width: 14.583vw;
  min-width: 240px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.role-card:hover {
  transform: translateY(-0.926vh);
  box-shadow: 0 1.389vh 2.778vh rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.role-icon {
  width: 6.25vmin;
  height: 6.25vmin;
  margin: 0 auto 1.852vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  padding: 1.042vw;
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
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.role-tip {
  font-family: 'SmileySans Oblique', sans-serif;
  text-align: center;
  max-width: 41.667vw;
  margin-left: auto;
  margin-right: auto;
}
</style>