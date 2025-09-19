import { data } from "react-router";
import { getDBClient } from "~/db/index";
import { comments } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "~/auth.server";

export async function action({ request, params, context }: { request: Request; params: { id: string }; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);
  
  // Check authentication
  const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  const session = sessionToken ? await getSession(sessionToken, env) : null;
  
  if (!session) {
    return data({ error: "Authentication required" }, { status: 401 });
  }
  
  const commentId = parseInt(params.id);
  const method = request.method;

  if (!commentId) {
    return data({ error: "Comment ID is required" }, { status: 400 });
  }

  if (method === "PUT") {
    return updateComment(commentId, request, db, session.user);
  } else if (method === "DELETE") {
    return deleteComment(commentId, db, session.user);
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

    // Verify the user owns this comment
    if (existingComment[0].authorId !== user.id) {
      return data({ error: "You can only edit your own comments" }, { status: 403 });
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: content.trim(),
        editedAt: new Date(),
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

async function deleteComment(commentId: number, db: any, user: any) {
  try {
    // Verify comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));

    if (existingComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }

    // Verify the user owns this comment
    if (existingComment[0].authorId !== user.id) {
      return data({ error: "You can only delete your own comments" }, { status: 403 });
    }

    // Soft delete by setting deletedAt
    const deletedComment = await db
      .update(comments)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId))
      .returning();

    return data({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return data({ error: "Failed to delete comment" }, { status: 500 });
  }
}