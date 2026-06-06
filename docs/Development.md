# 开发指南

本文面向希望在此项目基础上进行二次开发的开发者，涵盖项目结构详解、依赖清单、目录组织约定、数据流说明、代码约定、关键模块说明以及如何扩展功能。

---

## 0. 如何开始二次开发

如果你是第一次接触本项目，建议按以下路径阅读：

1. 查看 `server/index.js` —— 理解后端入口
2. 查看 `src/services/api.js` —— 理解前后端通信方式
3. 查看 `src/stores/auth.js` —— 理解用户状态流
4. 查看 `src/pages/` —— 理解页面组织方式

常见修改路径：

- 修改 UI：`src/pages` + `src/components`
- 修改接口：`server/routes`
- 修改数据结构：`server/db.js`

---

## 1. 依赖清单与版本

### 前端依赖

保存在项目根目录的 `package.json` 中。

| 包名 | 版本 | 用途 |
|------|------|------|
| `vue` | ^3.5.29 | 前端框架 |
| `vue-router` | ^4.6.4 | 客户端路由（Hash 模式） |
| `pinia` | ^3.0.4 | 全局状态管理 |
| `@tiptap/vue-3` | ^3.22.3 | 富文本编辑器（Vue 3 绑定） |
| `@tiptap/starter-kit` | ^3.22.3 | TipTap 基础扩展集（加粗、标题、列表等） |
| `@tiptap/extension-mention` | ^3.22.3 | @提及扩展（TipTap） |
| `@supabase/supabase-js` | ^2.100.1 | Supabase 客户端（项目早期依赖，当前向后兼容） |
| `dompurify` | ^3.4.8 | HTML 内容安全过滤 |
| `cors` | ^2.8.6 | 跨域中间件（运行时依赖，前端构建中冗余） |
| `dotenv` | ^17.4.2 | 环境变量加载（运行时依赖，前端构建中冗余） |
| `express-rate-limit` | ^8.5.2 | 速率限制（运行时依赖，前端构建中冗余） |

**开发依赖**：

| 包名 | 版本 | 用途 |
|------|------|------|
| `vite` | ^7.3.1 | 构建工具 |
| `@vitejs/plugin-vue` | ^6.0.4 | Vite Vue 3 插件 |
| `vite-plugin-vue-devtools` | ^8.0.6 | Vue DevTools 集成插件 |
| `gh-pages` | ^6.3.0 | GitHub Pages 自动部署 |

### 后端依赖

保存在 `server/package.json` 中。

| 包名 | 版本 | 用途 |
|------|------|------|
| `express` | ^4.21.0 | Web 框架 |
| `sql.js` | ^1.11.0 | WebAssembly 编译的 SQLite（无需安装数据库服务） |
| `bcryptjs` | ^2.4.3 | 密码哈希 |
| `jsonwebtoken` | ^9.0.2 | JWT 签发与校验 |
| `cors` | ^2.8.5 | CORS 中间件 |

> 后端 `package.json` 中的 `"scripts"` 定义了两个命令：`node index.js`（生产启动）、`node --watch index.js`（开发启动，Node.js 原生文件监听，无需安装 nodemon）。

---

## 2. 项目结构详解

