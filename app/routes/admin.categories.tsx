import type { LoaderFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { categories } from "~/db/schema";
import { desc } from "drizzle-orm";
import CategoryManager from "~/components/blog/category-manager";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    // Redirect to sign in page if not authenticated
    return redirect("/auth/signin");
  }
  
  // Fetch all categories
  const db = getDBClient(env.D1);
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .orderBy(desc(categories.createdAt));
  
  return data({ categories: allCategories, user });
}

export default function AdminCategories({ loaderData }: { loaderData: any }) {
  const { categories, user } = loaderData as { categories: any[], user: any };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a
            href="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to Admin Dashboard
          </a>
        </div>

        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}