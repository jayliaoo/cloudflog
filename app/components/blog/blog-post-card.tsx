import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CalendarDays, User, Clock } from "lucide-react";

interface BlogPostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    coverImage?: string | null;
    createdAt: Date;
    author: {
      name?: string | null;
      image?: string | null;
    };
    tags?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {post.coverImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <CalendarDays className="h-4 w-4" />
          <time dateTime={post.createdAt.toISOString()}>
            {post.createdAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <CardTitle className="line-clamp-2">
          <Link to={`/blog/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {post.excerpt || 'No excerpt available'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.author.image && (
              <img
                src={post.author.image}
                alt={post.author.name || 'Author'}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div className="text-sm text-muted-foreground">
              <User className="h-4 w-4 inline mr-1" />
              {post.author.name || 'Unknown Author'}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/blog/${post.slug}`}>
              Read More
              <Clock className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {post.tags && post.tags.length > 0 && (
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
  );
}