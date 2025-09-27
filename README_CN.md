# CloudFlog - 现代博客平台

一个现代的、功能齐全的博客平台，采用 React Router v7、Cloudflare Workers、D1 数据库和 R2 存储构建。具有漂亮的 Tailwind CSS UI、全面的管理仪表板和边缘优先架构，以实现最佳性能。

## 🚀 功能

### 核心功能
- **现代博客平台**：完整的博客解决方案，包括文章、标签、评论和用户管理
- **管理仪表板**：功能齐全的管理界面，用于内容管理
- **身份验证**：GitHub OAuth 集成，支持基于会话的身份验证
- **内容管理**：富文本编辑器，支持 Markdown、图片上传和标签管理
- **评论系统**：嵌套评论，具有审核功能
- **搜索与过滤**：全文搜索、标签过滤和分页
- **浏览量跟踪**：文章浏览量计数和分析

### 技术特点
- **边缘计算**：由 Cloudflare Workers 提供支持，实现全球性能
- **数据库**：D1 SQLite 数据库，采用 Drizzle ORM
- **文件存储**：R2 对象存储，用于图片和资产
- **现代 UI**：Tailwind CSS v4 组件
- **TypeScript**：全面的 TypeScript 支持
- **SSR**：使用 React Router v7 进行服务器端渲染
- **响应式设计**：移动优先，完全响应式设计

## 🛠️ 技术栈

### 前端
- **React Router v7**：现代 React 框架，支持基于文件的路由
- **React 19**：最新 React，具有并发功能
- **TypeScript**：类型安全开发
- **Tailwind CSS v4**：实用优先的 CSS 框架
- **Lucide React**：漂亮的图标库

### 后端
- **Cloudflare Workers**：边缘计算平台
- **D1 数据库**：边缘 SQLite 数据库
- **R2 存储**：用于文件和图片的 S3 兼容对象存储
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
│   ├── blog/              # 博客特定组件
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
├── utils/                # 实用函数
│   ├── s3-client.ts      # R2/S3 客户端
│   └── view-tracking.ts  # 浏览量跟踪实用程序
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
- 基于 slug 的 URL
- 发布/草稿状态
- 精选文章
- 浏览量计数
- 封面图片

### 评论
- 嵌套评论系统
- 用户归属
- 软删除
- 审核功能

### 标签
- 标签管理系统
- 与文章的多对多关系
- 基于 slug 的 URL

### 文章浏览量
- 用户特定的浏览量跟踪
- 匿名浏览支持
- 分析数据

## 🚀 入门

### 先决条件

- **Node.js 18+**
- **npm 或 yarn**
- **Cloudflare 账户**（用于部署）
- **GitHub OAuth App**（用于身份验证）

### 安装

1. **克隆仓库**
   ```bash
   git clone <你的仓库地址>
   cd cloudflog
   ```

2. **安装依赖项**
   ```bash
   npm install
   ```

3. **设置环境变量**
   创建 `.dev.vars` 文件：
   ```bash
   # GitHub OAuth
   GITHUB_CLIENT_ID=你的_github_客户端_ID
   GITHUB_CLIENT_SECRET=你的_github_客户端_密钥
   
   # R2 存储（本地开发可选）
   R2_ACCESS_KEY_ID=你的_r2_访问_密钥_ID
   R2_SECRET_ACCESS_KEY=你的_r2_秘密_访问_密钥
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

## 🎨 功能概述

### 主页 (`/`)
- 精选文章轮播
- 最新文章网格
- 关于部分集成
- 响应式英雄部分

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
- **文章管理**：创建、编辑、发布、精选和删除文章
- **标签管理**：创建和管理标签
- **评论审核**：查看和审核评论
- **分析**：浏览量和文章统计
- **过滤**：按状态、标签和搜索过滤
- **批量操作**：发布/取消发布多篇文章

### 搜索 (`/search`)
- 文章全文搜索
- 实时搜索结果
- 分页支持

### 标签 (`/tags`, `/tag/:slug`)
- 带有文章计数的标签列表
- 按特定标签筛选的文章
- 基于标签的导航

### 身份验证 (`/auth/*`)
- GitHub OAuth 集成
- 会话管理
- 基于角色的访问控制

## 🔧 配置

### Cloudflare Workers 配置 (`wrangler.jsonc`)

```json
{
  "name": "blog",
  "compatibility_date": "2025-09-13",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",
  "vars": {
    "IMAGE_BASE_URL": "https://pub-472ed6155ec7452a9847ea0870702ffa.r2.dev",
    "R2_ENDPOINT": "https://534b483058263f37d29575599ffd483f.r2.cloudflarestorage.com",
    "R2_BUCKET_NAME": "blog"
  },
  "d1_databases": [
    {
      "binding": "D1",
      "database_name": "blog",
      "database_id": "你的数据库ID"
    }
  ]
}
```

### React Router 配置 (`react-router.config.ts`)

```typescript
export default {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
```

## 🚀 部署

### Cloudflare Workers 部署

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **创建 D1 数据库**
   ```bash
   wrangler d1 create blog
   ```

4. **创建 R2 存储桶**
   ```bash
   wrangler r2 bucket create blog
   ```

5. **更新 wrangler.jsonc**
   使用你的实际值更新数据库 ID 和存储桶配置。

6. **设置环境变量**
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put R2_ACCESS_KEY_ID
   wrangler secret put R2_SECRET_ACCESS_KEY
   ```

7. **部署数据库迁移**
   ```bash
   npm run db:migrate-remote
   ```

8. **部署应用程序**
   ```bash
   npm run deploy
   ```

## 🔐 身份验证设置

### GitHub OAuth 配置

1. **创建 GitHub OAuth App**
   - 转到 GitHub 设置 > 开发者设置 > OAuth Apps
   - 创建一个新的 OAuth App
   - 将授权回调 URL 设置为：`https://你的域名.com/auth/callback`

2. **配置环境变量**
   将你的 GitHub OAuth 凭据添加到 `.dev.vars` 用于本地开发，并作为秘密用于生产环境。

## 📸 图片管理

### R2 存储配置

图片存储在 Cloudflare R2 中，结构如下：

```
blog/
├── posts/
│   ├── covers/          # 文章封面图片
│   └── content/         # 内联内容图片
└── uploads/             # 通用上传
```

### 图片上传 API

应用程序包含一个位于 `/api/images` 的图片上传 API，它：
- 处理文件上传到 R2
- 生成唯一文件名
- 返回上传图片的公共 URL
- 支持各种图片格式

## 🎯 内容管理

### 创建文章

1. **通过管理仪表板**
   - 导航到 `/admin`
   - 点击“创建新文章”
   - 使用富文本编辑器界面
   - 添加标签、封面图片和元数据
   - 保存为草稿或立即发布

2. **文章功能**
   - Markdown 内容支持
   - 封面图片上传
   - 标签管理
   - SEO 友好的 slug
   - 精选文章指定
   - 草稿/发布状态

### 管理评论

- 在管理仪表板中查看所有评论
- 审核评论（批准/删除）
- 嵌套评论支持
- 经过身份验证的用户归属
- 匿名评论支持

### 标签管理

- 创建和管理标签
- 自动 slug 生成
- 基于标签的文章过滤
- 标签统计和文章计数

## 🔒 安全功能

- **身份验证**：安全的 GitHub OAuth 集成
- **授权**：基于角色的访问控制
- **会话管理**：安全的会话处理
- **输入验证**：全面的输入清理
- **SQL 注入防护**：使用 Drizzle ORM 的参数化查询
- **XSS 防护**：内容清理
- **CSRF 防护**：内置 CSRF 防护

## 📊 性能功能

- **边缘计算**：通过 Cloudflare Workers 进行全球分发
- **数据库**：边缘 SQLite，使用 D1
- **缓存**：自动边缘缓存
- **图片优化**：R2 存储与 CDN 交付
- **代码分割**：使用 Vite 自动代码分割
- **SSR**：服务器端渲染以实现最佳 SEO
- **懒加载**：基于组件和路由的懒加载

## 🧪 开发

### 类型安全

应用程序完全使用 TypeScript 构建：
- 使用 Drizzle 的数据库模式类型
- API 端点类型
- 组件属性类型
- 服务层类型

### 代码组织

- **服务**：业务逻辑分离到服务层
- **组件**：可重用的 UI 组件
- **工具**：共享实用函数
- **类型**：集中式类型定义

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
   git commit -m '添加惊人功能'
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
- [Drizzle ORM](https://orm.drizzle.team/) - 类型安全数据库工具包
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Lucide](https://lucide.dev/) - 漂亮的图标库

## 📞 支持

如有问题、疑问或贡献：

1. **文档**：查看此 README 和代码注释
2. **问题**：在 GitHub 上提出问题
3. **讨论**：使用 GitHub Discussions 提问
4. **联系**：通过联系页面联系

---

**用 ❤️ 和现代 Web 技术构建** 🚀