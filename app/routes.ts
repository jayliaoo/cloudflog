import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("posts/new", "routes/posts.new.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("admin", "routes/admin.tsx"),
  route("api/posts", "routes/api.posts.ts"),
  route("api/images/:objectKey?", "routes/api.images.ts"),
  route("auth/signin", "routes/auth/signin.tsx"),
  route("auth/signin/:provider", "routes/auth/signin.$provider.ts"),
  route("auth/signout", "routes/auth/signout.ts"),
  route("auth/error", "routes/auth.error.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("api/auth/*", "routes/api.auth.tsx"),

] satisfies RouteConfig;
