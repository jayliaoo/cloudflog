import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import PostCard from "~/components/blog/PostCard";
import Pagination from "~/components/Pagination";
import { getDBClient } from "~/db";
import { posts, tags, postTags, comments } from "~/db/schema";
import { eq, desc, and, count, sql, isNull } from "drizzle-orm";

export async function loader({
  context,
  request,
}: {
  context: { cloudflare: { env: Env } };
  request: Request;
}) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const postsPerPage = 10;
    const offset = (page - 1) * postsPerPage;

    // Get total count of published posts
    const totalCountResult = await db
      .select({
        count: count(),
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
        commentCount: count(comments.id),
        tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name})`,
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .leftJoin(
        comments,
        and(eq(posts.id, comments.postId), isNull(comments.deletedAt))
      )
      .where(eq(posts.published, true))
      .groupBy(
        posts.id,
        posts.title,
        posts.slug,
        posts.excerpt,
        posts.coverImage,
        posts.createdAt,
        posts.featured,
        posts.viewCount
      )
      .orderBy(desc(posts.featured), desc(posts.createdAt))
      .limit(postsPerPage)
      .offset(offset);

    return data({
      posts: postsData,
      currentPage: page,
      totalPages,
      totalCount,
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
  if ("error" in loaderData) {
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsPerPage={10}
            itemName="posts"
          />
        </div>
      </div>
    </div>
  );
}
