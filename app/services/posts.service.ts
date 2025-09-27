import { getDBClient } from "~/db";
import { posts, tags, postTags, comments } from "~/db/schema";
import { eq, desc, asc, and, or, like, count, sql, inArray } from "drizzle-orm";

// Base post interface with all possible fields
export interface PostWithMetadata {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  published: boolean;
  featured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string | null;
  commentCount?: number;
}

// Configuration interfaces for different query types
export interface PostsQueryConfig {
  // Pagination
  page?: number;
  limit?: number;

  // Filtering
  published?: boolean;
  featured?: boolean;
  tagSlug?: string;
  searchQuery?: string;
  authorId?: number;

  // Sorting
  sortBy?: SortConfig[]

  // Field selection
  includeContent?: boolean;
  includeTags?: boolean;
  includeCommentCount?: boolean;
  includeViewCount?: boolean;

  // Special filters for admin
  status?: 'all' | 'published' | 'draft';
  featuredFilter?: 'all' | 'featured' | 'unfeatured';
}

export interface SortConfig {
  by: 'createdAt' | 'updatedAt' | 'title' | 'viewCount' | 'featured';
  order?: 'asc' | 'desc';
}

// Response interfaces
export interface PostsResponse {
  posts: PostWithMetadata[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SinglePostResponse {
  post: PostWithMetadata | null;
  previousPost?: Pick<PostWithMetadata, 'id' | 'title' | 'slug'> | null;
  nextPost?: Pick<PostWithMetadata, 'id' | 'title' | 'slug'> | null;
}

export interface TagWithPostCount {
  name: string;
  slug: string;
  postCount: number;
  createdAt: Date;
}

// Service class
export class PostsService {
  private db: ReturnType<typeof getDBClient>;

  constructor(env: Env) {
    this.db = getDBClient(env.D1);
  }

  /**
   * Get featured posts for homepage
   */
  async getFeaturedPosts(limit: number = 4): Promise<PostWithMetadata[]> {
    const config: PostsQueryConfig = {
      published: true,
      featured: true,
      limit,
      includeTags: true,
      includeCommentCount: true,
      includeViewCount: true,
      sortBy: [{ by: 'createdAt', order: 'desc' }],
    };

    const result = await this.getPosts(config);
    return result.posts;
  }

  /**
   * Get recent posts for homepage
   */
  async getRecentPosts(limit: number = 6): Promise<PostWithMetadata[]> {
    const config: PostsQueryConfig = {
      published: true,
      limit,
      includeTags: true,
      includeCommentCount: true,
      includeViewCount: true,
      sortBy: [{ by: 'createdAt', order: 'desc' }], 
    };

    const result = await this.getPosts(config);
    return result.posts;
  }

  /**
   * Get posts for the main posts page with pagination
   */
  async getPostsPage(page: number = 1, postsPerPage: number = 10): Promise<PostsResponse> {
    const config: PostsQueryConfig = {
      published: true,
      page,
      limit: postsPerPage,
      includeTags: true,
      includeCommentCount: true,
      includeViewCount: true,
      sortBy: [{by: 'featured', order: 'desc'},{ by: 'createdAt', order: 'desc' }],
    };

    return this.getPosts(config);
  }

  /**
   * Get posts filtered by tag
   */
  async getPostsByTag(tagSlug: string, page: number = 1, postsPerPage: number = 10): Promise<PostsResponse> {
    const config: PostsQueryConfig = {
      published: true,
      tagSlug,
      page,
      limit: postsPerPage,
      includeTags: true,
      includeCommentCount: true,
      includeViewCount: true,
      sortBy: [{ by: 'createdAt', order: 'desc' }],
    };

    return this.getPosts(config);
  }

  /**
   * Search posts by title and content
   */
  async searchPosts(searchQuery: string, page: number = 1, postsPerPage: number = 10): Promise<PostsResponse> {
    const config: PostsQueryConfig = {
      published: true,
      searchQuery,
      page,
      limit: postsPerPage,
      includeTags: true,
      includeCommentCount: true,
      includeViewCount: true,
      sortBy: [{ by: 'createdAt', order: 'desc' }],
    };

    return this.getPosts(config);
  }

  /**
   * Get posts for admin management with advanced filtering
   */
  async getAdminPosts(config: {
    page?: number;
    postsPerPage?: number;
    status?: 'all' | 'published' | 'draft';
    featured?: 'all' | 'featured' | 'unfeatured';
    tagSlug?: string;
    searchQuery?: string;
  }): Promise<PostsResponse> {
    const {
      page = 1,
      postsPerPage = 10,
      status = 'all',
      featured = 'all',
      tagSlug,
      searchQuery
    } = config;

    const queryConfig: PostsQueryConfig = {
      page,
      limit: postsPerPage,
      includeTags: true,
      sortBy: [{ by: 'createdAt', order: 'desc' }],
    };

    // Apply status filter
    if (status === 'published') {
      queryConfig.published = true;
    } else if (status === 'draft') {
      queryConfig.published = false;
    }

    // Apply featured filter
    if (featured === 'featured') {
      queryConfig.featured = true;
    } else if (featured === 'unfeatured') {
      queryConfig.featured = false;
    }

    // Apply tag and search filters
    if (tagSlug) {
      queryConfig.tagSlug = tagSlug;
    }

    if (searchQuery) {
      queryConfig.searchQuery = searchQuery;
    }

    return this.getPosts(queryConfig);
  }

  /**
   * Get a single post by slug with navigation posts
   */
  async getPostBySlug(slug: string): Promise<SinglePostResponse> {
    // Get the main post
    const postData = await this.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        published: posts.published,
        featured: posts.featured,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (postData.length === 0) {
      return { post: null };
    }

    const post = postData[0];

    // Get tags for the post
    const postTagsData = await this.db
      .select({
        tagName: tags.name,
        tagSlug: tags.slug,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(eq(postTags.postId, post.id));

    // Get previous and next posts
    const [previousPostData, nextPostData] = await Promise.all([
      this.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
        })
        .from(posts)
        .where(and(
          eq(posts.published, true),
          sql`${posts.createdAt} < ${post.createdAt}`
        ))
        .orderBy(desc(posts.createdAt))
        .limit(1),
      
      this.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
        })
        .from(posts)
        .where(and(
          eq(posts.published, true),
          sql`${posts.createdAt} > ${post.createdAt}`
        ))
        .orderBy(asc(posts.createdAt))
        .limit(1)
    ]);

    const postWithMetadata: PostWithMetadata = {
      ...post,
      tags: postTagsData.map(pt => pt.tagName).join(','),
    };

    return {
      post: postWithMetadata,
      previousPost: previousPostData[0] || null,
      nextPost: nextPostData[0] || null,
    };
  }

