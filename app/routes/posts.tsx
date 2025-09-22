import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CalendarDays, User, Clock, Tag } from "lucide-react";
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

    // Fetch paginated published posts
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(postsPerPage)
      .offset(offset);

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

    return data({ 
      posts: postsWithTags,
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
        <p className="text-lg text-muted-foreground">
          Thoughts on web development, cloud computing, and modern technologies.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-video object-cover"
                />
              )}
             
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <CardTitle>
                  <Link to={`/posts/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Button size="sm" asChild>
                    <Link to={`/posts/${post.slug}`}>
                      Read More
                      <Clock className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-4">
                    {post.tags.map((tag) => (
                      <Link key={tag} to={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Badge variant="secondary" className="mr-2 text-xs hover:bg-secondary/80 cursor-pointer">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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

        {/* Sidebar */}
        <div className="space-y-8">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Welcome to my tech blog where I share insights on modern web development,
                cloud technologies, and programming best practices.
              </p>
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  React
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  JavaScript
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  Web Development
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  Cloud
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  Tutorial
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}