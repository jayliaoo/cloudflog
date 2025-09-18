import { data } from "react-router";
import { getDBClient } from "~/db";
import { categories } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ context }: { context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Fetch all categories from database
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

    return data({ categories: allCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return data({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    const db = getDBClient(env.D1);
    
    // Parse JSON body
    const body = await request.json() as {
      name?: string;
      slug?: string;
      description?: string;
      id?: string;
    };

    switch (request.method) {
      case "POST":
        // Handle category creation
        const { name, slug, description } = body;
        
        // Validate required fields
        if (!name || !slug) {
          return data({ error: "Name and slug are required" }, { status: 400 });
        }
        
        // Check if slug already exists
        const existingCategory = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
        if (existingCategory.length > 0) {
          return data({ error: "Category slug already exists" }, { status: 400 });
        }
        
        // Insert category into database
        const result = await db.insert(categories).values({
          name,
          slug,
          description: description || null,
        }).returning();
        
        return data({ success: true, message: "Category created successfully", category: result[0] });
        
      case "PUT":
        // Handle category update
        const { id: updateId, name: updateName, slug: updateSlug, description: updateDescription } = body;
        
        if (!updateId) {
          return data({ error: "Missing category ID" }, { status: 400 });
        }
        
        // Convert string ID to number for integer comparison
        const updateIdNum = parseInt(updateId, 10);
        if (isNaN(updateIdNum)) {
          return data({ error: "Invalid category ID format" }, { status: 400 });
        }
        
        // Check if new slug already exists (excluding current category)
        if (updateSlug) {
          const slugExists = await db
            .select()
            .from(categories)
            .where(eq(categories.slug, updateSlug))
            .limit(1);
          
          if (slugExists.length > 0 && slugExists[0].id !== updateIdNum) {
            return data({ error: "Category slug already exists" }, { status: 400 });
          }
        }
        
        const updateResult = await db.update(categories)
          .set({
            name: updateName,
            slug: updateSlug,
            description: updateDescription,
          })
          .where(eq(categories.id, updateIdNum))
          .returning();
          
        return data({ success: true, message: "Category updated successfully", category: updateResult[0] });
        
      case "DELETE":
        // Handle category deletion
        const { id: deleteId } = body;
        
        if (!deleteId) {
          return data({ error: "Missing category ID" }, { status: 400 });
        }
        
        // Convert string ID to number for integer comparison
        const deleteIdNum = parseInt(deleteId, 10);
        if (isNaN(deleteIdNum)) {
          return data({ error: "Invalid category ID format" }, { status: 400 });
        }
        
        await db.delete(categories).where(eq(categories.id, deleteIdNum));
        
        return data({ success: true, message: "Category deleted successfully" });
        
      default:
        return data({ error: "Method not allowed" }, { status: 405 });
    }
  } catch (error) {
    console.error("Error handling category action:", error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return data({ error: "Invalid JSON format" }, { status: 400 });
    }
    
    return data({ error: "Failed to process request" }, { status: 500 });
  }
}