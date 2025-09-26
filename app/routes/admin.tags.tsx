import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { tags, postTags } from "~/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Link } from "react-router";
import { Trash2, Tag, Plus, Eye } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";
import Pagination from "~/components/Pagination";

const tagsPerPage = 10;

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
  
  // Parse pagination parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  
  // Get total count for pagination
  const totalTagsResult = await db
    .select({
      count: count(),
    })
    .from(tags);
  const totalTags = totalTagsResult[0].count;
  const totalPages = Math.ceil(totalTags / tagsPerPage);
  
  // Apply pagination (limit and offset)
  const offset = (page - 1) * tagsPerPage;
  
  // Fetch tags with post counts and pagination
  const allTags = await db
    .select({
      name: tags.name,
      slug: tags.slug,
      postCount: count(postTags.postId),
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.slug, postTags.tagSlug))
    .groupBy(tags.name, tags.slug)
    .orderBy(desc(count(postTags.postId)))
    .limit(tagsPerPage)
    .offset(offset);
  
  return data({ 
    tags: allTags,
    currentPage: page,
    totalPages,
    totalTags
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return data({ error: "Forbidden - Admin access required" }, { status: 403 });
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "create") {
    const name = formData.get("name") as string;
    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return data({ error: "Tag name is required" }, { status: 400 });
    }
    
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    if (slug.length === 0) {
      return data({ error: "Invalid tag name" }, { status: 400 });
    }
    
    try {
      const db = getDBClient(env.D1);
      
      // Check if tag already exists
      const existingTag = await db
        .select()
        .from(tags)
        .where(eq(tags.slug, slug))
        .limit(1);
      
      if (existingTag.length > 0) {
        return data({ error: "Tag already exists" }, { status: 400 });
      }
      
      // Create new tag
      await db.insert(tags).values({
        name: trimmedName,
        slug
      });
      
      return data({ success: true });
    } catch (error) {
      console.error("Error creating tag:", error);
      return data({ error: "Failed to create tag" }, { status: 500 });
    }
  } else if (intent === "delete") {
    const tagSlug = formData.get("slug") as string;
    
    if (!tagSlug) {
      return data({ error: "Tag slug is required" }, { status: 400 });
    }
    
    try {
      const db = getDBClient(env.D1);
      
      // First delete all post-tag associations
      await db.delete(postTags).where(eq(postTags.tagSlug, tagSlug));
      
      // Then delete the tag itself
      await db.delete(tags).where(eq(tags.slug, tagSlug));
      
      return data({ success: true });
    } catch (error) {
      console.error("Error deleting tag:", error);
      return data({ error: "Failed to delete tag" }, { status: 500 });
    }
  }
  
  return data({ error: "Invalid intent" }, { status: 400 });
}

export default function AdminTags({ loaderData }: { loaderData: any }) {
  const { tags, currentPage, totalPages, totalTags } = loaderData as { 
    tags: any[]; 
    currentPage: number; 
    totalPages: number; 
    totalTags: number; 
  };
  const [newTagName, setNewTagName] = useState("");
  
  const handleCreateTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newTagName.trim()) return;
    
    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("name", newTagName);
    
    try {
      const response = await fetch("/admin/tags", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setNewTagName("");
        window.location.reload();
      } else {
        const responseData = await response.json() as { error: string };
        alert(responseData.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag");
    }
  };
  
  const handleDeleteTag = async (tagSlug: string, tagName: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"? This will remove it from all associated posts.`)) {
      return;
    }
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("slug", tagSlug);
    
    try {
      const response = await fetch("/admin/tags", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const responseData = await response.json() as { error: string };
        alert(responseData.error || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Failed to delete tag");
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Create New Tag */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Create New Tag</h3>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleCreateTag} className="flex gap-4">
              <input
                type="text"
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-md"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </button>
            </form>
          </div>
        </div>
      
        {/* Tags Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">All Tags ({totalTags})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Posts</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tags.map((tag) => (
                  <tr key={tag.slug} className="hover:bg-muted/25">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground font-mono">{tag.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                        {tag.postCount} post{tag.postCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-1">
                        <Link 
                          to={`/tags/${tag.slug}`}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Link>
                        <button
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-2"
                          onClick={() => handleDeleteTag(tag.slug, tag.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tags.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tags found.
              </div>
            )}
          </div>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalTags}
          itemsPerPage={tagsPerPage}
          itemName="tags"
          baseUrl="/admin/tags"
        />
      </div>
    </AdminLayout>
  );
}