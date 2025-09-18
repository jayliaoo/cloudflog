import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  
  // Check if user is already logged in
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = cookieHeader?.match(/session=([^;]+)/)?.[1];
  
  if (sessionToken) {
    const env = context.cloudflare.env as Env;
    const { getSession } = await import("~/auth.server");
    const session = await getSession(sessionToken, env);
    
    if (session) {
      // User is already logged in, redirect to home page
      return redirect("/");
    }
  }
  
  const errorMessages: Record<string, string> = {
    access_denied: "You denied access to your GitHub account. Please try again.",
    no_code: "Invalid authentication request. Please try again.",
    auth_failed: "Authentication failed. Please try again or contact support.",
  };
  
  return { error: error, errorMessage: error ? errorMessages[error] || "An unexpected error occurred. Please try again." : null };
}

export async function action({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  
  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID();
  
  // Build GitHub OAuth authorization URL
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.NEXTAUTH_URL}/auth/callback`,
    scope: 'user:email',
    state: state,
    allow_signup: 'false'
  });
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  
  return redirect(githubAuthUrl);
}

export default function SignIn() {
  const { error, errorMessage } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your blog
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your GitHub account to access the admin panel
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <form method="post" action="/auth/signin">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}