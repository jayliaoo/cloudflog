import { data, redirect } from "react-router";
import { getCurrentUser } from "~/auth.server";
import { getDBClient } from "~/db";
import { comments, posts, users } from "~/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Form, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
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
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      createdAt: comments.createdAt,
      postTitle: posts.title,
      postSlug: posts.slug,
      userName: users.name,
    })
    .from(comments)
    .leftJoin(posts, eq(comments.postId, posts.id))
    .leftJoin(users, eq(comments.authorId, users.id))
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
        const responseData = await response.json();
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
      <Card>
        <CardHeader>
          <CardTitle>Search Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search by content, author, or post title..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>
      
      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Comments ({filteredComments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {comment.userName || comment.authorName}
                      </span>
                      {comment.userName && (
                        <Badge variant="secondary" className="text-xs">
                          Registered
                        </Badge>
                      )}
                      {!comment.userName && (
                        <Badge variant="outline" className="text-xs">
                          Guest
                        </Badge>
                      )}
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
                    <Link to={`/posts/${comment.postSlug}#comments`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteComment(comment.id, comment.authorName)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}