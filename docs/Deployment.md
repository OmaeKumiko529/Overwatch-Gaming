# 生产部署指南

本文档说明如何将项目部署到生产环境，包括前端构建、GitHub Pages 部署、后端部署、环境变量配置以及反向代理设置。

## 环境要求

- **Node.js**：20.19 或 22.12 以上版本
- **npm**：随 Node.js 附带
- **可选 — Nginx**：如果需要反向代理和 HTTPS 支持
- **可选 — Docker**：容器化部署

## 1. 前端构建

### 构建命令

```bash
# 在项目根目录执行
npm run build
```

构建产物将输出到项目根目录的 `dist/` 文件夹。

### 构建配置

Vite 的构建配置位于 `vite.config.js`：

```js
// 关键配置项
export default defineConfig({
  base: '/Overwatch-Gaming/',  // GitHub Pages 子路径部署
  build: {
    outDir: 'dist',
    // 其他构建选项...
  }
})
```

`base` 路径设为 `/Overwatch-Gaming/` 以适配 GitHub Pages 的子路径部署。如果你的部署环境在根路径或自定义域名下，需要修改此值。

### 构建产物结构

```
dist/
├── index.html           # 入口 HTML
├── assets/              # 打包后的 JS/CSS 资源
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
├── favicon.ico
└── public/              # 复制的静态资源
    ├── Head.png
    ├── Heading.png
    ├── ow_icon.svg
    └── ...
```

## 2. GitHub Pages 部署

### 手动部署

```bash
# 构建前端
npm run build

# 将 dist 目录内容推送到 gh-pages 分支
# 或使用 GitHub Actions 自动部署
```

### GitHub Actions 自动部署（推荐）

在 `.github/workflows/deploy.yml` 中添加：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

部署完成后，前端可通过以下地址访问：

```
https://fishmoies.github.io/Overwatch-Gaming/
```

### 注意事项

- GitHub Pages 仅托管静态文件，Express 后端需要独立部署在其他位置
- 后端 API 地址需要在前端代码中配置（可通过环境变量或构建时注入）
- Hash 模式路由（`#/`）无需服务端路由配置即可正常工作

## 3. 后端部署

### 3.1 基础部署

```bash
# 进入后端目录
cd server

# 安装生产依赖
npm install --production

# 配置环境变量
# 编辑 server/.env 文件

# 启动服务器
npm start
```

### 3.2 使用进程管理器（PM2）

推荐使用 PM2 保证后端服务的稳定运行：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd server
pm2 start index.js --name overwatch-api

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs overwatch-api
```

### 3.3 环境变量配置

生产环境需要配置以下环境变量，编辑 `server/.env`：

```bash
# 管理员密码（首次登录 Admin 账户使用）
ADMIN_PASSWORD=your_strong_password_here

# JWT 签名密钥（用于签发和验证认证令牌）
JWT_SECRET=your_random_secret_key_here

# 服务器端口
PORT=3001

# 允许跨域访问的来源（多个用逗号分隔）
CORS_ORIGINS=https://fishmoies.github.io,https://your-custom-domain.com
```

**安全注意事项**：
- `ADMIN_PASSWORD` 和 `JWT_SECRET` 使用强密码和长随机字符串
- 不要将 `.env` 文件提交到版本控制系统（已在 `.gitignore` 中排除）
- 定期轮换 `JWT_SECRET`

## 4. 反向代理配置

在生产环境中，通常将前端静态文件和 /api 反向代理配置在同一个 Nginx 实例下。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /var/www/overwatch-gaming/dist;
    index index.html;

    # Hash 路由：所有路径返回 index.html（如果需要）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到 Express 后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（如果未来需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Nginx + HTTPS（Let's Encrypt）

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... 其余配置同上 ...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 5. Docker 容器化部署（可选）

### Dockerfile

```dockerfile
# 后端 Dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装后端依赖
COPY server/package.json server/package-lock.json ./
RUN npm ci --production

# 复制后端代码
COPY server/ .

# 创建数据卷挂载点
VOLUME ["/app/data.db"]

# 暴露端口
EXPOSE 3001

# 启动
CMD ["node", "index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./server/data.db:/app/data.db
    environment:
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - PORT=3001
      - CORS_ORIGINS=${CORS_ORIGINS}
    restart: unless-stopped

  # 如果需要 Nginx 前置代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html
      - ./ssl:/etc/letsencrypt
    depends_on:
      - api
    restart: unless-stopped
```

## 6. 数据库备份

```bash
# 数据库文件位置
server/data.db

# 手动备份
cp server/data.db server/backup/$(date +%Y%m%d_%H%M%S).db

# 使用 cron 定时备份（每天凌晨 3 点）
0 3 * * * cp /path/to/server/data.db /path/to/backup/$(date +\%Y\%m\%d).db
```

## 7. 常见部署问题排查

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| 前端页面空白，控制台报 404 | base 路径配置错误 | 检查 `vite.config.js` 中的 `base` 是否匹配部署子路径 |
| API 请求返回 404 | 反向代理配置错误 | 检查 Nginx 的 `location /api/` 区块 |
| CORS 错误 | `CORS_ORIGINS` 配置不正确 | 确保前端域名在 `.env` 的 `CORS_ORIGINS` 中 |
| 后端端口被占用 | 端口冲突 | 修改 `PORT` 或终止占用进程 |
| `data.db` 权限错误 | 文件所有者不匹配 | `chown nodeuser:nodeuser server/data.db` |
| 401 持续出现 | JWT_SECRET 变更导致旧 token 失效 | 前端清除 localStorage 重新登录 |