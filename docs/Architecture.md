# 系统架构

本文是项目 **Overwatch-Gaming** 的架构文档，描述系统的整体设计、通信链路、认证机制、限流策略和前端路由体系。

## 整体架构图

```
浏览器 (Vue 3)
    │
    │  src/services/api.js 统一封装 fetch 客户端
    │  自动从 localStorage/sessionStorage 读取 JWT token
    │  注入 Authorization: Bearer <token> 请求头
    │
    ▼
  开发环境: Vite dev server (:5173)
    │  vite.config.js proxy: /api → http://localhost:3001
    │
    ▼
  生产环境: 静态文件服务器 (GitHub Pages)
    │  前端 dist/ + 独立部署的 Express 后端
    │
    ▼
Express Server (:3001)
    │  server/middleware/auth.js 校验 JWT
    │  authMiddleware / optionalAuth / adminMiddleware
    │
    ▼
  server/db.js (OmaeSQL)
    │  sql.js (WebAssembly SQLite)
    │  8 张业务表 + 索引 + WAL 模式 + 防抖写入
    │
    ▼
  server/routes/*.js
    │  按领域拆分的路由模块
    │  每个路由文件自包含：参数校验 → SQL 操作 → 响应格式化
    │
    ▼
  前端 Pinia stores
    │  调用 service 层函数 → 驱动 Vue 组件响应式更新
```

## 前后端通信链路

### 开发环境

前端开发服务器运行在 `localhost:5173`，Express API 服务器运行在 `localhost:3001`。Vite 配置了 `/api` 代理规则：

