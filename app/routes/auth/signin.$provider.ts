import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getAuth } from "~/auth.server";
import { getEnv } from "~/env.server";
import { redirect } from "react-router";

function createNextAuthRequest(request: Request, providerId: string) {
  const url = new URL(request.url);
  
  // Create a mock request object that NextAuth can understand
  const mockRequest = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    query: { nextauth: ["signin", providerId] },
    body: null,
  } as any;
  
  // Add properties that NextAuth expects
  mockRequest.headers.host = url.host;
  mockRequest.headers['user-agent'] = request.headers.get('user-agent') || '';
  mockRequest.headers['x-forwarded-proto'] = url.protocol.slice(0, -1);
  mockRequest.headers['x-forwarded-host'] = url.host;
  
  return mockRequest;
}

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const providerId = params.provider;
  const { env } = context.cloudflare as { env: Env };
  
  console.log("Loader called with params:", params);
  
  if (!providerId) {
    return redirect("/auth/signin");
  }

  // For GET requests, redirect to the main signin page
  // NextAuth will handle the provider selection
  return redirect(`/auth/signin?provider=${providerId}`);
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const providerId = params.provider;
  const { env } = context.cloudflare as { env: Env };
  
  console.log("Action called with providerId:", providerId);
  
  if (!providerId) {
    return redirect("/auth/signin");
  }

  try {
    // Get the form data from the request
    const formData = await request.formData();
    const callbackUrl = formData.get('callbackUrl')?.toString() || '/';
    
    console.log("Callback URL:", callbackUrl);
    console.log("GitHub Client ID:", env.GITHUB_CLIENT_ID);
    console.log("NextAuth URL:", env.NEXTAUTH_URL);
    
    // Redirect to GitHub OAuth directly
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', `${env.NEXTAUTH_URL}/auth/callback/github`);
    githubAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubAuthUrl.searchParams.set('state', callbackUrl);
    
    console.log("Redirecting to:", githubAuthUrl.toString());
    
    return redirect(githubAuthUrl.toString());
  } catch (error) {
    console.error("Auth provider error:", error);
    return redirect("/auth/signin");
  }
}