```
Overwatch-Gaming/
├── public/                    # 静态资源（不经过 Vite 打包处理）
│   ├── favicon.ico            # 网站图标
│   ├── Head.png               # 默认用户头像
│   ├── Heading.png            # 页面横幅
│   ├── ow_icon.svg            # 守望先锋图标
│   ├── SmileySans-Oblique.ttf # 自定义标题字体
│   ├── MapleMono-CN-Regular.ttf # 自定义等宽字体
│   ├── 默认头图设计.psd       # PSD 设计源文件
│   ├── 职责专题页面参考.psd
│   └── Nsc/                   # 其他静态子目录
├── src/                       # 前端源代码
│   ├── App.vue                # 根组件（NavBar 条件渲染、过渡动画、Popup 挂载）
│   ├── main.js                # 应用入口（Pinia + Router + 全局组件注册）
│   ├── router/index.js        # 路由配置（17 条规则 + 守卫 + 滚动行为）
│   ├── components/            # 可复用组件
│   │   ├── NavBar.vue         # 导航栏
│   │   ├── SearchInput.vue    # 搜索输入框
│   │   ├── RichTextEditor.vue # 富文本编辑器（TipTap）
│   │   ├── UserrankBadge.vue  # 用户等级徽章
│   │   ├── Popup.vue          # 全站弹窗组件
│   │   ├── MentionExtension.js  # @提及 TipTap 扩展
│   │   └── BilibiliNode.js    # B站视频嵌入 TipTap 节点
│   ├── pages/                 # 页面级组件
│   │   ├── HomePage.vue       # 首页
│   │   ├── LoginPage.vue      # 登录页
│   │   ├── RegisterPage.vue   # 注册页
│   │   ├── UserPanel.vue      # 用户面板
│   │   ├── BrowsePage.vue     # 浏览帖子
│   │   ├── SearchPage.vue     # 搜索页面
│   │   ├── CreatePostPage.vue # 发帖页面
│   │   ├── PostDetailPage.vue # 帖子详情
│   │   ├── NotificationPage.vue # 通知列表
│   │   ├── AnnouncementPage.vue # 公告列表
│   │   ├── AdminPanel.vue     # 管理后台
│   │   ├── HeroesPage.vue     # 英雄图鉴
│   │   ├── ErrorPage.vue      # 错误页面
│   │   └── HomePages/         # 首页子组件
│   │       ├── HeroSection.vue
│   │       ├── RolesSection.vue
│   │       ├── SupportGallery.vue
│   │       └── BlankSection.vue
│   ├── UserPanel/             # 用户面板子组件
│   │   ├── ProfileHeader.vue  # 个人资料头部
│   │   ├── OverviewTab.vue    # 总览标签页
│   │   ├── PostsTab.vue       # 帖子标签页
│   │   ├── TeamTab.vue        # 战队标签页
│   │   ├── SettingsTab.vue    # 设置标签页
│   │   └── modals/            # 弹窗表单
│   ├── services/              # API 调用封装层
│   │   ├── api.js             # 统一 fetch 客户端 + 8 组 API 封装
│   │   ├── auth.js            # 旧的 localStorage 认证服务（向后兼容）
│   │   ├── post.js            # 帖子辅助服务
│   │   ├── user.js            # 用户搜索服务
│   │   └── notification.js    # 通知轮询服务
│   ├── stores/                # Pinia 全局状态
│   │   ├── auth.js            # 认证状态
│   │   ├── post.js            # 帖子状态
│   │   ├── team.js            # 战队状态
│   │   ├── popup.js           # 弹窗状态
│   │   └── notification.js    # 通知状态
│   ├── utils/                 # 工具函数
│   │   ├── auth.js            # 认证工具
│   │   ├── encode.js          # 编码工具
│   │   ├── mentionParser.js   # @提及 HTML 解析器
│   │   ├── contentFilter.js   # 内容安全过滤器
│   │   └── pop.js             # 弹窗快捷调用工具
│   ├── constants/             # 常量定义
│   │   ├── rankMap.js         # 用户等级 + 帖子标记映射表
│   │   └── popupStyles.json   # 弹窗样式主题配置
│   └── composables/           # Vue 组合式函数
├── server/                    # 后端源代码
│   ├── index.js               # Express 服务入口（CORS + 限流 + 路由挂载 + 健康检查）
│   ├── db.js                  # OmaeSQL 数据库工具层（8 张表 + 索引 + 增量迁移）
│   ├── migrate-v2.js          # Supabase → SQLite 迁移脚本
│   ├── check_db.js            # 数据库文件诊断脚本
│   ├── setup-env.js           # 交互式 .env 配置引导
│   ├── package.json           # 后端依赖
│   ├── middleware/auth.js     # 三层认证中间件
│   ├── routes/                # 路由模块
│   │   ├── auth.js            # 认证与用户管理（11 个端点）
│   │   ├── posts.js           # 帖子 CRUD（11 个端点）
│   │   ├── teams.js           # 战队管理（5 个端点）
│   │   ├── notifications.js   # 通知管理（5 个端点）
│   │   ├── announcements.js   # 公告管理（4 个端点）
│   │   ├── heroes.js          # 英雄图鉴（3 个端点）
│   │   ├── admin.js           # 管理后台（7 个端点）
│   │   └── migrate.js         # 数据迁移（1 个端点）
│   └── utils/identifiers.js   # UID/PID 生成器
├── tools/
│   └── migrate-localstorage.js # 浏览器 localStorage 数据迁移到 SQLite
├── vite.config.js             # Vite 构建配置（proxy + base + alias）
├── index.html                 # HTML 入口
├── package.json               # 前端依赖
├── jsconfig.json              # JS 项目配置（VS Code 智能提示）
├── test_auth.html             # 认证测试页面
└── test_admin_login.js        # 管理员登录测试脚本
```

