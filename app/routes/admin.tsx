import { data, redirect } from "react-router";
import { useLoaderData } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, users } from "~/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.DB);

  try {
    // Fetch all posts with author info for admin dashboard
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        createdAt: posts.createdAt,
        published: posts.published,
        author: {
          name: users.name
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
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
    
    // Fallback to static data if database is not available
    const posts = [
      {
        id: 1,
        title: "Getting Started with React Router v7",
        slug: "getting-started-react-router-v7",
        excerpt: "Learn how to build modern web applications with React Router v7...",
        createdAt: new Date("2024-01-15"),
        published: true,
        author: {
          name: "John Doe"
        }
      }
    ];

    return data({ 
      posts,
      stats: {
        total: 1,
        published: 1,
        drafts: 0
      }
    });
  }
}

export default function Admin() {
  const { posts, stats } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your blog posts and content</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Post
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
                      <span>by {post.author.name}</span>
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