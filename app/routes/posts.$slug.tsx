import { data, useLoaderData } from "react-router";
import { Link, useParams } from "react-router";
import { CalendarDays, User, ArrowLeft, Tag, Eye } from "lucide-react";
import { getDBClient } from "~/db";
import { posts, tags, postTags, comments, users } from "~/db/schema";
import { eq, lt, gt, desc, asc, and } from "drizzle-orm";
import { marked } from 'marked';
import { CommentsSection } from "~/components/blog/comments-section";
import { getCurrentUser } from "~/auth.server";
import { trackPostView } from "~/utils/view-tracking";
import type { Route } from "./+types/posts.$slug";

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    // Fetch current user
    const user = await getCurrentUser(request, env);

    // Fetch post by slug from database (including "about" post)
    const postData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        viewCount: posts.viewCount
      })
      .from(posts)
      .where(eq(posts.slug, params.slug))
      .limit(1);

    if (postData.length === 0) {
      throw new Response("Post not found", { status: 404 });
    }

    const post = postData[0];

    // Fetch tags for the post
    const postTagsData = await db
      .select({
        tagName: tags.name,
        tagSlug: tags.slug,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(eq(postTags.postId, post.id));

    // Fetch comments for the post
    const postComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        authorName: users.name,
        createdAt: comments.createdAt,
        postId: comments.postId,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .orderBy(comments.createdAt);

    // Fetch previous post (older post)
    const previousPostData = await db
      .select({
        title: posts.title,
        slug: posts.slug,
      })
      .from(posts)
      .where(and(eq(posts.published, true), lt(posts.createdAt, post.createdAt)))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    // Fetch next post (newer post)
    const nextPostData = await db
      .select({
        title: posts.title,
        slug: posts.slug,
      })
      .from(posts)
      .where(and(eq(posts.published, true), gt(posts.createdAt, post.createdAt)))
      .orderBy(asc(posts.createdAt))
      .limit(1);
    const postWithTags = {
      ...post,
      tags: postTagsData.map(pt => pt.tagName),
    };

    // Normalize comment dates to timestamps for CommentsSection
    const processedComments = postComments.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt as any).getTime(),
      // Optional fields can be added later when available
    }));

    // Track view for this post (only for published posts)
    if (post.published) {
      try {
        // Track the view (async, don't await to avoid blocking)
        trackPostView(post.id, env, user?.id).catch(error => 
          console.error("Failed to track post view:", error)
        );
      } catch (error) {
        console.error("Error setting up view tracking:", error);
        // Continue without view tracking - don't break the page
      }
    }

    return data({
      post: postWithTags,
      comments: processedComments,
      user,
      previousPost: previousPostData[0] || null,
      nextPost: nextPostData[0] || null
    });
  } catch (error) {
    console.error("Error fetching post from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export default function BlogPostPage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-lg text-slate-600 mb-4">
            Unable to load the requested blog post at this time.
          </p>
          <Link to="/posts" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium transition">
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  const { post, comments, user, previousPost, nextPost } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Link to="/posts" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-full text-sm font-medium transition flex items-center w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Posts
        </Link>
      </div>

      {/* Post Header */}
      <article>
        <header className="mb-8">
          {post.coverImage && (
            <div className="aspect-video overflow-hidden rounded-lg mb-6">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={post.createdAt.toISOString()}>
              {post.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <div className="flex items-center gap-1 ml-4">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount} views</span>
              </div>
            )}
          </div>
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-medium transition cursor-pointer flex items-center">
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          )}


        </header>

        {/* Post Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert markdown">
          <div dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }} />
        </div>

        {/* Owner Edit Button */}
        {user?.role === 'owner' && (
          <div className="mt-8 flex justify-end">
            <Link to={`/posts/new?edit=${post.id}`} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium transition">
              Edit
            </Link>
          </div>
        )}


      </article>

      {/* Navigation */}
      <nav className="mt-12 flex items-center justify-between">
        {previousPost ? (
          <Link to={`/posts/${previousPost.slug}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Post
          </Link>
        ) : (
          <div></div>
        )}
        {nextPost ? (
          <Link to={`/posts/${nextPost.slug}`} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-sm font-medium transition flex items-center">
            Next Post
            <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Link>
        ) : (
          <div></div>
        )}
      </nav>

      {/* Comments Section */}
      <CommentsSection 
        postId={post.id} 
        comments={comments as any}
        user={user ? { id: user.id, name: user.name ?? "", email: user.email, image: user.image ?? undefined, role: user.role } : null}
      />
    </div>
  );
}