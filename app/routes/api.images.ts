import { data, type LoaderFunctionArgs } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getSignedUrlForUpload } from "~/utils/s3-client";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Not authenticated" }, { status: 401 });
  }
  const url = new URL(request.url);

  // Handle signed URL generation for uploads
  if (url.searchParams.get("action") === "getUploadUrl") {
    const filename = url.searchParams.get("filename");
    const contentType = request.headers.get("content-type");

    if (!filename || !contentType) {
      return data(
        { error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    try {
      // Get current user (optional in development)
      const originalFilename = filename;

      // Extract file extension from original filename
      const fileParts = originalFilename.split(".");
      const fileExtension =
        fileParts.length > 1 ? fileParts.pop()?.toLowerCase() || "jpg" : "jpg";

      // Generate unique object key with original extension
      const objectKey = `${crypto.randomUUID()}.${fileExtension}`;

      // Construct final URL for the uploaded image
      const finalImageUrl = `${env.IMAGE_BASE_URL?.replace(/\/$/, "")}/${objectKey}`;

      // Generate signed URL using S3 client utilities
      const s3Config = {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        endpoint: env.R2_ENDPOINT,
        region: 'auto',
        bucket: env.R2_BUCKET_NAME,
      };

      const signedUrl = await getSignedUrlForUpload(
        s3Config,
        s3Config.bucket,
        objectKey,
        contentType,
        undefined, // metadata
        "public, max-age=31536000, immutable" // Default to 1 year cache
      );

      return data({
        success: true,
        signedUrl,
        objectKey,
        finalUrl: finalImageUrl,
      });
    } catch (error) {
      console.error("Signed URL generation error:", error);
      return data(
        {
          error: "Failed to generate signed URL",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }
}
