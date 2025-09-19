import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { Form, Link } from "react-router";

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
  
  // Build base query for posts
  let postsQuery = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      published: posts.published,
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
    totalPosts: totalCount
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
  
  if (!postId || !intent || !["publish", "unpublish", "delete"].includes(intent as string)) {
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
  const { posts, user, allTags, currentTag, currentStatus, currentPage, totalPages, totalPosts } = loaderData as { 
    posts: any[], 
    user: any, 
    allTags: any[], 
    currentTag: string | null, 
    currentStatus: string | null,
    currentPage: number,
    totalPages: number,
    totalPosts: number
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        
        {/* Active Filters Display */}
        {(currentTag || currentStatus) && (
          <div className="mb-4 flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filtered by:</span>
            {currentStatus && currentStatus !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Status: {currentStatus === 'published' ? 'Published' : 'Draft'}
              </span>
            )}
            {currentTag && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Tag: {allTags.find(t => t.slug === currentTag)?.name || currentTag}
              </span>
            )}
            <span className="text-sm text-gray-500">({posts.length} posts)</span>
          </div>
        )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{posts.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Published Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {posts.filter(post => post.published).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Draft Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {posts.filter(post => !post.published).length}
              </dd>
            </div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Link
            to="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Post
          </Link>
          
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
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
              <Link
                to="/admin"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </Link>
            )}
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {post.excerpt && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {post.tags.map((tag: string) => (
                            <Link
                              key={tag}
                              to={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            >
                              {tag}
                            </Link>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-sm text-gray-400">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!post.published ? (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="publish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Publish
                          </button>
                        </Form>
                      ) : (
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="unpublish" />
                          <input type="hidden" name="postId" value={post.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            Unpublish
                          </button>
                        </Form>
                      )}
                      <Link
                        to={`/posts/new?edit=${post.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View
                      </Link>
                      <Form method="post" className="inline">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="postId" value={post.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          onClick={(e) => {
                            if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Create your first post!</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalPosts)} of {totalPosts} posts
            </div>
            <div className="flex items-center space-x-2">
              {/* Previous Page */}
              {currentPage > 1 && (
                <Link
                  to={`/admin?page=${currentPage - 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Previous
                </Link>
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
                    <Link
                      key={pageNum}
                      to={`/admin?page=${pageNum}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              
              {/* Next Page */}
              {currentPage < totalPages && (
                <Link
                  to={`/admin?page=${currentPage + 1}${currentStatus && currentStatus !== 'all' ? `&status=${currentStatus}` : ''}${currentTag ? `&tag=${currentTag}` : ''}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}