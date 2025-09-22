import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tag, Hash } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Get all tags with post counts
    const tagsWithCounts = await db
      .select({
        tagName: tags.name,
        tagSlug: tags.slug,
        postCount: count(posts.id)
      })
      .from(tags)
      .leftJoin(postTags, eq(tags.slug, postTags.tagSlug))
      .leftJoin(posts, eq(postTags.postId, posts.id))
      .where(eq(posts.published, true))
      .groupBy(tags.slug, tags.name)
      .orderBy(desc(count(posts.id)));

    return data({ tags: tagsWithCounts });
  } catch (error) {
    console.error("Error fetching tags data from database:", error);
    
    return data({ error: "Failed to fetch tags data" }, { status: 500 });
  }
}

export default function TagsPage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tags</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Unable to load tags at this time.
          </p>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page or check back later.
          </p>
        </div>
      </div>
    );
  }

  const { tags } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Tags</h1>
        <p className="text-lg text-muted-foreground">
          Browse posts by tags. Click on a tag to view all posts associated with it.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.tagSlug} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    <Link 
                      to={`/tag/${tag.tagSlug}`} 
                      className="hover:text-primary transition-colors"
                    >
                      {tag.tagName}
                    </Link>
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {tag.postCount} {tag.postCount === 1 ? 'post' : 'posts'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Link 
                  to={`/tag/${tag.tagSlug}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View posts
                  <Hash className="h-3 w-3" />
                </Link>
                <Badge variant="outline" className="text-xs">
                  #{tag.tagSlug}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tags found</h3>
          <p className="text-muted-foreground">
            There are no tags with published posts at the moment.
          </p>
        </div>
      )}
    </div>
  );
}