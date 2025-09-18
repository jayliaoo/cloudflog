import { data } from "react-router";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Fetch posts from database
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        published: posts.published,
        tags: posts.tags,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt));

    // Transform the data to maintain the expected format
    const postsTransformed = postsData.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      createdAt: post.createdAt,
      published: post.published,
      tags: post.tags ? post.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    }));

    return data({ posts: postsTransformed });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Parse JSON body
    const body = await request.json() as {
      title?: string;
      content?: string;
      excerpt?: string;
      slug?: string;
      tags?: string;
      published?: boolean;
      id?: string;
    };

    switch (request.method) {
      case "POST":
        // Handle post creation
        const { title, content, excerpt, slug, tags, published = true } = body;
        
        // Validate required fields
        if (!title || !content || !excerpt || !slug) {
          return data({ error: "Missing required fields" }, { status: 400 });
        }
        
        // Check if slug already exists
        const existingPost = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
        if (existingPost.length > 0) {
          return data({ error: "Slug already exists" }, { status: 400 });
        }
        
        // For now, use a default user ID since this is a single-user blog
    // In a real application, you'd get this from the authenticated user
    const defaultUserId = 1;
        
        // Insert post into database
        const result = await db.insert(posts).values({
          title,
          slug,
          content,
          excerpt,
          authorId: defaultUserId,
          tags: tags || null,
          published
        }).returning();
        
        const newPost = result[0];
        
        return data({ success: true, message: "Post created successfully", post: newPost });
        
      case "PUT":
        // Handle post update
        const { id: updateId, title: updateTitle, content: updateContent, excerpt: updateExcerpt, published: updatePublished, tags: updateTags } = body;
        
        if (!updateId) {
          return data({ error: "Missing post ID" }, { status: 400 });
        }
        
        // Convert string ID to number for integer comparison
        const updateIdNum = parseInt(updateId, 10);
        if (isNaN(updateIdNum)) {
          return data({ error: "Invalid post ID format" }, { status: 400 });
        }
        
        // Update post
        const updateResult = await db.update(posts)
          .set({
            title: updateTitle,
            content: updateContent,
            excerpt: updateExcerpt,
            published: updatePublished,
            tags: updateTags !== undefined ? updateTags : undefined
          })
          .where(eq(posts.id, updateIdNum))
          .returning();
        
        const updatedPost = updateResult[0];
          
        return data({ success: true, message: "Post updated successfully", post: updatedPost });
        
      case "DELETE":
        // Handle post deletion
        const { id: deleteId } = body;
        
        if (!deleteId) {
          return data({ error: "Missing post ID" }, { status: 400 });
        }
        
        // Convert string ID to number for integer comparison
        const deleteIdNum = parseInt(deleteId, 10);
        if (isNaN(deleteIdNum)) {
          return data({ error: "Invalid post ID format" }, { status: 400 });
        }
        
        await db.delete(posts).where(eq(posts.id, deleteIdNum));
        
        return data({ success: true, message: "Post deleted successfully" });
        
      default:
        return data({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error("Error handling post action:", error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return data({ error: "Invalid JSON format" }, { status: 400 });
    }
    
    return data({ error: "Failed to process request" }, { status: 500 });
  }
}