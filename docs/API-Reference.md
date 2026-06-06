# API 参考手册

本文档列举项目所有 API 端点的详细说明，包括请求方法、路径、认证要求、参数格式及响应示例。适用于前端开发者对接后端接口或进行二次开发。

## 通用规范

### 基础路径

所有 API 端点以 `/api` 为前缀，例如完整的请求 URL 为 `http://localhost:3001/api/auth/login`。

### 认证方式

在请求头中携带 JWT token：

```
Authorization: Bearer <token>
```

前端 `api.js` 的 request() 函数会自动完成 token 的读取和注入。

### 响应格式

所有端点返回统一格式的 JSON：

```json
{
  "success": true,
  // ... 业务数据字段
}
```

失败时：

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

---

## 1. 认证模块 — `/api/auth`

### 1.1 注册

```
POST /api/auth/register
```

**认证**：无  
**频率限制**：每小时 3 次/IP

**请求体**：

```json
{
  "username": "玩家小明",
  "email": "player@example.com",
  "password": "mypassword123"
}
```

**校验规则**：
- 用户名：2-20 字符，仅允许字母、数字、下划线和中文
- 邮箱：格式校验，长度不超过 100
- 密码：6-128 字符

**成功响应**：

```json
{
  "success": true,
  "user": {
    "id": 5,
    "uid": "u-20260607-2841",
    "username": "玩家小明",
    "email": "player@example.com",
    "role": ["flexible"],
    "userrank": 0,
    "isAdmin": false,
    "avatar": "/Head.png",
    "teamId": null,
    "createdAt": "2026-06-07 00:00:00",
    "updatedAt": "2026-06-07 00:00:00",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "loggedIn": true,
    "loginTime": "2026-06-07T00:00:00.000Z",
    "rememberMe": false
  }
}
```

**失败响应**（用户名已存在）：

```json
{
  "success": false,
  "message": "用户名或邮箱已存在"
}
```

### 1.2 登录

```
POST /api/auth/login
```

**认证**：无  
**频率限制**：每分钟 5 次/IP

**请求体**：

```json
{
  "username": "Admin",
  "password": "88888888",
  "rememberMe": true
}
```

`username` 字段支持用户名或邮箱两种方式登录。`rememberMe` 控制 token 存储位置（localStorage vs sessionStorage）。

**成功响应**（与注册响应结构相同）：

```json
{
  "success": true,
  "user": {
    "id": 1,
    "uid": "u-20260101-0000",
    "username": "Admin",
    "userrank": 3,
    "isAdmin": true,
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.3 获取当前用户

```
GET /api/auth/me
```

**认证**：必需

**成功响应**：

```json
{
  "success": true,
  "user": {
    "id": 1,
    "uid": "u-20260101-0000",
    "username": "Admin",
    "email": "admin@omaekumiko.com",
    "role": ["flexible"],
    "userrank": 3,
    "isAdmin": true,
    "avatar": "/Head.png",
    "teamId": null,
    "createdAt": "2026-01-01 00:00:00",
    "updatedAt": "2026-06-07 00:00:00"
  }
}
```

### 1.4 获取所有用户

```
GET /api/auth/users
```

**认证**：无  
**说明**：返回所有用户列表，邮箱做脱敏处理（仅显示前两位字符）

**成功响应**：

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "uid": "u-20260101-0000",
      "username": "Admin",
      "email": "ad***@omaekumiko.com",
      "role": ["flexible"],
      "userrank": 3,
      "isAdmin": true,
      "avatar": "/Head.png",
      "teamId": null,
      "createdAt": "2026-01-01 00:00:00",
      "updatedAt": "2026-06-07 00:00:00"
    }
  ]
}
```

### 1.5 获取单个用户

```
GET /api/auth/users/:uid
```

**认证**：无  
**说明**：支持 UID 字符串（如 `u-20260101-0000`）或数字 ID（如 `1`）两种查询方式

**成功响应**（邮箱已脱敏）：

```json
{
  "success": true,
  "user": {
    "id": 1,
    "uid": "u-20260101-0000",
    "username": "Admin",
    "email": "ad***@omaekumiko.com",
    "role": ["flexible"],
    "userrank": 3,
    "isAdmin": true,
    "avatar": "/Head.png",
    "teamId": null,
    "createdAt": "2026-01-01 00:00:00",
    "updatedAt": "2026-06-07 00:00:00"
  }
}
```

