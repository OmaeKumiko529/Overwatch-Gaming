# 数据库设计

本文档详细介绍项目的数据库设计，包括表结构、字段说明、索引策略、增量迁移机制、OmaeSQL 工具模块以及标识符系统。

## 技术选型

项目使用 **sql.js** 作为数据库引擎——一个通过 Emscripten 编译到 WebAssembly 的 SQLite 实现。这意味着：

- **零安装**：无需安装 SQLite 服务或任何数据库驱动
- **嵌入式**：数据库文件为项目根目录下的 `server/data.db`
- **跨平台**：适用于所有 Node.js 环境
- **轻量**：单文件存储，备份仅需复制一个文件

### 关键配置

```js
// 启用外键约束
PRAGMA foreign_keys = ON
```

外键约束确保关联数据的完整性——例如删除用户时会自动级联删除其帖子、通知等关联记录。

## OmaeSQL 模块

`server/db.js` 是一个完整的 SQLite 数据库工具层（内部称为 **OmaeSQL**），它封装了所有数据库操作，并可作为独立模块嵌入到任何 Node.js 项目中使用。

### 导出的 API 函数

| 函数 | 签名 | 用途 | 返回值 |
|------|------|------|--------|
| `getDb()` | `async () => db` | 初始化数据库连接 | SQL.js Database 实例 |
| `getOne(sql, params)` | `(string, any[]) => object \| null` | 查询单行记录 | 行对象或 null |
| `getAll(sql, params)` | `(string, any[]) => object[]` | 查询多行记录 | 行对象数组 |
| `run(sql, params)` | `(string, any[]) => { changes }` | 执行写操作 | 影响行数 |
| `insert(sql, params)` | `(string, any[]) => { lastInsertRowid, changes }` | 插入并返回自增 ID | 插入结果 |
| `transaction(fn)` | `(() => void) => boolean` | 事务包裹 | true 或抛出异常 |
| `getValue(sql, params)` | `(string, any[]) => any` | 获取单个标量值 | 第一行第一列的值 |
| `saveDb()` | `() => void` | 手动强制持久化 | 无 |

### 防抖持久化

为避免高并发场景下频繁磁盘 I/O，OmaeSQL 采用防抖写入策略：

```js
let saveTimer = null

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveDb, 300)  // 300ms 防抖
}
```

每当执行写操作（run/insert）后自动调用 `scheduleSave()`，多次写操作会在 300ms 窗口内合并为一次磁盘写入。若磁盘写入失败，不会抛出异常——数据库内存状态已更新，下一次写入会自动重试。

## 表结构

### 1. `users` — 用户账户

```sql
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT '["flexible"]',
  is_admin      INTEGER NOT NULL DEFAULT 0,
  uid           TEXT UNIQUE,
  userrank      INTEGER NOT NULL DEFAULT 0,
  avatar        TEXT NOT NULL DEFAULT '/Head.png',
  team_id       INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
)
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `username` | TEXT | 用户名，唯一约束 |
| `email` | TEXT | 邮箱，唯一约束 |
| `password_hash` | TEXT | bcrypt 哈希后的密码 |
| `role` | TEXT | JSON 数组，如 `["damage","support"]`，存储守望先锋职责偏好 |
| `is_admin` | INTEGER | 遗存字段，兼容旧数据，后续版本应使用 `userrank` 判断权限 |
| `uid` | TEXT | 唯一公开标识符，格式如 `u-20260101-0000` |
| `userrank` | INTEGER | 用户等级：0=访客、1=玩家、2=受信任、3=管理员 |
| `avatar` | TEXT | 头像 URL 路径 |
| `team_id` | INTEGER | 所属战队 ID（外键到 teams 表） |
| `created_at` | TEXT | 创建时间（本地时区） |
| `updated_at` | TEXT | 最后更新时间（本地时区） |

### 2. `posts` — 帖子与评论

```sql
CREATE TABLE posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  username   TEXT NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  likes      INTEGER NOT NULL DEFAULT 0,
  context    TEXT DEFAULT '#',
  parent_id  INTEGER,
  pid        TEXT UNIQUE,
  postrank   TEXT NOT NULL DEFAULT '69',
  mentions   TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE
)
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `user_id` | INTEGER | 发帖用户 ID（外键） |
| `username` | TEXT | 发帖用户名（冗余字段，避免 JOIN） |
| `title` | TEXT | 帖子标题（子帖为 "回复: 原标题..."） |
| `content` | TEXT | 帖子内容（HTML 格式） |
| `category` | TEXT | 分类：`general`（主帖）或 `comment`（子帖） |
| `likes` | INTEGER | 点赞计数 |
| `context` | TEXT | 嵌套路径，如 `#/p-xxx/u-yyy` |
| `parent_id` | INTEGER | 父帖 ID（NULL 表示主帖） |
| `pid` | TEXT | 公开帖子标识符，如 `p-20260105-a1b2` |
| `postrank` | TEXT | 帖子标记：FF=红帖、69=普通、78=绿帖、00=黑帖 |
| `mentions` | TEXT | JSON 数组，@提及的用户信息 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

