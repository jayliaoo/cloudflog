import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { comments, posts, users } from "~/db/schema";
import { eq, desc, count, like, or, and } from "drizzle-orm";
import { Link, useSearchParams } from "react-router";
import { MessageSquare, User, Calendar, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";
import Pagination from "~/components/Pagination";

const commentsPerPage = 10;

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    return redirect("/auth/signin");
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return redirect("/"); // Redirect to home if not owner
  }
  
  const db = getDBClient(env.D1);
  
  // Parse pagination and search parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("search") || "";
  
  // Build search conditions
  const searchConditions = search.trim() 
    ? or(
        like(comments.content, `%${search}%`),
        like(users.name, `%${search}%`),
        like(posts.title, `%${search}%`)
      )
    : undefined;
  
  // Get total count for pagination (with search filter)
  const totalCommentsQuery = db
    .select({
      count: count(),
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .innerJoin(users, eq(comments.authorId, users.id));
    
  if (searchConditions) {
    totalCommentsQuery.where(searchConditions);
  }
  
  const totalCommentsResult = await totalCommentsQuery;
  const totalComments = totalCommentsResult[0].count;
  const totalPages = Math.ceil(totalComments / commentsPerPage);
  
  // Apply pagination (limit and offset)
  const offset = (page - 1) * commentsPerPage;
  
  // Fetch comments with post and author information, pagination, and search
  const commentsQuery = db
    .select({
      id: comments.id,
      content: comments.content,
      authorName: users.name,
      createdAt: comments.createdAt,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .innerJoin(users, eq(comments.authorId, users.id))
    .orderBy(desc(comments.createdAt))
    .limit(commentsPerPage)
    .offset(offset);
    
  if (searchConditions) {
    commentsQuery.where(searchConditions);
  }
  
  const allComments = await commentsQuery;
  
  return data({ 
    comments: allComments,
    currentPage: page,
    totalPages,
    totalComments,
    search
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Check if user is authenticated
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Check if user is owner (admin access required)
  if (user.role !== 'owner') {
    return data({ error: "Forbidden - Admin access required" }, { status: 403 });
  }
  
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  if (intent === "delete") {
    const commentId = formData.get("commentId") as string;
    
    if (!commentId) {
      return data({ error: "Comment ID is required" }, { status: 400 });
    }
    
    try {
      const db = getDBClient(env.D1);
      
      // Delete the comment
      await db.delete(comments).where(eq(comments.id, parseInt(commentId)));
      
      return data({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      return data({ error: "Failed to delete comment" }, { status: 500 });
    }
  }
  
  return data({ error: "Invalid intent" }, { status: 400 });
}

export default function AdminComments({ loaderData }: { loaderData: any }) {
  const { comments, currentPage, totalPages, totalComments, search } = loaderData as { 
    comments: any[]; 
    currentPage: number; 
    totalPages: number; 
    totalComments: number; 
    search: string;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(search || "");
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newSearchParams.set("search", searchTerm.trim());
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.delete("page"); // Reset to first page when searching
    setSearchParams(newSearchParams);
  };
  
  const handleDeleteComment = async (commentId: number, authorName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete the comment by "${authorName}"?`)) {
      return;
    }
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("commentId", commentId.toString());
    
    try {
      const response = await fetch("/admin/comments", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const responseData = await response.json() as { error: string };
        alert(responseData.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
      
      {/* Search */}
      <div className="rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Search Comments</h3>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="Search by content, author, or post title..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md"
            />
            <button
              type="submit"
              className="inline-flex bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition items-center space-x-2"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      
      {/* Comments Table */}
      <div className="rounded-lg border border-gray-200 shadow-sm p-5">
        <div className="flex flex-col space-y-1.5 p-4">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">All Comments ({totalComments})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Author</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Content</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Post</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-muted/25">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {comment.authorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                      {comment.content}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Link to={`/posts/${comment.postSlug}`} className="text-sm hover:text-primary hover:underline truncate max-w-xs">
                        {comment.postTitle}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end space-x-1">
                      <Link 
                        to={`/posts/${comment.postSlug}#comments`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                      <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-2"
                        onClick={() => handleDeleteComment(comment.id, comment.authorName)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No comments found matching your search." : "No comments yet."}
            </div>
          )}
        </div>
      </div>
        
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalComments}
        itemsPerPage={commentsPerPage}
        itemName="comments"
        baseUrl="/admin/comments"
      />
      </div>
    </AdminLayout>
  );
}