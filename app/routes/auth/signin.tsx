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
    headers.append('Set-Cookie', `next-auth.session-token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
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

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your blog
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={() => {
                // Simulate GitHub OAuth flow
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/auth/signin';
                
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'code';
                input.value = 'simulated-github-code';
                
                form.appendChild(input);
                document.body.appendChild(form);
                form.submit();
              }}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}