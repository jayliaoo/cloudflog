import { data, useLoaderData, Form } from "react-router";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import PostCard from "~/components/blog/PostCard";
import Pagination from "~/components/Pagination";
import { createPostsService } from "~/services/posts.service";

interface SearchLoaderData {
  posts: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    createdAt: Date;
    published: boolean;
    tags: string | null;
    commentCount?: number;
  }>;
  query: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  error?: string;
}

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  
  // Get pagination parameters
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const postsPerPage = 10;
  
  try {
    if (!query.trim()) {
      return data({ 
        posts: [], 
        query: "", 
        totalCount: 0,
        currentPage: 1,
        totalPages: 0
      });
    }
    
    // Create posts service instance and search posts
    const postsService = createPostsService(env);
    const result = await postsService.searchPosts(query, page, postsPerPage);
    
    return data({
      posts: result.posts,
      query,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    return data({ 
      posts: [], 
      query: query || "", 
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      error: "Failed to search posts"
    });
  }
}

export default function SearchPage() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const { posts, totalCount, currentPage, totalPages, error } = loaderData as SearchLoaderData & { error?: string };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Search Results</h1>
        
        {/* Search Form */}
        <Form method="get" className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search posts by title or content..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </Form>
        
        {query && (
          <p className="mt-4 text-muted-foreground">
            Found {totalCount} result{totalCount !== 1 ? 's' : ''} for "{query}"
          </p>
        )}
      </div>
      
      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}
      
      {/* No Results */}
      {query && posts.length === 0 && !error && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground mb-4">
            No posts match your search for "{query}". Try different keywords or browse all posts.
          </p>
          <Link 
            to="/posts"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Browse All Posts
          </Link>
        </div>
      )}
      
      {/* Search Results */}
      {posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={{
                ...post,
                excerpt: post.excerpt || "",
                createdAt: post.createdAt.toISOString()
              }} 
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={10}
        itemName="results"
        baseUrl="/search"
        searchParams={new URLSearchParams({ q: query })}
      />
    </div>
  );
}