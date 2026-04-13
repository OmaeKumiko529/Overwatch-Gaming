// Vue Router配置文件
// 定义应用的所有路由规则和导航守卫

// 导入Vue Router相关函数
import { createRouter, createWebHistory } from 'vue-router'
// 导入页面组件
import HomePage from '../pages/HomePage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import UserPanel from '../pages/UserPanel.vue'
import JoinTeamPage from '../pages/JoinTeamPage.vue'
import CreatePostPage from '../pages/CreatePostPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import SearchPage from '../pages/SearchPage.vue'
import NotificationPage from '../pages/NotificationPage.vue'
// 导入认证工具
import auth from '../utils/auth.js'

// 定义路由配置数组
const routes = [
  // 首页路由
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresFullpage: true }  // 元信息：需要fullpage.js支持
  },
  // 关于页面路由（实际上使用HomePage组件的第二屏）
  {
    path: '/about',
    name: 'About',
    component: HomePage,
    meta: { requiresFullpage: true, targetSection: 2 }  // 元信息：需要fullpage.js并跳转到第2屏
  },
  // 注册页面路由
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  // 登录页面路由
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  // 用户个人资料页面路由（带用户ID参数）
  {
    path: '/user/:uid',
    name: 'UserProfile',
    component: UserPanel,
    meta: { requiresAuth: true }  // 元信息：需要用户认证
  },
  // 用户面板路由（自动重定向到当前用户的个人资料页）
  {
    path: '/user',
    name: 'User',
    redirect: to => {
      // 获取当前登录用户
      const currentUser = auth.getCurrentUser();
      if (currentUser) {
        // 如果用户已登录，重定向到该用户的个人资料页
        return { name: 'UserProfile', params: { uid: currentUser.id } };
      } else {
        // 如果用户未登录，重定向到登录页面
        return '/login';
      }
    }
  },
  // 加入团队页面路由
  {
    path: '/jointeam',
    name: 'JoinTeam',
    component: JoinTeamPage,
    meta: { requiresAuth: true }  // 元信息：需要用户认证
  },
  // 创建帖子页面路由
  {
    path: '/createpost',
    name: 'CreatePost',
    component: CreatePostPage,
    meta: { requiresAuth: true }  // 元信息：需要用户认证
  },
  // 帖子详情页面路由（带帖子ID参数）
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: PostDetailPage
  },
  // 搜索页面路由
  {
    path: '/search',
    name: 'Search',
    component: SearchPage
  },
  // 通知页面路由
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationPage
  },
  // 重定向旧hash路由到新路由（兼容旧版本URL）
  // 例如：/#register -> /register
  {
    path: '/#:hash',
    redirect: to => {
      const hash = to.params.hash
      // 根据hash值重定向到对应的新路由
      switch(hash) {
        case 'register': return '/register'
        case 'login': return '/login'
        case 'user':
          const currentUser = auth.getCurrentUser();
          if (currentUser) {
            return { name: 'UserProfile', params: { uid: currentUser.id } };
          } else {
            return '/login';
          }
        case 'jointeam': return '/jointeam'
        case 'createpost': return '/createpost'
        case 'about': return '/about'
        case 'search': return '/search'
        case 'notifications': return '/notifications'
        default: return '/'  // 未知hash重定向到首页
      }
    }
  },
  // 404页面重定向到首页（捕获所有未匹配的路由）
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由器实例
const router = createRouter({
  history: createWebHistory(),  // 使用HTML5 history模式
  routes,  // 路由配置数组
  // 滚动行为配置
  scrollBehavior(to, from, savedPosition) {
    // 如果目标路由有targetSection元信息（用于fullpage.js）
    if (to.meta.targetSection) {
      // 处理fullpage.js滚动到特定section的逻辑
      return { selector: `#section-${to.meta.targetSection}`, behavior: 'smooth' }
    }
    // 如果有保存的滚动位置（浏览器前进/后退）
    if (savedPosition) {
      return savedPosition
    } else {
      // 默认滚动到顶部
      return { top: 0 }
    }
  }
})

// 全局前置路由守卫 - 检查认证状态
router.beforeEach((to, from, next) => {
  // 检查目标路由是否需要认证
  if (to.meta.requiresAuth) {
    // 使用auth工具检查用户是否已登录
    if (!auth.isLoggedIn()) {
      // 如果未登录，重定向到登录页面
      next('/login')
      return
    }
  }
  
  // 继续导航
  next()
})

// 导出路由器实例
export default router