### 1.6 更新用户信息

```
PUT /api/auth/update
```

**认证**：必需  
**说明**：可更新的字段为 `email`、`avatar`、`username`，其他字段将被忽略

**请求体**：

```json
{
  "email": "newemail@example.com",
  "username": "新用户名"
}
```

**成功响应**：

```json
{
  "success": true,
  "user": {
    "id": 5,
    "uid": "u-20260607-2841",
    "username": "新用户名",
    "email": "newemail@example.com"
  }
}
```

### 1.7 更新守望先锋职责

```
PUT /api/auth/role
```

**认证**：必需

**请求体**：

```json
{
  "roles": ["damage", "support"]
}
```

**校验规则**：
- 有效值：`heavy`、`damage`、`support`、`flexible`
- `flexible` 不能与其他职责同时选择
- 非灵活模式下最多选择 2 个职责

**成功响应**：

```json
{
  "success": true,
  "user": {
    "id": 5,
    "role": ["damage", "support"]
  }
}
```

### 1.8 提升用户等级（仅管理员）

```
PUT /api/auth/promote
```

**认证**：必需（管理员，userrank ≥ 3）

**请求体**：

```json
{
  "targetUid": "u-20260607-2841",
  "newRank": 2
}
```

等级定义：
- 0 = 访客
- 1 = 玩家
- 2 = 受信任玩家
- 3 = 管理员/超级管理员

**成功响应**：

```json
{
  "success": true,
  "message": "已将用户 玩家小明 的等级更新为 2"
}
```

### 1.9 修改密码

```
PUT /api/auth/password
```

**认证**：必需

**请求体**：

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**成功响应**：

```json
{
  "success": true
}
```

### 1.10 删除当前用户

```
DELETE /api/auth/delete
```

**认证**：必需

**成功响应**：

```json
{
  "success": true
}
```

---

## 2. 帖子模块 — `/api/posts`

### 2.1 获取帖子列表

```
GET /api/posts
```

**认证**：可选（登录后可获知自己的点赞状态）

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `search` | string | — | 搜索关键词（标题、内容、PID），最长 200 字符 |
| `category` | string | — | 按分类筛选 |
| `postrank` | string | — | 按帖子标记筛选（FF/69/78/00） |
| `popular` | string | — | 设为 `true` 按点赞数降序排列 |
| `limit` | number | 20 | 返回条数，最大 100 |

**成功响应**：

```json
{
  "success": true,
  "posts": [
    {
      "id": 1,
      "pid": "p-20260607-2841-42",
      "userId": 5,
      "username": "玩家小明",
      "title": "新手求助：怎么玩好源氏？",
      "content": "<p>如题，求大佬指点</p>",
      "category": "general",
      "likes": 3,
      "context": "#/p-20260607-2841-42",
      "parentId": null,
      "postrank": "69",
      "mentions": [],
      "createdAt": "2026-06-07 00:00:00",
      "updatedAt": "2026-06-07 00:00:00"
    }
  ]
}
```

### 2.2 获取帖子详情

```
GET /api/posts/:pid
```

**认证**：可选

**说明**：返回帖子的完整信息及所有子帖（树形结构）。如果帖子为黑帖（`postrank='00'`）且当前用户等级不足 2，内容会被隐藏。

**成功响应**：

```json
{
  "success": true,
  "post": {
    "id": 1,
    "pid": "p-20260607-2841-42",
    "userId": 5,
    "username": "玩家小明",
    "title": "新手求助：怎么玩好源氏？",
    "content": "<p>如题，求大佬指点</p>",
    "category": "general",
    "likes": 3,
    "context": "#/p-20260607-2841-42",
    "parentId": null,
    "postrank": "69",
    "mentions": [],
    "createdAt": "2026-06-07 00:00:00",
    "updatedAt": "2026-06-07 00:00:00",
    "isLikedByUser": false,
    "childPosts": [
      {
        "id": 2,
        "pid": "p-20260607-0001-73",
        "userId": 1,
        "username": "Admin",
        "title": "回复: 新手求助：怎么玩好源氏？...",
        "content": "<p>先学会shift的用法</p>",
        "category": "comment",
        "likes": 5,
        "context": "#/p-20260607-2841-42/u-20260101-0000",
        "parentId": 1,
        "postrank": "69",
        "mentions": [],
        "createdAt": "2026-06-07 01:00:00",
        "updatedAt": "2026-06-07 01:00:00",
        "isLikedByUser": false
      }
    ]
  }
}
```