  /**
   * Get all tags with post counts
   */
  async getTagsWithPostCounts(): Promise<TagWithPostCount[]> {
    const tagsData = await this.db
      .select({
        tagName: tags.name,
        tagSlug: tags.slug,
        tagCreatedAt: tags.createdAt,
        postCount: count(postTags.postId),
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.slug, postTags.tagSlug))
      .leftJoin(posts, and(
        eq(postTags.postId, posts.id),
        eq(posts.published, true)
      ))
      .groupBy(tags.name, tags.slug, tags.createdAt)
      .having(sql`COUNT(${postTags.postId}) > 0`)
      .orderBy(desc(count(postTags.postId)));

    return tagsData.map(tag => ({
      name: tag.tagName,
      slug: tag.tagSlug,
      postCount: tag.postCount,
      createdAt: tag.tagCreatedAt,
    }));
  }

  /**
   * Core method to get posts with flexible configuration
   */
  private async getPosts(config: PostsQueryConfig): Promise<PostsResponse> {
    const {
      page = 1,
      limit = 10,
      published,
      featured,
      tagSlug,
      searchQuery,
      sortBy = [{ by: 'createdAt', order: 'desc' }],
      includeTags = false,
      includeCommentCount = false,
      includeViewCount = true,
      includeContent = false,
    } = config;

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (published !== undefined) {
      conditions.push(eq(posts.published, published));
    }

    if (featured !== undefined) {
      conditions.push(eq(posts.featured, featured));
    }

    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          like(posts.title, searchTerm),
          like(posts.content, searchTerm)
        )
      );
    }

    // Handle tag filtering
    if (tagSlug) {
      const taggedPosts = await this.db
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagSlug, tagSlug));

      const tagFilteredPostIds = taggedPosts.map(tp => tp.postId);
      
      if (tagFilteredPostIds.length > 0) {
        conditions.push(inArray(posts.id, tagFilteredPostIds));
      } else {
        // No posts with this tag
        return {
          posts: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
    }

    // Build base select fields
    const baseSelectFields = {
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      published: posts.published,
      featured: posts.featured,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      ...(includeContent && { content: posts.content }),
    };

    // Handle different query types based on what we need to include
    let postsData: any[];

    if (includeTags && includeCommentCount) {
      // Query with both tags and comment count
      postsData = await this.db
        .select({
          ...baseSelectFields,
          tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name})`,
          commentCount: sql<number>`COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END)`
        })
        .from(posts)
        .leftJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
        .leftJoin(comments, eq(posts.id, comments.postId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(
          posts.id,
          posts.title,
          posts.slug,
          posts.excerpt,
          posts.published,
          posts.featured,
          posts.viewCount,
          posts.createdAt,
          posts.updatedAt,
          ...(includeContent ? [posts.content] : [])
        )
        .orderBy(...sortBy.map(({ by, order }) => 
            order === 'desc' ? desc(posts[by]) : asc(posts[by])
          ))
        .limit(limit)
        .offset(offset);
    } else if (includeTags) {
      // Query with tags only
      postsData = await this.db
        .select({
          ...baseSelectFields,
          tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name})`,
        })
        .from(posts)
        .leftJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(
          posts.id,
          posts.title,
          posts.slug,
          posts.excerpt,
          posts.published,
          posts.featured,
          posts.viewCount,
          posts.createdAt,
          posts.updatedAt,
          ...(includeContent ? [posts.content] : [])
        )
        .orderBy(...sortBy.map(({ by, order }) => 
            order === 'desc' ? desc(posts[by]) : asc(posts[by])
          ))
        .limit(limit)
        .offset(offset);
    } else if (includeCommentCount) {
      // Query with comment count only
      postsData = await this.db
        .select({
          ...baseSelectFields,
          commentCount: sql<number>`COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END)`
        })
        .from(posts)
        .leftJoin(comments, eq(posts.id, comments.postId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(
          posts.id,
          posts.title,
          posts.slug,
          posts.excerpt,
          posts.published,
          posts.featured,
          posts.viewCount,
          posts.createdAt,
          posts.updatedAt,
          ...(includeContent ? [posts.content] : [])
        )
        .orderBy(...sortBy.map(({ by, order }) => 
            order === 'desc' ? desc(posts[by]) : asc(posts[by])
          ))
        .limit(limit)
        .offset(offset);
    } else {
      // Simple query without joins
      postsData = await this.db
        .select(baseSelectFields)
        .from(posts)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          ...sortBy.map(({ by, order }) => 
            order === 'desc' ? desc(posts[by]) : asc(posts[by])
          )
        )
        .limit(limit)
        .offset(offset);
    }

    // Get total count for pagination
    const totalCountResult = await this.db
      .select({ count: count() })
      .from(posts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Transform results to ensure proper typing
    const transformedPosts = postsData.map(post => ({
      ...post,
      tags: post.tags || null,
      commentCount: post.commentCount || 0
    }));

    return {
      posts: transformedPosts as PostWithMetadata[],
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Increment view count for a post
   */
  async incrementViewCount(postId: number): Promise<void> {
    await this.db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(posts.id, postId));
  }

  /**
   * Get post statistics for admin dashboard
   */
  async getPostStatistics(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    featuredPosts: number;
  }> {
    const [totalResult, publishedResult, draftResult, featuredResult] = await Promise.all([
      this.db.select({ count: count() }).from(posts),
      this.db.select({ count: count() }).from(posts).where(eq(posts.published, true)),
      this.db.select({ count: count() }).from(posts).where(eq(posts.published, false)),
      this.db.select({ count: count() }).from(posts).where(eq(posts.featured, true)),
    ]);

    return {
      totalPosts: totalResult[0].count,
      publishedPosts: publishedResult[0].count,
      draftPosts: draftResult[0].count,
      featuredPosts: featuredResult[0].count,
    };
  }
}

// Factory function to create service instance
export function createPostsService(env: Env): PostsService {
  return new PostsService(env);
}

// Types are already exported above with their declarations