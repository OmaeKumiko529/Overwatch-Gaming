// Vue Router配置文件
import { createRouter, createWebHashHistory } from 'vue-router'  // 改这里
import HomePage from '../pages/HomePage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import UserPanel from '../pages/UserPanel.vue'
import JoinTeamPage from '../pages/JoinTeamPage.vue'
import CreatePostPage from '../pages/CreatePostPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import SearchPage from '../pages/SearchPage.vue'
import NotificationPage from '../pages/NotificationPage.vue'
import auth from '../utils/auth.js'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresFullpage: true }
  },
  {
    path: '/about',
    name: 'About',
    component: HomePage,
    meta: { requiresFullpage: true, targetSection: 2 }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/user/:uid',
    name: 'UserProfile',
    component: UserPanel,
    meta: { requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    redirect: to => {
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        return { name: 'UserProfile', params: { uid: currentUser.id } };
      } else {
        return '/login';
      }
    }
  },
  {
    path: '/jointeam',
    name: 'JoinTeam',
    component: JoinTeamPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/createpost',
    name: 'CreatePost',
    component: CreatePostPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: PostDetailPage
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchPage
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationPage
  },
  // 这个重定向规则在 hash 模式下可以移除，因为 hash 模式会自动处理
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),  // 改这里
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.meta.targetSection) {
      return { selector: `#section-${to.meta.targetSection}`, behavior: 'smooth' }
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
    if (!auth.isLoggedIn()) {
      next('/login')
      return
    }
  }
  next()
})

export default router