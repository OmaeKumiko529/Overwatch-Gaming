# 核心系统详解

本文档深入解析项目的几个核心设计：帖子线程模型、帖子标记与权限分级、点赞事务机制、富文本编辑器、全站弹窗系统以及管理员通用 CRUD 面板。

## 1. 帖子线程模型

项目的帖子系统采用"单表自关联 + 路径枚举"的线程模型设计。所有帖子和评论共用一张 `posts` 表，通过 `parent_id` 和 `context` 两个字段组织树形结构。

### 表结构

```sql
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id  INTEGER,               -- NULL 表示主帖，非 NULL 表示子帖（评论）
  context    TEXT DEFAULT '#',       -- 嵌套路径
  pid        TEXT UNIQUE,            -- 公开标识符，如 p-20260607-2841-42
  category   TEXT DEFAULT 'general', -- 'general' 为主帖，'comment' 为子帖
  ...
)
```

### 核心概念

#### parent_id

- `NULL`：表示这是一个主帖（线程的根节点）
- 非 `NULL`：表示这是一个子帖（评论），指向其父帖的 `id`

#### context — 嵌套路径

`context` 字段存储从帖子到用户的层级结构，格式类似于文件系统路径：

```
主帖：     #/p-20260607-2841-42
子帖1：   #/p-20260607-2841-42/u-20260101-0000
子帖2：   #/p-20260607-2841-42/u-20260607-2841
嵌套回复： #/p-20260607-2841-42/u-20260101-0000/u-20260607-2841
```

路径结构解析：

```
#         ← 根标记
/p-xxx    ← 主帖的 PID
/u-yyy    ← 评论者的 UID
/u-zzz    ← 回复者的 UID（嵌套回复）
```

#### 查询模型

获取某个主帖下的所有子帖时，无需递归查询，直接使用 `LIKE` 匹配即可：

```js
// 获取主帖 post 下的所有子帖
const childPosts = getAll(
  "SELECT * FROM posts WHERE context LIKE ? AND id != ? ORDER BY created_at ASC",
  [`${post.context}/%`, post.id]
)
```

这种设计的优势：
- **一次查询**：无论嵌套层级多深，一次 SQL 查询就能取到所有子帖
- **排序简单**：按 `created_at ASC` 返回，天然形成按时间排序的线性列表
- **删除方便**：删除主帖时通过 `context LIKE` 匹配即可级联删除所有子帖

### PID — 公开帖子标识符

数据库使用自增 `id` 作为主键，但对外暴露使用 `pid` 标识符。PID 格式：

```
p-YYYYMMDD-{UID后4位}-{2位随机数}
示例：p-20260607-2841-42
```

- 在 URL 中使用：`/post/:pid` → `/post/p-20260607-2841-42`
- 嵌入 UID 后缀，便于识别帖主身份
- 不依赖数据库自增 ID，避免暴露注册顺序或发帖顺序

### 帖子创建流程

```
用户提交表单
    │
    ▼
校验 title/content（长度、非空）
    │
    ▼
查询用户 UID
    │
    ▼
生成 PID（调用 generatePid）
    │
    ▼
构建 context
  ├── 主帖：  #/{pid}
  └── 子帖：  {父帖context}/{用户UID}
    │
    ▼
INSERT INTO posts
    │
    ▼
触发通知（@提及 + 评论通知）
    │
    ▼
返回新帖子对象
```

## 2. 帖子标记与权限分级

该功能受 VRChat 的标记系统启发，在帖子发布后管理员可以设置不同的标记（postrank），控制帖子的可见性和评论权限。

### 标记定义

| 标记 | 名称 | 视觉标识 | 权限限制 |
|------|------|----------|----------|
| `FF` | 红帖 | 红色标记 | 需要 userrank ≥ 1 才能评论 |
| `69` | 普通帖 | 无色 | 无额外限制 |
| `78` | 绿帖 | 绿色标记 | 无额外限制（标识优质内容） |
| `00` | 黑帖 | 黑色标记 | content 对 userrank < 2 隐藏；userrank < 3 无法评论 |

### 用户等级体系

| userrank | 等级名称 | 对应颜色 | 说明 |
|----------|----------|----------|------|
| 0 | 访客 | 灰色 | 默认注册用户等级，可浏览和发表主帖 |
| 1 | 玩家 | 蓝色 | 可评论红帖（FF） |
| 2 | 受信任玩家 | 紫色 | 可查看黑帖内容（00） |
| 3 | 管理员/超级管理员 | 金色 | 完全权限，可管理所有内容 |

### 权限校验实现

权限在后端路由和前端路由守卫中进行双重校验：

#### 后端（评论时校验）

```js
// server/routes/posts.js — 创建评论时
if (parentPost.postrank === 'FF' && userrank < 1) {
  return res.json({ success: false, message: '您的等级不足，无法评论此红帖' })
}
if (parentPost.postrank === '00' && userrank < 3) {
  return res.json({ success: false, message: '您的等级不足，无法评论此黑帖' })
}
```