### 2.3 获取用户帖子

```
GET /api/posts/user/:uid
```

**认证**：无  
**说明**：支持 UID 或数字 ID

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `mainOnly` | string | 设为 `true` 只返回主帖（不含评论） |

### 2.4 获取分类列表

```
GET /api/posts/categories/list
```

**认证**：无

**成功响应**：

```json
{
  "success": true,
  "categories": ["general", "攻略", "闲聊", "赛事"]
}
```

### 2.5 创建帖子

```
POST /api/posts
```

**认证**：必需

**请求体**：

```json
{
  "title": "新手求助：怎么玩好源氏？",
  "content": "<p>如题，求大佬指点</p>",
  "parentId": null,
  "mentions": []
}
```

- `parentId` 为 `null` 时创建主帖；提供值时创建子帖（评论）
- `mentions` 数组格式：`[{ userId: 2, username: "某人" }]`
- 标题长度限制：200 字符；内容长度限制：50000 字符
- 评论时校验父帖的 postrank 权限

**成功响应**：

```json
{
  "success": true,
  "post": {
    "id": 1,
    "pid": "p-20260607-2841-42",
    "title": "新手求助：怎么玩好源氏？",
    "content": "<p>如题，求大佬指点</p>"
  }
}
```

### 2.6 更新帖子

```
PUT /api/posts/:pid
```

**认证**：必需（仅帖主可修改）

**请求体**（至少提供一个字段）：

```json
{
  "title": "新标题",
  "content": "<p>新内容</p>"
}
```

### 2.7 设置帖子标记（仅管理员）

```
PUT /api/posts/:pid/rank
```

**认证**：必需（管理员，userrank ≥ 3）

**请求体**：

```json
{
  "postrank": "FF"
}
```

有效值：`FF`（红帖）、`69`（普通）、`78`（绿帖）、`00`（黑帖）

### 2.8 删除帖子

```
DELETE /api/posts/:pid
```

**认证**：必需（仅帖主可删除）

**说明**：级联删除该帖及其所有子帖（通过 `context LIKE` 匹配）

### 2.9 点赞帖子

```
POST /api/posts/:pid/like
```

**认证**：必需  
**说明**：每人每帖只能点赞一次（`post_likes` 表 UNIQUE 约束），成功后自动通知帖主

**成功响应**：

```json
{
  "success": true,
  "likes": 4
}
```

### 2.10 取消点赞

```
DELETE /api/posts/:pid/like
```

**认证**：必需  
**说明**：使用事务确保 `post_likes` 表和 `posts.likes` 计数的数据一致性

**成功响应**：

```json
{
  "success": true,
  "likes": 3
}
```

### 2.11 添加评论

```
POST /api/posts/:pid/comment
```

**认证**：必需

**请求体**：

```json
{
  "content": "<p>我来回答你这个问题</p>",
  "mentions": []
}
```

**说明**：创建的评论拥有独立的 PID，comment 路由在生成 context 路径后基于父帖 context 追加用户 UID。评论时检查父帖 postrank 权限：
- `FF`（红帖）：需要 userrank ≥ 1
- `00`（黑帖）：需要 userrank ≥ 3

---

## 3. 队伍模块 — `/api/teams`

### 3.1 获取所有战队

```
GET /api/teams
```

**认证**：无

### 3.2 获取战队详情

```
GET /api/teams/:id
```

**认证**：无  
**说明**：返回战队信息及成员列表

### 3.3 创建战队

```
POST /api/teams
```

**认证**：必需

**请求体**：

```json
{
  "teamName": "银河守望"
}
```

**说明**：系统会自动为战队名追加随机后缀以确保唯一性。创建者自动成为第一个成员。

### 3.4 加入战队

```
POST /api/teams/join
```

**认证**：必需

**请求体**：

```json
{
  "teamName": "银河守望-a7x3"
}
```

### 3.5 退出战队

```
POST /api/teams/leave
```

**认证**：必需  
**说明**：退出后如果战队成员数为 0，战队自动删除

---

## 4. 通知模块 — `/api/notifications`

### 4.1 获取通知列表

```
GET /api/notifications
```

