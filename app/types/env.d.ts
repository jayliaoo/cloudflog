export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
}

export interface CustomEnv {
  // R2 S3-compatible API credentials
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ENDPOINT?: string;
  R2_REGION?: string;
  R2_BUCKET_NAME?: string;
  
  // Legacy R2 binding (optional for fallback)
  R2?: R2Bucket;
  
  // Existing environment variables
  D1: D1Database;
  ASSETS: Fetcher;
  AUTH_URL: string;
  IMAGE_BASE_URL: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  NEXTAUTH_SECRET?: string;
}