#### 后端（查看黑帖内容时）

```js
// server/routes/posts.js — 获取帖子详情
if (post.postrank === '00' && userrank < 2) {
  mappedPost.content = '[该帖子已被标记为黑帖，您没有权限查看内容]'
}
```

#### 前端（路由守卫）

```js
// src/router/index.js
if (to.meta.requiresAdmin) {
  const userrank = Number(session.userrank ?? 0)
  if (userrank < 3) {
    next('/')
    return
  }
}
```

### 管理员提权接口

```http
PUT /api/auth/promote
Authorization: Bearer <admin-token>

{
  "targetUid": "u-20260607-2841",
  "newRank": 2
}
```

此接口要求调用者自身 userrank ≥ 3，且只能由超级管理员操作。

## 3. 点赞事务机制

点赞操作涉及两张表的数据变更，需要保证数据的原子性和一致性。

### 逻辑流程

#### 点赞（POST /api/posts/:pid/like）

```
1. 检查帖子是否存在
2. 检查是否已点赞（post_likes 表 UNIQUE 约束）
3. BEGIN TRANSACTION
    ├── INSERT INTO post_likes (post_id, user_id)
    └── UPDATE posts SET likes = likes + 1 WHERE id = ?
4. COMMIT
5. 触发通知（如果点赞者不是帖主）
6. 返回新的点赞数
```

#### 取消点赞（DELETE /api/posts/:pid/like）

```
1. 检查帖子是否存在
2. 检查点赞记录是否存在
3. BEGIN TRANSACTION
    ├── DELETE FROM post_likes WHERE id = ?
    └── UPDATE posts SET likes = MAX(likes - 1, 0) WHERE id = ?
4. COMMIT
5. 返回新的点赞数
```

### 代码实现

```js
// 点赞（带事务）
try {
  run('BEGIN TRANSACTION')
  insert('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post.id, userId])
  run("UPDATE posts SET likes = likes + 1, updated_at = datetime('now', 'localtime') WHERE id = ?", [post.id])
  run('COMMIT')
} catch {
  run('ROLLBACK')
  return res.json({ success: false, message: '点赞失败' })
}
```

### 约束保证

- **应用层**：查询 `post_likes` 表检查是否已有点赞记录
- **数据库层**：`UNIQUE(post_id, user_id)` 约束防止重复插入
- **事务层**：`BEGIN/COMMIT/ROLLBACK` 保证点赞数和点赞记录的一致性

### 高并发考虑

- 防抖持久化：写操作 300ms 合并写入磁盘
- 事务失败时回滚，保持数据一致性
- `post_likes` 表通过索引优化查询性能

## 4. 富文本编辑器

帖子编辑器基于 **TipTap**（Vue 3 版本的 ProseMirror 封装）构建，位于 `src/components/RichTextEditor.vue`。

### 已安装的扩展

| 扩展 | 来源 | 功能 |
|------|------|------|
| `StarterKit` | `@tiptap/starter-kit` | 基础编辑能力：加粗、斜体、删除线、标题(H1-H3)、列表、引用、分隔线 |
| `UserMention` | 自定义 (`MentionExtension.js`) | @提及用户，弹出自动补全列表 |
| `BilibiliNode` | 自定义 (`BilibiliNode.js`) | 嵌入 Bilibili 视频，通过 BV/AV/EP 号渲染 |

### @提及功能

在编辑器中输入 `@` 字符会触发用户搜索弹窗：

1. 编辑器通过 `MentionExtension.js` 注册 `@` 触发节点
2. 输入时调用 `userService.searchUsers(query)` 实时搜索
3. 弹窗显示匹配的用户头像和用户名
4. 选择用户后，编辑器内渲染为特殊的 `user-mention` 标签
5. 提交帖子时，`mentionParser.js` 从 HTML 中提取所有 @提及信息
6. 提及信息随帖子提交到后端，后端创建 `mention` 类型通知

```vue
<!-- 组件使用 -->
<RichTextEditor
  v-model="content"
  :max-length="5000"
  :enable-mention="true"
  placeholder="请输入内容..."
/>
```

### Bilibili 视频嵌入

功能特点：

1. 点击工具栏的 "B" 按钮打开输入弹窗
2. 输入 BV 号（如 `BV1NArXB4E5q`）或完整链接
3. 正则提取 BV 号：`/BV[a-zA-Z0-9]{10}/`
4. 编辑器内渲染为特殊的 `bilibili-inline` 节点（粉红色标记）
5. 前端展示时通过自定义节点渲染为嵌入式播放器

支持的视频格式：BV 号、AV 号、EP 号。

### 编辑器的可复用性

如需将编辑器嵌入到其他项目，只需复制以下文件：

