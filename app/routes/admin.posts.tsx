import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts, postTags } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Form, Link } from "react-router";
import { Edit, Trash2, Eye, EyeOff, Star } from "lucide-react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";
import Pagination from "~/components/Pagination";
import { createPostsService } from "~/services/posts.service";

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
  const searchQuery = url.searchParams.get('search');
  
  // Get pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const postsPerPage = 10; // Number of posts per page
  
  // Create posts service instance
  const postsService = createPostsService(env);
  
  // Fetch all available tags for filter dropdown
  const allTags = await postsService.getTagsWithPostCounts();
  
  // Map status filter to service format
  let status: 'all' | 'published' | 'draft' = 'all';
  if (statusFilter === 'published') status = 'published';
  else if (statusFilter === 'draft') status = 'draft';
  
  // Map featured filter to service format
  let featured: 'all' | 'featured' | 'unfeatured' = 'all';
  if (featuredFilter === 'featured') featured = 'featured';
  else if (featuredFilter === 'unfeatured') featured = 'unfeatured';
  
  // Use the posts service to get admin posts
  const result = await postsService.getAdminPosts({
    page,
    postsPerPage,
    status,
    featured,
    tagSlug: tagFilter || undefined,
    searchQuery: searchQuery || undefined,
  });
  
  return data({ 
     posts: result.posts, 
     allTags, 
     currentTag: tagFilter, 
     currentStatus: statusFilter,
     currentFeatured: featuredFilter,
     currentSearch: searchQuery,
     currentPage: result.currentPage,
     totalPages: result.totalPages,
     totalPosts: result.totalCount,
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
  const { posts, allTags, currentTag, currentStatus, currentFeatured, currentSearch, currentPage, totalPages, totalPosts } = loaderData as { 
    posts: any[], 
    allTags: any[], 
    currentTag: string | null, 
    currentStatus: string | null,
    currentFeatured: string | null,
    currentSearch: string | null,
    currentPage: number,
    totalPages: number,
    totalPosts: number
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">

      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="w-63">
          <input
            type="text"
            placeholder="Search posts by title or content..."
            defaultValue={currentSearch || ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const searchValue = (e.target as HTMLInputElement).value;
                const url = new URL(window.location.href);
                if (searchValue.trim()) {
                  url.searchParams.set('search', searchValue.trim());
                } else {
                  url.searchParams.delete('search');
                }
                url.searchParams.delete('page'); // Reset to first page when searching
                window.location.href = url.toString();
              }
            }}
            className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="w-63">
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
            className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Posts</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Only</option>
          </select>
        </div>
        
        {/* Featured Filter */}
        <div className="w-63">
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
            className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Posts</option>
            <option value="featured">Featured Only</option>
            <option value="unfeatured">Unfeatured Only</option>
          </select>
        </div>
        
        {/* Tag Filter */}
        <div className="w-63">
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
            className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Clear Filters - Always Visible */}
        <Link to="/admin/posts">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition">
            Clear Filters
          </button>
        </Link>
      </div>
      
      {/* Posts Table */}
      <div className="rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Tags</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Updated</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Link to={`/posts/${post.slug}`} className="font-medium hover:text-primary truncate max-w-xs">
                          {post.title}
                        </Link>
                        {post.featured && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {post.tags ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {post.tags.split(',').slice(0, 2).map((tag: string) => (
                          <span key={tag.trim()} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-background text-foreground">
                            {tag.trim()}
                          </span>
                        ))}
                        {post.tags.split(',').length > 2 && (
                          <span className="text-xs text-muted-foreground">+{post.tags.split(',').length - 2} more</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {post.updatedAt !== post.createdAt ? new Date(post.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-1">
                      {!post.published ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="publish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-2">
                            <Eye className="h-3 w-3" />
                          </button>
                        </Form>
                      ) : (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="unpublish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2">
                            <EyeOff className="h-3 w-3" />
                          </button>
                        </Form>
                      )}
                      
                      {post.featured ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="unfeature" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2">
                            <Star className="h-3 w-3 fill-current" />
                          </button>
                        </Form>
                      ) : (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="feature" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2">
                            <Star className="h-3 w-3" />
                          </button>
                        </Form>
                      )}
                      
                      <Link 
                        to={`/posts/new?edit=${post.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Link>
                      
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="postId" value={post.id} />
                        <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-2">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No posts found.
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalPosts}
        itemsPerPage={10}
        itemName="posts"
        baseUrl="/admin/posts"
        searchParams={(() => {
          const params = new URLSearchParams();
          if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus);
          if (currentFeatured && currentFeatured !== 'all') params.set('featured', currentFeatured);
          if (currentTag) params.set('tag', currentTag);
          if (currentSearch) params.set('search', currentSearch);
          return params;
        })()}
      />
      </div>
    </AdminLayout>
  );
}