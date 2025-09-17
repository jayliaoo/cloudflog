import { data, useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users, postTags, tags } from "~/db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch featured posts (published posts with cover images)
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
        },
        tags: []
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
        },
        tags: []
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(6);

    // Fetch tags for each post
    const featuredPosts = await Promise.all(
      featuredPostsData.map(async (post) => {
        const postTagsData = await db
          .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(postTags.postId, post.id));

        return {
          ...post,
          tags: postTagsData
        };
      })
    );

    const recentPosts = await Promise.all(
      recentPostsData.map(async (post) => {
        const postTagsData = await db
          .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(postTags.postId, post.id));

        return {
          ...post,
          tags: postTagsData
        };
      })
    );

    return data({ featuredPosts, recentPosts });
  } catch (error) {
    console.error("Error fetching posts from database:", error);
    
    // Fallback to static data if database is not available
    const featuredPosts = [
      {
        id: "1",
        title: "Getting Started with React Router 7",
        slug: "getting-started-react-router-7",
        excerpt: "Learn how to build modern web applications with React Router 7's new features and improvements.",
        coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
        createdAt: new Date("2024-01-15"),
        author: {
          name: "John Doe",
          image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
        },
        tags: [
          { id: "1", name: "React", slug: "react" },
          { id: "2", name: "JavaScript", slug: "javascript" }
        ]
      }
    ];

    const recentPosts = [
      {
        id: "3",
        title: "Modern CSS with Tailwind",
        slug: "modern-css-tailwind",
        excerpt: "Explore modern CSS development using Tailwind CSS utility-first approach.",
        createdAt: new Date("2024-01-05"),
        author: {
          name: "Mike Johnson"
        },
        tags: [
          { id: "5", name: "CSS", slug: "css" },
          { id: "6", name: "Tailwind", slug: "tailwind" }
        ]
      }
    ];

    return data({ featuredPosts, recentPosts });
  }
}

export default function HomePage() {
  const { featuredPosts, recentPosts } = useLoaderData<typeof loader>();

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
            <Link to="/blog">
              Read Blog
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Posts</h2>
          <Button variant="outline" asChild>
            <Link to="/blog">View All Posts</Link>
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
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600" />
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
                  <Link to={`/blog/${post.slug}`}>Read More</Link>
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
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/blog/${post.slug}`}>Read</Link>
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