```js
// vite.config.js 配置摘要
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

浏览器发出的 `/api/*` 请求由 Vite 代理转发至 Express 后端。

### 生产环境

前端构建产物（`dist/` 目录）部署到 GitHub Pages，路径基址设为 `/Overwatch-Gaming/`。Express 后端可部署到任意 Node.js 环境——VPS、云服务实例或容器平台。生产环境下需要通过 Nginx 或类似的反向代理将 `/api` 请求指向 Express 服务器。

## 认证闭环

认证闭环包含 5 个关键步骤：

```
1. 登录
   ├── POST /api/auth/login (username, password, rememberMe)
   └── 后端验证密码 → 签发 JWT（30天有效期）→ 返回 token

2. 存储
   ├── rememberMe = true  → localStorage
   ├── rememberMe = false → sessionStorage
   └── 存储键名: 'currentUser'

3. 注入
   ├── api.js request() 函数自动从存储读取 token
   ├── 注入 Authorization: Bearer <token> 请求头
   └── 根据 auth 选项决定是否强制携带 token

4. 校验
   ├── authMiddleware 解析 JWT → 挂载 req.user
   └── { uid, id, username, userrank } 注入请求对象

5. 续期
   ├── 401 响应触发 clearLoginSession()
   ├── 分发 CustomEvent('auth:unauthorized')
   └── Pinia auth store 响应 → 清除前端状态 → 跳转登录页
```

### JWT 载荷结构

```json
{
  "uid": "u-20260101-0000",
  "id": 1,
  "username": "Admin",
  "userrank": 3,
  "iat": 1700000000,
  "exp": 1702592000
}
```

- 签发算法：HS256
- 有效期：30 天
- 密钥来源：`server/.env` 中的 `JWT_SECRET`
- 未设置密钥时服务器启动会报错，拒绝提供服务

## 三层认证中间件

项目在 `server/middleware/auth.js` 中定义了三种认证中间件，覆盖所有 API 端点的认证需求：

### 1. `authMiddleware`（必需认证）

```js
export function authMiddleware(req, res, next) {
  // 无 Authorization 头 → 401 "请先登录"
  // token 过期/无效 → 401 "认证已过期，请重新登录"
  // 合法 token → 解析 payload 注入 req.user → next()
}
```

用途：需要登录才能访问的接口，如发帖、评论、点赞。

### 2. `optionalAuth`（可选认证）

```js
export function optionalAuth(req, res, next) {
  // 有合法 token → 注入 req.user
  // 无 token 或 token 无效 → 静默继续（req.user 为 undefined）
  // 不会返回 401
}
```

用途：公开但登录后提供个性化数据的接口，如帖子列表（显示 `isLikedByUser`）、帖子详情。

### 3. `adminMiddleware`（管理员认证）

```js
export function adminMiddleware(req, res, next) {
  // 无 token → 401
  // userrank < 3 → 403 "权限不足，需要管理员权限"
  // userrank >= 3 → 通过
}
```

用途：管理面板、数据统计、SQL 查询、其他用户等级提升等敏感操作。

## 频率限制（Rate Limiting）

项目配置了三层频率限制机制：

| 层级 | 范围 | 窗口 | 上限 | 实现位置 |
|------|------|------|------|----------|
| 全局 | 所有 API | 15 分钟 | 1000 次/IP | `server/index.js` |
| 登录 | `/api/auth/login` | 1 分钟 | 5 次/IP | `server/routes/auth.js` |
| 注册 | `/api/auth/register` | 1 小时 | 3 次/IP | `server/routes/auth.js` |

超限响应格式：

```json
{
  "success": false,
  "message": "请求过于频繁，请稍后再试"
}
```

## CORS 白名单

CORS 配置在 `server/index.js` 中，通过 `origin` 回调函数校验：

- 来源配置来自 `.env` 中的 `CORS_ORIGINS` 变量（多个地址用逗号分隔）
- 默认值：`http://localhost:5173,http://localhost:3000`
- 无 `Origin` 头的请求（同源请求、curl 等）默认放行
- 未在白名单中的来源请求会被拒绝

## 前端路由体系

项目使用 Vue Router 4，采用 **Hash 模式**（`createWebHashHistory`），共包含 17 条路由规则：

| 路径 | 名称 | 对应页面 | 认证要求 |
|------|------|----------|----------|
| `/` | Home | 首页 | 无 |
| `/about` | About | 首页（滚动至第2屏） | 无 |
| `/register` | Register | 注册 | 无 |
| `/login` | Login | 登录 | 无 |
| `/user/:uid` | UserProfile | 用户面板 | `requiresAuth` |
| `/user` | User | 自动重定向到 `/user/:uid` | - |
| `/jointeam` | JoinTeam | 加入/创建战队 | `requiresAuth` |
| `/createpost` | CreatePost | 发布帖文 | `requiresAuth` |
| `/post/:pid` | PostDetail | 帖子详情 | 无 |
| `/browse` | Browse | 浏览帖子 | 无 |
| `/search` | Search | 搜索 | 无 |
| `/notifications` | Notifications | 通知列表 | 无 |
| `/announcements` | Announcements | 公告列表 | 无 |
| `/heroes` | Heroes | 英雄图鉴 | 无 |
| `/generate` | Generate | 数据生成器 | `requiresAuth` + `requiresAdmin` |
| `/adminpower` | AdminPanel | 管理员面板 | `requiresAuth` + `requiresAdmin` |
| `/error/:code` | Error | 错误页 | 无 |
| `/:pathMatch(.*)*` | NotFound | 404 → 重定向到 `/error/404` | - |

### 路由守卫逻辑

位于 `router.beforeEach` 中的全局守卫：

```
请求进入 → 检查 meta.requiresAuth
  ├── false → 通过
  └── true → 检查 localStorage/sessionStorage 中是否存在 currentUser
        ├── 不存在 → 重定向到 /login
        └── 存在 → 检查 meta.requiresAdmin
              ├── false → 通过
              └── true → 检查 userrank ≥ 3
                    ├── 否 → 重定向到 /
                    └── 是 → 通过
```

### 滚动行为

- 含有 `meta.targetSection` 的路由（如 `/about`）会平滑滚动到对应章节
- 带有 savedPosition 的返回操作恢复到之前滚动位置
- 其余导航均滚动到页面顶部

## 响应格式规范

所有 API 端点统一使用以下响应格式：

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 请求是否成功 |
| `message` | string | （仅在失败时出现）错误描述 |
| `...data` | any | 业务数据，随端点变化 |

HTTP 状态码语义：

| 状态码 | 含义 |
|--------|------|
| 200 | 请求成功（即使业务逻辑失败也返回 200，通过 success 区分） |
| 401 | 未认证或 token 过期 |
| 403 | 权限不足 |
| 404 | 路由不存在 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |