# CloudFlog - Cloudflare + Blog = Free Dynamic Blog Platform

[简体中文](README_CN.md)

A simple, dynamic blog platform built with React Router v7, Cloudflare Workers, and D1 Database. Features an easy deployment process for those who want to host their own dynamic blog for free!

## 🚀 Deployment

### Prerequisites

- **Node.js 18+**
- **Cloudflare account** (for deployment)

### Deploy with Wrangler

1. **Clone the repository**

   ```bash
   git clone https://github.com/jayliaoo/cloudflog.git
   cd cloudflog
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Wrangler CLI**

   ```bash
   npm install -g wrangler
   ```

4. **Login to Cloudflare**
   ```bash
   wrangler login
   ```
5. **Create wrangler.jsonc**

   ```bash
   cp wrangler.example.jsonc wrangler.jsonc
   ```

   - Replace `<YOUR_WORKER_NAME>` with your desired worker name.
   - Replace `<YOUR_ACCOUNT_NAME>` with your processed Cloudflare account name (lowercase, no special characters).

6. **Create D1 Database**

   ```bash
   wrangler d1 create blog
   ```

   - Choose No when asked "Would you like Wrangler to add it on your behalf?"
   - Copy the database_name and database_id from the output to wrangler.jsonc

7. **Set up GitHub OAuth App**
   - Go to https://github.com/settings/applications/new
   - Set the Application name to "CloudFlog"
   - Set the Authorization callback URL to `https://<YOUR_WORKER_NAME>.<YOUR_ACCOUNT_NAME>.workers.dev/auth/callback`
   - Copy the Client ID and Client Secret and put them into secrets:
     ```bash
     wrangler secret put GITHUB_CLIENT_ID
     ```
     ```bash
     wrangler secret put GITHUB_CLIENT_SECRET
     ```

8. **Deploy the application**

   ```bash
   npm run deploy
   ```

   - Choose Yes when asked "Your database may not be available to serve requests during the migration, continue?"

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **Cloudflare account** (for deployment)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jayliaoo/cloudflog.git
   cd cloudflog
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Wrangler CLI**

   ```bash
   npm install -g wrangler
   ```

4. **Create wrangler.jsonc**

   ```bash
   cp wrangler.example.jsonc wrangler.jsonc
   ```

   - Replace `<YOUR_WORKER_NAME>` with your desired worker name.
   - Replace `<YOUR_ACCOUNT_NAME>` with your processed Cloudflare account name (lowercase, no special characters). This step is optional if you don't deploy to Cloudflare Workers.
   - Replace `<YOUR_D1_DATABASE_NAME>` with whatever name you like.
   - database_id is not needed for local development, but it's required for development to Cloudflare.

5. **Set up GitHub OAuth App**
   - Go to https://github.com/settings/applications/new
   - Set the Application name to "CloudFlogDev"
   - Set the Authorization callback URL to `http://localhost:5173/auth/callback`
   - Copy the Client ID and Client Secret and create a .dev.vars file:
     ```
     GITHUB_CLIENT_ID=your_github_client_id
     GITHUB_CLIENT_SECRET=your_github_client_secret
     DOMAIN=http://localhost:5173
     ```

6. **Set up database**

   ```bash
   # Apply migrations locally
   npm run db:migrate
   ```

7. **Start development server**

   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to `http://localhost:5173`

## 🚀 Features

### Core Functionality

- **Modern Blog Platform**: Complete blogging solution with posts, tags, comments, and user management
- **Admin Dashboard**: Full-featured admin interface for content management
- **Authentication**: GitHub OAuth integration with session-based authentication
- **Content Management**: Rich post editor with markdown support, image uploads, and tag management
- **Comment System**: Nested comments with moderation capabilities
- **Search & Filtering**: Full-text search, tag filtering, and pagination
- **View Tracking**: Post view counting and analytics

### Technical Features

- **Edge Computing**: Powered by Cloudflare Workers for global performance
- **Database**: D1 SQLite database with Drizzle ORM
- **Modern UI**: Tailwind CSS v4 components
- **TypeScript**: Full TypeScript support throughout
- **SSR**: Server-side rendering with React Router v7
- **Responsive Design**: Mobile-first, fully responsive design

## 🛠️ Tech Stack

### Frontend

- **React Router v7**: Modern React framework with file-based routing
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS v4**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library

### Backend

- **Cloudflare Workers**: Edge computing platform
- **D1 Database**: SQLite database at the edge
- **Drizzle ORM**: Type-safe database toolkit
- **GitHub OAuth**: Authentication provider

### Build & Development

- **Vite**: Fast build tool and dev server
- **Wrangler**: Cloudflare Workers CLI
- **Drizzle Kit**: Database migrations and introspection

## 📁 Project Structure

```
app/
├── components/             # React components
│   ├── blog/              # Blog-specific components
│   │   ├── PostCard.tsx   # Post preview card
│   │   └── ...
│   ├── layouts/           # Layout components
│   │   ├── admin-layout.tsx
│   │   └── ...
│   └── Pagination.tsx     # Pagination component
├── db/                    # Database configuration
│   ├── index.ts          # Database client setup
│   └── schema.ts         # Drizzle schema definitions
├── routes/               # React Router routes
│   ├── _index.tsx        # Homepage
│   ├── posts.tsx         # Blog listing
│   ├── posts.$slug.tsx   # Individual post
│   ├── admin.tsx         # Admin dashboard
│   ├── admin.*.tsx       # Admin sub-pages
│   ├── api.*.ts          # API endpoints
│   ├── auth/             # Authentication routes
│   ├── search.tsx        # Search functionality
│   ├── tags.tsx          # Tag listing
│   └── tag.$tagSlug.tsx  # Posts by tag
├── services/             # Business logic
│   └── posts.service.ts  # Posts service layer
├── utils/                # Utility functions
│   └── view-tracking.ts  # View tracking utilities
├── auth.server.ts        # Authentication logic
├── app.css              # Global styles
├── root.tsx             # Root layout
└── routes.ts            # Route configuration
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run type checking**
   ```bash
   npm run typecheck
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Router](https://reactrouter.com/) - Modern React framework
- [Cloudflare](https://cloudflare.com/) - Edge computing platform
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icon library

## 📞 Support

For questions, issues, or contributions:

1. **Documentation**: Check this README and code comments
2. **Issues**: Open an issue on GitHub
3. **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ using modern web technologies** 🚀
