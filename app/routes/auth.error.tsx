import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

export default function AuthError() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return t('auth.configurationError');
      case "AccessDenied":
        return t('auth.accessDenied');
      case "Verification":
        return t('auth.verificationError');
      default:
        return t('auth.authError');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="text-center p-6 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">
            {t('auth.authenticationError')}
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
            {t('auth.trySignInAgain')}
          </a>
        </div>
      </div>
    </div>
  );
}