```
src/components/RichTextEditor.vue   # 主组件
src/components/MentionExtension.js   # @提及扩展
src/components/BilibiliNode.js       # B站视频扩展
```

然后安装依赖：`@tiptap/vue-3`、`@tiptap/starter-kit`。

## 5. 全站弹窗系统

项目实现了一套统一的弹窗管理系统，由三个文件共同组成：

| 文件 | 职责 |
|------|------|
| `src/components/Popup.vue` | 弹窗展示组件（单例，在 App.vue 中挂载） |
| `src/utils/pop.js` | 工具函数，提供 `pop()` 调用接口 |
| `src/constants/popupStyles.json` | 弹窗样式主题配置 |

### 使用方式

```js
import { pop } from '../utils/pop.js'

// 最简单的用法
pop('操作成功！')

// 指定样式主题
pop('警告：此操作不可撤销', 'warning')

// 使用配置对象
pop({
  text: '确认删除？',
  style: 'danger',
  duration: 0,    // 0 表示不自动关闭
  buttons: ['取消', '确认']
})
```

### 弹窗样式主题

样式主题定义在 `popupStyles.json` 中，支持自定义配色、动画和图标。内置主题包括：

| 主题名 | 用途 |
|--------|------|
| `success` | 成功操作反馈（绿色） |
| `warning` | 警告提示（橙色） |
| `danger` | 危险操作确认（红色） |
| `info` | 普通信息提示（蓝色） |
| 其他自定义主题 | 按需扩展 |

### 架构设计

- **单例模式**：整个应用只有一个 Popup 组件实例，挂载在 App.vue 中
- **响应式队列**：Pinia 的 `popup` store 维护一个弹窗队列，支持连续弹窗
- **无侵入**：任何组件只需引入 `pop()` 函数即可触发弹窗，无需额外组件注册

## 6. 管理员通用 CRUD 面板

管理后台（AdminPanel.vue）是一个动态的数据库可视化操作面板，无需为每张表编写单独的 CRUD 代码。

### 动态表结构探测

```js
// GET /api/admin/tables
// 遍历 SQLite 系统表，返回所有用户表及其列结构
const tables = getAll("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
const result = tables.map(t => {
  const cols = getTableInfo(t.name)     // PRAGMA table_info
  const countResult = getOne(`SELECT COUNT(*) as count FROM \`${t.name}\``)
  return { name: t.name, columns: cols, rowCount: countResult.count }
})
```

### 安全限制

#### 表白名单

只允许操作预定义的 8 张表：

```js
const ALLOWED_TABLES = [
  'users', 'posts', 'teams', 'team_members',
  'notifications', 'announcements', 'post_likes',
  'ow_heroes'
]
```

#### 字段脱敏

```js
// 用户表的 password_hash 字段自动截断
if (tableName === 'users' && sanitized.password_hash) {
  sanitized.password_hash = sanitized.password_hash.substring(0, 8) + '...[已脱敏]'
}
```

#### SQL 注入防护

```js
// 只允许 SELECT 和 PRAGMA 语句
if (!/^\s*(SELECT|PRAGMA)\b/i.test(query)) {
  return res.json({ success: false, message: '仅允许执行 SELECT 或 PRAGMA 查询' })
}

// 关键字黑名单
const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'EXEC', 'ATTACH']
```

#### 自增主键保护

插入和更新操作排除自增主键列：

```js
// INSERT 时排除主键
const pk = getPrimaryKey(tableName)  // 返回 'id'
const allowedCols = cols.filter(c => c.name !== pk)

// UPDATE 时按主键定位
const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`${pk}\` = ?`
```

### 功能清单

| 端点 | 功能 | 额外说明 |
|------|------|----------|
| `GET /api/admin/tables` | 获取所有表结构 | 含列名、类型、行数 |
| `GET /api/admin/table/:name` | 分页查看表数据 | 支持排序、搜索 |
| `POST /api/admin/table/:name` | 插入新行 | 自动过滤主键 |
| `PUT /api/admin/table/:name/:id` | 更新行 | JSON 字段自动序列化 |
| `DELETE /api/admin/table/:name/:id` | 删除行 | — |
| `POST /api/admin/sql` | 执行只读 SQL | SELECT/PRAGMA 仅限 |
| `GET /api/admin/stats` | 数据库统计概览 | 各表行数 + 管理员数 |

### 前端交互

`AdminPanel.vue` 页面提供完整的数据库操作界面：

- **表选择器**：下拉菜单选择要操作的表
- **数据表格**：动态渲染列，自动处理 JSON 字段显示
- **搜索框**：在所有文本列中模糊搜索
- **分页器**：支持页码跳转和每页条数设置
- **行操作**：每行提供编辑/删除按钮
- **SQL 查询台**：可直接执行 SELECT 查询（展示结果表格）
- **统计面板**：显示数据库总体健康状态