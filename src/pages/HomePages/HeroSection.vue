<template>
  <div class="section">
    <div class="video-background">
      <video autoplay muted loop playsinline>
        <source src="/Amiya.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>
    </div>

    <div class="content hero-content" style="white-space: pre-wrap;">
      <h1 class="main-title">E426 Overwatch</h1>

      <p class="subtitle" style="padding-left: 0.521vw;">
        基于Vue.js开发的轻量级守望先锋®论坛<br/><br/>
      </p>

      <br>

      <div v-if="!isLoggedIn" class="button-container">
        <button class="register-button" @click.prevent="navigateTo('Register')">注册</button>
        <button class="login-button" @click.prevent="navigateTo('Login')">登录</button>
      </div>

      <div v-else class="welcome-message">
        <button class="login-button" @click.prevent="navigateTo('User')">用户面板</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const isLoggedIn = auth.isLoggedIn

const navigateTo = (routeName) => {
  router.push({ name: routeName })
}
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

.video-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
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

.main-title {
  font-family: "Fugaz One", sans-serif;
  font-size: clamp(2rem, 3.33vw, 4rem);
  margin: 0;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.subtitle {
  font-family: 'SmileySans Oblique', sans-serif;
  font-size: clamp(0.875rem, 1vw, 1.2rem);
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.926vh;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.button-container {
  display: flex;
  gap: 1.042vw;
  margin-top: 1.852vh;
}

.register-button,
.login-button {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 0.6em 1.25vw;
  font-family: 'MapleMono CN Regular', monospace;
  border-radius: 64px;
  cursor: pointer;
  transition: 0.3s;
}

.register-button:hover,
.login-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.welcome-message {
  margin-top: 1.852vh;
}
</style>