<script setup>
// 导入Vue Composition API
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'

// 组件挂载时初始化登录状态（由 NavBar 和子页面自行管理）
onMounted(() => {
  // 无需在 App 层管理登录状态，各组件通过 Pinia 自动响应
})
</script>

<template>
  <!-- 应用根容器 -->
  <div class="app-container">
    <!-- 导航栏组件 -->
    <NavBar />
    
    <!-- 路由出口：Vue Router渲染匹配的页面组件 -->
    <router-view v-slot="{ Component }">
      <!-- 页面切换过渡动画 -->
      <Transition name="fade" mode="out-in">
        <!-- 动态组件：渲染当前路由对应的组件 -->
        <component :is="Component" />
      </Transition>
    </router-view>
  </div>
</template>

<style scoped>
/* 自定义字体声明：导入SmileySans Oblique字体 */
@font-face {
  font-family: 'SmileySans Oblique';
  src: url('/SmileySans-Oblique.ttf') format('truetype');
}

/* 自定义字体声明：导入MapleMono CN等宽字体 */
@font-face {
  font-family: 'MapleMono CN Regular';
  src: url('/MapleMono-CN-Regular.ttf') format('truetype');
}

/* 应用根容器样式 */
.app-container{
  width:100%;          /* 宽度占满父容器 */
  height:100vh;        /* 高度占满视口高度 */
  position:relative;   /* 相对定位，为子元素定位提供参考 */
}

/* 页面切换过渡动画样式 */
/* 进入和离开时的活动状态 */
.fade-enter-active,
.fade-leave-active{
  transition:opacity .5s;  /* 透明度过渡效果，持续0.5秒 */
}

/* 进入开始状态和离开结束状态 */
.fade-enter-from,
.fade-leave-to{
  opacity:0;  /* 完全透明 */
}

</style>