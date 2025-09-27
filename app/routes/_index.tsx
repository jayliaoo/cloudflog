import { data, useLoaderData } from "react-router";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq } from "drizzle-orm";
import PostCard from "~/components/blog/PostCard";
import { createPostsService } from "~/services/posts.service";
import {
  detectLanguageFromRequest,
  createServerTranslator,
} from "~/utils/server-i18n";

export async function loader({
  request,
  context,
}: {
  request: Request;
  context: { cloudflare: { env: Env } };
}) {
  const { env } = context.cloudflare;

  try {
    // Detect language from request
    const language = detectLanguageFromRequest(request);
    const t = createServerTranslator(language);

    // Create posts service instance
    const postsService = createPostsService(env);

    // Fetch featured and recent posts using the service
    const [featuredPosts, recentPosts] = await Promise.all([
      postsService.getFeaturedPosts(4),
      postsService.getRecentPosts(6),
    ]);

    // Fetch about post data from database (keep this separate as it's specific to homepage)
    const db = getDBClient(env.D1);
    const aboutPostData = await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
      })
      .from(posts)
      .where(eq(posts.slug, "about"))
      .limit(1);

    // Use database data or fallback to translated default data if about post doesn't exist
    const aboutPost =
      aboutPostData.length > 0
        ? aboutPostData[0]
        : {
            title: t("about.title"),
            slug: "about",
            excerpt: t("about.description"),
          };

    return data({ featuredPosts, recentPosts, aboutPost });
  } catch (error) {
    console.error("Error fetching posts from database:", error);

    // Detect language for error message translation
    const language = detectLanguageFromRequest(request);
    const t = createServerTranslator(language);

    // Return error response with translated error message
    return data({ error: t("home.failedToFetchBlogData") }, { status: 500 });
  }
}

export default function HomePage() {
  const { t } = useTranslation();
  const loaderData = useLoaderData<typeof loader>();

  // Handle error case
  if ("error" in loaderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-6">
            {t("home.welcome")}{" "}
            <span className="text-primary">{t("home.techBlog")}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t(loaderData.error)}
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
            <h2 className="text-3xl font-bold mb-6">
              {aboutPost.title.startsWith("home.about.")
                ? t(aboutPost.title)
                : aboutPost.title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {aboutPost.excerpt && aboutPost.excerpt.startsWith("home.about.")
                ? t(aboutPost.excerpt)
                : aboutPost.excerpt}
            </p>
            <Link
              to={`/posts/${aboutPost.slug}`}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm items-center transition-colors"
            >
              {t("home.learnMore")}
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">{t("home.featuredPosts")}</h2>
          <Link
            to="/posts"
            className="text-slate-900 mb-2 hover:text-indigo-600 transition-colors"
          >
            {t("home.viewAllPosts")}
          </Link>
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
          <h2 className="text-3xl font-bold">{t("home.recentPosts")}</h2>
          <Link
            to="/posts"
            className="text-slate-900 mb-2 hover:text-indigo-600 transition-colors"
          >
            {t("home.viewAllPosts")}
          </Link>
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
