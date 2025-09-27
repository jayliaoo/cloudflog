import type { ActionFunctionArgs } from "react-router";
import { deleteSession } from "~/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const cookieHeader = request.headers.get('Cookie');
  
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies['session'];
    
    if (sessionToken) {
      await deleteSession(sessionToken, env);
    }
  }
  
  // Clear session cookie and redirect to home
  const headers = new Headers();
  headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  headers.append('Location', '/');
  
  return new Response(null, { 
    status: 302, 
    headers 
  });
}

// Simple cookie parser
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join('='));
    }
  });
  return cookies;
}