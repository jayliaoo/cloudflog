// Test data for blog posts
const testPosts = [
  {
    title: "Getting Started with React Router",
    slug: "getting-started-react-router",
    content: "React Router is a powerful library for handling routing in React applications. In this comprehensive guide, we'll explore the fundamentals of React Router, from basic setup to advanced routing patterns. Learn how to create dynamic routes, handle navigation, and implement protected routes for your applications.",
    excerpt: "A comprehensive guide to React Router fundamentals and advanced patterns.",
    tags: ["React", "JavaScript", "Routing"],
    published: true
  },
  {
    title: "Building Modern Web Applications with TypeScript",
    slug: "building-modern-web-apps-typescript",
    content: "TypeScript has revolutionized the way we write JavaScript applications. This article explores best practices for building scalable web applications with TypeScript, including type safety, interface design, and advanced TypeScript features that will make your code more maintainable and bug-free.",
    excerpt: "Best practices for building scalable web applications with TypeScript.",
    tags: ["TypeScript", "JavaScript", "Web Development"],
    published: true
  },
  {
    title: "The Art of Writing Clean Code",
    slug: "art-writing-clean-code",
    content: "Clean code is not just about making your code work; it's about making it readable, maintainable, and elegant. Learn the principles of clean code, including meaningful naming, function design, and code organization that will make your fellow developers thank you.",
    excerpt: "Principles of writing clean, maintainable, and elegant code.",
    tags: ["Best Practices", "Code Quality"],
    published: false
  },
  {
    title: "Understanding Database Design Patterns",
    slug: "understanding-database-design-patterns",
    content: "Database design is crucial for application performance and scalability. This guide covers essential database design patterns, normalization techniques, and when to use different types of relationships. Learn how to structure your data for optimal performance and maintainability.",
    excerpt: "Essential database design patterns and normalization techniques.",
    tags: ["Database", "Design Patterns", "SQL"],
    published: true
  },
  {
    title: "Mastering CSS Grid and Flexbox",
    slug: "mastering-css-grid-flexbox",
    content: "Modern CSS layout techniques have transformed web design. This comprehensive tutorial covers CSS Grid and Flexbox in depth, with practical examples and use cases. Learn when to use each technique and how to combine them for responsive, beautiful layouts.",
    excerpt: "Comprehensive tutorial on CSS Grid and Flexbox layout techniques.",
    tags: ["CSS", "Web Design", "Layout"],
    published: true
  },
  {
    title: "Introduction to Cloud Computing",
    slug: "introduction-cloud-computing",
    content: "Cloud computing has become the foundation of modern software infrastructure. This beginner-friendly guide explains cloud concepts, service models (IaaS, PaaS, SaaS), and deployment strategies. Understand how to leverage cloud services for scalable applications.",
    excerpt: "Beginner-friendly guide to cloud computing concepts and service models.",
    tags: ["Cloud", "DevOps", "Infrastructure"],
    published: false
  },
  {
    title: "JavaScript Performance Optimization Techniques",
    slug: "javascript-performance-optimization",
    content: "Performance is crucial for user experience. This article explores advanced JavaScript optimization techniques, including memory management, event loop optimization, and rendering performance. Learn how to identify bottlenecks and implement solutions for faster applications.",
    excerpt: "Advanced JavaScript optimization techniques for better performance.",
    tags: ["JavaScript", "Performance", "Optimization"],
    published: true
  },
  {
    title: "Building RESTful APIs Best Practices",
    slug: "building-restful-apis-best-practices",
    content: "RESTful API design is both an art and a science. This guide covers REST principles, HTTP methods, status codes, and API versioning strategies. Learn how to design APIs that are intuitive, scalable, and maintainable for long-term success.",
    excerpt: "Best practices for designing scalable and maintainable RESTful APIs.",
    tags: ["API", "REST", "Backend"],
    published: true
  },
  {
    title: "Mobile-First Responsive Design",
    slug: "mobile-first-responsive-design",
    content: "With mobile devices dominating web traffic, mobile-first design is essential. This comprehensive guide teaches you how to create responsive designs that work beautifully on all devices, from smartphones to desktop computers.",
    excerpt: "Comprehensive guide to mobile-first responsive design principles.",
    tags: ["CSS", "Mobile", "Responsive Design"],
    published: false
  },
  {
    title: "Version Control with Git Advanced Techniques",
    slug: "version-control-git-advanced",
    content: "Go beyond basic Git commands with advanced techniques for professional development. Learn about interactive rebasing, cherry-picking, bisecting, and complex merge strategies. Master Git workflows that will streamline your development process.",
    excerpt: "Advanced Git techniques for professional development workflows.",
    tags: ["Git", "Version Control", "Development"],
    published: true
  },
  {
    title: "Introduction to Machine Learning",
    slug: "introduction-machine-learning",
    content: "Machine learning is transforming how we build software. This beginner-friendly introduction covers fundamental ML concepts, common algorithms, and practical applications. Understand when and how to apply machine learning to solve real-world problems.",
    excerpt: "Beginner-friendly introduction to machine learning concepts and applications.",
    tags: ["Machine Learning", "AI", "Data Science"],
    published: true
  },
  {
    title: "Cybersecurity Fundamentals for Developers",
    slug: "cybersecurity-fundamentals-developers",
    content: "Security should be built into applications from the start. This essential guide covers cybersecurity fundamentals every developer should know, including common vulnerabilities, secure coding practices, and threat modeling basics.",
    excerpt: "Essential cybersecurity fundamentals every developer should understand.",
    tags: ["Security", "Development", "Best Practices"],
    published: false
  },
  {
    title: "Microservices Architecture Deep Dive",
    slug: "microservices-architecture-deep-dive",
    content: "Microservices architecture offers scalability and flexibility but comes with complexity. This deep dive explores microservices patterns, inter-service communication, data management, and deployment strategies for successful implementations.",
    excerpt: "Deep dive into microservices patterns, communication, and deployment strategies.",
    tags: ["Architecture", "Microservices", "Backend"],
    published: true
  },
  {
    title: "Progressive Web Apps Complete Guide",
    slug: "progressive-web-apps-complete-guide",
    content: "Progressive Web Apps combine the best of web and mobile apps. This complete guide covers PWA fundamentals, service workers, offline functionality, and app manifest configuration. Build web applications that feel like native apps.",
    excerpt: "Complete guide to building Progressive Web Apps with offline functionality.",
    tags: ["PWA", "JavaScript", "Web Development"],
    published: true
  },
  {
    title: "Docker and Containerization Essentials",
    slug: "docker-containerization-essentials",
    content: "Containerization has revolutionized application deployment. This essential guide covers Docker fundamentals, container orchestration, and best practices for creating efficient containers. Learn how to containerize applications for consistent deployments.",
    excerpt: "Essential guide to Docker fundamentals and containerization best practices.",
    tags: ["Docker", "DevOps", "Containers"],
    published: false
  }
];

async function insertTestData() {
  console.log('🚀 Starting test data insertion...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < testPosts.length; i++) {
    const post = testPosts[i];
    
    try {
      console.log(`📤 Creating post ${i + 1}/${testPosts.length}: ${post.title}`);
      
      const response = await fetch('http://localhost:5173/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully created: ${post.title}`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create: ${post.title} - ${error.error}`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`❌ Error creating: ${post.title} - ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Test data insertion complete!');
  console.log(`✅ Successfully created: ${successCount} posts`);
  console.log(`❌ Failed: ${errorCount} posts`);
  console.log(`📈 Total posts attempted: ${testPosts.length}`);
}

// Run the insertion
insertTestData().catch(console.error);