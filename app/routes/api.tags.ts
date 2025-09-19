import { data } from "react-router";
import { getDBClient } from "~/db";
import { tags } from "~/db/schema";
import { like, desc } from "drizzle-orm";
import { getCurrentUser } from "~/auth.server";

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    let query = db.select().from(tags);

    if (search) {
      query = query.where(like(tags.name, `%${search}%`));
    }

    const allTags = await query.orderBy(desc(tags.createdAt));

    return data({ tags: allTags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return data({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  // Check authentication and role for tag creation
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Authentication required" }, { status: 401 });
  }
  
  if (user.role !== 'owner') {
    return data({ error: "Admin access required" }, { status: 403 });
  }
  
  const db = getDBClient(env.D1);

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return data({ error: "Tag name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (slug.length === 0) {
      return data({ error: "Invalid tag name" }, { status: 400 });
    }

    // Check if tag already exists
    const existingTag = await db.select().from(tags).where(like(tags.name, trimmedName)).limit(1);
    
    if (existingTag.length > 0) {
      return data({ tag: existingTag[0] });
    }

    // Create new tag
    const newTag = await db.insert(tags).values({
      name: trimmedName,
      slug
    }).returning();

    return data({ tag: newTag[0] });
  } catch (error) {
    console.error("Error creating tag:", error);
    return data({ error: "Failed to create tag" }, { status: 500 });
  }
}