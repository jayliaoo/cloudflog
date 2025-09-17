import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // driver: 'd1',
  // dbCredentials: {
    // wranglerConfigPath: './wrangler.jsonc',
    // dbName: 'blog',
  // },
} satisfies Config;