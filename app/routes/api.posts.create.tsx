import { data } from "react-router";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function action({ request, context }: { 
  request: Request; 
  context: { cloudflare: { env: Env } } 
}) {
  const { env } = context.cloudflare;
  
  // Only accept POST requests
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    // Parse JSON body
    const body = await request.json() as {
      title: string;
      content: string;
      excerpt: string;
      slug: string;
      categories?: string;
      tags?: string;
      published?: boolean;
    };
    
    const { title, content, excerpt, slug, categories, tags, published = true } = body;
    
    // Validate required fields
    if (!title || !content || !excerpt || !slug) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }
    
    const db = getDBClient(env.D1);
    
    // Check if slug already exists
    const existingPost = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
    if (existingPost.length > 0) {
      return data({ error: "Slug already exists" }, { status: 400 });
    }
    
    // Generate ID for new post
    const postId = crypto.randomUUID();
    
    // Insert post into database
    const result = await db.insert(posts).values({
      id: postId,
      title,
      slug,
      content,
      excerpt,
      published
    }).returning();
    
    return data({ 
      success: true, 
      message: "Post created successfully", 
      post: {
        id: result[0].id,
        title: result[0].title,
        slug: result[0].slug,
        excerpt: result[0].excerpt,
        content: result[0].content,
        published: result[0].published,
        createdAt: result[0].createdAt
      }
    });
    
  } catch (error) {
    console.error("Error creating post via JSON API:", error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return data({ error: "Invalid JSON format" }, { status: 400 });
    }
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return data({ error: "Slug already exists" }, { status: 400 });
    }
    
    return data({ error: "Failed to create post" }, { status: 500 });
  }
}

// Export a loader to handle GET requests (returns API info)
export async function loader() {
  return data({
    message: "JSON API for creating posts",
    method: "POST",
    requiredFields: ["title", "content", "excerpt", "slug"],
    optionalFields: ["categories", "tags", "published"],
    note: "This is a single-user blog system - no author management needed",
    example: {
      title: "My New Post",
      content: "Post content here...",
      excerpt: "Brief description",
      slug: "my-new-post",
      published: true
    }
  });
}