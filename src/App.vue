<script setup>
// 导入Vue Composition API
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Popup from './components/Popup.vue'

const route = useRoute()
const hideNavBar = computed(() => route.meta && route.meta.hideNavBar)
</script>

<template>
  <!-- 应用根容器 -->
  <div class="app-container">
    <!-- 导航栏组件（某些页面如管理后台隐藏） -->
    <NavBar v-if="!hideNavBar" />
    
    <!-- 路由出口：Vue Router渲染匹配的页面组件 -->
    <router-view v-slot="{ Component }">
      <!-- 页面切换过渡动画 -->
      <Transition name="fade" mode="out-in">
        <!-- 动态组件：渲染当前路由对应的组件 -->
        <component :is="Component" />
      </Transition>
    </router-view>
  </div>
  <!-- 全局弹窗组件 -->
  <Popup />
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