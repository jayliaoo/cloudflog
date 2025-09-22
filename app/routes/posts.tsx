import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import PostCard from "~/components/blog/PostCard";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export async function loader({ 
  context, 
  request 
}: { 
  context: { cloudflare: { env: Env } },
  request: Request
}) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const postsPerPage = 10;
    const offset = (page - 1) * postsPerPage;

    // Get total count of published posts
    const totalCountResult = await db
      .select({
        count: count()
      })
      .from(posts)
      .where(eq(posts.published, true));
    
    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / postsPerPage);

    // Fetch published posts with pagination (excluding featured posts if any)
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        featured: posts.featured,
        viewCount: posts.viewCount,
        tags: sql<string>`GROUP_CONCAT(${tags.name}, ', ')`
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(eq(posts.published, true))
      .groupBy(posts.id, posts.title, posts.slug, posts.excerpt, posts.coverImage, posts.createdAt, posts.featured, posts.viewCount)
      .orderBy(desc(posts.featured), desc(posts.createdAt))
      .limit(postsPerPage)
      .offset(offset);

    return data({ 
      posts: postsData,
      currentPage: page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error("Error fetching blog data from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch blog data" }, { status: 500 });
  }
}

export default function BlogPage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Posts</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Unable to load blog posts at this time.
          </p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or check back later.
          </p>
        </div>
      </div>
    );
  }

  const { posts, currentPage, totalPages, totalCount } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Posts</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Regular Posts */}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} posts
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`?page=${Math.max(1, currentPage - 1)}`}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    currentPage === 1 
                      ? 'pointer-events-none opacity-50' 
                      : 'hover:bg-accent'
                  }`}
                >
                  Previous
                </Link>
                
                {/* Page numbers */}
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
                      to={`?page=${pageNum}`}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                
                <Link
                  to={`?page=${Math.min(totalPages, currentPage + 1)}`}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    currentPage === totalPages 
                      ? 'pointer-events-none opacity-50' 
                      : 'hover:bg-accent'
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}