---

## 3. 目录组织约定

本章规定项目中**什么代码放在哪个目录、以什么格式命名**，帮助开发者快速定位文件并保持代码结构的一致性。

### 前端目录约定

| 目录 | 存放内容 | 禁止存放 | 文件命名规则 |
|------|----------|----------|-------------|
| `src/pages/` | 页面级组件（每个文件对应一条路由） | 可复用的 UI 组件、非路由组件 | PascalCase — `PostDetailPage.vue` |
| `src/pages/HomePages/` | 首页专用的子组件（仅被首页引用） | 可跨页面复用的组件 | PascalCase — `HeroSection.vue` |
| `src/UserPanel/` | 用户面板专用子组件 | 其他页面的组件 | PascalCase — `ProfileHeader.vue` |
| `src/UserPanel/modals/` | 用户面板弹窗表单合集 | 独立页面、全局弹窗 | 小写，如 `change-password.vue` |
| `src/components/` | 可跨页面复用的 UI 组件 | 页面级业务逻辑、直接调用 store | PascalCase — `RichTextEditor.vue` |
| `src/components/` 中的 `.js` | TipTap 自定义扩展（编辑器插件） | 业务工具函数、API 封装 | PascalCase — `MentionExtension.js` |
| `src/stores/` | Pinia 全局状态仓库 | 工具函数、API 调用逻辑 | 小写 camelCase — `auth.js` |
| `src/services/` | API 调用封装、数据服务 | UI 组件、store 逻辑 | 小写 camelCase — `api.js` |
| `src/utils/` | 纯工具函数（无副作用、无 API 调用） | 有副作用的操作、store 修改 | 小写 camelCase — `pop.js` |
| `src/constants/` | 常量定义、映射表、静态 JSON 配置 | 动态数据、运行时计算 | 小写 camelCase — `rankMap.js` |
| `src/router/` | Vue Router 配置（单一入口） | 组件、store | `index.js` 固定文件名 |
| `src/composables/` | Vue 组合式函数（useXxx 模式） | 组件、工具函数 | camelCase 前缀 `use` — `useAuth.js` |

**常见错误示例**：

```
❌ src/components/CreatePostPage.vue     → 页面组件，应放 src/pages/
❌ src/pages/EditorButton.vue            → 可复用按钮，应放 src/components/
❌ src/utils/api.js                       → API 调用，应放 src/services/
❌ src/services/formatDate.js             → 纯工具函数，应放 src/utils/
❌ src/stores/pop.js                      → 工具函数，弹窗工具应放 src/utils/
```

### 后端目录约定

| 目录 | 存放内容 | 禁止存放 | 文件命名规则 |
|------|----------|----------|-------------|
| `server/routes/` | Express 路由模块（一个领域一个文件） | 中间件、数据库工具函数 | 小写复数名词 — `posts.js`、`teams.js` |
| `server/middleware/` | 认证/安全中间件 | 路由处理逻辑、业务代码 | 小写 camelCase — `auth.js` |
| `server/utils/` | 后端工具函数 | 路由处理、中间件 | 小写 camelCase — `identifiers.js` |
| `server/` 根目录 | 入口文件 + 数据库核心 + 配置文件 | 路由模块、中间件 | `index.js`、`db.js`、`setup-env.js` |

