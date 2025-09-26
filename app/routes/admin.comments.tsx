import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { comments, posts, users } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { Link } from "react-router";
import { MessageSquare, User, Calendar, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import AdminLayout from "~/components/layouts/admin-layout";

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
  
  // Fetch all comments with post and author information
  const allComments = await db
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
    .orderBy(desc(comments.createdAt));
  
  return data({ comments: allComments });
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
  const { comments } = loaderData as { comments: any[] };
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.postTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Search Comments</h3>
        </div>
        <div className="p-6 pt-0">
          <input
            type="text"
            placeholder="Search by content, author, or post title..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-md"
          />
        </div>
      </div>
      
      {/* Comments List */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">All Comments ({filteredComments.length})</h3>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {comment.authorName}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{comment.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <Link to={`/posts/${comment.postSlug}`} className="hover:underline">
                          {comment.postTitle}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link 
                      to={`/posts/${comment.postSlug}#comments`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <button
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
                      onClick={() => handleDeleteComment(comment.id, comment.authorName)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredComments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No comments found matching your search." : "No comments yet."}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}