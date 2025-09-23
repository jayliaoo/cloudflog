import { data, useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, User, Tag } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users, tags, postTags } from "~/db/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch featured posts with tags
    const featuredPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        tags: sql<string>`GROUP_CONCAT(${tags.name}, ', ')`
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(and(
        eq(posts.published, true),
        eq(posts.featured, true)
      ))
      .groupBy(posts.id, posts.title, posts.slug, posts.excerpt, posts.createdAt)
      .orderBy(desc(posts.createdAt))
      .limit(4);

    // Fetch recent posts (latest published posts) with tags
    const recentPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        tags: sql<string>`GROUP_CONCAT(${tags.name}, ', ')`
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(eq(posts.published, true))
      .groupBy(posts.id, posts.title, posts.slug, posts.excerpt, posts.createdAt)
      .orderBy(desc(posts.createdAt))
      .limit(6);

    // Fetch about post data from database
    const aboutPostData = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content
      })
      .from(posts)
      .where(eq(posts.slug, 'about'))
      .limit(1);

    // Use database data or fallback to hardcoded data if about post doesn't exist
    const aboutPost = aboutPostData.length > 0 ? aboutPostData[0] : {
      title: "About Me",
      slug: "about",
      excerpt: "Welcome to my corner of the internet where I share my thoughts on technology and development.",
      content: "Welcome to my corner of the internet where I share my thoughts on technology and development."
    };

    const featuredPosts = featuredPostsData;
    const recentPosts = recentPostsData;

    return data({ featuredPosts, recentPosts, aboutPost });
  } catch (error) {
    console.error("Error fetching posts from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// Helper function to render tags
function renderTags(tagsString: string | null) {
  if (!tagsString) return null;
  
  const tagNames = tagsString.split(', ').filter(tag => tag.trim());
  if (tagNames.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tagNames.map((tagName) => {
        // Convert tag name to slug for URL (tags are already stored as slugs in the database)
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return (
          <Link
            key={tagName}
            to={`/tag/${tagSlug}`}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors no-underline"
          >
            <Tag className="h-3 w-3 mr-1" />
            {tagName}
          </Link>
        );
      })}
    </div>
  );
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

  const { featuredPosts, recentPosts, aboutPost } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* About Section */}
      <section className="py-16 bg-muted/50 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">{aboutPost.title}</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {aboutPost.excerpt}
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link to={`/posts/${aboutPost.slug}`}>
                Learn More About Me
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
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
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {renderTags(post.tags)}
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Posts</h2>
          <Button variant="secondary" asChild>
            <Link to="/posts">View All Posts</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {recentPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                {renderTags(post.tags)}
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