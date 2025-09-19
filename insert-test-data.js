import { getDBClient } from './app/db/index.ts';
import { posts, tags, postTags } from './app/db/schema.ts';
import { desc, sql } from 'drizzle-orm';

// Mock environment for D1 database
const mockEnv = {
  D1: process.env.DATABASE_URL || 'file:./local.db'
};

// Test data
const testPosts = [
  {
    title: "Getting Started with React Router",
    slug: "getting-started-react-router",
    content: "React Router is a powerful library for handling routing in React applications. In this comprehensive guide, we'll explore the fundamentals of React Router, from basic setup to advanced routing patterns. Learn how to create dynamic routes, handle navigation, and implement protected routes for your applications.",
    excerpt: "A comprehensive guide to React Router fundamentals and advanced patterns.",
    published: true,
    authorId: 1
  },
  {
    title: "Building Modern Web Applications with TypeScript",
    slug: "building-modern-web-apps-typescript",
    content: "TypeScript has revolutionized the way we write JavaScript applications. This article explores best practices for building scalable web applications with TypeScript, including type safety, interface design, and advanced TypeScript features that will make your code more maintainable and bug-free.",
    excerpt: "Best practices for building scalable web applications with TypeScript.",
    published: true,
    authorId: 1
  },
  {
    title: "The Art of Writing Clean Code",
    slug: "art-writing-clean-code",
    content: "Clean code is not just about making your code work; it's about making it readable, maintainable, and elegant. Learn the principles of clean code, including meaningful naming, function design, and code organization that will make your fellow developers thank you.",
    excerpt: "Principles of writing clean, maintainable, and elegant code.",
    published: false,
    authorId: 1
  },
  {
    title: "Understanding Database Design Patterns",
    slug: "understanding-database-design-patterns",
    content: "Database design is crucial for application performance and scalability. This guide covers essential database design patterns, normalization techniques, and when to use different types of relationships. Learn how to structure your data for optimal performance and maintainability.",
    excerpt: "Essential database design patterns and normalization techniques.",
    published: true,
    authorId: 1
  },
  {
    title: "Mastering CSS Grid and Flexbox",
    slug: "mastering-css-grid-flexbox",
    content: "Modern CSS layout techniques have transformed web design. This comprehensive tutorial covers CSS Grid and Flexbox in depth, with practical examples and use cases. Learn when to use each technique and how to combine them for responsive, beautiful layouts.",
    excerpt: "Comprehensive tutorial on CSS Grid and Flexbox layout techniques.",
    published: true,
    authorId: 1
  },
  {
    title: "Introduction to Cloud Computing",
    slug: "introduction-cloud-computing",
    content: "Cloud computing has become the foundation of modern software infrastructure. This beginner-friendly guide explains cloud concepts, service models (IaaS, PaaS, SaaS), and deployment strategies. Understand how to leverage cloud services for scalable applications.",
    excerpt: "Beginner-friendly guide to cloud computing concepts and service models.",
    published: false,
    authorId: 1
  },
  {
    title: "JavaScript Performance Optimization Techniques",
    slug: "javascript-performance-optimization",
    content: "Performance is crucial for user experience. This article explores advanced JavaScript optimization techniques, including memory management, event loop optimization, and rendering performance. Learn how to identify bottlenecks and implement solutions for faster applications.",
    excerpt: "Advanced JavaScript optimization techniques for better performance.",
    published: true,
    authorId: 1
  },
  {
    title: "Building RESTful APIs Best Practices",
    slug: "building-restful-apis-best-practices",
    content: "RESTful API design is both an art and a science. This guide covers REST principles, HTTP methods, status codes, and API versioning strategies. Learn how to design APIs that are intuitive, scalable, and maintainable for long-term success.",
    excerpt: "Best practices for designing scalable and maintainable RESTful APIs.",
    published: true,
    authorId: 1
  },
  {
    title: "Mobile-First Responsive Design",
    slug: "mobile-first-responsive-design",
    content: "With mobile devices dominating web traffic, mobile-first design is essential. This comprehensive guide teaches you how to create responsive designs that work beautifully on all devices, from smartphones to desktop computers.",
    excerpt: "Comprehensive guide to mobile-first responsive design principles.",
    published: false,
    authorId: 1
  },
  {
    title: "Version Control with Git Advanced Techniques",
    slug: "version-control-git-advanced",
    content: "Go beyond basic Git commands with advanced techniques for professional development. Learn about interactive rebasing, cherry-picking, bisecting, and complex merge strategies. Master Git workflows that will streamline your development process.",
    excerpt: "Advanced Git techniques for professional development workflows.",
    published: true,
    authorId: 1
  },
  {
    title: "Introduction to Machine Learning",
    slug: "introduction-machine-learning",
    content: "Machine learning is transforming how we build software. This beginner-friendly introduction covers fundamental ML concepts, common algorithms, and practical applications. Understand when and how to apply machine learning to solve real-world problems.",
    excerpt: "Beginner-friendly introduction to machine learning concepts and applications.",
    published: true,
    authorId: 1
  },
  {
    title: "Cybersecurity Fundamentals for Developers",
    slug: "cybersecurity-fundamentals-developers",
    content: "Security should be built into applications from the start. This essential guide covers cybersecurity fundamentals every developer should know, including common vulnerabilities, secure coding practices, and threat modeling basics.",
    excerpt: "Essential cybersecurity fundamentals every developer should understand.",
    published: false,
    authorId: 1
  },
  {
    title: "Microservices Architecture Deep Dive",
    slug: "microservices-architecture-deep-dive",
    content: "Microservices architecture offers scalability and flexibility but comes with complexity. This deep dive explores microservices patterns, inter-service communication, data management, and deployment strategies for successful implementations.",
    excerpt: "Deep dive into microservices patterns, communication, and deployment strategies.",
    published: true,
    authorId: 1
  },
  {
    title: "Progressive Web Apps Complete Guide",
    slug: "progressive-web-apps-complete-guide",
    content: "Progressive Web Apps combine the best of web and mobile apps. This complete guide covers PWA fundamentals, service workers, offline functionality, and app manifest configuration. Build web applications that feel like native apps.",
    excerpt: "Complete guide to building Progressive Web Apps with offline functionality.",
    published: true,
    authorId: 1
  },
  {
    title: "Docker and Containerization Essentials",
    slug: "docker-containerization-essentials",
    content: "Containerization has revolutionized application deployment. This essential guide covers Docker fundamentals, container orchestration, and best practices for creating efficient containers. Learn how to containerize applications for consistent deployments.",
    excerpt: "Essential guide to Docker fundamentals and containerization best practices.",
    published: false,
    authorId: 1
  }
];

