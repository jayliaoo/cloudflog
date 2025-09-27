import { data } from "react-router";
import { getDBClient } from "~/db/index";
import { comments } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "~/auth.server";

export async function action({ request, params, context }: { request: Request; params: { id: string }; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);

  // Authenticate via cookie-based session
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Authentication required" }, { status: 401 });
  }

  const commentId = parseInt(params.id);
  const method = request.method;

  if (!commentId) {
    return data({ error: "Comment ID is required" }, { status: 400 });
  }

  if (method === "PUT") {
    return updateComment(commentId, request, db, user);
  } else if (method === "DELETE") {
    return deleteComment(commentId, db, user, request);
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}

async function updateComment(commentId: number, request: Request, db: any, user: any) {
  const formData = await request.formData();
  const content = formData.get("content") as string;

  if (!content) {
    return data({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Verify comment exists and is not deleted
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));

    if (existingComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }

    if (existingComment[0].deletedAt) {
      return data({ error: "Cannot edit deleted comment" }, { status: 400 });
    }

    // Verify the user owns this comment for editing
    if (existingComment[0].authorId !== user.id) {
      return data({ error: "You can only edit your own comments" }, { status: 403 });
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    return data({ comment: updatedComment[0] });
  } catch (error) {
    console.error("Failed to update comment:", error);
    return data({ error: "Failed to update comment" }, { status: 500 });
  }
}

async function deleteComment(commentId: number, db: any, user: any, request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode"); // 'archive' | 'hard'

    // Verify comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));

    if (existingComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }

    // Only blog owner can delete any comment
    if (user.role !== "owner") {
      return data({ error: "Only the blog owner can delete comments" }, { status: 403 });
    }

    if (mode === "hard") {
      // Permanent removal
      await db.delete(comments).where(eq(comments.id, commentId));
      return data({ message: "Comment permanently removed" });
    } else {
      // Archive (soft delete) by setting deletedAt
      await db
        .update(comments)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(comments.id, commentId));
      return data({ message: "Comment archived" });
    }
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return data({ error: "Failed to delete comment" }, { status: 500 });
  }
}