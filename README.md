# Instant Melon (即刻瓜田)

一个基于 React + Vite + Express 的轻量级匿名投稿与吃瓜平台。
数据存储采用本地 JSON 文件，无需外部数据库，部署极其简单。
![Uploading 20251214012257_rec_.gif…]()

## 功能特性

- 🍉 **匿名投稿**：用户可以发布故事，支持 AI 自动总结（需配置 API Key）。
- 💬 **评论互动**：支持对故事进行评论。
- ❤️ **点赞**：双击卡片或点击爱心点赞。
- 🌓 **主题切换**：支持明暗模式。
- 📱 **响应式设计**：完美适配移动端与桌面端。

## 部署指南 (腾讯云/阿里云等 Linux 服务器)

### 1. 环境准备
确保服务器已安装 Node.js (推荐 v18+)。
```bash
# 安装 nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
node -v
```

### 2. 获取代码
```bash
git clone <你的GitHub仓库地址>
cd Instant-Melon
```

### 3. 安装依赖与构建
```bash
# 安装依赖
npm install

# 构建前端静态资源
npm run build
```

### 4. 启动服务

**临时启动 (测试用):**
```bash
npm start
```
服务将在 `http://localhost:3000` 运行。

**生产环境后台启动 (推荐):**
使用 PM2 管理进程，保证服务崩溃自动重启。
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "instant-melon"

# 查看状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

### 5. 配置访问
确保服务器防火墙（安全组）已开放 3000 端口（或你自定义的端口）。
现在你可以通过 `http://服务器IP:3000` 访问了！

## 配置说明

- **端口**: 默认 `3000`。可通过环境变量 `PORT` 修改。
- **数据**: 数据存储在 `data.json` 文件中。备份该文件即可备份所有数据。
- **AI 接口**: 默认代理到外部 API，如需修改 key 或接口地址，请修改 `server.js` 中的 `/api/ai` 路由部分。

## 本地开发

```bash
npm install
npm run dev
```
前端运行在 `http://localhost:5173`，后端 API 需要单独启动 `node server.js` (注意端口跨域配置，开发环境建议使用 Vite 代理)。

由于本项目已针对生产环境优化，开发时建议直接运行 `npm run build && npm start` 查看最终效果，或者手动配置 Vite 代理指向 Express 服务。
