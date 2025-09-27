import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq } from "drizzle-orm";
import PostCard from "~/components/blog/PostCard";
import { createPostsService } from "~/services/posts.service";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;

  try {
    // Create posts service instance
    const postsService = createPostsService(env);

    // Fetch featured and recent posts using the service
    const [featuredPosts, recentPosts] = await Promise.all([
      postsService.getFeaturedPosts(4),
      postsService.getRecentPosts(6)
    ]);

    // Fetch about post data from database (keep this separate as it's specific to homepage)
    const db = getDBClient(env.D1);
    const aboutPostData = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content
      })
      .from(posts)
      .where(eq(posts.slug, 'about'))
      .limit(1);

    // Use database data or fallback to hardcoded data if about post doesn't exist
    const aboutPost = aboutPostData.length > 0 ? aboutPostData[0] : {
      title: "About Me",
      slug: "about",
      excerpt: "Welcome to my corner of the internet where I share my thoughts on technology and development.",
      content: "Welcome to my corner of the internet where I share my thoughts on technology and development."
    };

    return data({ featuredPosts, recentPosts, aboutPost });
  } catch (error) {
    console.error("Error fetching posts from database:", error);
    
    // Return error response instead of fallback data
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}



export default function HomePage() {
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ('error' in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            Welcome to My{" "}
            <span className="text-primary">Tech Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Unable to load content at this time. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const { featuredPosts, recentPosts, aboutPost } = loaderData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* About Section */}
      <section className="py-16 bg-muted/50 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">{aboutPost.title}</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {aboutPost.excerpt}
            </p>
            <Link to={`/posts/${aboutPost.slug}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm items-center transition-colors">
              Learn More About Me
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Posts</h2>
          <Link to="/posts" className="text-slate-900 mb-2 hover:text-indigo-600 transition-colors">View All Posts</Link>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {featuredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Posts</h2>
          <Link to="/posts" className="text-slate-900 mb-2 hover:text-indigo-600 transition-colors">View All Posts</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}