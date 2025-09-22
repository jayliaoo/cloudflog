import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { desc, eq, inArray, count } from "drizzle-orm";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
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
  const featuredFilter = url.searchParams.get('featured'); // 'all', 'featured', 'unfeatured'
  
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
  
  // Apply status filter
  if (statusFilter === 'published') {
    postsQuery = postsQuery.where(eq(posts.published, true));
  } else if (statusFilter === 'draft') {
    postsQuery = postsQuery.where(eq(posts.published, false));
  }
  
  // Apply featured filter
  if (featuredFilter === 'featured') {
    postsQuery = postsQuery.where(eq(posts.featured, true));
  } else if (featuredFilter === 'unfeatured') {
    postsQuery = postsQuery.where(eq(posts.featured, false));
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
      postsQuery = postsQuery.where(inArray(posts.id, postIds));
    } else {
      // No posts have this tag, return empty result
      return data({ 
        posts: [], 
        allTags, 
        user, 
        currentTag: tagFilter, 
        currentStatus: statusFilter,
        currentFeatured: featuredFilter,
        currentPage: page,
        totalPages: 0,
        totalPosts: 0
      });
    }
  }
  
  // Get total count for pagination
  const totalCountResult = await postsQuery;
  const totalCount = totalCountResult.length;
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
    currentTag: tagFilter, 
    currentStatus: statusFilter,
    currentFeatured: featuredFilter,
    currentPage: page,
    totalPages,
    totalPosts: totalCount,
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
    console.error("Error processing post action:", error);
    return data({ error: "Failed to process action" }, { status: 500 });
  }
}

export default function AdminPosts({ loaderData }: { loaderData: any }) {
  const { posts, allTags, currentTag, currentStatus, currentFeatured, currentPage, totalPages, totalPosts } = loaderData as { 
    posts: any[], 
    allTags: any[], 
    currentTag: string | null, 
    currentStatus: string | null,
    currentFeatured: string | null,
    currentPage: number,
    totalPages: number,
    totalPosts: number
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild>
            <Link to="/posts/new">Create New Post</Link>
          </Button>
        </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
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
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Posts</option>
          <option value="published">Published Only</option>
          <option value="draft">Draft Only</option>
        </select>
        
        {/* Featured Filter */}
        <select
          value={currentFeatured || 'all'}
          onChange={(e) => {
            const newFeatured = e.target.value;
            const url = new URL(window.location.href);
            if (newFeatured === 'all') {
              url.searchParams.delete('featured');
            } else {
              url.searchParams.set('featured', newFeatured);
            }
            window.location.href = url.toString();
          }}
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Posts</option>
          <option value="featured">Featured Only</option>
          <option value="unfeatured">Unfeatured Only</option>
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
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.name}
            </option>
          ))}
        </select>
        
        {/* Clear Filters */}
        {(currentTag || currentStatus || currentFeatured) && (
          <Button size="sm" asChild>
            <Link to="/admin/posts">Clear Filters</Link>
          </Button>
        )}
      </div>
      
      {/* Posts List */}
      <Card>
        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium truncate">
                        <Link to={`/posts/${post.slug}`} className="hover:text-primary">
                          {post.title}
                        </Link>
                      </h3>
                      {!post.published && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {post.featured && (
                        <Badge variant="default" className="bg-yellow-500">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created: {new Date(post.createdAt).toLocaleDateString()}
                      {post.updatedAt !== post.createdAt && (
                        <> • Updated: {new Date(post.updatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!post.published ? (
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="publish" />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="sm" variant="default">
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </Button>
                      </Form>
                    ) : (
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="unpublish" />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish
                        </Button>
                      </Form>
                    )}
                    
                    {post.featured ? (
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="unfeature" />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <Star className="h-4 w-4 mr-1" />
                          Unfeature
                        </Button>
                      </Form>
                    ) : (
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="feature" />
                        <input type="hidden" name="postId" value={post.id} />
                        <Button type="submit" size="sm" variant="outline">
                          <Star className="h-4 w-4 mr-1" />
                          Feature
                        </Button>
                      </Form>
                    )}
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/posts/new?edit=${post.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    
                    <Form method="post" className="inline">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="postId" value={post.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          {/* Previous Page */}
          {currentPage > 1 && (
            <Button
              size="sm"
              asChild
            >
              <Link to={`/admin/posts?page=${currentPage - 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentFeatured && currentFeatured !== 'all' ? `&featured=${currentFeatured}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
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
                  <Link to={`/admin/posts?page=${pageNum}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentFeatured && currentFeatured !== 'all' ? `&featured=${currentFeatured}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
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
              <Link to={`/admin/posts?page=${currentPage + 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentFeatured && currentFeatured !== 'all' ? `&featured=${currentFeatured}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}