**认证**：必需  
**说明**：返回最近 100 条通知

**成功响应**：

```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "mention",
      "author": "u-20260101-0000",
      "root": "p-20260607-2841-42",
      "toUser": 5,
      "isRead": 0,
      "title": null,
      "createdAt": "2026-06-07 01:00:00"
    }
  ]
}
```

通知类型：
- `mention` — 被 @提及
- `comment` — 帖子被回复
- `like` — 帖子被点赞

### 4.2 获取未读通知数

```
GET /api/notifications/unread-count
```

**认证**：必需

**成功响应**：

```json
{
  "success": true,
  "count": 3
}
```

### 4.3 标记单条已读

```
PUT /api/notifications/:id/read
```

**认证**：必需

### 4.4 标记全部已读

```
PUT /api/notifications/read-all
```

**认证**：必需

### 4.5 创建通知

```
POST /api/notifications
```

**认证**：必需  
**频率限制**：每分钟 10 次

---

## 5. 英雄图鉴模块 — `/api/heroes`

### 5.1 获取英雄列表

```
GET /api/heroes
```

**认证**：无

**查询参数**：

| 参数 | 说明 |
|------|------|
| `role` | 按职责筛选：`tank`、`damage`、`support` |

### 5.2 获取英雄详情

```
GET /api/heroes/:key
```

**认证**：无  
**说明**：`key` 为英雄标识，如 `genji`、`mercy`

### 5.3 同步英雄数据（仅管理员）

```
POST /api/heroes/sync
```

**认证**：必需（管理员）  
**说明**：从 OverFast API 拉取所有英雄数据并写入 `ow_heroes` 表

---

## 6. 公告模块 — `/api/announcements`

### 6.1 获取公告列表

```
GET /api/announcements
```

**认证**：无

### 6.2 获取公告详情

```
GET /api/announcements/:id
```

**认证**：无

### 6.3 创建公告（仅管理员）

```
POST /api/announcements
```

**认证**：必需（管理员）

**请求体**：

```json
{
  "title": "系统维护通知",
  "content": "服务器将于今晚 2:00-4:00 进行维护"
}
```

### 6.4 删除公告（仅管理员）

```
DELETE /api/announcements/:id
```

**认证**：必需（管理员）

---

## 7. 管理后台 — `/api/admin`

### 7.1 获取所有表结构

```
GET /api/admin/tables
```

**认证**：必需（管理员）  
**说明**：返回所有业务表的名称、列结构和行数统计

### 7.2 查看表数据

```
GET /api/admin/table/:tableName
```

**认证**：必需（管理员）

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 50 | 每页条数，最大 200 |
| `search` | string | — | 搜索关键词 |
| `sortBy` | string | id | 排序列 |
| `sortOrder` | string | DESC | 排序方向（asc/desc） |

**说明**：`password_hash` 字段自动脱敏。仅允许操作白名单中的 8 张表。

### 7.3 插入行

```
POST /api/admin/table/:tableName
```

**认证**：必需（管理员）

### 7.4 更新行

```
PUT /api/admin/table/:tableName/:id
```

**认证**：必需（管理员）

### 7.5 删除行

```
DELETE /api/admin/table/:tableName/:id
```

**认证**：必需（管理员）

### 7.6 执行 SQL 查询

```
POST /api/admin/sql
```

**认证**：必需（管理员）

**请求体**：

```json
{
  "query": "SELECT COUNT(*) as total FROM users"
}
```

**安全限制**：仅允许 SELECT 和 PRAGMA 语句，通过关键字黑名单和正则校验双重防护。

### 7.7 数据库统计

```
GET /api/admin/stats
```

**认证**：必需（管理员）

**成功响应**：

```json
{
  "success": true,
  "stats": {
    "users": 10,
    "posts": 45,
    "teams": 3,
    "team_members": 8,
    "notifications": 120,
    "announcements": 5,
    "post_likes": 67,
    "ow_heroes": 42,
    "adminUsers": 2
  }
}
```

---

## 8. 通用接口

### 8.1 健康检查

```
GET /api/health
```

**认证**：无

**成功响应**：

```json
{
  "status": "ok",
  "timestamp": "2026-06-07T00:00:00.000Z"
}
```

### 8.2 数据迁移

```
POST /api/migrate
```

**认证**：无  
**说明**：从 Supabase 格式导入数据到 SQLite