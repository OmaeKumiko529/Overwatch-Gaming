# Overwatch Gaming

这是一个以守望先锋为主题的社区论坛，也是我第一次将 Vue 3 用于完整的全栈项目。整个项目的前后端代码都托管在 [GitHub](https://github.com/FishMoies/Overwatch-Gaming) 上，使用 MIT 许可证开源。public 目录下包含的守望先锋相关美术资源（英雄职责图标）来自第三方的版权财产，仅供演示用途，不适用 MIT 许可证，商业使用或再分发需要用自有素材替换。

## 技术栈

前端基于 Vue 3 构建，搭配 Vue Router 4 做客户端路由、Pinia 管理全局状态。构建工具选用 Vite 7，生产构建时 base 路径设为 /Overwatch-Gaming/ 以适配 GitHub Pages 的子路径部署。开发环境下 Vite 将 /api 请求代理到 localhost:3001 的 Express 后端，前端与后端的通信统一通过 src/services/api.js 中封装的 fetch 客户端完成，该客户端自动从 localStorage 或 sessionStorage 读取 token 注入 Authorization 头部。

后端使用 Express 4 搭建 RESTful API，sql.js 实现 SQLite 数据库的读写与持久化，bcryptjs 做密码哈希，jsonwebtoken 签发 JWT 认证令牌，express-rate-limit 对敏感接口施加频率限制。项目早期依赖 Supabase 作为后端服务，经过一次数据迁移后改为自建的 Express + SQLite 架构，相关迁移逻辑实现在 server/migrate-v2.js 和 tools/migrate-localstorage.js 中。

## 项目文件结构

```
Overwatch-Gaming/
├── public/                    # 静态资源
│   ├── favicon.ico            # 网站图标
│   ├── 96px-职责：输出_图标.webp
│   ├── 96px-职责：支援_图标.webp
│   ├── 96px-职责：重装_图标.webp
│   ├── Head.png
│   ├── Heading.png
│   ├── ow_icon.svg
│   ├── SmileySans-Oblique.ttf
│   ├── MapleMono-CN-Regular.ttf
│   ├── 默认头图设计.psd
│   ├── 职责专题页面参考.psd
│   ├── migrate.html
│   └── Nsc/
├── src/                       # 前端源代码
│   ├── App.vue                # 根组件
│   ├── main.js                # 应用入口
│   ├── router/index.js        # 路由配置
│   ├── components/            # 可复用组件
│   │   ├── NavBar.vue
│   │   ├── SearchInput.vue
│   │   ├── RichTextEditor.vue
│   │   ├── UserrankBadge.vue
│   │   ├── MentionExtension.js
│   │   └── BilibiliNode.js
│   ├── pages/                 # 页面级组件
│   │   ├── HomePage.vue
│   │   ├── LoginPage.vue
│   │   ├── RegisterPage.vue
│   │   ├── UserPanel.vue
│   │   ├── BrowsePage.vue
│   │   ├── SearchPage.vue
│   │   ├── CreatePostPage.vue
│   │   ├── PostDetailPage.vue
│   │   ├── NotificationPage.vue
│   │   ├── AnnouncementPage.vue
│   │   ├── AdminPanel.vue
│   │   └── HomePages/
│   │       ├── HeroSection.vue
│   │       ├── RolesSection.vue
│   │       ├── SupportGallery.vue
│   │       └── BlankSection.vue
│   ├── UserPanel/             # 用户面板子组件
│   │   ├── ProfileHeader.vue
│   │   ├── OverviewTab.vue
│   │   ├── PostsTab.vue
│   │   ├── TeamTab.vue
│   │   ├── SettingsTab.vue
│   │   └── modals/ (change password, delete account, team CRUD, etc.)
│   ├── services/              # API 调用封装
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── post.js
│   │   ├── user.js
│   │   └── notification.js
│   ├── stores/                # Pinia 状态仓库
│   │   ├── auth.js
│   │   ├── post.js
│   │   ├── team.js
│   │   └── notification.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── encode.js
│   │   ├── mentionParser.js
│   │   └── contentFilter.js
│   ├── constants/rankMap.js
│   ├── composables/
│   └── types/fullpage.d.ts
├── server/                    # 后端源代码
│   ├── index.js               # Express 服务入口
│   ├── db.js                  # 数据库初始化和工具函数
│   ├── migrate-v2.js          # 数据迁移脚本
│   ├── package.json
│   ├── middleware/auth.js     # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── teams.js
│   │   ├── notifications.js
│   │   ├── announcements.js
│   │   ├── admin.js
│   │   └── migrate.js
│   └── utils/identifiers.js
├── tools/
│   └── migrate-localstorage.js
├── vite.config.js
├── index.html
├── package.json
├── jsconfig.json
└── test_auth.html
```

## API 接口

### 认证

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | /api/auth/register | 无 | 注册，每小时限3次 |
| POST | /api/auth/login | 无 | 登录，每分钟限5次 |
| GET | /api/auth/me | 必需 | 获取当前登录用户信息 |
| GET | /api/auth/users | 无 | 获取所有用户列表（邮箱脱敏） |
| GET | /api/auth/users/:uid | 无 | 获取单个用户，支持 UID 或数字 ID |
| PUT | /api/auth/update | 必需 | 更新 email/avatar/username |
| PUT | /api/auth/role | 必需 | 更新守望先锋职责偏好 |
| PUT | /api/auth/promote | 必需(Admin) | 提升目标用户等级 (0-3) |
| PUT | /api/auth/password | 必需 | 修改密码，需验证旧密码 |
| DELETE | /api/auth/delete | 必需 | 删除当前用户账号 |

### 帖子

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/posts | 可选 | 帖子列表，支持 search/category/postrank/popular/limit |
| GET | /api/posts/:pid | 可选 | 帖子详情，含子帖树 |
| GET | /api/posts/user/:uid | 无 | 查询指定用户的帖子 |
| GET | /api/posts/categories/list | 无 | 返回所有帖子分类 |
| POST | /api/posts | 必需 | 创建主帖，触发 mention 和 reply 通知 |
| POST | /api/posts/:pid/comment | 必需 | 评论帖子，检查父帖 postrank 权限 |
| POST | /api/posts/:pid/like | 必需 | 去重点赞 |
| PUT | /api/posts/:pid | 必需 | 更新帖子（仅帖主） |
| PUT | /api/posts/:pid/rank | 必需(Admin) | 设置帖子标记 (FF/69/78/00) |
| DELETE | /api/posts/:pid | 必需 | 删除帖子及所有子帖（仅帖主） |

### 队伍

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/teams | 无 | 获取所有战队 |
| GET | /api/teams/:id | 无 | 获取战队详情及成员 |
| POST | /api/teams | 必需 | 创建战队，自动追加随机后缀 |
| POST | /api/teams/join | 必需 | 加入战队 |
| POST | /api/teams/leave | 必需 | 退出战队，成员为0时自动删除 |

### 通知

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/notifications | 必需 | 获取最近100条通知 |
| GET | /api/notifications/unread-count | 必需 | 未读通知数量 |
| PUT | /api/notifications/:id/read | 必需 | 标记单条已读 |
| PUT | /api/notifications/read-all | 必需 | 标记全部已读 |
| POST | /api/notifications | 必需 | 创建通知，每分钟限10次 |

### 公告与管理

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/announcements | 无 | 获取所有公告 |
| GET | /api/admin/tables | 必需(Admin) | 列出所有数据库表及列结构 |
| GET | /api/admin/table/:tableName | 必需(Admin) | 分页查看表数据 |
| POST | /api/admin/table/:tableName | 必需(Admin) | 插入新行 |
| PUT | /api/admin/table/:tableName/:id | 必需(Admin) | 更新指定行 |
| DELETE | /api/admin/table/:tableName/:id | 必需(Admin) | 删除指定行 |
| POST | /api/admin/sql | 必需(Admin) | 执行只读 SELECT/PRAGMA 查询 |
| GET | /api/admin/stats | 必需(Admin) | 数据库统计概览 |

### 通用

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | /api/health | 无 | 服务健康检查 |
| POST | /api/migrate | 无 | 从 Supabase 格式导入数据 |

## 关键设计

**帖子系统的线程模型**。所有帖子和评论共用一张 posts 表，通过 parent_id 区分主帖和子帖，通过 context 字段存储嵌套路径。context 的格式类似于 `#/p-xxx/u-yyy/u-zzz`，查询时通过 LIKE 匹配即可一次性取出一条主帖下的所有子帖，不需要递归查询。每个帖子拥有唯一的 PID 标识符（格式如 `p-20260105-a1b2`），直接作为 URL 参数使用，避免暴露自增数字 ID。

**帖子标记与权限分级**。postrank 字段定义了四个等级：FF 为红帖，需要 userrank >= 1 才能评论；69 为普通帖，无额外限制；78 为绿帖；00 为黑帖，仅 userrank >= 3 的管理员可以查看内容。前端路由守卫和后端中间件双重校验确保了权限的严格执行。

**管理员通用 CRUD 面板**。GET /api/admin/tables 遍历 SQLite 系统表列出所有用户表及其列结构。GET /api/admin/table/:tableName 提供分页、排序和搜索能力，通过 PRAGMA table_info 动态获取列信息，password_hash 自动脱敏。POST、PUT、DELETE 对应同一端点的增删改，所有操作都限定在一个表名白名单（7张表）和自增主键排除机制之内。POST /api/admin/sql 支持执行只读的 SELECT 和 PRAGMA 查询，通过关键字黑名单和正则校验防止注入。

**标识符系统**。UID 和 PID 由 server/utils/identifiers.js 生成，格式为 `u-{日期}-{随机字符}` 和 `p-{日期}-{随机字符}`，不依赖数据库自增 ID。各业务接口都同时支持 UID 字符串和数字 ID 两种查找方式以兼容迁移数据。

**数据库兼容性**。users 和 posts 表的 initSchema 函数在创建表后通过 PRAGMA table_info 检查列的存量，对缺失的列执行 ALTER TABLE 补充。posts 表针对 user_id、parent_id、category 建立了索引以优化查询。team_members 和 post_likes 使用 UNIQUE 约束防止重复记录。

**通知与点赞的自动联动**。创建帖子或评论时，如果内容包含 @提及，后端会验证被提及用户的存在性并向其发送 mention 通知。评论创建时自动向原帖作者发送 reply 通知。点赞操作同样会通知帖主，但不会自我通知。

## Git 分支

项目在开发过程中第一次尝试使用 Git 进行团队协作，共维护了六个本地分支和四个远程分支。main 分支是稳定版本，dev 分支汇合了多位开发者的前端功能，fmy-dev 是我本人的开发分支（包含数据库访问面板和 B站视频嵌入功能），lyd-dev 和 lyd-dev-test 是另一位开发者的分支，test 分支存放实验性设计（例如将全部逻辑迁移到 Supabase 的尝试），该分支可能存在未完成的 Bug。main 和 dev 分支在编译环境中不会出现阻塞性错误。

## 安装与运行

环境要求 Node.js 20.19 或 22.12 以上版本，以及 npm。克隆仓库后按以下步骤操作：

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

在 server/.env 中配置 JWT_SECRET（必填）和 ADMIN_PASSWORD（可选，默认密码为 ChangeMeNow123!）。

```env
JWT_SECRET=你的密钥
ADMIN_PASSWORD=你的管理员密码
```

开发时需要同时启动两个终端：

```bash
# 终端 1：启动 Vite 前端开发服务器（默认 5173 端口）
npm run dev

# 终端 2：启动 Express API 服务器（默认 3001 端口）
cd server
npm run dev
```

生产构建：

```bash
npm run build
```

将生成的 dist 目录部署到任意静态文件服务器即可。后端通过 `npm start` 启动。

## 许可证

项目源代码根据 MIT 许可证授权。public/ 目录中包含从第三方版权财产中提取的示例资源材料（包括英雄职责图标、PSD 设计文件、背景视频等），仅供演示之用，不受 MIT 许可证保护。如果计划移植、重新分发或商业使用此项目，必须用自己的资产替换这些受版权保护的材料。部分代码和素材包含 AI 生成内容，请仔细鉴别并自行规避相关法律风险。详情请参阅根目录下的 LICENSE 文件。

## 一些感想

开发这个项目的起因是我有一门关于 HTML 设计与制作的大学课程，授课的老师喋喋不休地讲那些我已经完全掌握了的基础知识。我知道没做作业确实不对，但我的能力已经超出了这门课程的范畴，所以索性提前开始做期末作业，也就是这个网站，想向老师证明我已经不需要再听这些内容了。

我之前学过 Vue，但这是我第一个主要使用 Vue 的前端项目。在这个过程里我接触到了很多原本属于后端范畴的知识，比如 Supabase 和基础的 SQL。从这个角度看，这门课程也让我受益匪浅。这也是我第一次尝试用 Git 做团队开发，所以你可能看到有很多分支还没有合并到主分支。dev 分支是正在开发的功能，几个不同编写者写了不同的部分，以后会逐步整合到 main 上；test 分支是未来可能加入的设计，比如把整个本地服务器迁移到 Supabase 上。test 分支通常或多或少有 Bug，有的是我懒得修就丢进去了，有些是我还没掌握那部分知识，所以暂时搁置了。

总之这是一个还不完善的项目，但 main 和 dev 分支已经可以在编译环境下正常工作。你完全可以把这两个分支的代码用于微信小程序或者独立的前端页面之上。

另外提一下，我没有打包 Amiya.mp4 和 Amiya2.mp4 这两个背景视频文件到仓库里，因为它们太大了，GitHub 接收不了。如果你需要这两个视频，可以去该项目的 GitHub Pages 页面下载，或者用自己的视频替代。