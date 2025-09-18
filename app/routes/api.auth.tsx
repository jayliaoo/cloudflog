import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticateWithGitHub } from "~/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/', '');
  
  if (path === 'callback/github') {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    
    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }
    
    try {
      const sessionToken = await authenticateWithGitHub(code, env);
      
      if (!sessionToken) {
        return new Response('Authentication failed', { status: 401 });
      }
      
      // Set session cookie and redirect
      const headers = new Headers();
      headers.append('Set-Cookie', `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
      headers.append('Location', '/admin');
      
      return new Response(null, { 
        status: 302, 
        headers 
      });
    } catch (error) {
      console.error('OAuth callback error:', error);
      return new Response('Authentication failed', { status: 500 });
    }
  }
  
  return new Response('Not found', { status: 404 });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/', '');
  
  if (path === 'session') {
    // Return current session info
    return new Response(JSON.stringify({ user: null }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not found', { status: 404 });
}