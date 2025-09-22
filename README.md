# Modern Blog with React Router v7 & Cloudflare Workers

A modern, fast, and scalable blog built with React Router v7, Cloudflare Workers, D1 Database, and R2 Storage. Features a beautiful UI with Tailwind CSS and shadcn/ui components.

## 🚀 Features

- **Modern Framework**: Built with React Router v7
- **Edge Computing**: Powered by Cloudflare Workers
- **Database**: D1 SQLite database at the edge
- **Storage**: R2 object storage for images and assets
- **Beautiful UI**: Tailwind CSS with shadcn/ui components
- **Responsive Design**: Mobile-first, fully responsive
- **Dark Mode**: Automatic dark mode support
- **TypeScript**: Full TypeScript support
- **Fast Performance**: Optimized for speed and SEO

## 🛠️ Tech Stack

- **Frontend**: React Router v7, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Cloudflare Workers, D1 Database, R2 Storage
- **Build Tool**: Vite
- **Icons**: Lucide React

## 📁 Project Structure

```
app/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── blog/           # Blog-specific components
│   └── layouts/        # Layout components
├── routes/             # React Router routes
│   ├── _index.tsx      # Homepage
│   ├── blog.tsx        # Blog listing
│   ├── blog.$slug.tsx  # Blog post detail
│   ├── about.tsx       # About page
│   ├── contact.tsx     # Contact page
│   ├── admin.tsx       # Admin dashboard
│   └── api.posts.ts    # API endpoint
├── lib/                # Utility functions
├── app.css             # Global styles
└── root.tsx            # Root layout
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blog3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Pages & Features

### Homepage (`/`)
- Hero section with featured posts
- Recent blog posts grid
- Newsletter signup
- Social links

### Blog Listing (`/blog`)
- All blog posts with pagination
- Tag filtering
- Search functionality
- Post excerpts and metadata

### Blog Post (`/posts/:slug`)
- Full post content with markdown support
- Author information
- Related posts
- Social sharing
- Comments (ready for integration)

### About Page (`/about`)
- Author bio and photo
- Skills and technologies
- Contact information
- Social media links

### Contact Page (`/contact`)
- Contact form
- Location and contact details
- Social media links
- Response time information

### Admin Dashboard (`/admin`)
- Post management
- Analytics overview
- Quick stats
- Content editor (ready for integration)

## 🎨 Styling

The blog uses Tailwind CSS with a custom theme configuration:

- **Color System**: CSS custom properties for light/dark modes
- **Typography**: System font stack with fallbacks
- **Components**: shadcn/ui components with custom variants
- **Responsive**: Mobile-first approach with breakpoints

### Theme Colors

```css
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--card: 0 0% 100%;
--card-foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
/* ... and more */
```

## 🗄️ Database Schema

The blog is ready for D1 database integration with the following schema:

```sql
-- Posts table
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id INTEGER,
  published BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Post tags junction table
CREATE TABLE post_tags (
  post_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (post_id, tag_id)
);
```

## 📸 Image Storage

Images are stored in Cloudflare R2 with the following structure:

```
blog-images/
├── posts/
│   ├── featured/
│   └── content/
├── authors/
└── assets/
```

## 🔧 Configuration

### Environment Variables

Create a `.dev.vars` file for local development:

```
VALUE_FROM_CLOUDFLARE="Hello from Cloudflare"
```

### Wrangler Configuration

The `wrangler.json` file contains Cloudflare Workers configuration:

```json
{
  "name": "blog3",
  "compatibility_date": "2024-07-29",
  "assets": {
    "directory": "./build/client"
  }
}
```

## 🚀 Deployment

### Cloudflare Workers

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
   wrangler d1 create blog-db
   ```

4. **Create R2 Bucket**
   ```bash
   wrangler r2 bucket create blog-images
   ```

5. **Update wrangler.json**
   Add your database and bucket bindings:
   ```json
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "blog-db",
         "database_id": "your-database-id"
       }
     ],
     "r2_buckets": [
       {
         "binding": "BLOG_IMAGES",
         "bucket_name": "blog-images"
       }
     ]
   }
   ```

6. **Deploy**
   ```bash
   npm run deploy
   ```

## 🔧 Customization

### Adding New Posts

1. **Via Admin Dashboard**: Navigate to `/admin` and use the post editor
2. **Via API**: Send POST requests to `/api/posts`
3. **Direct Database**: Insert into D1 database directly

### Modifying Design

1. **Colors**: Update the CSS custom properties in `app.css`
2. **Components**: Modify shadcn/ui components in `app/components/ui/`
3. **Layout**: Update the blog layout in `app/components/layouts/blog-layout.tsx`
4. **Pages**: Customize individual pages in `app/routes/`

### Adding Features

1. **Comments**: Integrate with services like Disqus or create custom solution
2. **Search**: Implement full-text search with Cloudflare Workers
3. **Newsletter**: Add email subscription with services like Mailchimp
4. **Analytics**: Integrate with Google Analytics or Plausible

## 📝 Content Management

### Writing Posts

Posts support markdown formatting and include:

- **Frontmatter**: Title, date, tags, excerpt, cover image
- **Content**: Full markdown content with syntax highlighting
- **Images**: Automatic optimization and R2 storage
- **SEO**: Meta tags, Open Graph, and structured data

### Media Management

- Upload images via admin dashboard
- Automatic optimization and responsive sizing
- R2 storage with CDN delivery
- Alt text and accessibility support

## 🔒 Security

- Content Security Policy headers
- XSS protection
- SQL injection prevention
- Rate limiting on API endpoints
- Secure headers configuration

## 📊 Performance

- Edge caching with Cloudflare
- Image optimization and lazy loading
- Code splitting and lazy loading
- Critical CSS inlining
- Service worker for offline support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Router](https://reactrouter.com/) for the amazing framework
- [Cloudflare](https://cloudflare.com/) for edge computing platform
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Lucide](https://lucide.dev/) for beautiful icons

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](https://github.com/yourusername/blog3/wiki)
2. Open an [issue](https://github.com/yourusername/blog3/issues)
3. Contact me through the [contact page](/contact)

---

**Happy blogging!** 🎉
