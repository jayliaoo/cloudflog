import { data } from "react-router";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "~/auth.server";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Fetch posts with their tags using many-to-many relationship
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
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt));

    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      postsData.map(async (post) => {
        const postTagsData = await db
          .select({
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
          .where(eq(postTags.postId, post.id));

        return {
          ...post,
          tags: postTagsData.map(pt => pt.tagName),
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
  
  // Check authentication and role
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Authentication required" }, { status: 401 });
  }
  
  if (user.role !== 'owner') {
    return data({ error: "Admin access required" }, { status: 403 });
  }
  
  try {
    const db = getDBClient(env.D1);
    
    // Parse JSON body
    const body = await request.json() as {
      title?: string;
      content?: string;
      excerpt?: string;
      slug?: string;
      tags?: string[];
      published?: boolean;
      id?: string;
    };

    switch (request.method) {
      case "POST":
        // Handle post creation
        const { title, content, excerpt, slug, tags: tagNames, published = true } = body;
        
        // Validate required fields
        if (!title || !content || !excerpt || !slug) {
          return data({ error: "Missing required fields" }, { status: 400 });
        }
        
        // Check if slug already exists
        const existingPost = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
        if (existingPost.length > 0) {
          return data({ error: "Slug already exists" }, { status: 400 });
        }
        
        // Use the authenticated user's ID
        const authorId = user.id;
        
        // Insert post into database first
        const postResult = await db.insert(posts).values({
          title,
          slug,
          content,
          excerpt,
          authorId: authorId,
          published
        }).returning();
        
        const newPost = postResult[0];
        
        // Handle tag associations
        if (tagNames && Array.isArray(tagNames) && tagNames.length > 0) {
          // Filter out empty tags and trim
          const cleanTags = tagNames.map(tag => tag.trim()).filter(tag => tag);
          
          if (cleanTags.length > 0) {
            // Create all tags (existing ones will be ignored due to unique constraint)
            // Create tags one by one (simpler approach)
            for (const tagName of cleanTags) {
              try {
                await db.insert(tags).values({
                  name: tagName,
                  slug: tagName.toLowerCase().replace(/\s+/g, '-')
                });
              } catch (error) {
                // Ignore unique constraint violations - tag already exists
              }
            }
            
            // Create post-tag associations using slugs
            const tagSlugs = cleanTags.map(tagName => tagName.toLowerCase().replace(/\s+/g, '-'));
            const postTagData = tagSlugs.map(tagSlug => ({
              postId: newPost.id,
              tagSlug
            }));
            
            try {
              await db.insert(postTags).values(postTagData);
            } catch (error) {
              // Ignore any constraint violations
              console.log("Some tag associations may already exist");
            }
          
            console.log("Post created with tags:", cleanTags);
          }
        }
        
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
        
        // Update post and handle tag associations
        const updateResult = await db.update(posts)
          .set({
            title: updateTitle,
            content: updateContent,
            excerpt: updateExcerpt,
            published: updatePublished
          })
          .where(eq(posts.id, updateIdNum))
          .returning();
        
        const post = updateResult[0];
        
        // Handle tag associations if tags are provided
        if (updateTags !== undefined) {
          // Remove existing tag associations
          await db.delete(postTags).where(eq(postTags.postId, updateIdNum));
          
          // Add new tag associations if tags are provided
          if (Array.isArray(updateTags) && updateTags.length > 0) {
            // Filter out empty tags and trim
            const cleanTags = updateTags.map(tag => tag.trim()).filter(tag => tag);
            
            if (cleanTags.length > 0) {
              // Create all tags (existing ones will be ignored due to unique constraint)
              // Create tags one by one (simpler approach)
              for (const tagName of cleanTags) {
                try {
                  await db.insert(tags).values({
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-')
                  });
                } catch (error) {
                  // Ignore unique constraint violations - tag already exists
                }
              }
              
              // Create post-tag associations using slugs
              const tagSlugs = cleanTags.map(tagName => tagName.toLowerCase().replace(/\s+/g, '-'));
              const postTagData = tagSlugs.map(tagSlug => ({
                postId: updateIdNum,
                tagSlug
              }));
              
              try {
                await db.insert(postTags).values(postTagData);
              } catch (error) {
                // Ignore any constraint violations
                console.log("Some tag associations may already exist");
              }
            }
          }
        }
        
        const updatedPost = post;
        
        // Fetch updated tags for the post to include in response
        const updatedPostTags = await db
          .select({
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
          .where(eq(postTags.postId, updateIdNum));
        
        console.log(`Fetched tags for post ${updateIdNum} response:`, updatedPostTags);
        
        const postWithTags = {
          ...updatedPost,
          tags: updatedPostTags.map(pt => pt.tagName),
        };
        
        console.log(`Returning post with tags for ${updateIdNum}:`, postWithTags.tags);
          
        return data({ success: true, message: "Post updated successfully", post: postWithTags });
        
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