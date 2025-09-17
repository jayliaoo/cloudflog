import { data } from "react-router";
import { getDBClient } from "~/db";
import { posts, users, postTags, tags } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Initialize database client
    
    // Fetch posts with authors and tags from database
    const postsWithRelations = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        published: posts.published
      })
      .from(posts)
      // Single user blog - no author join needed
      .orderBy(desc(posts.createdAt));

    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      postsWithRelations.map(async (post) => {
        const postTagsData = await db
          .select({
            tagName: tags.name
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(postTags.postId, post.id));

        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          createdAt: post.createdAt,
          published: post.published,
          tags: postTagsData.map(pt => pt.tagName)
        };
      })
    );

    return data({ posts: postsWithTags });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    const db = getDBClient(env.D1);

    switch (intent) {
      case "create":
        // Handle post creation
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const excerpt = formData.get("excerpt") as string;
        const slug = formData.get("slug") as string;
        const categories = formData.get("categories") as string;
        const tags = formData.get("tags") as string;
        const published = formData.get("published") === "true";
        
        // Validate required fields
        if (!title || !content || !excerpt || !slug) {
          return data({ error: "Missing required fields" }, { status: 400 });
        }
        
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
        
        return data({ success: true, message: "Post created successfully", post: result[0] });
        
      case "update":
        // Handle post update
        const updateId = formData.get("id") as string;
        const updateTitle = formData.get("title") as string;
        const updateContent = formData.get("content") as string;
        const updateExcerpt = formData.get("excerpt") as string;
        const updatePublished = formData.get("published") === "true";
        
        const updateResult = await db.update(posts)
          .set({
            title: updateTitle,
            content: updateContent,
            excerpt: updateExcerpt,
            published: updatePublished
          })
          .where(eq(posts.id, updateId))
          .returning();
          
        return data({ success: true, message: "Post updated successfully", post: updateResult[0] });
        
      case "delete":
        // Handle post deletion
        const deleteId = formData.get("id") as string;
        
        await db.delete(posts).where(eq(posts.id, deleteId));
        
        return data({ success: true, message: "Post deleted successfully" });
        
      default:
        return data({ error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling post action:", error);
    return data({ error: "Failed to process request" }, { status: 500 });
  }
}