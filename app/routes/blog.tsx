import { data } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, User, Clock, Tag } from "lucide-react";

export async function loader() {
  // This would normally come from your database
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
    },
    {
      id: "2",
      title: "Building with Cloudflare Workers",
      slug: "building-cloudflare-workers",
      excerpt: "Discover how to create scalable applications using Cloudflare Workers and edge computing.",
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
      createdAt: new Date("2024-01-10"),
      author: {
        name: "Jane Smith",
        image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face"
      },
      tags: [
        { id: "3", name: "Cloudflare", slug: "cloudflare" },
        { id: "4", name: "Edge Computing", slug: "edge-computing" }
      ]
    },
    {
      id: "3",
      title: "Modern CSS with Tailwind",
      slug: "modern-css-tailwind",
      excerpt: "Explore modern CSS development using Tailwind CSS utility-first approach.",
      coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      createdAt: new Date("2024-01-05"),
      author: {
        name: "Mike Johnson",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
      },
      tags: [
        { id: "5", name: "CSS", slug: "css" },
        { id: "6", name: "Tailwind", slug: "tailwind" }
      ]
    }
  ];

  const tags = [
    { id: "1", name: "React", slug: "react", count: 5 },
    { id: "2", name: "JavaScript", slug: "javascript", count: 4 },
    { id: "3", name: "Cloudflare", slug: "cloudflare", count: 3 },
    { id: "4", name: "Edge Computing", slug: "edge-computing", count: 2 },
    { id: "5", name: "CSS", slug: "css", count: 3 },
    { id: "6", name: "Tailwind", slug: "tailwind", count: 2 }
  ];

  return data({ posts, tags });
}

export default function BlogPage() {
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
          {/* Blog posts would be mapped here */}
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600" />
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>January {20 - i * 5}, 2024</span>
                </div>
                <CardTitle>
                  <Link to={`/blog/post-${i}`} className="hover:text-primary">
                    Blog Post Title {i}
                  </Link>
                </CardTitle>
                <CardDescription>
                  This is a sample blog post excerpt that gives readers a preview of what the article is about.
                  It's designed to be engaging and informative while being concise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Author Name</span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/blog/post-${i}`}>
                      Read More
                      <Clock className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {["React", "JavaScript", "Web Development"].slice(0, i + 1).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
                {["React", "JavaScript", "Cloudflare", "CSS", "Tailwind"].map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/blog/tag/${tag.toLowerCase()}`}>
                      {tag}
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