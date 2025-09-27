# CloudFlog - 现代博客平台

[English](README.md)

一个现代的、功能齐全的博客平台，采用 React Router v7、Cloudflare Workers、D1 数据库和 R2 存储构建。具有 Tailwind CSS 带来的精美 UI、全面的管理仪表板和边缘优先架构，以实现最佳性能。

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
   - 将 `<YOUR_ACCOUNT_NAME>` 替换为您的 Cloudflare 账户名称。

6. **创建 D1 数据库**
   ```bash
   wrangler d1 create blog
   ```
   - 当被问及“您希望 Wrangler 代表您添加吗？”时，选择“否”。
   - 将输出中的 `database_name` 和 `database_id` 复制到 `wrangler.jsonc`。

7. **创建 R2 存储桶**
   ```bash
   wrangler r2 bucket create blog
   ```
   - 将 `<YOUR_R2_BUCKET_NAME>` 替换为输出中的 `bucket_name`。
   - 创建一个具有账户级别访问权限的 R2 API 令牌，选择“Admin Read & Write”：https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>/r2/api-tokens/create?type=account
   - 复制 Access Key ID 和 Secret Access Key 并将其放入 secrets 中：
     ```bash
     wrangler secret put R2_ACCESS_KEY_ID
     #
     ```
   - 当被问及“✔ 似乎没有名为“blog2”的 Worker。您想创建一个同名的新 Worker 并向其添加 secrets 吗？”时，选择“是”。
     ```bash
     wrangler secret put R2_SECRET_ACCESS_KEY
     ```
   - 启用公共开发 URL 并将其替换为 `<YOUR_R2_PUBLIC_DEVELOPMENT_URL>`：https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>/r2/default/buckets/<YOUR_R2_BUCKET_NAME>/settings
   - 添加 CORS 配置：
     ```json
     {
       "AllowedOrigins": [
         "*"
       ],
       "AllowedMethods": [
         "GET",
         "PUT",
         "POST"
       ],
       "AllowedHeaders": [
         "*"
       ]
     }
     ```

8. **设置 GitHub OAuth App**
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

9. **部署应用程序**
   ```bash
   npm run deploy
   ```
   - 当被问及“您的数据库在迁移期间可能无法处理请求，是否继续？”时，选择“是”。

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
- **文件存储**：R2 对象存储，用于图片和资产
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
- **R2 Storage**：用于文件和图片的对象存储
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
│   ├── s3-client.ts      # R2/S3 客户端
│   └── view-tracking.ts  # 浏览量跟踪工具
├── auth.server.ts        # 身份验证逻辑
├── app.css              # 全局样式
├── root.tsx             # 根布局
└── routes.ts            # 路由配置
```

## 🗄️ 数据库模式

应用程序使用包含以下实体的综合数据库模式：

### 用户
- 使用 GitHub OAuth 进行用户管理
- 基于角色的访问（所有者/读者）
- 会话管理

### 文章
- 完整的博客文章管理
- 基于 Slug 的 URL
- 发布/草稿状态
- 精选文章
- 浏览量统计
- 封面图片

### 评论
- 嵌套评论系统
- 用户归属
- 软删除
- 审核功能

### 标签
- 标签管理系统
- 与文章的多对多关系
- 基于 Slug 的 URL

### 文章浏览量
- 用户特定的浏览量跟踪
- 匿名浏览支持
- 分析数据

## 🚀 入门

### 安装

1. **克隆仓库**
   ```bash
   git clone <your-repo-url>
   cd cloudflog
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置环境变量**
   创建 `.dev.vars` 文件：
   ```bash
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # R2 存储（本地开发可选）
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret_key
   ```

4. **设置数据库**
   ```bash
   # 生成数据库迁移
   npm run db:generate
   
   # 本地应用迁移
   npm run db:migrate
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

6. **打开浏览器**
   导航到 `http://localhost:5173`

## 📝 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 构建生产版本
npm run preview         # 预览生产版本

# 数据库
npm run db:generate     # 生成数据库迁移
npm run db:migrate      # 本地应用迁移
npm run db:migrate-remote # 将迁移应用到远程 D1

# 类型检查和部署
npm run typecheck       # 运行 TypeScript 类型检查
npm run cf-typegen      # 生成 Cloudflare 类型
npm run deploy          # 构建并部署到 Cloudflare
```

## 🎨 功能概览

### 主页 (`/`)
- 精选文章轮播
- 最新文章网格
- 关于部分集成
- 响应式英雄区

### 博客列表 (`/posts`)
- 分页文章列表
- 带有元数据的文章卡片
- 标签过滤
- 搜索功能

### 单篇文章 (`/posts/:slug`)
- 完整的 Markdown 内容渲染
- 评论系统
- 相关文章
- 浏览量跟踪
- 支持社交分享

### 管理仪表板 (`/admin`)
- **文章管理**：创建、编辑、发布、置顶和删除文章
- **标签管理**：创建和管理标签
- **评论审核**：审查和审核评论
- **分析**：浏览量和文章统计
- **过滤**：按状态、标签和搜索进行过滤
- **批量操作**：发布/取消发布多篇文章

### 搜索 (`/search`)
- 文章全文搜索
- 实时搜索结果
- 支持分页

### 标签 (`/tags`, `/tag/:slug`)
- 带有文章计数的标签列表
- 按特定标签筛选的文章
- 基于标签的导航

### 身份验证 (`/auth/*`)
- GitHub OAuth 集成
- 会话管理
- 基于角色的访问控制

## 🤝 贡献

1. **Fork 仓库**
2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **进行更改**
4. **运行类型检查**
   ```bash
   npm run typecheck
   ```
5. **提交更改**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **打开拉取请求**

## 📝 许可证

本项目采用 MIT 许可证 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [React Router](https://reactrouter.com/) - 现代 React 框架
- [Cloudflare](https://cloudflare.com/) - 边缘计算平台
- [Drizzle ORM](https://orm.drizzle.team/) - 类型安全的数据库工具包
- [Tailwind CSS](https://tailwindcss.com/) - 实用工具优先的 CSS 框架
- [Lucide](https://lucide.dev/) - 精美的图标库

## 📞 支持

如有问题、疑问或贡献：

1. **文档**：查阅此 README 和代码注释
2. **问题**：在 GitHub 上提出问题
3. **讨论**：使用 GitHub Discussions 提问

---

**用 ❤️ 和现代 Web 技术构建** 🚀