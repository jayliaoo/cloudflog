import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { desc, eq, inArray, count } from "drizzle-orm";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    // Redirect to sign in page if not authenticated
    return redirect("/auth/signin");
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return redirect("/"); // Redirect to home if not owner
  }
  
  // Get filter parameters from URL
  const url = new URL(request.url);
  const tagFilter = url.searchParams.get('tag');
  const statusFilter = url.searchParams.get('status'); // 'all', 'published', 'draft'
  
  // Get pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const postsPerPage = 10; // Number of posts per page
  
  const db = getDBClient(env.D1);
  
  // Fetch all available tags for filter dropdown
  const allTags = await db
    .select({
      name: tags.name,
      slug: tags.slug,
    })
    .from(tags)
    .orderBy(tags.name);

  // Fetch featured posts count
  const featuredCount = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.featured, true));
  
  // Build base query for posts
  let postsQuery = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      published: posts.published,
      featured: posts.featured,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts);
  
  // Build filtered query for counting
  let filteredQuery = db
    .select({
      id: posts.id,
    })
    .from(posts);
  
  // Apply status filter
  if (statusFilter === 'published') {
    filteredQuery = filteredQuery.where(eq(posts.published, true));
    postsQuery = postsQuery.where(eq(posts.published, true));
  } else if (statusFilter === 'draft') {
    filteredQuery = filteredQuery.where(eq(posts.published, false));
    postsQuery = postsQuery.where(eq(posts.published, false));
  }
  
  // Apply tag filter if specified
  if (tagFilter) {
    // Get post IDs that have the specified tag
    const taggedPosts = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagSlug, tagFilter));
    
    const postIds = taggedPosts.map(tp => tp.postId);
    
    if (postIds.length > 0) {
      // Filter posts by the tagged post IDs
      filteredQuery = filteredQuery.where(inArray(posts.id, postIds));
      postsQuery = postsQuery.where(inArray(posts.id, postIds));
    } else {
      // No posts have this tag, return empty result
      return data({ 
        posts: [], 
        allTags, 
        user, 
        currentTag: tagFilter, 
        currentStatus: statusFilter,
        currentPage: page,
        totalPages: 0,
        totalPosts: 0
      });
    }
  }
  
  // Get total count for pagination
  const totalCount = await filteredQuery.execute().then(result => result.length);
  const totalPages = Math.ceil(totalCount / postsPerPage);
  
  // Apply pagination (limit and offset)
  const offset = (page - 1) * postsPerPage;
  const paginatedPosts = await postsQuery
    .orderBy(desc(posts.createdAt))
    .limit(postsPerPage)
    .offset(offset);
  // Fetch tags for each post
  const postsWithTags = await Promise.all(
    paginatedPosts.map(async (post) => {
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
  
  return data({ 
    posts: postsWithTags, 
    allTags, 
    user, 
    currentTag: tagFilter, 
    currentStatus: statusFilter,
    currentPage: page,
    totalPages,
    totalPosts: totalCount,
    featuredCount: featuredCount[0].count
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return data({ error: "Forbidden - Admin access required" }, { status: 403 });
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  const postId = formData.get("postId");
  
  if (!postId || !intent || !["publish", "unpublish", "delete", "feature", "unfeature"].includes(intent as string)) {
    return data({ error: "Invalid request" }, { status: 400 });
  }
  
  try {
    const db = getDBClient(env.D1);
    const postIdNum = parseInt(postId as string, 10);
    
    if (intent === "delete") {
      // First delete related post tags
      await db.delete(postTags).where(eq(postTags.postId, postIdNum));
      // Then delete the post
      await db.delete(posts).where(eq(posts.id, postIdNum));
    } else if (intent === "feature" || intent === "unfeature") {
      // Toggle featured status
      const newFeaturedStatus = intent === "feature" ? true : false;
      
      await db.update(posts)
        .set({ featured: newFeaturedStatus })
        .where(eq(posts.id, postIdNum));
    } else {
      // Update the post status based on intent
      const newPublishedStatus = intent === "publish" ? true : false;
      
      await db.update(posts)
        .set({ published: newPublishedStatus })
        .where(eq(posts.id, postIdNum));
    }
    
    return data({ success: true });
  } catch (error) {
    console.error(`Error ${intent}ing post:`, error);
    return data({ error: `Failed to ${intent} post` }, { status: 500 });
  }
}

export default function Admin({ loaderData }: { loaderData: any }) {
  const { posts, user, allTags, currentTag, currentStatus, currentPage, totalPages, totalPosts, featuredCount } = loaderData as { 
    posts: any[], 
    user: any, 
    allTags: any[], 
    currentTag: string | null, 
    currentStatus: string | null,
    currentPage: number,
    totalPages: number,
    totalPosts: number,
    featuredCount: number
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
        
        {/* Active Filters Display */}
        {(currentTag || currentStatus) && (
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            {currentStatus && currentStatus !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                Status: {currentStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            )}
            {currentTag && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                Tag: {allTags.find(t => t.slug === currentTag)?.name || currentTag}
              </span>
            )}
            <span className="text-sm text-muted-foreground">({posts.length} posts)</span>
          </div>
        )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-muted-foreground truncate">Total Posts</dt>
              <dd className="mt-1 text-3xl font-semibold">{posts.length}</dd>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-muted-foreground truncate">Published Posts</dt>
              <dd className="mt-1 text-3xl font-semibold">
                {posts.filter(post => post.published).length}
              </dd>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-muted-foreground truncate">Featured Posts</dt>
              <dd className="mt-1 text-3xl font-semibold">{loaderData.featuredCount}</dd>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-muted-foreground truncate">Draft Posts</dt>
              <dd className="mt-1 text-3xl font-semibold">
                {posts.filter(post => !post.published).length}
              </dd>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Button
            asChild
          >
            <Link to="/posts/new">
              Create New Post
            </Link>
          </Button>
          
          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <select
              value={currentStatus || 'all'}
              onChange={(e) => {
                const newStatus = e.target.value;
                const url = new URL(window.location.href);
                if (newStatus === 'all') {
                  url.searchParams.delete('status');
                } else {
                  url.searchParams.set('status', newStatus);
                }
                window.location.href = url.toString();
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">All Posts</option>
              <option value="published">Published Only</option>
              <option value="draft">Draft Only</option>
            </select>
            
            {/* Tag Filter */}
            <select
              value={currentTag || ''}
              onChange={(e) => {
                const newTag = e.target.value;
                const url = new URL(window.location.href);
                if (newTag === '') {
                  url.searchParams.delete('tag');
                } else {
                  url.searchParams.set('tag', newTag);
                }
                window.location.href = url.toString();
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag.slug} value={tag.slug}>
                  {tag.name}
                </option>
              ))}
            </select>
            
            {/* Clear Filters */}
            {(currentTag || currentStatus) && (
              <Button
                size="sm"
                asChild
              >
                <Link to="/admin">
                  Clear Filters
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Posts List */}
        <Card>
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium truncate">
                          {post.title}
                        </h3>
                        <Badge
                          variant={post.published ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      {post.excerpt && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                              asChild
                            >
                              <Link to={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                                {tag}
                              </Link>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!post.published ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="publish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="default"
                          >
                            Publish
                          </Button>
                        </Form>
                      ) : (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="unpublish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="secondary"
                          >
                            Unpublish
                          </Button>
                        </Form>
                      )}
                      <Button
                        size="sm"
                        asChild
                      >
                        <Link to={`/posts/new?edit=${post.id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        asChild
                      >
                        <Link to={`/posts/${post.slug}`}>
                          View
                        </Link>
                      </Button>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value={post.featured ? "unfeature" : "feature"} />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant={post.featured ? "default" : "outline"}
                          className={post.featured ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        >
                          {post.featured ? "★ Featured" : "☆ Feature"}
                        </Button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </Form>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {posts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Create your first post!</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalPosts)} of {totalPosts} posts
            </div>
            <div className="flex items-center space-x-2">
              {/* Previous Page */}
              {currentPage > 1 && (
                <Button
                size="sm"
                asChild
              >
                <Link to={`/admin?page=${currentPage - 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                  Previous
                </Link>
              </Button>
              )}
              
              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <Link to={`/admin?page=${pageNum}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                        {pageNum}
                      </Link>
                    </Button>
                  );
                })}
              </div>
              
              {/* Next Page */}
              {currentPage < totalPages && (
                <Button
                size="sm"
                asChild
              >
                <Link to={`/admin?page=${currentPage + 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                  Next
                </Link>
              </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}