// Vue Router配置文件（含路由懒加载）
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../pages/HomePage.vue'),
    meta: { targetSection: 2 }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/RegisterPage.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue')
  },
  {
    path: '/user/:uid',
    name: 'UserProfile',
    component: () => import('../pages/UserPanel.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    redirect: to => {
      // 使用懒加载方式获取登录状态
      try {
        const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (sessionJson) {
          const user = JSON.parse(sessionJson);
          return { name: 'UserProfile', params: { uid: user.id } };
        }
      } catch {}
      return '/login';
    }
  },
  {
    path: '/jointeam',
    name: 'JoinTeam',
    component: () => import('../pages/JoinTeamPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/createpost',
    name: 'CreatePost',
    component: () => import('../pages/CreatePostPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('../pages/PostDetailPage.vue')
  },
  {
    path: '/browse',
    name: 'Browse',
    component: () => import('../pages/BrowsePage.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../pages/SearchPage.vue')
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../pages/NotificationPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.targetSection) {
      return { selector: `.home-section:nth-child(${to.meta.targetSection})`, behavior: 'smooth' }
    }
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const sessionJson = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      if (!sessionJson) {
        next('/login')
        return
      }
    } catch {
      next('/login')
      return
    }
  }
  next()
})

export default router
