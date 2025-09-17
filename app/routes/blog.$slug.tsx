import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, User, ArrowLeft, Tag } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users, tags, postTags } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ params, context }: { params: { slug: string }, context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.DB);

  try {
    // Fetch post by slug
    const postData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        author: {
          name: users.name,
          image: users.image,
          bio: users.bio
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.slug, params.slug))
      .limit(1);

    if (postData.length === 0) {
      throw new Response("Post not found", { status: 404 });
    }

    const post = postData[0];

    // Fetch tags for the post
    const postTagsData = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id));

    return data({
      post: {
        ...post,
        tags: postTagsData
      }
    });
  } catch (error) {
    console.error("Error fetching post from database:", error);
    
    // Fallback to static data if database is not available
    const post = {
      id: "1",
      title: "Getting Started with React Router 7",
      slug: params.slug,
      content: `
        <p>React Router 7 brings exciting new features and improvements that make building modern web applications easier than ever. In this comprehensive guide, we'll explore the key enhancements and how to leverage them in your projects.</p>
        
        <h2>What's New in React Router 7</h2>
        <p>React Router 7 introduces several groundbreaking features:</p>
        <ul>
          <li>Enhanced data loading capabilities</li>
          <li>Improved TypeScript support</li>
          <li>Better error handling</li>
          <li>Optimized bundle size</li>
        </ul>
        
        <h2>Getting Started</h2>
        <p>To get started with React Router 7, you'll need to install the latest version:</p>
        <pre><code>npm install react-router@latest</code></pre>
        
        <h2>Data Loading</h2>
        <p>One of the most exciting features is the enhanced data loading system. You can now define loaders for your routes that automatically fetch data before rendering:</p>
        
        <h2>Conclusion</h2>
        <p>React Router 7 represents a significant step forward in client-side routing. With its improved performance, better developer experience, and powerful new features, it's an excellent choice for building modern web applications.</p>
      `,
      excerpt: "Learn how to build modern web applications with React Router 7's new features and improvements.",
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop",
      published: true,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      author: {
        name: "John Doe",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        bio: "Full-stack developer passionate about React and modern web technologies."
      },
      tags: [
        { id: "1", name: "React", slug: "react" },
        { id: "2", name: "JavaScript", slug: "javascript" },
        { id: "7", name: "Tutorial", slug: "tutorial" }
      ]
    };

    return data({ post });
  }
}

export default function BlogPostPage() {
  const { post } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>

      {/* Post Header */}
      <article>
        <header className="mb-8">
          {post.coverImage && (
            <div className="aspect-video overflow-hidden rounded-lg mb-6">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              {post.author.image && (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <User className="h-4 w-4" />
              <span>{post.author.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <time dateTime={post.createdAt.toISOString()}>
                {post.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to={`/blog/tag/${tag.slug}`}>
                    <Tag className="mr-1 h-3 w-3" />
                    {tag.name}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Author Bio */}
        {post.author.bio && (
          <Card className="mt-12">
            <CardHeader>
              <div className="flex items-center gap-4">
                {post.author.image && (
                  <img
                    src={post.author.image}
                    alt={post.author.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{post.author.name}</h3>
                  <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </article>

      {/* Navigation */}
      <nav className="mt-12 flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Post
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/blog">
            Next Post
            <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Link>
        </Button>
      </nav>
    </div>
  );
}