**索引**：

```sql
CREATE INDEX idx_posts_user_id ON posts(user_id)
CREATE INDEX idx_posts_parent_id ON posts(parent_id)
CREATE INDEX idx_posts_category ON posts(category)
```

### 3. `teams` — 战队

```sql
CREATE TABLE teams (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  creator_id   INTEGER NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
)
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `name` | TEXT | 唯一名称（原始名+随机后缀，如 `银河守望-a7x3`） |
| `display_name` | TEXT | 展示名称（原始名，不带后缀） |
| `creator_id` | INTEGER | 创建者用户 ID（外键） |
| `created_at` | TEXT | 创建时间 |

### 4. `team_members` — 战队成员

```sql
CREATE TABLE team_members (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id  INTEGER NOT NULL,
  user_id  INTEGER NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**约束**：`UNIQUE(team_id, user_id)` 防止同一用户重复加入同一战队。

**索引**：

```sql
CREATE INDEX idx_team_members_team_id ON team_members(team_id)
CREATE INDEX idx_team_members_user_id ON team_members(user_id)
```

### 5. `notifications` — 通知

```sql
CREATE TABLE notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  type       TEXT NOT NULL,
  author     TEXT,
  root       TEXT,
  to_user    INTEGER NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0,
  title      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
)
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `type` | TEXT | 通知类型：`mention` / `comment` / `like` |
| `author` | TEXT | 触发者的 UID |
| `root` | TEXT | 关联帖子的 PID |
| `to_user` | INTEGER | 接收通知的用户 ID（外键） |
| `is_read` | INTEGER | 已读状态：0=未读、1=已读 |
| `title` | TEXT | 通知标题（可选） |
| `created_at` | TEXT | 创建时间 |

**索引**：

```sql
CREATE INDEX idx_notifications_to_user ON notifications(to_user)
```

### 6. `announcements` — 公告

```sql
CREATE TABLE announcements (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

### 7. `post_likes` — 点赞记录

```sql
CREATE TABLE post_likes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE(post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

**约束**：`UNIQUE(post_id, user_id)` 保证每人每帖只能点赞一次。

**索引**：

```sql
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id)
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id)
```

### 8. `ow_heroes` — 守望英雄数据缓存

```sql
CREATE TABLE ow_heroes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_key    TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  portrait    TEXT,
  role        TEXT NOT NULL,
  subrole     TEXT,
  data_json   TEXT NOT NULL,
  last_synced TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
)
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `hero_key` | TEXT | 英雄标识符，如 `genji` |
| `name` | TEXT | 英雄中文名称 |
| `portrait` | TEXT | 头像 URL |
| `role` | TEXT | 职责：`tank` / `damage` / `support` |
| `subrole` | TEXT | 细分职责（可选） |
| `data_json` | TEXT | 完整英雄详情 JSON |
| `last_synced` | TEXT | 最后同步时间 |

**索引**：

```sql
CREATE INDEX idx_ow_heroes_role ON ow_heroes(role)
CREATE UNIQUE INDEX idx_ow_heroes_key ON ow_heroes(hero_key)
```

## 增量迁移机制

为兼容不同版本的数据库结构，`initSchema()` 函数在创建表后通过 `PRAGMA table_info` 检查列存量，对缺失的列执行 `ALTER TABLE` 补充：

