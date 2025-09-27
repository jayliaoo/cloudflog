import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import PostCard from "~/components/blog/PostCard";
import Pagination from "~/components/Pagination";
import { createPostsService } from "~/services/posts.service";

export async function loader({
  context,
  request,
}: {
  context: { cloudflare: { env: Env } };
  request: Request;
}) {
  const { env } = context.cloudflare;

  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const postsPerPage = 10;

    // Create posts service instance
    const postsService = createPostsService(env);

    // Fetch paginated posts using the service
    const result = await postsService.getPostsPage(page, postsPerPage);

    return data({
      posts: result.posts,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalCount: result.totalCount,
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
