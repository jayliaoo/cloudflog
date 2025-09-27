import { useSearchParams } from "react-router";

export default function AuthError() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="text-center p-6 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Authentication Error
          </h1>
        </div>
        <div className="text-center space-y-4 p-6 pt-0">
          <p className="text-slate-600">
            {getErrorMessage(error)}
          </p>
          <a 
            href="/auth/signin"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Try signing in again
          </a>
        </div>
      </div>
    </div>
  );
}