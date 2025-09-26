import { useState } from "react";

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

  const handleSubmit = async () => {
    
    if (!validateForm()) {
      return;
    }
    
    // Only authenticated users can submit
    if (!user) {
      setErrors({ submit: "Please sign in to leave a comment." });
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
        // Reset form - preserve user info for authenticated users
        setFormData({ 
          authorName: user?.name || "", 
          authorEmail: user?.email || "", 
          content: "" 
        });
        setErrors({});
        onSubmit?.();
      } else {
        const error = await response.json<{ message: string }>();
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
    <div className="mb-6">
      <div className="mb-4">
        <h4 className="text-lg font-semibold">
          {isReply ? "Reply to Comment" : "Leave a Comment"}
        </h4>
      </div>
      <div>
        {!user ? (
          <div className="text-center py-8">
            <p className="text-slate-600 mb-4">
              Please sign in to leave a comment.
            </p>
            <a
              href="/auth/signin"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full font-medium transition"
            >
              Sign In
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {errors.submit && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {errors.submit}
              </div>
            )}
            
            <div>
              <textarea
                placeholder={isReply ? "Write your reply..." : "Write your comment..."}
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("content", e.target.value)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-vertical ${errors.content ? "border-red-500" : ""}`}
                rows={4}
                disabled={isSubmitting}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2 rounded-full font-medium transition"
              >
                {isSubmitting ? "Submitting..." : (isReply ? "Post Reply" : "Post Comment")}
              </button>
              {onCancel && (
                <button 
                  type="button" 
                  onClick={onCancel} 
                  disabled={isSubmitting}
                  className="bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 px-4 py-2 rounded-full font-medium transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}