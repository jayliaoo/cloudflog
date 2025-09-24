import { useState, useEffect } from "react";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

interface Comment {
  id: number;
  content: string;
  authorName: string;
  authorId: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
  postId: number;
  parentId?: number;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: number;
  comments: Comment[];
  user?: { id: number; name: string; email: string; image?: string; role?: string } | null;
  onCommentUpdate?: () => void;
}

export function CommentsSection({ postId, comments: initialComments, user, onCommentUpdate }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);

  // Build nested comment structure
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build the tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parentId) {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          parentComment.replies = parentComment.replies || [];
          parentComment.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleCommentSubmit = async () => {
    // Refresh comments after submission
    await fetchComments();
    onCommentUpdate?.();
  };

  const handleCommentEdit = (id: number, content: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === id ? { ...comment, content, editedAt: Date.now() } : comment
    ));
    onCommentUpdate?.();
  };

  const handleCommentDelete = (id: number) => {
    setComments(prev => prev.map(comment => 
      comment.id === id ? { ...comment, deletedAt: Date.now() } : comment
    ));
    onCommentUpdate?.();
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json<{ comments: Comment[] }>();
        // Convert ISO date strings to Unix timestamps
        const processedComments = data.comments.map((comment: Comment) => ({
          ...comment,
          createdAt: new Date(comment.createdAt).getTime(),
          updatedAt: comment.updatedAt ? new Date(comment.updatedAt).getTime() : undefined,
          deletedAt: comment.deletedAt ? new Date(comment.deletedAt).getTime() : undefined,
        }));
        setComments(processedComments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const commentTree = buildCommentTree(comments);
  const approvedCommentsCount = comments.length;
  return (
    <div className="mt-12">
      <div className="mb-6">
        <h3 className="text-2xl font-bold">
          Comments ({approvedCommentsCount})
        </h3>
      </div>
      
      <CommentForm 
        postId={postId} 
        onSubmit={handleCommentSubmit}
        user={user}
      />
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading comments...</p>
        </div>
      )}
      
      {!isLoading && commentTree.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      )}
      
      {!isLoading && commentTree.length > 0 && (
        <div className="space-y-4 mt-8">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              onEdit={handleCommentEdit}
              onDelete={handleCommentDelete}
              onReply={handleCommentSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}