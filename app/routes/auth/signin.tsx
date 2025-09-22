import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            Sign in to your blog
          </CardTitle>
          <CardDescription>
            Use your GitHub account to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    Authentication Error
                  </h3>
                  <div className="mt-2 text-sm text-destructive/80">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <form method="post" action="/auth/signin">
            <Button
              type="submit"
              className="w-full"
            >
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}