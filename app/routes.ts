import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("posts/new", "routes/posts.new.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("admin", "routes/admin.tsx"),
  route("tags", "routes/tags.tsx"),
  route("tag/:tagSlug", "routes/tag.$tagSlug.tsx"),
  route("search", "routes/search.tsx"),
  route("api/posts", "routes/api.posts.ts"),
  route("api/tags", "routes/api.tags.ts"),
  route("api/images/:objectKey?", "routes/api.images.ts"),
  route("auth/signin", "routes/auth/signin.tsx"),
  route("auth/signin/:provider", "routes/auth/signin.$provider.ts"),
  route("auth/signout", "routes/auth/signout.ts"),
  route("auth/error", "routes/auth.error.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("api/auth/*", "routes/api.auth.tsx"),
  route("api/comments", "routes/api.comments.ts"),
  route("api/comments/:id", "routes/api.comments.$id.ts"),

] satisfies RouteConfig;
