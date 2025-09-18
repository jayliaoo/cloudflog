export function getEnv(): Env {
  // This function is only used in development/testing contexts
  // In production, the environment is provided by the Cloudflare Workers runtime
  // We'll return a mock environment for development
  return {
    VALUE_FROM_CLOUDFLARE: 'Hello from Cloudflare',
    D1: {} as D1Database,
    R2: {} as R2Bucket,
    ASSETS: {} as any,
    GITHUB_CLIENT_ID: 'your-github-client-id',
    GITHUB_CLIENT_SECRET: 'your-github-client-secret',
    NEXTAUTH_URL: 'http://localhost:5173' as "http://localhost:5173",
    NEXTAUTH_SECRET: 'your-nextauth-secret' as "your-nextauth-secret",
  };
}