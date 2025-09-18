import { data } from "react-router";
import { getDBClient } from "~/db";
import { posts, categories } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Initialize database client
    
    // Fetch posts with their single category from database
    const postsWithCategories = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        published: posts.published,
        categoryId: posts.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .orderBy(desc(posts.createdAt));

    // Transform the data to maintain the expected format
    const postsWithCategoriesTransformed = postsWithCategories.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      createdAt: post.createdAt,
      published: post.published,
      category: post.categoryId ? {
        id: post.categoryId,
        name: post.categoryName,
        slug: post.categorySlug,
      } : null,
      tags: [] // No tags in simplified schema
    }));

    return data({ posts: postsWithCategoriesTransformed });
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
      categories?: string;
      tags?: string;
      published?: boolean;
      categoryId?: number;
      id?: string;
    };

    switch (request.method) {
      case "POST":
        // Handle post creation
        const { title, content, excerpt, slug, categoryId, published = true } = body;
        
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
        
        // Insert post into database with category
        const result = await db.insert(posts).values({
          title,
          slug,
          content,
          excerpt,
          authorId: defaultUserId,
          categoryId: categoryId || null,
          published
        }).returning();
        
        const newPost = result[0];
        
        return data({ success: true, message: "Post created successfully", post: newPost });
        
      case "PUT":
        // Handle post update
        const { id: updateId, title: updateTitle, content: updateContent, excerpt: updateExcerpt, published: updatePublished, categoryId: updateCategoryId } = body;
        
        if (!updateId) {
          return data({ error: "Missing post ID" }, { status: 400 });
        }
        
        // Convert string ID to number for integer comparison
        const updateIdNum = parseInt(updateId, 10);
        if (isNaN(updateIdNum)) {
          return data({ error: "Invalid post ID format" }, { status: 400 });
        }
        
        // Update post with category
        const updateResult = await db.update(posts)
          .set({
            title: updateTitle,
            content: updateContent,
            excerpt: updateExcerpt,
            published: updatePublished,
            categoryId: updateCategoryId !== undefined ? updateCategoryId : undefined
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