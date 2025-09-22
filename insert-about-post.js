import { getDBClient } from './app/db/index.js';
import { posts } from './app/db/schema.js';
import { eq } from 'drizzle-orm';

// Mock environment for D1 database
const mockEnv = {
  D1: process.env.DATABASE_URL || 'file:./local.db'
};

async function insertAboutPost() {
  try {
    console.log('🚀 Starting About post insertion...');
    
    // Initialize database client
    const db = getDBClient(mockEnv.D1);
    
    // Check if we already have an about post
    const existingAboutPost = await db.select().from(posts).where(eq(posts.slug, 'about')).limit(1);
    if (existingAboutPost.length > 0) {
      console.log('📄 About post already exists');
      return;
    }
    
    console.log('📝 Inserting About post...');
    
    // Create the about post
    const aboutPost = {
      title: "About Me",
      slug: "about",
      content: `# About Me

Welcome to my corner of the internet where I share my thoughts on technology and development.

## Hello, I'm a Developer

I'm a passionate full-stack developer with expertise in modern web technologies. I love exploring new frameworks, building scalable applications, and sharing my knowledge with the community.

This blog is my platform to document my learning journey, share tutorials, and discuss the latest trends in web development. I believe in continuous learning and the power of sharing knowledge with others.

## Skills & Technologies

**Frontend:** React, TypeScript, Next.js, Tailwind CSS, Vue.js

**Backend:** Node.js, Python, Go, PostgreSQL, MongoDB

**Cloud & DevOps:** AWS, Cloudflare, Docker, Kubernetes, CI/CD

## Connect With Me

- GitHub: [yourusername](https://github.com/yourusername)
- Twitter: [yourusername](https://twitter.com/yourusername)
- LinkedIn: [yourusername](https://linkedin.com/in/yourusername)
- RSS Feed: [/rss.xml](/rss.xml)

## About This Blog

This blog is built with modern web technologies including React Router 7, Cloudflare Workers, and shadcn/ui components. It's designed to be fast, scalable, and provide a great reading experience.

**Tech Stack:** React Router 7, TypeScript, Tailwind CSS, Cloudflare Workers, D1 Database, R2 Storage`,
      excerpt: "Welcome to my corner of the internet where I share my thoughts on technology and development.",
      published: true,
      authorId: 1
    };
    
    const result = await db.insert(posts).values(aboutPost);
    console.log('✅ About post created successfully!');
    console.log('📄 Post details:');
    console.log(`   Title: ${aboutPost.title}`);
    console.log(`   Slug: ${aboutPost.slug}`);
    console.log(`   Published: ${aboutPost.published}`);
    
  } catch (error) {
    console.error('❌ Error inserting About post:', error);
    process.exit(1);
  }
}

// Run the script
insertAboutPost();