import { Link } from "react-router";
import { CalendarDays, Clock, Tag, Eye, MessageCircle } from "lucide-react";

interface PostCardProps {
  post: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage?: string | null;
    createdAt: string | Date;
    featured?: boolean;
    viewCount?: number | null;
    commentCount?: number;
    tags: string | null | string[];
  };
  variant?: 'featured' | 'recent' | 'default';
}

// Helper function to render tags (same as home page)
function renderTags(tags: string | null | string[]) {
  if (!tags) return null;
  
  // Handle both string format ("tag1,tag2") and array format (["tag1", "tag2"])
  const tagNames = Array.isArray(tags) ? tags : tags.split(',').filter(tag => tag.trim());
  if (tagNames.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {tagNames.map((tagName) => {
        // Convert tag name to slug for URL (tags are already stored as slugs in the database)
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return (
          <Link
            key={tagName}
            to={`/tag/${tagSlug}`}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors no-underline"
          >
            <Tag className="h-3 w-3 mr-1" />
            {tagName}
          </Link>
        );
      })}
    </div>
  );
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const isFeatured = variant === 'featured';
  const isRecent = variant === 'recent';
  const showCoverImage = variant === 'default' && post.coverImage;
  
  // Helper function to handle date formatting
  const formatDate = (date: string | Date, format: 'long' | 'short' = 'long') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (format === 'short') {
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow ${showCoverImage ? 'overflow-hidden' : ''}`}>
      {showCoverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="aspect-video object-cover"
        />
      )}
      
      <div className="p-6">
        {/* Date at top for featured posts or default layout */}
        {(isFeatured || variant === 'default') && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDate(post.createdAt, 'long')}</span>
            {variant === 'default' && post.viewCount !== undefined && post.viewCount > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount}</span>
              </div>
            )}
            {variant === 'default' && post.commentCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.commentCount}</span>
              </div>
            )}
            {variant === 'default' && post.featured && (
              <span className="ml-auto px-2 py-1 text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-full">
                ★ Featured
              </span>
            )}
          </div>
        )}
        
        {/* Tags */}
        {renderTags(post.tags)}
        
        {/* Title */}
        <Link to={`/posts/${post.slug}`} className="no-underline">
          <h3 className={`font-semibold text-slate-900 mb-2 hover:text-indigo-600 transition-colors cursor-pointer ${
            isFeatured ? 'text-xl' : isRecent ? 'text-lg' : 'text-xl'
          }`}>
            {post.title}
          </h3>
        </Link>
        
        {/* Excerpt */}
        {post.excerpt && (
          <Link to={`/posts/${post.slug}`} className="no-underline">
            <p className={`text-slate-600 mb-4 hover:text-slate-700 transition-colors cursor-pointer ${
              isRecent ? 'text-sm' : 'text-base'
            }`}>
              {post.excerpt}
            </p>
          </Link>
        )}
        
        {/* Stats and actions */}
        {isFeatured ? (
          // Featured post layout
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{post.commentCount || 0}</span>
              </div>
            </div>
            <Link to={`/posts/${post.slug}`} className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Read More
            </Link>
          </div>
        ) : isRecent ? (
          // Recent post layout
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{post.viewCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{post.commentCount || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {formatDate(post.createdAt, 'short')}
              </span>
              <Link to={`/posts/${post.slug}`} className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Read
              </Link>
            </div>
          </>
        ) : (
          // Default layout
          <div className="flex items-center justify-between">
            <Link to={`/posts/${post.slug}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center transition-colors">
              Read More
              <Clock className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}