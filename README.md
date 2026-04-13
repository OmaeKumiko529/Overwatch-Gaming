# Game BBS Template Development For Vue.js 3
如您所见，这是一个用于学习vue和html的游戏论坛模板网站。  
在这个模板网站中，你可以学习很多关于如何构建vue网站以及如何解决开发问题的知识。  
As you can see, this is a Game BBS template website for studying of **vue** and html.  
In this template website, you can study a lot about how to build a vue website and how to solve dev problems.  

![License](https://img.shields.io/badge/License-MIT-blue?logo=github)
![Vue](https://img.shields.io/badge/Vue-3.x-green?logo=vue.js)
![Supabase](https://img.shields.io/badge/Backend-Supabase-blueviolet?logo=supabase)
![Status](https://img.shields.io/badge/Status-Development-orange)
![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4%20Love%20and%20Vue.js-white)

## License Notice
该项目的源代码根据MIT获得许可。但是请注意，``public/``目录包含从第三方版权财产中提取的示例资源材料，仅供演示之用。  
这些资源不受MIT许可证的保护。如果您打算移植、重新分发或商业使用此项目，您必须用自己的资产替换这些受版权保护的材料，以避免法律侵权。  
请注意，该项目的部分代码和素材包含AI生成内容，请仔细鉴别，并自行规避相关法律风险。  
详情请参阅[LICENSE](LICENSE)。   
This project's source code is licensed under the MIT License. However, please note that the public/ directories contain sample resource materials extracted from third-party copyrighted properties for demonstration purposes only.  
These resources are NOT covered by the MIT License. If you intend to port, redistribute, or use this project commercially, you MUST replace these copyrighted materials with your own assets to avoid legal infringement.  
see the [LICENSE](LICENSE) file for details.

## 项目文件结构 (Project File Structure)

```
Overwatch-Gaming/
├── .vscode/                # VS Code 配置文件
├── dist/                   # 编译后的静态资源（构建时生成）
├── node_modules/           # 项目依赖包
├── public/                 # 公共静态资源文件
│   ├── favicon.ico         # 网站图标
│   ├── *.png, *.webp       # 图片资源
│   ├── *.ttf               # 字体文件
│   └── Nsc/                # 设计素材目录
├── src/                    # 源代码目录
│   ├── components/         # 可复用组件
│   │   ├── NavBar.vue      # 导航栏组件
│   │   ├── RichTextEditor.vue # 富文本编辑器组件
│   │   └── SearchInput.vue # 搜索输入框组件
│   ├── pages/              # 页面级组件
│   │   ├── CreatePostPage.vue # 创建帖子页面
│   │   ├── HomePage.vue    # 首页
│   │   ├── JoinTeamPage.vue # 加入/搜索队伍页面
│   │   ├── LoginPage.vue   # 登录页面
│   │   ├── NotificationPage.vue # 通知页面
│   │   ├── PostDetailPage.vue # 帖子详情页面
│   │   ├── RegisterPage.vue # 注册页面
│   │   ├── SearchPage.vue  # 全局搜索页面
│   │   ├── UserPanel.vue   # 用户面板页面
│   │   └── HomePages/      # 首页相关子页面
│   │       └── SupportGallery.vue # 支援英雄展示页面
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由逻辑配置
│   ├── services/           # 业务逻辑服务层
│   │   ├── auth.js         # 用户认证服务
│   │   ├── avatarService.js # 头像系统服务
│   │   ├── post.js         # 帖子管理服务
│   │   ├── team.js         # 队伍管理服务
│   │   └── user.js         # 用户信息服务
│   ├── types/              # TypeScript 类型定义
│   │   └── fullpage.d.ts   # fullpage.js 类型定义
│   ├── utils/              # 工具函数
│   │   └── auth.js         # 认证相关工具函数
│   ├── App.vue             # 根组件
│   ├── main.js             # 应用入口文件
│   └── supabaseClient.js   # Supabase 客户端配置
├── .gitattributes          # Git 属性配置
├── .gitignore              # Git 忽略文件配置
├── index.html              # 应用入口 HTML
├── package.json            # 项目依赖和脚本配置
├── package-lock.json       # 依赖锁文件
├── vite.config.js          # Vite 构建配置
├── jsconfig.json           # JavaScript 配置
├── LICENSE                 # 开源许可证
└── README.md               # 项目说明文档
```

### 关键目录说明
- **`src/components/`**: 包含可复用的UI组件，遵循单一职责原则
- **`src/pages/`**: 每个文件对应一个完整的页面视图，通过路由访问
- **`src/services/`**: 封装所有业务逻辑和API调用，保持组件纯净
- **`src/router/`**: 管理应用的路由配置和导航逻辑
- **`public/`**: 存放静态资源，如图片、字体等，不会被构建工具处理

## 外部NPM组件与依赖 (External NPM Components & Dependencies)

以下是项目中使用的主要第三方NPM资源：

### 核心框架 (Core Frameworks)
- **Vue 3** - 渐进式JavaScript框架 [官方文档](https://vuejs.org/) | [GitHub](https://github.com/vuejs/core)
- **Vue Router 4** - Vue.js官方路由管理器 [官方文档](https://router.vuejs.org/) | [GitHub](https://github.com/vuejs/router)

### UI与交互组件 (UI & Interaction Components)
- **fullPage.js** - 创建全屏滚动网站 [官方网站](https://alvarotrigo.com/fullPage/) | [GitHub](https://github.com/alvarotrigo/fullpage.js)
- **TipTap** - 无头富文本编辑器框架
  - `@tiptap/starter-kit` - 核心编辑器功能
  - `@tiptap/vue-3` - Vue 3集成
  - `@tiptap/extension-mention` - @提及功能扩展
  - [官方网站](https://tiptap.dev/) | [GitHub](https://github.com/ueberdosis/tiptap)

### 后端与数据层 (Backend & Data Layer)
- **Supabase JS** - Supabase客户端库 [官方文档](https://supabase.com/docs/reference/javascript) | [GitHub](https://github.com/supabase/supabase-js)

### 开发工具 (Development Tools)
- **Vite** - 下一代前端构建工具 [官方文档](https://vitejs.dev/) | [GitHub](https://github.com/vitejs/vite)
- **Vue DevTools** - Vue.js开发者工具 [GitHub](https://github.com/vuejs/devtools)

## Setup & Installation

### 环境要求
- Node.js (建议 v18.0 或更高)
- npm 或 pnpm

### 安装步骤
1. 克隆项目：
```Bash
git clone https://github.com/FishMoies/Overwatch-Gaming.git
```

2.安装依赖：
```Bash
npm install
```

3.本地开发运行：
```Bash
npm run dev
```

4.生产环境构建：
```Bash
npm run build
```

### 配置环境变量
如果要使用自己的后端，请在 ``supabaseClient.js`` 填入你的 Supabase 信息：
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 项目特性 (Project Features)

### 🎮 游戏社区功能
- **用户系统**: 注册、登录、个人资料管理
- **帖子系统**: 创建、编辑、查看游戏相关帖子
- **富文本编辑器**: 支持@提及、格式化的内容创作
- **队伍系统**: 寻找队友、创建/加入游戏队伍
- **通知系统**: 实时接收社区互动通知

### 🎨 用户体验
- **全屏滚动**: 沉浸式的页面浏览体验
- **响应式设计**: 适配桌面和移动设备
- **现代化UI**: 基于Vue 3的组件化界面
- **实时交互**: 基于Supabase的实时数据更新

### 🔧 技术特性
- **模块化架构**: 清晰的代码分层和职责分离
- **类型安全**: TypeScript类型定义支持
- **现代化工具链**: Vite构建、热重载、开发工具集成
- **安全认证**: 基于Supabase的JWT认证和授权

### 📱 多平台支持
- **Web应用**: 完整的浏览器端SPA应用
- **PWA支持**: 可安装为渐进式Web应用
- **API驱动**: 前后端分离，易于扩展

## 技术实现要点 (Technical Highlights)

### 1. 模块化服务架构 (Modular Service Layer)
项目采用清晰的分层架构，将业务逻辑与UI组件分离：
- **服务层** (`src/services/`): 封装所有API调用和业务逻辑，包括用户认证、帖子管理、队伍操作等
- **组件层** (`src/components/`): 专注于UI渲染和用户交互
- **页面层** (`src/pages/`): 组织完整的页面视图
这种架构提高了代码的可维护性、可测试性和复用性。

### 2. 响应式与全屏滚动集成 (Fullpage Integration)
利用 `fullPage.js` 结合 Vue 3 的生命周期钩子，实现了沉浸式的社区展示效果：
- 处理路由切换时销毁与重新初始化 fullPage 实例的逻辑
- 支持垂直全屏滚动与水平幻灯片切换
- 与Vue响应式系统深度集成，确保状态同步

### 3. 基于 Supabase 的实时数据层
- **实时认证**: 利用 Supabase 的 `onAuthStateChange` 钩子，实现全局用户状态的自动同步
- **数据存储**: 使用 Supabase PostgreSQL 数据库存储用户、帖子、队伍等结构化数据
- **实时订阅**: 通过 Supabase 的实时功能实现帖子更新、通知推送等实时交互

### 4. 富文本编辑器集成 (TipTap Editor)
- 集成 TipTap 无头富文本编辑器，提供强大的内容编辑功能
- 支持 @提及功能，增强社区互动体验
- 自定义工具栏和编辑器样式，与项目设计语言保持一致
- 实现内容的安全存储和渲染，防止XSS攻击

### 5. 现代化构建工具链 (Vite)
- 使用 Vite 作为构建工具，提供极快的开发服务器启动和热模块替换
- 支持 Vue 3 单文件组件 (SFC) 的即时编译
- 生产环境构建优化，包括代码分割、Tree Shaking 和资源压缩
- 集成 Vue DevTools 插件，便于开发和调试

### 6. 响应式设计与移动端适配
- 采用移动优先的设计理念，确保在各种设备上的良好体验
- 使用 CSS Flexbox 和 Grid 实现灵活的布局系统
- 媒体查询和视口单位确保在不同屏幕尺寸下的可用性

### 7. 路由与状态管理
- Vue Router 4 实现客户端路由，支持动态路由和嵌套路由
- 利用 Vue 3 的组合式 API 管理组件状态，避免过度复杂的状态管理库
- 路由守卫保护需要认证的页面，确保安全性

## Contributing
欢迎提交 Issue 或 Pull Request 来完善这个学习模板
1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 一些感想 Something I want to say
>这不是一个正式的项目，所以可能不会在后续进行进一步维护。  

开发该项目的起因是我有一门关于HTML设计与制作的大学课程，授课的老师非常的喋喋不休。我的意思是，我和其他的组员已经完全了解了html的基本知识，但是老师仍然要求我们完成最基础的课后作业。我知道没做作业确实不对，但是我的能力已经超出了需要学习这门课程的学生的范畴，所以我开始提前制作期末作业，也就是这个网站，想要向老师证明我的能力。

我之前学习过vue，但是这是我第一个主要使用vue的前端项目，所以我也学习了许多，甚至接触到了很多后端才会学到的东西，比如 ``Supabase`` 和基础的SQL知识。从这个角度看，这门课程也是让我受益匪浅了。

除此以外，这也是我第一次尝试使用Git进行团队开发，所以你可能会看到会有很多分支尚未合并到主分支，这是正常的。 ``dev`` 分支是正在开发的功能，其中几个不同编写者编写了不同的部分，以后会逐步整合到 ``main`` 上； ``test`` 分支是未来可能加入的设计，例如将整个本地服务器都挪移到 ``Supabase`` 上。一般而言， ``test`` 分支总有或多或少的Bug，有的可能是我懒得修就丢进去了，有些可能是我还没有掌握这部分知识，所以暂时存在里面。

总之，这是一个还不完善的项目，但是你已经可以将 ``main`` 或 ``dev`` 用到微信小程序或是独立的前端页面之上，我保证这两个分支在编译环境不会出现任何问题。