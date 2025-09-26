import { data, useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, User, Tag, MessageCircle, Eye } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users, tags, postTags, comments } from "~/db/schema";
import { eq, desc, and, isNotNull, sql, count, isNull } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch featured posts with tags, comment count, and view count
    const featuredPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        viewCount: posts.viewCount,
        tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name})`,
        commentCount: sql<number>`COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END)`
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(and(
        eq(posts.published, true),
        eq(posts.featured, true)
      ))
      .groupBy(posts.id, posts.title, posts.slug, posts.excerpt, posts.createdAt, posts.viewCount)
      .orderBy(desc(posts.createdAt))
      .limit(4);

    // Fetch recent posts (latest published posts) with tags, comment count, and view count
    const recentPostsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        viewCount: posts.viewCount,
        tags: sql<string>`GROUP_CONCAT(DISTINCT ${tags.name})`,
        commentCount: sql<number>`COUNT(DISTINCT CASE WHEN ${comments.deletedAt} IS NULL THEN ${comments.id} END)`
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagSlug, tags.slug))
      .leftJoin(comments, eq(posts.id, comments.postId))
      .where(eq(posts.published, true))
      .groupBy(posts.id, posts.title, posts.slug, posts.excerpt, posts.createdAt, posts.viewCount)
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
  
  const tagNames = tagsString.split(',').filter(tag => tag.trim());
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
            <Link to={`/posts/${aboutPost.slug}`}>
              Learn More About Me
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Posts</h2>
          <Link to="/posts">View All Posts</Link>
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
                <Link to={`/posts/${post.slug}`} className="no-underline">
                  <CardTitle className="hover:text-primary transition-colors cursor-pointer">{post.title}</CardTitle>
                </Link>
                <Link to={`/posts/${post.slug}`} className="no-underline">
                  <CardDescription className="hover:text-foreground transition-colors cursor-pointer">
                    {post.excerpt}
                  </CardDescription>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentCount || 0}</span>
                    </div>
                  </div>
                  <Link to={`/posts/${post.slug}`}>Read More</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Posts</h2>
          <Link to="/posts">View All Posts</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {recentPosts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                {renderTags(post.tags)}
                <Link to={`/posts/${post.slug}`} className="no-underline">
                  <CardTitle className="text-lg hover:text-primary transition-colors cursor-pointer">{post.title}</CardTitle>
                </Link>
                <Link to={`/posts/${post.slug}`} className="no-underline">
                  <CardDescription className="text-sm hover:text-foreground transition-colors cursor-pointer">
                    {post.excerpt}
                  </CardDescription>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{post.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <Link to={`/posts/${post.slug}`}>Read</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}