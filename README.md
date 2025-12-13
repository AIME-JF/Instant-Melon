# 🍉 Instant Melon (即刻瓜田)

<<<<<<< HEAD
**一个基于 React + Express + PostgreSQL 的现代化匿名投稿与吃瓜平台。**
支持 AI 毒舌总结、实时评论互动、无限流加载，均已容器化，一键部署。
=======
一个基于 React + Vite + Express 的轻量级匿名投稿与吃瓜平台。
数据存储采用本地 JSON 文件，无需外部数据库，部署极其简单。
![Uploading 20251214012257_rec_.gif…]()
>>>>>>> e68428364317ec5eea4b867877011ab4f9db3ed7

![Instant Melon UI](https://via.placeholder.com/800x400?text=Instant+Melon+Preview)

## ✨ 核心特性

- **🎭 匿名投稿**：畅所欲言，系统自动生成唯一瓜号。
- **🤖 AI 毒舌总结**：集成 AI (GPT-4o-mini)，自动为每个瓜生成少于 30 字的“毒舌锐评”，并在后端增加随机性与反缓存机制，拒绝千篇一律。
- **💬 实时评论**：支持评论区实时轮询 (Polling)，不用刷新页面即可看到最新吐槽。
- **⚡️ 极致性能**：
    - 后端支持分页查询 (Limit/Offset)。
    - 前端实现无限滚动 (Infinite Scroll)，智能预加载。
- **🎨 沉浸体验**：
    - 粒子特效背景 (Particle Background)。
    - 丝滑的 UI 动画与卡片切换。
    - 明/暗模式一键切换。
- **� 全栈容器化**：前端、后端、数据库完全 Docker 化，部署仅需一行命令。

## 🛠️ 技术栈

- **前端**: React 18, Vite, Tailwind CSS, Lucide Icons
- **后端**: Node.js, Express, `pg` (PostgreSQL Client)
- **数据库**: PostgreSQL 15
- **运维**: Docker, Docker Compose

## 🚀 极速部署指南 (Docker)

本可以直接部署在任何支持 Docker 的 Linux 服务器上（如腾讯云、阿里云）。

### 1. 环境准备
确保服务器已安装 Docker 和 Docker Compose。

### 2. 获取代码
```bash
git clone <你的仓库地址>
cd Instant-Melon
```

### 3. 一键启动
```bash
docker compose up --build -d
```
> **注意**: 如果提示 `docker compose` 命令不存在，请尝试使用 `docker-compose`。

### 4. 访问服务
服务将在 **3000** 端口运行。请确保服务器防火墙（安全组）已放行 TCP:3000。
访问地址: `http://<服务器IP>:3000`

---

## 🔧 开发与调试

### 目录结构
- `/src`: 前端 React 代码
- `/server.js`: 后端 Express 入口
- `/postgres-data`: 数据库持久化文件 (自动生成, 勿删)
- `docker-compose.yml`: 容器编排配置
- `Dockerfile`: 多阶段构建定义

### 常用管理命令

**查看日志:**
```bash
docker compose logs -f --tail=50
```

**重启服务 (更新代码后):**
```bash
docker compose down
docker compose up --build -d
```

**重置数据库 (清空所有数据):**
```bash
docker compose exec db psql -U admin -d instant_melon -c "TRUNCATE TABLE stories, comments RESTART IDENTITY CASCADE;"
```

## 🔒 安全说明
- OpenAI API Key 已移至后端 (`server.js`)，前端通过代理访问，密钥不泄露。
- 数据库密码在 `docker-compose.yml` 中配置 (生产环境建议修改)。

---
*Built with ❤️ by Instant Melon Team*
