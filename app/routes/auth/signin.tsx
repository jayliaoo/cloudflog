import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { getCurrentUser } from "~/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  
  // Check if user is already logged in
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = cookieHeader?.match(/session=([^;]+)/)?.[1];
  
  if (sessionToken) {
    const env = context.cloudflare.env as Env;
    const user = await getCurrentUser(request, env);
    
    if (user) {
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
    redirect_uri: `${env.AUTH_URL}/auth/callback`,
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="text-center p-6 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Sign in to your blog
          </h1>
          <p className="mt-2 text-slate-600">
            Use your GitHub account to access the blog
          </p>
        </div>
        <div className="px-6 pb-6">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
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
          
          <form method="post" action="/auth/signin">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Sign in with GitHub
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}