### 通用文件命名规则

| 文件类型 | 规则 | 示例 |
|----------|------|------|
| Vue 组件 | PascalCase（首字母大写） | `NavBar.vue`、`PostDetailPage.vue` |
| JS/TS 模块（非组件） | 小写 camelCase | `auth.js`、`contentFilter.js` |
| TipTap 扩展（JS） | PascalCase | `MentionExtension.js`、`BilibiliNode.js` |
| 数据库表名 | 小写 + 下划线 | `post_likes`、`ow_heroes` |
| 路由路径 | 小写 + 连字符 | `/adminpower`、`/createpost` |
| API 路径 | 小写复数名词 | `/api/posts`、`/api/teams` |
| 环境变量 | 大写 + 下划线 | `ADMIN_PASSWORD`、`JWT_SECRET` |

### 代码职责边界

```
src/stores/    ──→  管理全局状态（state + actions）
src/services/  ──→  封装 API 请求（调用 fetch，返回 JSON）
src/utils/     ──→  纯逻辑工具（无副作用，无 API 调用）
src/components/──→  可复用 UI 组件（接收 props，emit 事件）
src/pages/     ──→  页面（组合 components + stores + services）
server/routes/ ──→  路由处理（参数校验 → 数据库操作 → 响应）
server/db.js   ──→  数据库操作（OmaeSQL 工具层）
```

**单向依赖链**（禁止反向引用）：

```
pages/ → components/ + stores/ + services/
stores/ → services/ → api.js → (HTTP)
components/ → utils/
services/ → api.js
utils/ → (无依赖)
```

---

## 4. 应用入口与根组件

### main.js — 应用入口

`src/main.js` 是应用的启动点，依次执行以下操作：

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import UserrankBadge from './components/UserrankBadge.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)          // 注册 Pinia 状态管理
app.use(router)         // 注册 Vue Router
app.component('userrankBadge', UserrankBadge)  // 全局注册等级徽章组件
app.mount('#app')       // 挂载到 #app 元素
```

- `UserrankBadge` 被注册为全局组件，可在任何页面直接使用 `<userrankBadge />` 而不需要单独 import
- Pinia 使用 Composition API 风格（`defineStore` 第二个参数为函数，而非 Options 对象）

### App.vue — 根组件

```vue
<template>
  <div class="app-container">
    <NavBar v-if="!hideNavBar" />
    <router-view v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </div>
  <Popup />
</template>
```

关键设计点：
- **NavBar 条件隐藏**：通过 `route.meta.hideNavBar` 控制，如 AdminPanel 页面需要全屏管理界面
- **过渡动画**：使用 `fade` 动画（`opacity` 0.3s），`mode="out-in"` 保证离开动画完成后才渲染新页面
- **Popup 全局挂载**：`<Popup />` 在 App.vue 根层级渲染，不被任何页面 DOM 结构限制
- **自定义字体**：在 `<style>` 中通过 `@font-face` 加载 `SmileySans-Oblique.ttf` 和 `MapleMono-CN-Regular.ttf`

---

## 5. Vite 构建配置

完整配置位于 `vite.config.js`：

```js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  base: process.env.NODE_ENV === 'production'
    ? '/Overwatch-Gaming/'    // 生产环境：GitHub Pages 子路径
    : './',                    // 开发环境：相对路径

  plugins: [
    vue(),                     // Vue 3 支持
    vueDevTools(),             // Vue DevTools 集成（开发用）
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `base` (生产) | `/Overwatch-Gaming/` | 适配 GitHub Pages 子路径部署 |
| `base` (开发) | `./` | 相对路径，本地开发时正常 |
| `@` 别名 | `src/` | 可用 `@/components/Popup.vue` 引用 |
| `/api` proxy | `localhost:3001` | 开发时前端请求 `/api/*` 自动转发给 Express |
| 插件 | vue + vueDevTools | 核心插件 + 调试工具 |

### package.json 脚本

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "npm run build && npx gh-pages -d dist"
}
```

---

## 6. 数据流说明

本章描述项目中 4 条最核心的数据流路径。

### 6.1 认证登录流

用户登录时，数据从前端表单到达后端并返回 JWT：

```
LoginPage.vue
    │  authStore.login(username, password, rememberMe)
    ▼