const testTags = [
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "JavaScript", slug: "javascript" },
  { name: "CSS", slug: "css" },
  { name: "Database", slug: "database" },
  { name: "Cloud", slug: "cloud" },
  { name: "Performance", slug: "performance" },
  { name: "API", slug: "api" },
  { name: "Design", slug: "design" },
  { name: "Git", slug: "git" },
  { name: "Machine Learning", slug: "machine-learning" },
  { name: "Security", slug: "security" },
  { name: "Architecture", slug: "architecture" },
  { name: "PWA", slug: "pwa" },
  { name: "Docker", slug: "docker" }
];

async function insertTestData() {
  try {
    console.log('🚀 Starting test data insertion...');
    
    // Initialize database client
    const db = getDBClient(mockEnv.D1);
    
    // Check if we already have data
    const existingPosts = await db.select().from(posts).orderBy(desc(posts.id)).limit(1);
    if (existingPosts.length > 10) {
      console.log('📊 Database already has sufficient test data');
      console.log(`📈 Current post count: ${existingPosts.length}`);
      return;
    }
    
    console.log('📦 Inserting tags...');
    // Insert tags first
    for (const tag of testTags) {
      try {
        await db.insert(tags).values(tag);
        console.log(`✅ Added tag: ${tag.name}`);
      } catch (error) {
        // Tag might already exist, skip
        console.log(`ℹ️  Tag already exists: ${tag.name}`);
      }
    }
    
    console.log('📝 Inserting posts...');
    // Insert posts
    let insertedCount = 0;
    for (const post of testPosts) {
      try {
        const result = await db.insert(posts).values(post);
        const postId = result.meta.last_row_id;
        insertedCount++;
        console.log(`✅ Added post: ${post.title}`);
        
        // Add some random tags to posts
        const randomTags = testTags.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
        for (const tag of randomTags) {
          try {
            await db.insert(postTags).values({
              postId: postId,
              tagSlug: tag.slug
            });
            console.log(`   🏷️  Added tag ${tag.name} to post`);
          } catch (error) {
            console.log(`   ⚠️  Could not add tag relationship: ${tag.name}`);
          }
        }
        
      } catch (error) {
        console.log(`⚠️  Could not add post: ${post.title} - might already exist`);
      }
    }
    
    console.log(`\n🎉 Test data insertion complete!`);
    console.log(`📊 Inserted ${insertedCount} new posts`);
    
    // Show final count
    const finalPosts = await db.select({ count: sql`count(*)` }).from(posts);
    console.log(`📈 Total posts in database: ${finalPosts[0].count}`);
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
}

// Run the insertion
insertTestData();