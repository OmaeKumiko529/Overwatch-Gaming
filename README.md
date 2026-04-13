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

## File Structure
以下是文件结构  
Overwatch-Gaming/  
├── .vscode/                # IDE 配置文件  
├── dist/                   # 编译后的静态资源  
├── node_modules/           # 项目依赖  
├── public/                 # 公共资源文件  
├── src/                    # 源码目录  
│   ├── component/          # 首页组件  
│   │   ├── NavBar.vue      # 导航栏组件  
│   │   └── SearchInput.vue   # 搜索输入框组件  
│   ├── pages/              # 页面级组件  
│   │   ├── CreatePostPage.vue # 发帖页面  
│   │   ├── HomePage.vue       # 首页  
│   │   ├── JoinTeamPage.vue   # 组队/搜索队伍页面  
│   │   ├── LoginPage.vue      # 登录页面  
│   │   ├── PostDetailPage.vue # 帖子详情模版页  
│   │   ├── RegisterPage.vue   # 注册页面  
│   │   ├── SearchPage.vue     # 全局搜索页面  
│   │   └── UserPanel.vue      # 用户详情与面板  
│   ├── router/  
│   │   └── index.js        # 路由逻辑配置  
│   ├── services/           # 业务逻辑与接口调用  
│   │   ├── auth.js         # 用户认证服务  
│   │   ├── avatarService.js # 头像系统服务  
│   │   ├── post.js         # 帖子信息服务  
│   │   ├── team.js         # 队伍相关服务  
│   │   └── user.js         # 用户信息服务  
│   ├── types/  
│   │   └── fullpage.d.ts   # fullpage.js 类型定义/配置  
│   ├── utils/  
│   │   └── auth.js         # 旧版存储系统工具  
│   ├── App.vue             # 根组件  
│   ├── main.js             # 项目入口文件  
│   └── supabaseClient.js   # Supabase 客户端配置文件  
├── .gitattributes          # Git 属性配置  
├── .gitignore              # Git 忽略文件  
├── index.html              # 入口 HTML  
└── readme.md               # 项目自述文件   

## External NPM Components Used
以下是项目中引用的，由他人分发或制作的额外的NPM资源。  
*** fullPage.js *** [Official Website](https://alvarotrigo.com/fullPage/) | [In GitHub](https://github.com/alvarotrigo/fullpage.js)  
*** Vue Router *** [Official Website](https://router.vuejs.org/) | [In GitHub](https://github.com/vuejs/router)

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

## 技术实现要点 (Technical Highlights)

### 1. 模块化服务架构 (Modular Service Layer)
项目将 API 调用与组件逻辑分离。所有与本地服务器的交互均封装在 `src/services/` 下。  
组件只负责 UI 渲染，逻辑更易于维护和测试。  

### 2. 响应式与全屏滚动集成 (Fullpage Integration)
利用 `fullPage.js` 结合 Vue 3 的生命周期钩子，实现了沉浸式的社区展示效果。  
处理路由切换时销毁与重新初始化 fullPage 实例的逻辑。

### 3. 基于 Supabase 的实时认证
利用 Supabase 的 `onAuthStateChange` 钩子，实现了全局用户状态的自动同步。

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