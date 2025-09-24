import { useState } from "react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { CommentForm } from "./comment-form";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectOption } from "~/components/ui/select";

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    authorName: string;
    authorId: number;
    createdAt: number;
    editedAt?: number;
    deletedAt?: number;
    postId: number;
    parentId?: number;
    replies?: any[];
  };
  user?: { id: number; name: string; email: string; image?: string; role?: string } | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteMode, setDeleteMode] = useState<'archive' | 'hard'>('archive');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
  const isOwner = user?.role === 'owner';

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

    setIsSubmitting(true);
    setEditError("");

    try {
      const formData = new FormData();
      formData.append("content", editContent);
      formData.append("authorName", editAuthorName);
      
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
    setDeleteError("");
    try {
      const response = await fetch(`/api/comments/${comment.id}?mode=${deleteMode}`, {
        method: "DELETE",
      });
  
      if (response.ok) {
        const res: any = await response.json().catch(() => ({}));
        alert(res.message || (deleteMode === 'hard' ? 'Comment permanently removed' : 'Comment archived'));
        setIsDeleteOpen(false);
        onDelete?.(comment.id);
      } else {
        const res: any = await response.json().catch(() => ({}));
        const msg = res.error || res.message || 'Failed to delete comment';
        setDeleteError(msg);
        alert(msg);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      const msg = "Failed to delete comment. Please try again.";
      setDeleteError(msg);
      alert(msg);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditAuthorName(comment.authorName);
    setEditError("");
  };

  if (comment.deletedAt) {
    return (
      <div className={`mb-4 ${depth > 0 ? "ml-8 pl-4 border-l-2 border-l-border" : ""}`}>
        <p className="text-muted-foreground italic">This comment has been deleted.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`mb-4 ${depth > 0 ? `ml-${Math.min(depth * 8, 32)} pl-4 border-l-2 border-l-primary/20` : ""}`}>        
        <div className="pb-2">
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
                  </>
                )}
                {isOwner && (
                  <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Comment</DialogTitle>
                        <DialogDescription>
                          This action requires owner permission. Choose delete mode and confirm.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Delete Mode</label>
                          <Select value={deleteMode} onChange={(e) => setDeleteMode(e.target.value as 'archive' | 'hard')}>
                            <SelectOption value="archive">Archive (soft delete)</SelectOption>
                            <SelectOption value="hard">Permanent (hard delete)</SelectOption>
                          </Select>
                        </div>
                        {deleteError && (
                          <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                            {deleteError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
        </div>
        
        <div>
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
        </div>
      </div>

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