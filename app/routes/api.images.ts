import {
  data,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { images } from "~/db/schema";
import { eq } from "drizzle-orm";
import { calculateMD5 } from "~/utils/crypto";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Not authenticated" }, { status: 401 });
  }
  const url = new URL(request.url);

  // Handle MD5 duplicate checking
  const md5Hash = url.searchParams.get("md5");

  if (!md5Hash) {
    return data({ error: "Missing MD5 hash" }, { status: 400 });
  }

  try {
    const db = getDBClient(env.D1);
    const existingImage = await db
      .select()
      .from(images)
      .where(eq(images.md5, md5Hash))
      .limit(1);

    if (existingImage.length > 0) {
      return data({
        exists: true,
        objectKey: existingImage[0].objectKey,
        filename: existingImage[0].filename,
      });
    } else {
      return data({
        exists: false,
      });
    }
  } catch (error) {
    console.error("Duplicate check error:", error);
    return data(
      {
        error: "Failed to check for duplicates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await getCurrentUser(request, env);

  if (!user) {
    return data({ error: "Not authenticated" }, { status: 401 });
  }

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const filename = formData.get("filename") as string;

      if (!file || !filename) {
        return data({ error: "Missing file or filename" }, { status: 400 });
      }

      // Calculate MD5 hash of the file
      const fileBuffer = await file.arrayBuffer();
      const md5Hash = await calculateMD5(fileBuffer);

      // Generate object key for identification
      const originalFilename = filename;
      const fileParts = originalFilename.split(".");
      const fileExtension =
        fileParts.length > 1 ? fileParts.pop()?.toLowerCase() || "jpg" : "jpg";
      const objectKey = `${md5Hash}.${fileExtension}`;

      // Save image data directly to database
      const db = getDBClient(env.D1);
      await db.insert(images).values({
        filename: originalFilename,
        objectKey,
        data: fileBuffer,
        md5: md5Hash,
        contentType: file.type,
        fileSize: file.size,
        uploadedBy: user.id,
      });

      return data({
        success: true,
        objectKey,
        message: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Image upload error:", error);
      return data(
        {
          error: "Failed to upload image",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}
