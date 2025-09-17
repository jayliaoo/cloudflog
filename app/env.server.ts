export function getEnv(): Env {
  // In development, use environment variables from process.env
  if (typeof process !== 'undefined' && process.env) {
    return {
      D1: process.env.D1 as unknown as D1Database,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    };
  }
  
  // In production, this would be provided by the runtime
  // For now, we'll throw an error if not in development
  throw new Error('Environment variables not available in production context');
}