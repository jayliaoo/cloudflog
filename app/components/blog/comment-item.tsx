import { useState } from "react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { CommentForm } from "./comment-form";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    authorName: string;
    authorEmail: string;
    authorId: number;
    createdAt: number;
    editedAt?: number;
    deletedAt?: number;
    approved: boolean;
    postId: number;
    parentId?: number;
    replies?: any[];
  };
  user?: { id: number; name: string; email: string; image?: string } | null;
  depth?: number;
  onReply?: () => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

export function CommentItem({ comment, user, depth = 0, onReply, onEdit, onDelete }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editAuthorName, setEditAuthorName] = useState(comment.authorName);
  const [editAuthorEmail, setEditAuthorEmail] = useState(comment.authorEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState("");

  const maxDepth = 4; // Limit nesting depth to prevent excessive indentation
  const canReply = depth < maxDepth;
  
  // Check if user can edit (within 15 minutes of posting and is the author)
  const canEdit = () => {
    const fifteenMinutes = 15 * 60 * 1000;
    const timeSincePosted = Date.now() - comment.createdAt;
    const isWithinTimeLimit = timeSincePosted < fifteenMinutes;
    const isAuthor = user && comment.authorId === user.id;
    return isWithinTimeLimit && isAuthor;
  };

  const handleReply = () => {
    setShowReplyForm(true);
    // onReply?.();
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      setEditError("Comment content is required");
      return;
    }
    
    if (!editAuthorName.trim()) {
      setEditError("Author name is required");
      return;
    }
    
    if (!editAuthorEmail.trim()) {
      setEditError("Email is required");
      return;
    }

    setIsSubmitting(true);
    setEditError("");

    try {
      const formData = new FormData();
      formData.append("content", editContent);
      formData.append("authorName", editAuthorName);
      formData.append("authorEmail", editAuthorEmail);
      
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        setIsEditing(false);
        onEdit?.(comment.id, editContent);
      } else {
        const error = await response.json<{ message: string }>();
        setEditError(error.message || "Failed to update comment");
      }
    } catch (error) {
      setEditError("Failed to update comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        const response = await fetch(`/api/comments/${comment.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          onDelete?.(comment.id);
        }
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditAuthorName(comment.authorName);
    setEditAuthorEmail(comment.authorEmail);
    setEditError("");
  };

  if (comment.deletedAt) {
    return (
      <Card className={`mb-4 ${depth > 0 ? "ml-8 border-l-4 border-l-border" : ""}`}>
        <CardContent className="py-4">
          <p className="text-muted-foreground italic">This comment has been deleted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`mb-4 ${depth > 0 ? `ml-${Math.min(depth * 8, 32)} border-l-4 border-l-primary/30` : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm">{comment.authorName}</h4>
              <span className="text-muted-foreground text-xs">
                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
              {comment.editedAt && (
                <span className="text-muted-foreground/70 text-xs">(edited)</span>
              )}
            </div>
            
            {!comment.deletedAt && (
              <div className="flex space-x-2">
                {canEdit() && !isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </Button>
                  </>
                )}
                {canReply && !showReplyForm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReply}
                    className="text-xs"
                  >
                    Reply
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              {editError && (
                <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                  {editError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  type="text"
                  value={editAuthorName}
                  onChange={(e) => setEditAuthorName(e.target.value)}
                  placeholder="Your Name"
                  className="text-sm"
                />
                <Input
                  type="email"
                  value={editAuthorEmail}
                  onChange={(e) => setEditAuthorEmail(e.target.value)}
                  placeholder="Your Email"
                  className="text-sm"
                />
              </div>
              
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                rows={3}
                className="text-sm"
              />
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showReplyForm && (
        <div className={`ml-${Math.min((depth + 1) * 8, 32)} mb-4`}>
          <CommentForm
            postId={comment.postId}
            parentId={comment.id}
            onSubmit={() => {
              onReply?.();
              setShowReplyForm(false);
            }}
            onCancel={handleCancelReply}
            isReply={true}
            user={user}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}