import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CalendarDays, User, Clock, Tag } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch all published posts
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
      .orderBy(desc(posts.createdAt));

    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      postsData.map(async (post) => {
        const postTagsData = await db
          .select({
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(postTags.postId, post.id));

        return {
          ...post,
          tags: postTagsData.map(pt => pt.tagName),
        };
      })
    );

    return data({ posts: postsWithTags });
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
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Unable to load blog posts at this time.
          </p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page or check back later.
          </p>
        </div>
      </div>
    );
  }

  const { posts } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
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
              {!post.coverImage && (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600" />
              )}
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <CardTitle>
                  <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/blog/${post.slug}`}>
                      Read More
                      <Clock className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="mr-2 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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