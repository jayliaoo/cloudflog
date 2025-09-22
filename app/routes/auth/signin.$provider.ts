import type { ActionFunctionArgs } from "react-router";
import { authenticateWithGitHub } from "~/auth.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
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
    
    // Set session cookie
    const headers = new Headers();
    headers.append('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
    headers.append('Location', '/admin');
    
    return new Response(null, { 
      status: 302, 
      headers 
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}