<template>
  <div class="section blank-page">
    <div class="content">
      <h1 class="main-title">{{ title }}</h1>
      <p class="subtitle" style="padding-left: 0.521vw;">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '新页面'
  },
  description: {
    type: String,
    default: '这里是你要的空白页面，可以放页脚或联系方式'
  }
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

.blank-page {
  background: #1a1a1a;
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
</style>