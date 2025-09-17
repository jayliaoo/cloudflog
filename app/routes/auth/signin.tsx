import { getAuth } from "~/auth.server";
import { getEnv } from "~/env.server";
import { Form, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const env = getEnv();
  const auth = getAuth(env);
  
  // Get available providers
  const providers = await auth.providers;
  
  return { providers };
}

export default function SignIn() {
  const { providers } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {providers && Object.values(providers).length > 0 ? (
            Object.values(providers).map((provider: any) => (
              <div key={provider.name}>
                <form action={`/auth/signin/${provider.id}`} method="post">
                  <input type="hidden" name="callbackUrl" value="/admin" />
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Sign in with {provider.name}
                  </button>
                </form>
              </div>
            ))
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">No authentication providers available</p>
              <form action="/auth/signin/github" method="post">
                <input type="hidden" name="callbackUrl" value="/admin" />
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Sign in with GitHub
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}