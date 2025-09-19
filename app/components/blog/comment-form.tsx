import { useState } from "react";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface CommentFormProps {
  postId: number;
  parentId?: number;
  onSubmit?: () => void;
  onCancel?: () => void;
  isReply?: boolean;
  user?: { id: number; name: string; email: string; image?: string } | null;
}

export function CommentForm({ postId, parentId, onSubmit, onCancel, isReply = false, user }: CommentFormProps) {
  const [formData, setFormData] = useState({
    authorName: user?.name || "",
    authorEmail: user?.email || "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Only validate name and email for unauthenticated users
    if (!user) {
      if (!formData.authorName.trim()) {
        newErrors.authorName = "Name is required";
      }
      
      if (!formData.authorEmail.trim()) {
        newErrors.authorEmail = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorEmail)) {
        newErrors.authorEmail = "Please enter a valid email address";
      }
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "Comment is required";
    } else if (formData.content.trim().length < 5) {
      newErrors.content = "Comment must be at least 5 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only authenticated users can submit
    if (!user) {
      setErrors({ submit: "Please sign in to leave a comment." });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formDataObj = new FormData();
      formDataObj.append("postId", postId.toString());
      formDataObj.append("content", formData.content);
      if (parentId) {
        formDataObj.append("parentId", parentId.toString());
      }
      
      // Use authenticated user's profile data
      formDataObj.append("authorName", user.name);
      formDataObj.append("authorEmail", user.email);
      
      // Generate edit token for future edits
      const editToken = Math.random().toString(36).substring(2, 15);
      formDataObj.append("editToken", editToken);
      
      const response = await fetch("/api/comments", {
        method: "POST",
        body: formDataObj,
      });
      
      if (response.ok) {
        // Store edit token in localStorage for future edits
        localStorage.setItem(`comment-edit-${postId}-${Date.now()}`, editToken);
        
        // Reset form
        setFormData({ authorName: "", authorEmail: "", content: "" });
        setErrors({});
        onSubmit?.();
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || "Failed to submit comment" });
      }
    } catch (error) {
      setErrors({ submit: "Failed to submit comment. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          {isReply ? "Reply to Comment" : "Leave a Comment"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please sign in to leave a comment.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Sign In
            </a>
          </div>
        ) : (
          <Form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {errors.submit}
              </div>
            )}
            
            <div>
              <Textarea
                placeholder={isReply ? "Write your reply..." : "Write your comment..."}
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className={errors.content ? "border-red-500" : ""}
                rows={4}
                disabled={isSubmitting}
              />
              {errors.content && (
                <p className="text-red-600 text-sm mt-1">{errors.content}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : (isReply ? "Post Reply" : "Post Comment")}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
            </div>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}