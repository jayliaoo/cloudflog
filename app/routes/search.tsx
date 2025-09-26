import { data, useLoaderData, Form } from "react-router";
import { Link, useSearchParams } from "react-router";
import { Search } from "lucide-react";
import PostCard from "~/components/blog/PostCard";
import Pagination from "~/components/Pagination";
import { getDBClient } from "~/db";
import { posts, tags, postTags } from "~/db/schema";
import { desc, eq, or, like, and, count } from "drizzle-orm";

interface SearchLoaderData {
  posts: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    createdAt: Date;
    published: boolean;
    tags: string[];
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
  
  const db = getDBClient(env.D1);
  
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
    
    // Search in both title and content
    const searchTerm = `%${query}%`;
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({
        count: count()
      })
      .from(posts)
      .where(and(
        eq(posts.published, true),
        or(
          like(posts.title, searchTerm),
          like(posts.content, searchTerm)
        )
      ));
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / postsPerPage);
    
    // Calculate offset for pagination
    const offset = (page - 1) * postsPerPage;
    
    // Fetch matching posts with pagination
    const searchResults = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        createdAt: posts.createdAt,
        published: posts.published
      })
      .from(posts)
      .where(and(
        eq(posts.published, true),
        or(
          like(posts.title, searchTerm),
          like(posts.content, searchTerm)
        )
      ))
      .orderBy(desc(posts.createdAt))
      .limit(postsPerPage)
      .offset(offset);
    
    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      searchResults.map(async (post) => {
        const postTagsData = await db
          .select({
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagSlug, tags.slug))
          .where(eq(postTags.postId, post.id));
        
        return {
          ...post,
          excerpt: post.excerpt || "",
          tags: postTagsData.map(pt => pt.tagName),
        };
      })
    );
    
    return data({ 
      posts: postsWithTags, 
      query: query || "", 
      totalCount,
      currentPage: page,
      totalPages
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
        searchParams={{ q: query }}
      />
    </div>
  );
}