import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticateWithGitHub } from "~/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (error) {
    console.error('GitHub OAuth error:', error, errorDescription);
    return redirect('/auth/signin?error=' + encodeURIComponent(error));
  }
  
  if (!code) {
    return redirect('/auth/signin?error=no_code');
  }
  
  try {
    const sessionToken = await authenticateWithGitHub(code, env);
    if (!sessionToken) {
      return redirect('/auth/signin?error=authentication_failed');
    }
    
    // Set session cookie with proper settings for OAuth flow
    const headers = new Headers();
    
    // Use SameSite=Lax for OAuth redirects (more permissive than Strict)
    // and ensure it works for localhost development
    const cookieOptions = [
      `session=${sessionToken}`,
      'Path=/',
      'HttpOnly',
      'Max-Age=2592000', // 30 days
      'SameSite=Lax' // Changed from Strict to Lax for OAuth compatibility
    ];
    
    // Only add Secure flag for HTTPS (production)
    // Skip for localhost development
    if (env.AUTH_URL.startsWith('https://')) {
      cookieOptions.push('Secure');
    }
    
    headers.append('Set-Cookie', cookieOptions.join('; '));

    
    if (env.AUTH_URL.startsWith('https://')) {
      cookieOptions.push('Secure');
    }
    
    headers.append('Set-Cookie', cookieOptions.join('; '));
    
    // Use HTML redirect with meta refresh as fallback for better reliability
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=/posts">
          <script>window.location.href = '/posts';</script>
        </head>
        <body>
          <p>Authentication successful. Redirecting to blog posts...</p>
          <a href="/posts">Click here if not redirected</a>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          ...Object.fromEntries(headers.entries()),
          'Content-Type': 'text/html'
        }
      }
    );
  } catch (error) {
    console.error('Authentication failed:', error);
    return redirect('/auth/signin?error=auth_failed');
  }
}