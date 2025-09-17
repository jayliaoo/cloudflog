import { data } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { ArrowRight, CalendarDays, User } from "lucide-react";

export async function loader() {
  // This would normally come from your database
  const featuredPosts = [
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
    }
  ];

  const recentPosts = [
    {
      id: "3",
      title: "Modern CSS with Tailwind",
      slug: "modern-css-tailwind",
      excerpt: "Explore modern CSS development using Tailwind CSS utility-first approach.",
      createdAt: new Date("2024-01-05"),
      author: {
        name: "Mike Johnson"
      },
      tags: [
        { id: "5", name: "CSS", slug: "css" },
        { id: "6", name: "Tailwind", slug: "tailwind" }
      ]
    }
  ];

  return data({ featuredPosts, recentPosts });
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Welcome to My{" "}
          <span className="text-primary">Tech Blog</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Exploring modern web development with React Router 7, Cloudflare Workers, and cutting-edge technologies.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/blog">
              Read Blog
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/about">About Me</Link>
          </Button>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Posts</h2>
          <Button variant="outline" asChild>
            <Link to="/blog">View All Posts</Link>
          </Button>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Featured posts would be mapped here */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600" />
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4" />
                <span>January 15, 2024</span>
              </div>
              <CardTitle>Getting Started with React Router 7</CardTitle>
              <CardDescription>
                Learn how to build modern web applications with React Router 7's new features and improvements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">John Doe</span>
              </div>
              <Button asChild>
                <Link to="/blog/getting-started-react-router-7">Read More</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16">
        <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recent posts would be mapped here */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modern CSS with Tailwind</CardTitle>
              <CardDescription className="text-sm">
                Explore modern CSS development using Tailwind CSS utility-first approach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jan 5, 2024</span>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/blog/modern-css-tailwind">Read</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}