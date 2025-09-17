import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/auth.server";

// Create a mock NextAuth request with the required structure
function createNextAuthRequest(request: Request, path: string) {
  const url = new URL(request.url);
  const [action, provider] = path.split('/').filter(Boolean);
  
  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // @ts-ignore - Adding NextAuth-specific properties
    query: {
      nextauth: action === 'callback' ? [action, provider] : [action]
    }
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const auth = getAuth(context.cloudflare.env as Env);
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/', '');
  
  try {
    const mockRequest = createNextAuthRequest(request, path);
    return await auth(mockRequest);
  } catch (error) {
    console.error("Auth error:", error);
    return new Response("Authentication error", { status: 500 });
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  const auth = getAuth(context.cloudflare.env as Env);
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/', '');
  
  try {
    const mockRequest = createNextAuthRequest(request, path);
    return await auth(mockRequest);
  } catch (error) {
    console.error("Auth error:", error);
    return new Response("Authentication error", { status: 500 });
  }
}