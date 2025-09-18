import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, User, ArrowLeft } from "lucide-react";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ params, context }: { params: { slug: string }, context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

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
        updatedAt: posts.updatedAt
      })
      .from(posts)
      .where(eq(posts.slug, params.slug))
      .limit(1);

    if (postData.length === 0) {
      throw new Response("Post not found", { status: 404 });
    }

    const post = postData[0];

    return data({
      post
    });
  } catch (error) {
    console.error("Error fetching post from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export default function BlogPostPage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Unable to load the requested blog post at this time.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { post } = loaderData;

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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={post.createdAt.toISOString()}>
              {post.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>


        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>


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