src/stores/auth.js
    │  authApi.login()
    ▼
src/services/api.js
    │  fetch('/api/auth/login') → Vite proxy → Express
    ▼
server/routes/auth.js
    │  loginLimiter(1min/5次) → getOne('SELECT * FROM users WHERE username=?')
    │  → bcrypt.compare() → generateToken() → jwt.sign()
    ▼
返回 JSON { token } → persistLoginSession → authStore.currentUser 更新
```

### 6.2 文章列表读流

```
BrowsePage.vue (onMounted)
    │  postStore.fetchPosts({ category, search })
    ▼
src/services/api.js
    │  GET /api/posts → Vite proxy → Express
    ▼
server/routes/posts.js
    │  optionalAuth → getAll('SELECT * FROM posts WHERE parent_id IS NULL ...')
    ▼
server/db.js (OmaeSQL)
    │  db.prepare() → stmt.step() → stmt.getAsObject()
    ▼
返回 JSON → postStore 更新 → Vue 响应式渲染
```

### 6.3 创建帖子写流

```
CreatePostPage.vue → contentFilter XSS 过滤
    │  POST /api/posts (auth: true)
    ▼
server/routes/posts.js
    │  authMiddleware → 参数校验 → generatePid() → 构建 context
    │  → OmaeSQL insert() → scheduleSave(300ms)
    │  → 通知写入（@提及 + 评论通知）
    ▼
返回新帖子 → router.push(`/post/${pid}`)
```

### 6.4 会话过期事件流

```
API 请求收到 HTTP 401
    │
    ▼
api.js → clearLoginSession() + dispatchEvent('auth:unauthorized')
    │
    ▼
stores/auth.js 监听 → logout() → currentUser=null → 导航栏切换
```

### 数据流总结

| 数据流类型 | 耗时点 | 容错机制 |
|------------|--------|----------|
| 认证登录 | bcrypt 比对 | loginLimiter（1min/5次） |
| 读数据 | SQL 查询 | 可选认证（不强制登录） |
| 写数据 | 防抖 300ms 写入 | 参数校验 + 事务回滚 |
| 事件流 | 无（纯前端） | 每个请求独立检测 401 |

---

## 7. 开发工作流

### 启动开发环境

```bash
# 终端 1：前端（端口 5173）
npm run dev

