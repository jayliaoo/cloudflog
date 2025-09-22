import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { CalendarDays, Clock, Tag, Hash } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, count, and } from "drizzle-orm";

export async function loader({ 
  context, 
  request,
  params 
}: { 
  context: { cloudflare: { env: Env } },
  request: Request,
  params: { tagSlug: string }
}) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);
  const { tagSlug } = params;

  try {
    // Parse pagination parameters from URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const postsPerPage = 10;
    const offset = (page - 1) * postsPerPage;

    // Get tag info
    const tagInfo = await db
      .select({
        name: tags.name,
        slug: tags.slug
      })
      .from(tags)
      .where(eq(tags.slug, tagSlug))
      .limit(1);

    if (tagInfo.length === 0) {
      return data({ error: "Tag not found" }, { status: 404 });
    }

    const currentTag = tagInfo[0];

    // Get total count of published posts for this tag
    const totalCountResult = await db
      .select({
        count: count(posts.id)
      })
      .from(posts)
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .where(and(
        eq(posts.published, true),
        eq(postTags.tagSlug, tagSlug)
      ));
    
    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / postsPerPage);

    // Fetch paginated posts for this tag
    const postsData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .innerJoin(postTags, eq(posts.id, postTags.postId))
      .where(and(
        eq(posts.published, true),
        eq(postTags.tagSlug, tagSlug)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(postsPerPage)
      .offset(offset);

    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      postsData.map(async (post) => {
        const postTagsData = await db
          .select({
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
          .where(eq(postTags.postId, post.id));

        return {
          ...post,
          tags: postTagsData.map(pt => pt.tagName),
        };
      })
    );

    return data({ 
      posts: postsWithTags,
      currentTag,
      currentPage: page,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error("Error fetching tag posts from database:", error);
    
    return data({ error: "Failed to fetch tag posts" }, { status: 500 });
  }
}

export default function TagPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { tagSlug } = useParams();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Tag Not Found</h1>
          <p className="text-lg text-muted-foreground mb-4">
            The tag "{tagSlug}" could not be found.
          </p>
          <Button asChild>
            <Link to="/tags">Browse All Tags</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { posts, currentTag, currentPage, totalPages, totalCount } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/tags" className="text-sm text-muted-foreground hover:text-primary">
            ← All Tags
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">{currentTag.name}</h1>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalCount} {totalCount === 1 ? 'post' : 'posts'}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          Browse all posts tagged with "{currentTag.name}"
        </p>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="aspect-video object-cover"
              />
            )}
            
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4" />
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <CardTitle>
                <Link to={`/posts/${post.slug}`} className="hover:text-primary">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription>
                {post.excerpt}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button size="sm" asChild>
                  <Link to={`/posts/${post.slug}`}>
                    Read More
                    <Clock className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-6 mt-8">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} posts
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/tag/${currentTag.slug}?page=${Math.max(1, currentPage - 1)}`}
              className={`px-3 py-2 text-sm border rounded-md ${
                currentPage === 1 
                  ? 'pointer-events-none opacity-50' 
                  : 'hover:bg-accent'
              }`}
            >
              Previous
            </Link>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Link
                  key={pageNum}
                  to={`/tag/${currentTag.slug}?page=${pageNum}`}
                  className={`px-3 py-2 text-sm border rounded-md ${
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            
            <Link
              to={`/tag/${currentTag.slug}?page=${Math.min(totalPages, currentPage + 1)}`}
              className={`px-3 py-2 text-sm border rounded-md ${
                currentPage === totalPages 
                  ? 'pointer-events-none opacity-50' 
                  : 'hover:bg-accent'
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">
            There are no posts tagged with "{currentTag.name}" yet.
          </p>
          <Button asChild>
            <Link to="/posts">Browse All Posts</Link>
          </Button>
        </div>
      )}
    </div>
  );
}