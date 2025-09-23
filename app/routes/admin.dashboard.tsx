import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts, tags, comments, users } from "~/db/schema";
import { eq, count, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3, FileText, Tag, MessageSquare, Users, TrendingUp, Eye } from "lucide-react";
import type { LoaderFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    return redirect("/auth/signin");
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return redirect("/"); // Redirect to home if not owner
  }
  
  const db = getDBClient(env.D1);
  
  // Fetch statistics
  const totalPostsCount = await db
    .select({ count: count() })
    .from(posts);
  
  const publishedPostsCount = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.published, true));
  
  const draftPostsCount = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.published, false));
  
  const featuredPostsCount = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.featured, true));
  
  const totalTagsCount = await db
    .select({ count: count() })
    .from(tags);
  
  const totalCommentsCount = await db
    .select({ count: count() })
    .from(comments);
  
  const totalUsersCount = await db
    .select({ count: count() })
    .from(users);
  
  // Calculate total views across all posts
  const totalViewsResult = await db
    .select({ totalViews: sql<number>`SUM(${posts.viewCount})` })
    .from(posts);
  
  const totalViews = totalViewsResult[0].totalViews || 0;
  
  // Get recent posts
  const recentPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      published: posts.published,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(5);
  
  // Get recent comments
  const recentComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      authorName: users.name,
      createdAt: comments.createdAt,
      postId: comments.postId,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .orderBy(desc(comments.createdAt))
    .limit(5);
  
  return data({
    stats: {
      totalPosts: totalPostsCount[0].count,
      publishedPosts: publishedPostsCount[0].count,
      draftPosts: draftPostsCount[0].count,
      featuredPosts: featuredPostsCount[0].count,
      totalTags: totalTagsCount[0].count,
      totalComments: totalCommentsCount[0].count,
      totalUsers: totalUsersCount[0].count,
      totalViews: totalViews,
    },
    recentPosts,
    recentComments,
  });
}

export default function AdminDashboard({ loaderData }: { loaderData: any }) {
  const { stats, recentPosts, recentComments } = loaderData;
  
  const statCards = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Published Posts",
      value: stats.publishedPosts,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Draft Posts",
      value: stats.draftPosts,
      icon: FileText,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Featured Posts",
      value: stats.featuredPosts,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Tags",
      value: stats.totalTags,
      icon: Tag,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Total Comments",
      value: stats.totalComments,
      icon: MessageSquare,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
  ];
  
  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.published 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComments.map((comment) => (
                <div key={comment.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{comment.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AdminLayout>
  );
}