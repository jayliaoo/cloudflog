import type { LoaderFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { desc } from "drizzle-orm";
import { Form, Link } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    // Redirect to sign in page if not authenticated
    return redirect("/auth/signin");
  }
  
  // Fetch all posts for admin dashboard (without author info)
  const db = getDBClient(env.D1);
  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      published: posts.published,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));
  
  return data({ posts: allPosts, user });
}

export default function Admin({ loaderData }: { loaderData: any }) {
  const { posts, user } = loaderData as { posts: any[], user: any };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{posts.length}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Published Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {posts.filter(post => post.published).length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Draft Posts</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {posts.filter(post => !post.published).length}
              </dd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Link
            to="/posts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Post
          </Link>
        </div>

        {/* Posts List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {post.excerpt && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <p className="mt-2 text-sm text-gray-400">
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/posts/new?edit=${post.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Create your first post!</p>
          </div>
        )}
      </div>
    </div>
  );
}