# 终端 2：后端（端口 3001）
cd server && npm run dev
```

首次启动后端时进入交互式 .env 配置向导：
1. 管理员密码
2. JWT 签名密钥
3. 服务器端口（默认 3001）
4. CORS 允许来源（默认 localhost:5173）

### 热重载

- 前端 Vite HMR，修改后浏览器自动更新
- 后端 Node.js `--watch` 模式，修改后自动重启

### 调试技巧

- 后端日志在终端 2
- 前端网络请求在浏览器 DevTools → Network
- 测试 API：`fetch('/api/health')` 在控制台执行
- 查看认证状态：`localStorage.getItem('currentUser')`

---

## 8. 代码约定

### 前端

- **Vue 3 Composition API**：`<script setup>` + `ref`/`computed`/`watch`
- **Pinia 状态管理**：`defineStore('name', () => { ... })` 工厂函数风格
- **API 调用**：通过 `api.js` 封装函数发起，不直接调用 `fetch()`
- **`auth` 选项三元值**：`true`(必需)、`'optional'`(可选)、`false`/省略(公开)
- **样式**：`<style scoped>`，全局样式在 App.vue
- **组件命名**：PascalCase — `RichTextEditor.vue`
- **自定义字体**：`SmileySans Oblique`（标题）、`MapleMono CN Regular`（等宽）

### 后端

- **ESM 模块**：`package.json` 设置 `"type": "module"`
- **路由结构**：`router.use(getDb)` → 定义路由 → `export default router`
- **参数校验**：开头校验，失败返回 `res.json({ success: false, message })`
- **错误处理**：`console.error()` + 返回 500
- **SQL 防护**：参数化查询（`?` 占位符）

### 响应格式

```js
// 成功
res.json({ success: true, ...dataFields })
// 业务错误
res.json({ success: false, message: "描述信息" })
// 系统错误
res.status(500).json({ success: false, message: "服务器内部错误" })
```

---

## 9. 前端服务层参考

### services/api.js — 统一 HTTP 客户端

```js
async function request(endpoint, options = {}) {
  const { method = 'GET', body, auth = false, params } = options

  const headers = { 'Content-Type': 'application/json' }
  if (auth === true || auth === 'optional') {
    const token = getToken()  // 从 localStorage/sessionStorage 读取
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let url = `/api${endpoint}`
  if (params) { /* URLSearchParams 拼接 */ }

  const res = await fetch(url, { method, headers, body })

  // 401 统一处理
  if (res.status === 401) {
    clearLoginSession()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  return await res.json()
}
```

`api.js` 导出 8 组 API 对象 + 2 个辅助函数：

| 导出对象 | 方法数 | 说明 |
|----------|--------|------|
| `authApi` | 10 | 注册、登录、用户 CRUD、密码、权限提升 |
| `postsApi` | 11 | 帖子 CRUD、点赞/取消、评论、分类 |
| `teamsApi` | 5 | 创建/加入/退出、列表/详情 |
| `heroesApi` | 3 | 列表/详情、同步 |
| `notificationsApi` | 5 | 列表、未读数、标记已读 |
| `announcementsApi` | 4 | 列表/详情、创建/删除 |
| `adminApi` | 7 | 表 CRUD、SQL、统计 |
| `persistLoginSession` | — | 保存会话到存储 |
| `clearLoginSession` | — | 清除会话 |

### services/auth.js — 旧版认证兼容层

项目早期使用 localStorage 的纯前端认证。当前应使用 `stores/auth.js` + `api.js`。此文件提供兼容功能：
- `getAllUsers()` / `saveAllUsers()` — 本地用户存取
- `registerUser()` / `login()` — 本地登录模拟
- `getCurrentUser()` / `logout()` — 会话管理

### services/user.js

用户搜索服务，用于 RichTextEditor @提及：
- `refreshUsers()` — 从后端拉取用户列表
- `searchUsers(query)` — 本地模糊搜索

### services/post.js / services/notification.js

帖子辅助服务（格式化、分类）和通知轮询服务。

---

## 10. 常量系统

### constants/rankMap.js

```js
export const USERRANK_MAP = {
  0: { key: 'visitor',    cn: '游客',   icon: '👤', color: '#6c757d' },
  1: { key: 'player',     cn: '玩家',   icon: '🎮', color: '#4facfe' },
  2: { key: 'trusted_player', cn: '信任玩家', icon: '⭐', color: '#28a745' },
  3: { key: 'op',         cn: '管理员', icon: '🛡️', color: '#dc3545' }
}

export const POSTRANK_MAP = {
  'FF': { cn: '受警告内容', color: '#dc3545' },
  '69': { cn: '',           color: '#4facfe' },
  '78': { cn: '精华内容',   color: '#28a745' },
  '00': { cn: '封禁内容',   color: '#212529' }
}
```

工具函数：

| 函数 | 用途 | 示例 |
|------|------|------|
| `getUserRankInfo(rank)` | 获取等级信息 | `getUserRankInfo(3)` → 管理员 |
| `getPostRankInfo(rank)` | 获取帖子标记 | `getPostRankInfo('FF')` → 红帖 |
| `canCommentOnPost(u, p)` | 检查评论权限 | `canCommentOnPost(0, 'FF')` → false |
| `canViewPostContent(u, p)` | 检查查看权限 | `canViewPostContent(1, '00')` → false |

### constants/popupStyles.json

弹窗样式主题配置，每个主题定义配色方案，支持扩展自定义主题。

---

## 11. 工具函数参考

### utils/pop.js — 弹窗快捷调用（8 个方法）

| 方法 | 说明 |
|------|------|
| `pop.up(config, text?, icon?)` | 通用弹窗 |
| `pop.confirm(title, text?, options?)` | 确认框（Promise） |
| `pop.success(title, text?, options?)` | 成功提示 |
| `pop.error(title, text?, options?)` | 错误提示 |
| `pop.warning(title, text?, options?)` | 警告提示 |
| `pop.info(title, text?, options?)` | 信息提示 |
| `pop.toast(text, icon?, options?)` | 底部轻提示（1 秒自动消失） |
| `pop.hide()` | 关闭当前弹窗 |

```js
import pop from '@/utils/pop.js'

pop.toast('已复制', 'success')
const ok = await pop.confirm('确定删除？')
pop.up({ title: '提示', style: 'ow' })
```

### utils/mentionParser.js

从 TipTap 渲染的 HTML 中提取 @提及信息，返回 `[{ userId, username }]`。

### utils/contentFilter.js

基于 DOMPurify，移除危险标签和事件处理属性。

### utils/encode.js / utils/auth.js

编码工具（HTML 转义、URL 编码、Base64）和前端认证辅助函数。

---

## 12. Pinia Store 详解

5 个 store 全部使用 Composition API 风格。

### auth store — `src/stores/auth.js`

**状态**：`currentUser`

**计算属性**：

| 属性 | 说明 |
|------|------|
| `isLoggedIn` | 是否已登录 |
| `currentUsername` | 当前用户名 |
| `currentUid` | 当前用户 UID |
| `userrank` | 等级（0-3） |
| `isAdmin` | userrank ≥ 3 |
| `isPlayer` | userrank ≥ 1 |
| `isTrustedPlayer` | userrank ≥ 2 |

**方法**：

| 方法 | 说明 |
|------|------|
| `loadSession()` | 从存储加载会话，校验有效期 |
| `registerUser(userData)` | 注册 |
| `login(username, password, rememberMe?)` | 登录 |
| `logout()` | 登出 |
| `getAllUsers()` | 获取所有用户 |
| `getUserById(id)` | 获取单个用户 |
| `updateUser(userId, updates)` | 更新信息 |
| `deleteUser(userId)` | 删除账户 |
| `updateUserRole(userId, roles)` | 更新职责 |
| `promoteUser(targetUid, newRank)` | 提升等级（仅管理员） |

**自动登出**：监听 `auth:unauthorized` 事件（来自 api.js），自动清除会话。

### popup store — `src/stores/popup.js`

**双层架构**：上层 `pop.js`（8 个快捷方法）→ 下层 `popup store`（状态管理）

**关键方法**：
- `open(config)` — 打开弹窗，支持 Promise、emoji/图片图标、超时关闭
- `close()` / `confirm()` / `cancel()` — 关闭弹窗

### post store / team store / notification store

- `post store`：帖子列表、详情、创建
- `team store`：战队信息、加入/退出/创建
- `notification store`：通知列表、未读数、标记已读、轮询

---

## 13. 页面组件参考清单

### 一级页面（13 个）

| 组件 | 路由 | 功能 |
|------|------|------|
| `HomePage.vue` | `/` | 首页（4 个子组件） |
| `LoginPage.vue` | `/login` | 登录 |
| `RegisterPage.vue` | `/register` | 注册 |
| `BrowsePage.vue` | `/browse` | 帖子浏览 |
| `SearchPage.vue` | `/search` | 搜索结果 |
| `CreatePostPage.vue` | `/createpost` | 发帖（TipTap 编辑器） |
| `PostDetailPage.vue` | `/post/:pid` | 帖子详情 + 评论 |
| `NotificationPage.vue` | `/notifications` | 通知列表 |
| `AnnouncementPage.vue` | `/announcements` | 公告列表 |
| `UserPanel.vue` | `/user/:uid` | 用户面板（5 子标签页） |
| `HeroesPage.vue` | `/heroes` | 英雄图鉴 |
| `AdminPanel.vue` | `/adminpower` | 管理后台 |
| `ErrorPage.vue` | `/error/:code` | 错误页 |

### 首页子组件

`HeroSection.vue` / `RolesSection.vue` / `SupportGallery.vue` / `BlankSection.vue`

### 用户面板子组件

`ProfileHeader.vue` / `OverviewTab.vue` / `PostsTab.vue` / `TeamTab.vue` / `SettingsTab.vue` / `modals/`

---

## 14. 组件复用指南

### NavBar.vue

自动根据登录状态显示导航项。支持 `route.meta.hideNavBar` 隐藏。

### RichTextEditor.vue

基于 TipTap，支持加粗/标题/列表/引用/@提及/B站嵌入。

```vue
<RichTextEditor v-model="content" :max-length="10000" :enable-mention="true" />
```

**复用**：复制 `RichTextEditor.vue` + `MentionExtension.js` + `BilibiliNode.js`，安装 `@tiptap/vue-3`、`@tiptap/starter-kit`、`@tiptap/extension-mention`。

### SearchInput.vue

防抖搜索（300ms）、搜索历史、清空按钮。

### Popup.vue

已在 App.vue 全局挂载，配合 `utils/pop.js`：

```js
import pop from '@/utils/pop.js'
pop.toast('操作成功', 'success')
```

### UserrankBadge.vue

全局注册 `<userrankBadge>`，已可在任何页面使用。

---

## 15. 后端工具文件说明

### setup-env.js

交互式 .env 配置引导，首次启动且 `.env` 不存在时自动运行：
1. 显示 ASCII Banner
2. 输入 ADMIN_PASSWORD、JWT_SECRET（可自动生成）、PORT、CORS_ORIGINS
3. 生成 `.env` 并打印配置摘要

### migrate-v2.js

Supabase → SQLite 数据迁移。

### check_db.js

数据库文件诊断脚本。

### tools/migrate-localstorage.js

浏览器 localStorage 数据迁移到 SQLite。

---

## 16. 如何添加新页面

1. **创建页面组件**：在 `src/pages/` 下创建 `.vue` 文件
2. **添加路由**：在 `src/router/index.js` 中添加：
   ```js
   { path: '/new-page', component: () => import('../pages/NewPage.vue'),
     meta: { requiresAuth: true } }
   ```
3. **添加 API 调用**：在 `src/services/api.js` 中添加方法
4. **添加 Pinia Store（可选）**：在 `src/stores/` 下创建

路由 meta 选项：`requiresAuth`、`requiresAdmin`、`hideNavBar`、`targetSection`

---

## 17. 如何添加新 API 端点

1. **创建路由文件**：`server/routes/new-feature.js`
2. **注册入口**：`server/index.js` 中 `app.use('/api/new-feature', router)`
3. **选择认证中间件**：
   - 无中间件 — 公开
   - `authMiddleware` — 需登录
   - `adminMiddleware` — 需管理员
   - `optionalAuth` — 可选认证
4. **添加频率限制（可选）**：`rateLimit({ windowMs, max })`

---

## 18. Git 分支策略

| 分支 | 状态 | 说明 |
|------|------|------|
| `main` | ✅ 稳定 | 完整提交历史 |
| `fmy-dev` | ✅ 稳定 | 与 main 同步 |
| `dev` | 🛠 开发中 | 功能汇合 |
| `test` | 🧪 实验性 | 可能存在 Bug |
| `lyd-dev` | 🧪 实验性 | 实验性功能 |

```bash
git checkout dev
git checkout -b feature/my-feature
# 开发后合并
git checkout dev && git merge feature/my-feature
git checkout main && git merge dev
```

---

## 19. 缺失资源说明

仓库没有包含 `Amiya.mp4` 和 `Amiya2.mp4`（文件过大）。如需使用：
- 从 GitHub Pages 下载
- 使用自有视频替换
- 移除相关引用

首次编译因缺失这两个文件会报错。