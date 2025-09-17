import { data, redirect } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

export async function loader() {
  // Mock data for now - in a real app, this would come from D1 database
  const posts = [
    {
      id: 1,
      title: "Getting Started with React Router v7",
      slug: "getting-started-react-router-v7",
      excerpt: "Learn how to build modern web applications with React Router v7...",
      date: "2024-01-15",
      published: true,
      views: 1250
    },
    {
      id: 2,
      title: "Building with Cloudflare Workers",
      slug: "building-with-cloudflare-workers",
      excerpt: "Discover the power of edge computing with Cloudflare Workers...",
      date: "2024-01-10",
      published: true,
      views: 890
    },
    {
      id: 3,
      title: "Modern CSS with Tailwind",
      slug: "modern-css-with-tailwind",
      excerpt: "Master utility-first CSS development with Tailwind CSS...",
      date: "2024-01-05",
      published: false,
      views: 0
    }
  ];

  return data({ posts });
}

export default function Admin() {
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
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">2,140</div>
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
              {[
                {
                  id: 1,
                  title: "Getting Started with React Router v7",
                  slug: "getting-started-react-router-v7",
                  excerpt: "Learn how to build modern web applications with React Router v7...",
                  date: "2024-01-15",
                  published: true,
                  views: 1250
                },
                {
                  id: 2,
                  title: "Building with Cloudflare Workers",
                  slug: "building-with-cloudflare-workers",
                  excerpt: "Discover the power of edge computing with Cloudflare Workers...",
                  date: "2024-01-10",
                  published: true,
                  views: 890
                },
                {
                  id: 3,
                  title: "Modern CSS with Tailwind",
                  slug: "modern-css-with-tailwind",
                  excerpt: "Master utility-first CSS development with Tailwind CSS...",
                  date: "2024-01-05",
                  published: false,
                  views: 0
                }
              ].map((post) => (
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
                      <span>{post.date}</span>
                      <span>{post.views} views</span>
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