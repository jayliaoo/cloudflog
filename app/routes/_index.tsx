import { data, useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users } from "~/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch featured posts (with cover images)
    const featuredPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        author: {
          name: users.name,
          image: users.image
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.published, true),
        isNotNull(posts.coverImage)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(4);

    // Fetch recent posts (latest published posts)
    const recentPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        author: {
          name: users.name
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(6);

    const featuredPosts = featuredPostsData;
    const recentPosts = recentPostsData;

    return data({ featuredPosts, recentPosts });
  } catch (error) {
    console.error("Error fetching posts from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export default function HomePage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            Welcome to My{" "}
            <span className="text-primary">Tech Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Unable to load content at this time. Please try refreshing the page.
          </p>
          <Button size="lg" asChild>
            <Link to="/about">About Me</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { featuredPosts, recentPosts } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Welcome to My{" "}
          <span className="text-primary">Tech Blog</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Exploring modern web development with React Router 7, Cloudflare Workers, and cutting-edge technologies.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/posts">
              Read Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Posts</h2>
          <Button variant="secondary" asChild>
            <Link to="/posts">View All Posts</Link>
          </Button>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {featuredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-video object-cover"
                />
              )}
              {!post.coverImage && (
                <div className="aspect-video bg-gradient-to-br from-yellow-400 to-orange-500" />
              )}
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{post.author.name}</span>
                </div>
                <Button asChild>
                  <Link to={`/posts/${post.slug}`}>Read More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16">
        <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {recentPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="text-sm">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Button size="sm" asChild>
                    <Link to={`/posts/${post.slug}`}>Read</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}