```js
// 检查 users 表是否缺少某些列
const userCols = db.exec("PRAGMA table_info('users')")
if (userCols.length > 0) {
  const colNames = userCols[0].values.map(v => v[1])
  if (!colNames.includes('uid')) {
    db.run("ALTER TABLE users ADD COLUMN uid TEXT UNIQUE")
  }
  if (!colNames.includes('userrank')) {
    db.run("ALTER TABLE users ADD COLUMN userrank INTEGER NOT NULL DEFAULT 0")
  }
}

// posts 表的增量迁移
const postCols = db.exec("PRAGMA table_info('posts')")
if (postCols.length > 0) {
  const colNames = postCols[0].values.map(v => v[1])
  if (!colNames.includes('pid')) {
    db.run("ALTER TABLE posts ADD COLUMN pid TEXT UNIQUE")
  }
  if (!colNames.includes('postrank')) {
    db.run("ALTER TABLE posts ADD COLUMN postrank TEXT NOT NULL DEFAULT '69'")
  }
}
```

这确保了从早期版本升级时，旧数据库不会因为缺少新列而崩溃。

## Admin 用户初始化

服务器首次启动时，如果数据库中不存在 Admin 用户，会自动创建：

```js
function ensureAdminUser() {
  const existing = getOne('SELECT id, password_hash, uid, userrank FROM users WHERE username = ?', ['Admin'])
  if (!existing) {
    // 创建 Admin 用户，密码来自 .env 的 ADMIN_PASSWORD
    // 默认密码为 88888888（会显示警告）
    const passwordHash = bcrypt.hashSync(adminPassword, 10)
    insert('INSERT INTO users (username, email, password_hash, is_admin, uid, userrank) VALUES (?, ?, ?, ?, ?, ?)',
      ['Admin', 'admin@omaekumiko.com', passwordHash, 1, uid, 3])
  } else {
    // 仅补充缺失字段，绝不覆盖密码
    // 确保 uid 和 userrank 不为空
  }
}
```

**安全策略**：Admin 已存在时，不会覆盖密码，确保前端修改的密码不会被后端重启重置。

## 标识符系统

项目使用公开的 UID 和 PID 标识符，避免暴露数据库自增主键。

### UID — 用户标识符

格式：`u-{YYYYMMDD}-{4位随机数}`

```
示例：u-20260101-0000
      │  ───┬───  ─┬─
      │     │       └─ 4 位随机数字
      │     └───────── 注册日期（本地时间）
      └─────────────── 前缀
```

生成算法：

```js
export function generateUid(getOne, dateStr) {
  const today = extractDateStr(dateStr)       // "20260607"
  for (let i = 0; i < 100; i++) {             // 最多尝试 100 次
    const rand = String(Math.floor(1000 + Math.random() * 9000))  // 1000-9999
    const uid = `u-${today}-${rand}`
    const exists = getOne('SELECT 1 FROM users WHERE uid = ?', [uid])
    if (!exists) return uid
  }
  throw new Error('UID生成失败：当日注册量过大（超过100次冲突）')
}
```

### PID — 帖子标识符

格式：`p-{YYYYMMDD}-{UID后4位}-{2位随机数}`

```
示例：p-20260607-2841-42
      │  ───┬───  ─┬─  ─┬
      │     │       │    └─ 2 位随机数字
      │     │       └────── UID 后 4 位
      │     └────────────── 发帖日期
      └──────────────────── 前缀
```

PID 嵌入了 UID 的部分信息，便于识别帖主的身份。生成算法与 UID 类似，最多尝试 100 次避免冲突。

### 查找兼容性

所有业务接口同时支持标识符字符串和数字 ID 两种查找方式：

```js
// 先按 uid 查，再按数字 id 查
let user = getOne('SELECT * FROM users WHERE uid = ?', [param])
if (!user) {
  const id = Number(param)
  if (!isNaN(id)) {
    user = getOne('SELECT * FROM users WHERE id = ?', [id])
  }
}
```

## 数据迁移脚本

项目早期依赖 Supabase 作为后端服务，后迁移至自建 Express + SQLite 架构。相关的迁移逻辑实现于：

- `server/migrate-v2.js` — 从 Supabase 数据格式迁移到 SQLite
- `tools/migrate-localstorage.js` — 从浏览器 localStorage 数据迁移到 SQLite

迁移入口为 `POST /api/migrate` 端点。

## 数据库文件位置

- 数据库文件：`server/data.db`
- 在 Express 启动时自动创建或加载
- 可通过 `saveDb()` 函数手动触发持久化
- 直接复制 `data.db` 文件即可完成备份