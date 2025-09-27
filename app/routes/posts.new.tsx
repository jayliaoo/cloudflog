import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLoaderData } from "react-router";
import { data } from "react-router";
import MarkdownPreview from "~/components/blog/markdown-preview";
import MarkdownToolbar from "~/components/blog/markdown-toolbar";
import TagInput from "~/components/blog/tag-input";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "~/auth.server";

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  // Check authentication and role
  const user = await getCurrentUser(request, env);
  if (!user) {
    return data({ error: "Authentication required" }, { status: 401 });
  }
  
  if (user.role !== 'owner') {
    return data({ error: "Admin access required" }, { status: 403 });
  }
  
  const url = new URL(request.url);
  const editId = url.searchParams.get('edit');
  
  try {
    if (!editId) {
      return data({ post: null, user });
    }
    
    const db = getDBClient(env.D1);
    const postId = parseInt(editId, 10);
    
    if (isNaN(postId)) {
      return data({ error: "Invalid post ID" }, { status: 400 });
    }
    
    const postData = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        published: posts.published,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    
    // Fetch tags for the post
    const postTagsData = await db
      .select({
        tagName: tags.name,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
      .where(eq(postTags.postId, postId));
    
    if (postData.length === 0) {
      return data({ error: "Post not found" }, { status: 404 });
    }
    
    return data({ 
      post: {
        ...postData[0],
        tags: postTagsData.map(pt => pt.tagName)
      },
      user
    });
  } catch (error) {
    console.error("Error loading post for editing:", error);
    return data({ error: "Failed to load post" }, { status: 500 });
  }
}

export default function NewPost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Handle loader errors
  useEffect(() => {
    if ('error' in loaderData && loaderData.error) {
      setError(loaderData.error);
    }
  }, [loaderData]);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    tags: [] as string[],
    published: false,
  });

  // Load existing post data when editing
  useEffect(() => {
    if (isEditing && 'post' in loaderData && loaderData.post) {
      setFormData({
        title: loaderData.post.title || "",
        slug: loaderData.post.slug || "",
        content: loaderData.post.content || "",
        tags: loaderData.post.tags || [],
        published: loaderData.post.published || false,
      });
    }
  }, [isEditing, loaderData]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate excerpt from content
      const excerpt = generateExcerpt(formData.content);
      
      // Create JSON payload for draft
      const jsonData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: excerpt,
        content: formData.content,
        published: false, // Save as draft
        tags: formData.tags,
        ...(isEditing && { id: editId }) // Include ID when editing
      };

      const response = await fetch("/api/posts", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} draft`);
      }

      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate excerpt from content
      const excerpt = generateExcerpt(formData.content);
      
      // Create JSON payload for published post
      const jsonData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: excerpt,
        content: formData.content,
        published: true, // Publish the post
        tags: formData.tags,
        ...(isEditing && { id: editId }) // Include ID when editing
      };

      const response = await fetch("/api/posts", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'publish'} post`);
      }

      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const generateExcerpt = (content: string): string => {
    // Remove markdown formatting
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/\[.*?\]\(.*?\)/g, '$1') // Replace links with text
      .replace(/^\s*[\-\*]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/^\s*>\s+/gm, '') // Remove blockquote markers
      .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
      .replace(/\n/g, ' ') // Replace single newlines with space
      .trim();

    // Take first 150 characters and add ellipsis if longer
    if (plainText.length <= 150) {
      return plainText;
    }
    return plainText.substring(0, 150) + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update your existing blog post' : 'Share your thoughts, tutorials, and insights with the world'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter your blog title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                required
                value={formData.slug}
                onChange={handleChange}
                placeholder="my-awesome-blog-post"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                URL-friendly version of your title (lowercase, hyphens only)
              </p>
            </div>



            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <div className="flex border-b border-gray-300">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'edit' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'preview' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <div className="p-4">
                  {activeTab === 'edit' ? (
                    <>

                      <MarkdownToolbar
                        textareaRef={contentTextareaRef as React.RefObject<HTMLTextAreaElement>}
                        content={formData.content}
                        setContent={(content) => setFormData(prev => ({ ...prev, content }))}
                      />
                      <textarea
                        ref={contentTextareaRef}
                        id="content"
                        name="content"
                        required
                        rows={15}
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Write your blog content here..."
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                      />
                    </>
                  ) : (
                    <div className="min-h-[360px] max-h-[360px] overflow-y-auto">
                      <MarkdownPreview content={formData.content} />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                You can use Markdown for formatting (headers, links, code blocks, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tags
              </label>
              <TagInput
                selectedTags={formData.tags}
                onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Type to search existing tags or create new ones
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={handlePublish} 
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
              >
                {loading ? (isEditing ? "Updating..." : "Publishing...") : (isEditing ? "Update Post" : "Publish Post")}
              </button>
              <button 
                type="button" 
                onClick={handleSaveDraft} 
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-md font-medium transition-colors"
              >
                {loading ? "Saving Draft..." : (isEditing ? "Save as Draft" : "Save Draft")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}