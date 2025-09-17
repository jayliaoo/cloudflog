import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, User, Clock, Tag } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users, tags, postTags } from "~/db/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.DB);

  try {
    // Fetch all published posts with author and tags
    const postsData = await db
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
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt));

    // Fetch tags for each post
    const posts = await Promise.all(
      postsData.map(async (post) => {
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

    // Fetch tags with post counts
    const tagsWithCount = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        count: count(posts.id)
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.id, postTags.tagId))
      .leftJoin(posts, and(eq(postTags.postId, posts.id), eq(posts.published, true)))
      .groupBy(tags.id)
      .orderBy(desc(count(posts.id)));

    return data({ posts, tags: tagsWithCount });
  } catch (error) {
    console.error("Error fetching blog data from database:", error);
    
    // Fallback to static data if database is not available
    const posts = [
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

    const tags = [
      { id: "1", name: "React", slug: "react", count: 5 },
      { id: "2", name: "JavaScript", slug: "javascript", count: 4 }
    ];

    return data({ posts, tags });
  }
}

export default function BlogPage() {
  const { posts, tags } = useLoaderData<typeof loader>();

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
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{post.author.name}</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/blog/${post.slug}`}>
                      Read More
                      <Clock className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/blog/tag/${tag.slug}`}>
                      {tag.name} ({tag.count})
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </div>
  );
}