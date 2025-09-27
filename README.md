# CloudFlog - Modern Blog Platform

A modern, full-featured blog platform built with React Router v7, Cloudflare Workers, D1 Database, and R2 Storage. Features a beautiful UI with Tailwind CSS, comprehensive admin dashboard, and edge-first architecture for optimal performance.

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
- **File Storage**: R2 object storage for images and assets
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
- **R2 Storage**: Object storage for files and images
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
│   ├── s3-client.ts      # R2/S3 client
│   └── view-tracking.ts  # View tracking utilities
├── auth.server.ts        # Authentication logic
├── app.css              # Global styles
├── root.tsx             # Root layout
└── routes.ts            # Route configuration
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following entities:

### Users
- User management with GitHub OAuth
- Role-based access (owner/reader)
- Session management

### Posts
- Full blog post management
- Slug-based URLs
- Published/draft status
- Featured posts
- View counting
- Cover images

### Comments
- Nested comment system
- User attribution
- Soft deletion
- Moderation capabilities

### Tags
- Tag management system
- Many-to-many relationship with posts
- Slug-based URLs

### Post Views
- User-specific view tracking
- Anonymous view support
- Analytics data

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **npm or yarn**
- **Cloudflare account** (for deployment)
- **GitHub OAuth App** (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cloudflog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.dev.vars` file:
   ```bash
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # R2 Storage (optional for local development)
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret_key
   ```

4. **Set up database**
   ```bash
   # Generate database migrations
   npm run db:generate
   
   # Apply migrations locally
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:generate     # Generate database migrations
npm run db:migrate      # Apply migrations locally
npm run db:migrate-remote # Apply migrations to remote D1

# Type checking and deployment
npm run typecheck       # Run TypeScript type checking
npm run cf-typegen      # Generate Cloudflare types
npm run deploy          # Build and deploy to Cloudflare
```

## 🎨 Features Overview

### Homepage (`/`)
- Featured posts carousel
- Recent posts grid
- About section integration
- Responsive hero section

### Blog Listing (`/posts`)
- Paginated post listing
- Post cards with metadata
- Tag filtering
- Search functionality

### Individual Posts (`/posts/:slug`)
- Full markdown content rendering
- Comment system
- Related posts
- View tracking
- Social sharing ready

### Admin Dashboard (`/admin`)
- **Posts Management**: Create, edit, publish, feature, and delete posts
- **Tag Management**: Create and manage tags
- **Comment Moderation**: Review and moderate comments
- **Analytics**: View counts and post statistics
- **Filtering**: Filter by status, tags, and search
- **Bulk Operations**: Publish/unpublish multiple posts

### Search (`/search`)
- Full-text search across posts
- Real-time search results
- Pagination support

### Tags (`/tags`, `/tag/:slug`)
- Tag listing with post counts
- Posts filtered by specific tags
- Tag-based navigation

### Authentication (`/auth/*`)
- GitHub OAuth integration
- Session management
- Role-based access control

## 🔧 Configuration

### Cloudflare Workers Configuration (`wrangler.jsonc`)

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
      "database_id": "your-database-id"
    }
  ]
}
```

### React Router Configuration (`react-router.config.ts`)

```typescript
export default {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
```

## 🚀 Deployment

### Cloudflare Workers Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create D1 Database**
   ```bash
   wrangler d1 create blog
   ```

4. **Create R2 Bucket**
   ```bash
   wrangler r2 bucket create blog
   ```

5. **Update wrangler.jsonc**
   Update the database ID and bucket configuration with your actual values.

6. **Set up environment variables**
   ```bash
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   wrangler secret put R2_ACCESS_KEY_ID
   wrangler secret put R2_SECRET_ACCESS_KEY
   ```

7. **Deploy database migrations**
   ```bash
   npm run db:migrate-remote
   ```

8. **Deploy the application**
   ```bash
   npm run deploy
   ```

## 🔐 Authentication Setup

### GitHub OAuth Configuration

1. **Create GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `https://your-domain.com/auth/callback`

2. **Configure Environment Variables**
   Add your GitHub OAuth credentials to `.dev.vars` for local development and as secrets for production.

## 📸 Image Management

### R2 Storage Configuration

Images are stored in Cloudflare R2 with the following structure:

```
blog/
├── posts/
│   ├── covers/          # Post cover images
│   └── content/         # Inline content images
└── uploads/             # General uploads
```

### Image Upload API

The application includes an image upload API at `/api/images` that:
- Handles file uploads to R2
- Generates unique filenames
- Returns public URLs for uploaded images
- Supports various image formats

## 🎯 Content Management

### Creating Posts

1. **Via Admin Dashboard**
   - Navigate to `/admin`
   - Click "Create New Post"
   - Use the rich editor interface
   - Add tags, cover images, and metadata
   - Save as draft or publish immediately

2. **Post Features**
   - Markdown content support
   - Cover image uploads
   - Tag management
   - SEO-friendly slugs
   - Featured post designation
   - Draft/published status

### Managing Comments

- View all comments in admin dashboard
- Moderate comments (approve/delete)
- Nested comment support
- User attribution for authenticated users
- Anonymous comment support

### Tag Management

- Create and manage tags
- Automatic slug generation
- Tag-based post filtering
- Tag statistics and post counts

## 🔒 Security Features

- **Authentication**: Secure GitHub OAuth integration
- **Authorization**: Role-based access control
- **Session Management**: Secure session handling
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **XSS Protection**: Content sanitization
- **CSRF Protection**: Built-in CSRF protection

## 📊 Performance Features

- **Edge Computing**: Global distribution via Cloudflare Workers
- **Database**: SQLite at the edge with D1
- **Caching**: Automatic edge caching
- **Image Optimization**: R2 storage with CDN delivery
- **Code Splitting**: Automatic code splitting with Vite
- **SSR**: Server-side rendering for optimal SEO
- **Lazy Loading**: Component and route-based lazy loading

## 🧪 Development

### Type Safety

The application is built with TypeScript throughout:
- Database schema types with Drizzle
- API endpoint types
- Component prop types
- Service layer types

### Code Organization

- **Services**: Business logic separated into service layers
- **Components**: Reusable UI components
- **Utils**: Shared utility functions
- **Types**: Centralized type definitions

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
4. **Contact**: Reach out through the contact page

---

**Built with ❤️ using modern web technologies** 🚀
