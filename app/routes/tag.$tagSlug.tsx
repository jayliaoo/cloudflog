import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { Hash, Tag } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import PostCard from "~/components/blog/PostCard";
import Pagination from "~/components/Pagination";

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
          <Link 
            to="/tags"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Browse All Tags
          </Link>
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
          <Hash className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold">{currentTag.name}</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-medium bg-slate-100 text-slate-800">
            {totalCount} {totalCount === 1 ? 'post' : 'posts'}
          </span>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          Browse all posts tagged with "{currentTag.name}"
        </p>
      </div>

      <div className="space-y-8">
        {posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={{
              ...post,
              excerpt: post.excerpt || "",
              createdAt: post.createdAt.toISOString()
            }} 
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={10}
        itemName="posts"
        baseUrl={`/tag/${currentTag.slug}`}
      />

      {posts.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-muted-foreground mb-4">
            There are no posts tagged with "{currentTag.name}" yet.
          </p>
          <Link 
            to="/posts"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Browse All Posts
          </Link>
        </div>
      )}
    </div>
  );
}