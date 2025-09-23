import { data } from "react-router";
import { getDBClient } from "~/db/index";
import { comments } from "~/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "~/auth.server";

function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['session'] || null;
}

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);
  
  const url = new URL(request.url);
  const postId = url.searchParams.get("postId");

  if (!postId) {
    return data({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const postComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, parseInt(postId)))
      .orderBy(asc(comments.createdAt));

    return data({ comments: postComments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return data({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const db = getDBClient(env.D1);
  
  // Check authentication - support both Bearer token and cookie
  const authHeader = request.headers.get('Authorization');
  const sessionToken = authHeader ? authHeader.replace('Bearer ', '') : getSessionTokenFromRequest(request);
  const session = sessionToken ? await getSession(sessionToken, env) : null;
  
  if (!session) {
    return data({ error: "Authentication required" }, { status: 401 });
  }
  
  const formData = await request.formData();
  const method = request.method;

  if (method === "POST") {
    return createComment(formData, db, session.user);
  } else if (method === "PUT") {
    return updateComment(formData, db, session.user);
  } else if (method === "DELETE") {
    return deleteComment(formData, db, session.user);
  }

  return data({ error: "Method not allowed" }, { status: 405 });
}

async function createComment(formData: FormData, db: any, user: any) {
  const postId = parseInt(formData.get("postId") as string);
  const content = formData.get("content") as string;
  const parentId = formData.get("parentId") ? parseInt(formData.get("parentId") as string) : null;
  const editToken = formData.get("editToken") as string;

  if (!postId || !content) {
    return data({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Check if parent comment exists and is approved
    if (parentId) {
      const parentComment = await db
        .select()
        .from(comments)
        .where(and(eq(comments.id, parentId)));
      
      if (parentComment.length === 0) {
        return data({ error: "Parent comment not found or not approved" }, { status: 400 });
      }
    }

    const newComment = await db
      .insert(comments)
      .values({
        postId,
        content: content.trim(),
        authorName: user.name,
        authorEmail: user.email,
        authorId: user.id,
        parentId,
        editToken,
        approved: true, // Auto-approve for signed-in users
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return data({ comment: newComment[0] }, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return data({ error: "Failed to create comment" }, { status: 500 });
  }
}

async function updateComment(formData: FormData, db: any, user: any) {
  const url = new URL(formData.get("url") as string || "http://localhost");
  const commentId = parseInt(url.pathname.split('/').pop() || '0');
  const content = formData.get("content") as string;

  if (!commentId || !content) {
    return data({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Verify the user owns this comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));
    
    if (existingComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }
    
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

    if (updatedComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }

    return data({ comment: updatedComment[0] });
  } catch (error) {
    console.error("Failed to update comment:", error);
    return data({ error: "Failed to update comment" }, { status: 500 });
  }
}

async function deleteComment(formData: FormData, db: any, user: any) {
  const url = new URL(formData.get("url") as string || "http://localhost");
  const commentId = parseInt(url.pathname.split('/').pop() || '0');

  if (!commentId) {
    return data({ error: "Comment ID is required" }, { status: 400 });
  }

  try {
    // Verify the user owns this comment
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));
    
    if (existingComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }
    
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

    if (deletedComment.length === 0) {
      return data({ error: "Comment not found" }, { status: 404 });
    }

    return data({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return data({ error: "Failed to delete comment" }, { status: 500 });
  }
}