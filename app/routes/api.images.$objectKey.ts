import { type LoaderFunctionArgs } from "react-router";
import { getDBClient } from "~/db";
import { images } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { objectKey } = params;

  if (!objectKey) {
    return new Response("Object key is required", { status: 400 });
  }

  try {
    // Get database client
    const db = getDBClient(context.cloudflare.env.D1);

    // Find the image record with data
    const imageRecord = await db
      .select()
      .from(images)
      .where(eq(images.objectKey, objectKey))
      .get();

    if (!imageRecord) {
      return new Response("Image not found", { status: 404 });
    }

    if (!imageRecord.data) {
      return new Response("Image data not found", { status: 404 });
    }

    // Return the image with proper headers
    return new Response(imageRecord.data, {
      status: 200,
      headers: {
        "Content-Type": imageRecord.contentType || "application/octet-stream",
        "Content-Length": imageRecord.fileSize?.toString() || "",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        ETag: `"${imageRecord.md5}"`,
        "Last-Modified": imageRecord.createdAt.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
