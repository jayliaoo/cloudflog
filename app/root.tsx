import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { Route } from "./+types/root";
import "./app.css";
import "./i18n";
import BlogLayout from "~/components/layouts/blog-layout";
import { getCurrentUser, getOwnerUser } from "~/auth.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const env = context.cloudflare.env as Env;
  const user = await getCurrentUser(request, env);
  const ownerUser = await getOwnerUser(env);
  
  // Detect language from Accept-Language header or cookie
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const cookieHeader = request.headers.get('Cookie') || '';
  const languageCookie = cookieHeader.match(/i18nextLng=([^;]+)/)?.[1];
  
  let detectedLanguage = 'en'; // default
  
  if (languageCookie) {
    // Use language from cookie if available
    detectedLanguage = languageCookie;
  } else if (acceptLanguage.includes('zh')) {
    // Detect Chinese from Accept-Language header
    detectedLanguage = 'zh';
  }
  
  // Normalize language
  if (detectedLanguage.startsWith('zh')) detectedLanguage = 'zh';
  else if (detectedLanguage.startsWith('en')) detectedLanguage = 'en';
  else detectedLanguage = 'en';
  
  return { user, ownerUser, language: detectedLanguage };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Set the language from server-detected language
    if (data?.language && i18n.language !== data.language) {
      i18n.changeLanguage(data.language);
    }
    // Set document direction for RTL languages if needed
    document.documentElement.dir = i18n.dir();
  }, [data?.language, i18n]);

  return (
    <html lang={data?.language || i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="text-slate-800">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INITIAL_LANGUAGE__ = ${JSON.stringify(data?.language || 'en')};`,
          }}
        />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, ownerUser } = useLoaderData<typeof loader>();
  
  return (
    <BlogLayout user={user} ownerUser={ownerUser}>
      <Outlet />
    </BlogLayout>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();
  let message = t('errors.oops');
  let details = t('errors.unexpectedError');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : t('common.error');
    details =
      error.status === 404
        ? t('errors.pageNotFound')
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
