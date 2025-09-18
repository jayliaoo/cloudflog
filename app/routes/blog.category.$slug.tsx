import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, Clock, Tag, ChevronLeft } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, categories } from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function loader({ params, context }: { 
  params: { slug: string }; 
  context: { cloudflare: { env: Env } } 
}) {
  const { env } = context.cloudflare;
  const { slug } = params;
  const db = getDBClient(env.D1);

  try {
    // First, find the category by slug
    const categoryData = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description
      })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (categoryData.length === 0) {
      return data({ error: "Category not found" }, { status: 404 });
    }

    const category = categoryData[0];

    // Fetch posts for this category
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt
      })
      .from(posts)
      .where(and(eq(posts.published, true), eq(posts.categoryId, category.id)))
      .orderBy(desc(posts.createdAt));

    return data({ posts: postsData, category });
  } catch (error) {
    console.error("Error fetching category posts from database:", error);
    return data({ error: "Failed to fetch category posts" }, { status: 500 });
  }
}

export default function BlogCategoryPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { slug } = useParams();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <p className="text-lg text-muted-foreground mb-4">
            The category you're looking for doesn't exist.
          </p>
          <Button variant="outline" asChild>
            <Link to="/blog">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const { posts, category } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Tag className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-lg text-muted-foreground mt-2">
            {category.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            There are no posts in this category yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                <CardTitle className="text-lg">
                  <Link to={`/blog/${post.slug}`} className="hover:text-primary">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/blog/${post.slug}`}>
                    Read More
                    <Clock className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}