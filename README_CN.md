# CloudFlog - Cloadflare + Blog = 免费的动态博客平台

[English](README.md)

一个简单、动态的博客平台，采用 React Router v7、Cloudflare Workers 和 D1 数据库构建。为那些想要免费托管自己的动态博客的用户提供简单的部署流程！

## 🚀 部署

### 先决条件

- **Node.js 18+**
- **Cloudflare 账户**（用于部署）

### 使用 Wrangler 部署

1. **克隆仓库**

   ```bash
   git clone https://github.com/jayliaoo/cloudflog.git
   cd cloudflog
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

4. **登录 Cloudflare**
   ```bash
   wrangler login
   ```
5. **创建 wrangler.jsonc**
   ```bash
   cp wrangler.example.jsonc wrangler.jsonc
   ```
   - 将 `<YOUR_WORKER_NAME>` 替换为您想要的 Worker 名称。
   - 将 `<YOUR_ACCOUNT_NAME>` 替换为您处理过的 Cloudflare 账户名称（小写，无特殊字符）。

6. **创建 D1 数据库**
   ```bash
   wrangler d1 create blog
   ```
   - 当被问及“您希望 Wrangler 代表您添加吗？”时，选择“否”。
   - 将输出中的 `database_name` 和 `database_id` 复制到 `wrangler.jsonc`。

7. **设置 GitHub OAuth App**
   - 访问 https://github.com/settings/applications/new
   - 将应用程序名称设置为“CloudFlog”
   - 将授权回调 URL 设置为 `https://<YOUR_WORKER_NAME>.<YOUR_ACCOUNT_NAME>.workers.dev/auth/callback`
   - 复制 Client ID 和 Client Secret 并将其放入 secrets 中：
     ```bash
     wrangler secret put GITHUB_CLIENT_ID
     ```
     ```bash
     wrangler secret put GITHUB_CLIENT_SECRET
     ```

8. **部署应用程序**
   ```bash
   npm run deploy
   ```
   - 当被问及“您的数据库在迁移期间可能无法处理请求，是否继续？”时，选择“是”。

## 🚀 入门指南

### 先决条件

- **Node.js 18+**
- **Cloudflare 账户**（用于部署）

### 安装

1. **克隆仓库**

   ```bash
   git clone https://github.com/jayliaoo/cloudflog.git
   cd cloudflog
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **安装 Wrangler CLI**

   ```bash
   npm install -g wrangler
   ```

4. **创建 wrangler.jsonc**

   ```bash
   cp wrangler.example.jsonc wrangler.jsonc
   ```

   - 将 `<YOUR_WORKER_NAME>` 替换为您想要的 Worker 名称。
   - 将 `<YOUR_ACCOUNT_NAME>` 替换为您处理过的 Cloudflare 账户名称（小写，无特殊字符）。如果您不部署到 Cloudflare Workers，此步骤是可选的。
   - 将 `<YOUR_D1_DATABASE_NAME>` 替换为您喜欢的任何名称。
   - database_id 在本地开发中不需要，但在部署到 Cloudflare 时是必需的。

5. **设置 GitHub OAuth App**
   - 访问 https://github.com/settings/applications/new
   - 将应用程序名称设置为"CloudFlogDev"
   - 将授权回调 URL 设置为 `http://localhost:5173/auth/callback`
   - 复制 Client ID 和 Client Secret 并创建 .dev.vars 文件：
     ```
     GITHUB_CLIENT_ID=your_github_client_id
     GITHUB_CLIENT_SECRET=your_github_client_secret
     DOMAIN=http://localhost:5173
     ```

6. **设置数据库**

   ```bash
   # 本地应用迁移
   npm run db:migrate
   ```

7. **启动开发服务器**

   ```bash
   npm run dev
   ```

8. **打开浏览器**
   导航到 `http://localhost:5173`

## 🚀 功能

### 核心功能
- **现代博客平台**：完整的博客解决方案，包括文章、标签、评论和用户管理
- **管理仪表板**：功能齐全的管理界面，用于内容管理
- **身份验证**：GitHub OAuth 集成，支持基于会话的身份验证
- **内容管理**：支持 Markdown 的富文本编辑器、图片上传和标签管理
- **评论系统**：支持审核功能的嵌套评论
- **搜索与过滤**：全文搜索、标签过滤和分页
- **浏览量跟踪**：文章浏览量统计和分析

### 技术特点
- **边缘计算**：由 Cloudflare Workers 提供支持，实现全球性能
- **数据库**：D1 SQLite 数据库，使用 Drizzle ORM
- **现代 UI**：Tailwind CSS v4 组件
- **TypeScript**：全面的 TypeScript 支持
- **SSR**：使用 React Router v7 进行服务器端渲染
- **响应式设计**：移动优先，完全响应式设计

## 🛠️ 技术栈

### 前端
- **React Router v7**：采用文件路由的现代 React 框架
- **React 19**：最新 React，具有并发特性
- **TypeScript**：类型安全开发
- **Tailwind CSS v4**：实用工具优先的 CSS 框架
- **Lucide React**：精美的图标库

### 后端
- **Cloudflare Workers**：边缘计算平台
- **D1 Database**：边缘 SQLite 数据库
- **Drizzle ORM**：类型安全的数据库工具包
- **GitHub OAuth**：身份验证提供商

### 构建与开发
- **Vite**：快速构建工具和开发服务器
- **Wrangler**：Cloudflare Workers CLI
- **Drizzle Kit**：数据库迁移和内省

## 📁 项目结构

```
app/
├── components/             # React 组件
│   ├── blog/              # 博客专用组件
│   │   ├── PostCard.tsx   # 文章预览卡片
│   │   └── ...
│   ├── layouts/           # 布局组件
│   │   ├── admin-layout.tsx
│   │   └── ...
│   └── Pagination.tsx     # 分页组件
├── db/                    # 数据库配置
│   ├── index.ts          # 数据库客户端设置
│   └── schema.ts         # Drizzle 模式定义
├── routes/               # React Router 路由
│   ├── _index.tsx        # 主页
│   ├── posts.tsx         # 博客列表
│   ├── posts.$slug.tsx   # 单篇文章
│   ├── admin.tsx         # 管理仪表板
│   ├── admin.*.tsx       # 管理子页面
│   ├── api.*.ts          # API 端点
│   ├── auth/             # 身份验证路由
│   ├── search.tsx        # 搜索功能
│   ├── tags.tsx          # 标签列表
│   └── tag.$tagSlug.tsx  # 按标签筛选的文章
├── services/             # 业务逻辑
│   └── posts.service.ts  # 文章服务层
├── utils/                # 实用工具函数
│   └── view-tracking.ts  # 浏览量跟踪工具
├── auth.server.ts        # 身份验证逻辑
├── app.css              # 全局样式
├── root.tsx             # 根布局
└── routes.ts            # 路由配置
```

## 🤝 贡献

欢迎贡献！请随时提交拉取请求。

## 📝 许可证

本项目采用 MIT 许可证 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Remix](https://remix.run/) - 现代 React 框架
- [Cloudflare](https://cloudflare.com/) - 边缘计算平台
- [Drizzle ORM](https://orm.drizzle.team/) - 类型安全的数据库工具包
- [Tailwind CSS](https://tailwindcss.com/) - 实用工具优先的 CSS 框架
- [Lucide](https://lucide.dev/) - 精美的图标库

## 📞 支持

如有问题或需要支持，请在 GitHub 上提出问题。

---

**用 ❤️ 和现代 Web 技术构建** 🚀