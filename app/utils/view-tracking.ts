import { getDBClient } from "~/db";
import { posts, postViews } from "~/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

/**
 * Track a post view with duplicate prevention
 * @param postId - The ID of the post being viewed
 * @param env - Cloudflare environment
 * @param userId - Optional user ID if user is logged in
 */
export async function trackPostView(
  postId: number,
  env: Env,
  userId?: number
): Promise<void> {
  try {
    const db = getDBClient(env.D1);

    // Increment post view count
    try {
      await db
        .update(posts)
        .set({ viewCount: sql`${posts.viewCount} + 1` })
        .where(eq(posts.id, postId));
    } catch (updateError) {
      console.error('Failed to update post view count:', updateError);
      // Continue even if update fails - the view record was still created
    }


    console.log(`Tracking view for post ${postId}, userId: ${userId}`);

    // Check if this view already exists
    // For logged-in users: check by userId
    // For anonymous users: check if any anonymous view exists for this post
    let existingView;

    userId = userId || 0;
    // Logged-in user: check by userId
    console.log(`Checking existing view for logged-in user ${userId}`);
    try {
      existingView = await db
        .select()
        .from(postViews)
        .where(
          and(
            eq(postViews.postId, postId),
            eq(postViews.userId, userId)
          )
        )
        .limit(1);
    } catch (checkError) {
      console.error('Error checking existing view for logged-in user:', checkError);
      existingView = []; // Assume no existing view if check fails
    }

    console.log(`Existing view check result: ${existingView.length} records found`);

    // If view already exists, increment the view count instead of skipping
    if (existingView.length > 0) {
      console.log('View already exists, incrementing view count');
      try {
        await db
          .update(postViews)
          .set({ viewCount: sql`${postViews.viewCount} + 1` })
          .where(
            and(
              eq(postViews.postId, postId),
              eq(postViews.userId, userId)
            )
          );
        console.log('View count incremented successfully');
      } catch (updateError) {
        console.error('Failed to increment view count:', updateError);
      }
    } else {
      console.log('Inserting new view record');
      // Insert new view record
      try {
        await db.insert(postViews).values({
          postId,
          userId: userId || 0, // Use 0 for anonymous users
          viewCount: 1, // New view count column
          viewedAt: new Date(),
        });
        console.log('View record inserted successfully');
      } catch (insertError) {
        console.error('Failed to insert view record:', insertError);
        // If insert fails, we can't continue
        return;
      }
    }

  
    console.log('View tracking completed successfully');
  } catch (error) {
    console.error("Error tracking post view:", error);
  }
}

/**
 * Get view statistics for a post
 * @param postId - The ID of the post
 * @param env - Cloudflare environment
 */
export async function getPostViewStats(postId: number, env: Env) {
  try {
    const db = getDBClient(env.D1);

    // Get total views from posts table
    const postData = await db
      .select({ viewCount: posts.viewCount })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    const totalViews = postData[0]?.viewCount || 0;

    // Get unique views (by user/session)
    const uniqueViews = await db
      .select({ count: count() })
      .from(postViews)
      .where(eq(postViews.postId, postId));

    return {
      totalViews,
      uniqueViews: uniqueViews[0].count,
    };
  } catch (error) {
    console.error("Error getting post view stats:", error);
    return { totalViews: 0, uniqueViews: 0 };
  }
}