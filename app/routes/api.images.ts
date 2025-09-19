import { data, type ActionFunctionArgs } from "react-router";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "~/auth.server";
import { getDBClient } from "~/db";
import { images } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Get session from cookie
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = cookieHeader?.match(/session=([^;]+)/)?.[1];
  
  if (!sessionToken) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  
  const session = await getSession(sessionToken, env);
  if (!session?.user?.id) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if user is owner (admin access required for image uploads)
  if (session.user.role !== 'owner') {
    return data({ error: "Admin access required" }, { status: 403 });
  }
  
  const db = getDBClient(env.D1);

  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return data({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return data({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." }, { status: 400 });
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return data({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
  }

  try {
    // Generate UUID for object key
    const objectKey = uuidv4();
    
    // Read file as buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to R2 (only in production or when R2 is available)
    const env = context.cloudflare.env as Env;
    if (env.R2) {
      await env.R2.put(objectKey, buffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
    } else if (import.meta.env.DEV) {
      // In development without R2, we'll just save metadata
      console.log("Development mode: Image metadata saved without R2 upload");
    } else {
      throw new Error("R2 bucket not available");
    }

    // Save metadata to database
    const [imageRecord] = await db.insert(images).values({
      objectKey,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedBy: session.user.id,
    }).returning();

    return data({
      success: true,
      image: {
        objectKey,
        originalName: file.name,
        url: `/api/images/${objectKey}`,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return data({ error: "Failed to upload image" }, { status: 500 });
  }
}

// GET endpoint to serve images
export async function loader({ params, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const objectKey = params.objectKey;
  
  if (!objectKey) {
    return data({ error: "Object key required" }, { status: 400 });
  }

  try {
    // In development, R2 might not be available, so we'll return a placeholder
    if (import.meta.env.DEV && !env.R2) {
      // Return a 1x1 transparent PNG as placeholder in development
      const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      return new Response(placeholderImage, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const object = await env.R2.get(objectKey);
    
    if (!object) {
      return data({ error: "Image not found" }, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error("Image fetch error:", error);
    return data({ error: "Failed to fetch image" }, { status: 500 });
  }
}