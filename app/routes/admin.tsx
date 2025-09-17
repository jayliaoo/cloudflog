import { data, redirect } from "react-router";
import { useLoaderData } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { desc } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch all posts for admin dashboard (without author info)
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        published: posts.published
      })
      .from(posts)
      .orderBy(desc(posts.createdAt));

    // Get post counts for stats
    const totalPosts = postsData.length;
    const publishedPosts = postsData.filter(p => p.published).length;
    const draftPosts = postsData.filter(p => !p.published).length;

    return data({ 
      posts: postsData,
      stats: {
        total: totalPosts,
        published: publishedPosts,
        drafts: draftPosts
      }
    });
  } catch (error) {
    console.error("Error fetching admin data from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}

export default function Admin() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard Error</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Unable to load admin dashboard data at this time.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please check your database connection and try again.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { posts, stats } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <Button asChild>
          <Link to="/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.published}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.drafts}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">-</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{post.title}</h3>
                      {post.published ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Published</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{new Date(post.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}