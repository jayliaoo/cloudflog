import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLoaderData } from "react-router";
import { data } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import MarkdownPreview from "~/components/blog/markdown-preview";
import MarkdownToolbar from "~/components/blog/markdown-toolbar";
import TagInput from "~/components/blog/tag-input";
import { getDBClient } from "~/db";
import { posts } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const url = new URL(request.url);
  const editId = url.searchParams.get('edit');
  
  try {
    if (!editId) {
      return data({ post: null });
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
        coverImage: posts.coverImage,
        authorId: posts.authorId,
        published: posts.published,

      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);
    
    if (postData.length === 0) {
      return data({ error: "Post not found" }, { status: 404 });
    }
    
    return data({ post: postData[0] });
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle loader errors
  useEffect(() => {
    if (loaderData.error) {
      setError(loaderData.error);
    }
  }, [loaderData.error]);
  
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    tags: [],
  });

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing post data when editing
  useEffect(() => {
    if (isEditing && loaderData.post) {
      setFormData({
        title: loaderData.post.title || "",
        slug: loaderData.post.slug || "",
        content: loaderData.post.content || "",
        tags: [],
      });
      // Set the tags if the post has any
        if (loaderData.post.tags) {
          const postTags = loaderData.post.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
          setFormData(prev => ({ ...prev, tags: postTags }));
        }
    }
  }, [isEditing, loaderData.post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Generate excerpt from content
      const excerpt = generateExcerpt(formData.content);
      
      // Create JSON payload
      const jsonData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: excerpt,
        content: formData.content,
        published: true,
        tags: formData.tags.join(", "),
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
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} post`);
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your blog title"
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
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="my-awesome-blog-post"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                URL-friendly version of your title (lowercase, hyphens only)
              </p>
            </div>



            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
              </label>
              <div className="border border-input rounded-md overflow-hidden">
                <div className="flex border-b border-input">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'edit'
                        ? 'bg-background text-foreground border-b-2 border-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'preview'
                        ? 'bg-background text-foreground border-b-2 border-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <div className="p-4">
                  {activeTab === 'edit' ? (
                    <>

                      <MarkdownToolbar
                        textareaRef={contentTextareaRef}
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
                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                        placeholder="Write your blog content here..."
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
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Post" : "Create Post")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}