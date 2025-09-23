import { eq } from "drizzle-orm";
import { data, type LoaderFunctionArgs } from "react-router";
import { getDBClient } from "~/db";
import { images } from "~/db/schema";
import { getCurrentUser } from "~/auth.server";
import { createS3Client, getSignedUrlForUpload } from "~/utils/s3-client";



export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const url = new URL(request.url);
  
  // Handle signed URL generation for uploads
  if (url.searchParams.get("action") === "getUploadUrl") {
    const filename = url.searchParams.get("filename");
    const contentType = url.searchParams.get("contentType");
    
    if (!filename || !contentType) {
      return data({ error: "Missing filename or contentType" }, { status: 400 });
    }

    try {
      // Get current user (optional in development)
      const user = await getCurrentUser(request, env);
      const originalFilename = filename;
      
      // Generate unique object key
      const objectKey = `${crypto.randomUUID()}.jpg`;
      
      // Construct final URL for the uploaded image
      const finalImageUrl = `${env.IMAGE_BASE_URL?.replace(/\/$/, '')}${objectKey}`;
      
      // Insert metadata into database
      const db = getDBClient(env.D1);
      const [imageRecord] = await db
        .insert(images)
        .values({
          objectKey,
          originalName: originalFilename,
          mimeType: contentType,
          size: 0, // Size will be updated after upload
          uploadedBy: user?.id || null,
          createdAt: new Date(),
        })
        .returning();

      // Generate signed URL using S3 client utilities
      const s3Config = {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        endpoint: env.R2_ENDPOINT || "https://<account-id>.r2.cloudflarestorage.com",
        region: env.R2_REGION || 'auto',
        bucket: env.R2_BUCKET_NAME || 'blog-images',
      };

      const signedUrl = await getSignedUrlForUpload(
        s3Config,
        s3Config.bucket,
        objectKey,
        contentType,
      );

      return data({
        success: true,
        signedUrl,
        objectKey,
        finalUrl: finalImageUrl,
      });
    } catch (error) {
      console.error("Signed URL generation error:", error);
      return data({ error: "Failed to generate signed URL", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }

  // Original image serving functionality
  const filename = url.pathname.split("/").pop();

  if (!filename) {
    return data({ error: "No filename provided" }, { status: 400 });
  }

  // Check if S3 credentials are available
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    // In development, return a placeholder image
    if (import.meta.env.DEV) {
      // Return a 1x1 transparent PNG as placeholder in development
      const placeholderImage =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      return new Response(placeholderImage, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      return data({ error: "S3 credentials not configured" }, { status: 500 });
    }
  }

  try {
    // Get metadata from database
    const db = getDBClient(env.D1);
    const [imageRecord] = await db
      .select()
      .from(images)
      .where(eq(images.objectKey, filename))
      .limit(1);

    if (!imageRecord) {
      return data({ error: "Image metadata not found" }, { status: 404 });
    }

    // In development with credentials, redirect to R2 URL
    if (import.meta.env.DEV) {
      console.log(`Development mode: Redirecting to R2 for ${filename}`);
      const imageUrl = `${env.R2_ENDPOINT || 'https://534b483058263f37d29575599ffd483f.r2.cloudflarestorage.com'}/${env.R2_BUCKET_NAME || 'blog'}/${filename}`;
      return Response.redirect(imageUrl, 302);
    } else {
      // In production, redirect to the S3/R2 URL
      const imageUrl = `${env.IMAGE_BASE_URL}${filename}`;
      return Response.redirect(imageUrl, 302);
    }
  } catch (error) {
    console.error("Image retrieval error:", error);
    return data({ error: "Failed to retrieve image" }, { status: 500 });
  }
}
