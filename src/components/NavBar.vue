<template>
  <!-- 导航栏组件 -->
  <nav class="navbar">
    <!-- 品牌/首页链接 -->
    <router-link to="/" class="brand">首页</router-link>
    
    <!-- 导航链接列表 -->
    <ul class="nav-links">
      <!-- 仅登录用户可见：发帖链接 -->
      <li v-if="auth.isLoggedIn"><router-link to="/createpost">发帖</router-link></li>
      <!-- 仅登录用户可见：用户面板链接 -->
      <li v-if="auth.isLoggedIn"><router-link to="/user">用户面板</router-link></li>
      <!-- 外部链接：熔火工坊（新标签页打开） -->
      <li><a href="https://www.owmod.net/" target="_blank" rel="noopener noreferrer">熔火工坊</a></li>
    </ul>
    
    <!-- 导航栏操作区域 -->
    <div class="nav-actions">
      <!-- 通知按钮 -->
      <router-link to="/notifications" class="notification-button" title="通知">
        🔔
      </router-link>
      <!-- 搜索输入组件 -->
      <SearchInput />
    </div>
  </nav>
</template>

<script setup>
// 导入Vue Composition API
import { onMounted, onUnmounted } from 'vue';
// 导入认证 Store
import { useAuthStore } from '../stores/auth.js';
// 导入搜索输入组件
import SearchInput from './SearchInput.vue';

const auth = useAuthStore();

// 组件挂载时，初始加载会话
onMounted(() => {
  auth.loadSession();
  window.addEventListener('storage', auth.loadSession);
});

onUnmounted(() => {
  window.removeEventListener('storage', auth.loadSession);
});
</script>

<style scoped>
/* 导航栏容器样式 */
.navbar {
  display: flex;                    /* 使用Flexbox布局 */
  justify-content: space-between;   /* 子元素两端对齐 */
  align-items: center;              /* 垂直居中对齐 */
  background-color: #333;           /* 深灰色背景 */
  color: white;                     /* 白色文字 */
  padding: 10px 20px;               /* 内边距：上下10px，左右20px */
  position: fixed;                  /* 固定定位 */
  top: 0;                           /* 顶部对齐 */
  left: 0;                          /* 左侧对齐 */
  right: 0;                         /* 右侧对齐 */
  z-index: 1000;                    /* 高z-index确保在其他元素上方 */
}

/* 品牌/首页链接样式 */
.brand {
  color: white;                     /* 白色文字 */
  text-decoration: none;            /* 去除下划线 */
  font-size: 1em;                   /* 字体大小：1em（相对于父元素） */
}

/* 导航链接列表容器样式 */
.nav-links {
  list-style: none;                 /* 去除列表默认样式（圆点） */
  margin: 0;                        /* 外边距清零 */
  padding: 0;                       /* 内边距清零 */
  display: flex;                    /* 使用Flexbox布局 */
}

/* 导航链接项样式 */
.nav-links li {
  margin-right: 20px;               /* 右侧外边距：20px（项间距） */
}

/* 导航链接样式 */
.nav-links a {
  color: white;                     /* 白色文字 */
  text-decoration: none;            /* 去除下划线 */
}

/* 导航链接悬停效果 */
.nav-links a:hover {
  text-decoration: underline;       /* 悬停时显示下划线 */
}

/* 导航栏操作区域样式 */
.nav-actions {
  display: flex;                    /* 使用Flexbox布局 */
  align-items: center;              /* 垂直居中对齐 */
  gap: 10px;                        /* 子元素间距：10px */
}

/* 通知按钮样式 */
.notification-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 20px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

/* 导航按钮通用样式（可能用于未来的登录/注册按钮） */
.nav-button {
  padding: 8px 16px;                /* 内边距：上下8px，左右16px */
  border-radius: 20px;              /* 圆角：20px（胶囊形状） */
  font-weight: bold;                /* 粗体文字 */
  transition: all 0.3s ease;        /* 所有属性过渡效果：0.3秒缓动 */
  font-family: 'SmileySans Oblique', sans-serif; /* 自定义字体 */
}

/* 注册按钮样式 */
.register-nav {
  background-color: rgba(102, 126, 234, 0.2); /* 半透明蓝色背景 */
  border: 2px solid #667eea;        /* 蓝色边框 */
}

/* 注册按钮悬停效果 */
.register-nav:hover {
  background-color: #667eea;        /* 悬停时变为实心蓝色 */
  text-decoration: none;            /* 去除下划线 */
}

/* 登录按钮样式 */
.login-nav {
  background-color: rgba(245, 87, 108, 0.2); /* 半透明红色背景 */
  border: 2px solid #f5576c;        /* 红色边框 */
}

/* 登录按钮悬停效果 */
.login-nav:hover {
  background-color: #f5576c;        /* 悬停时变为实心红色 */
  text-decoration: none;            /* 去除下划线 */
}
</style>