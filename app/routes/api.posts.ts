import { data } from "react-router";

export async function loader({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  
  try {
    // For now, return mock data. In a real app, this would query the D1 database
    const posts = [
      {
        id: 1,
        title: "Getting Started with React Router v7",
        slug: "getting-started-react-router-v7",
        excerpt: "Learn how to build modern web applications with React Router v7...",
        content: "React Router v7 is a powerful framework for building modern web applications...",
        coverImage: "https://via.placeholder.com/800x400/0066cc/ffffff?text=React+Router+v7",
        date: "2024-01-15",
        author: {
          name: "John Doe",
          avatar: "https://via.placeholder.com/100x100/cccccc/666666?text=JD",
          bio: "Full-stack developer passionate about React and modern web technologies."
        },
        tags: ["React", "Router", "JavaScript"],
        published: true,
        views: 1250,
        readingTime: "5 min read"
      },
      {
        id: 2,
        title: "Building with Cloudflare Workers",
        slug: "building-with-cloudflare-workers",
        excerpt: "Discover the power of edge computing with Cloudflare Workers...",
        content: "Cloudflare Workers allow you to run JavaScript at the edge...",
        coverImage: "https://via.placeholder.com/800x400/ff6600/ffffff?text=Cloudflare+Workers",
        date: "2024-01-10",
        author: {
          name: "Jane Smith",
          avatar: "https://via.placeholder.com/100x100/cccccc/666666?text=JS",
          bio: "Cloud engineer specializing in edge computing and serverless architectures."
        },
        tags: ["Cloudflare", "Workers", "Edge Computing"],
        published: true,
        views: 890,
        readingTime: "8 min read"
      },
      {
        id: 3,
        title: "Modern CSS with Tailwind",
        slug: "modern-css-with-tailwind",
        excerpt: "Master utility-first CSS development with Tailwind CSS...",
        content: "Tailwind CSS is a utility-first CSS framework that helps you build modern designs...",
        coverImage: "https://via.placeholder.com/800x400/38bdf8/ffffff?text=Tailwind+CSS",
        date: "2024-01-05",
        author: {
          name: "Mike Johnson",
          avatar: "https://via.placeholder.com/100x100/cccccc/666666?text=MJ",
          bio: "Frontend developer and UI/UX enthusiast."
        },
        tags: ["CSS", "Tailwind", "Design"],
        published: false,
        views: 0,
        readingTime: "6 min read"
      }
    ];

    return data({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return data({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function action({ request, context }: { request: Request; context: { cloudflare: { env: Env } } }) {
  const { env } = context.cloudflare;
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "create":
        // Handle post creation
        const title = formData.get("title");
        const content = formData.get("content");
        const excerpt = formData.get("excerpt");
        const tags = formData.get("tags");
        const published = formData.get("published") === "true";
        
        // In a real app, this would insert into D1 database
        return data({ success: true, message: "Post created successfully" });
        
      case "update":
        // Handle post update
        const id = formData.get("id");
        return data({ success: true, message: "Post updated successfully" });
        
      case "delete":
        // Handle post deletion
        const deleteId = formData.get("id");
        return data({ success: true, message: "Post deleted successfully" });
        
      default:
        return data({ error: "Invalid intent" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling post action:", error);
    return data({ error: "Failed to process request" }, { status: 500 });
  }
}