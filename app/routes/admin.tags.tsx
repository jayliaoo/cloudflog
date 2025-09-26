import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { tags, postTags, posts } from "~/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Form, Link } from "react-router";
import { Edit, Trash2, Tag, Plus, Eye } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
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
  
  // Fetch all tags with post counts
  const allTags = await db
    .select({
      name: tags.name,
      slug: tags.slug,
      postCount: count(postTags.postId),
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.slug, postTags.tagSlug))
    .groupBy(tags.name, tags.slug)
    .orderBy(desc(count(postTags.postId)));
  
  return data({ tags: allTags });
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
  const { tags } = loaderData as { tags: any[] };
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
        const responseData = await response.json();
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
        const responseData = await response.json();
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
        {/* Header */}
        <div className="flex items-center justify-between">
        </div>
      
      {/* Tags List */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">All Tags ({tags.length})</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {tags.map((tag) => (
              <div key={tag.slug} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{tag.name}</h3>
                    <p className="text-sm text-muted-foreground">Slug: {tag.slug}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
                    {tag.postCount} post{tag.postCount !== 1 ? 's' : ''}
                  </span>
                  <Link 
                    to={`/tags/${tag.slug}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  <button
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                    onClick={() => handleDeleteTag(tag.slug, tag.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}