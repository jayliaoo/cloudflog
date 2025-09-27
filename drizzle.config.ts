import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  casing: 'snake_case',
} satisfies Config;