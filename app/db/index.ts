import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDBClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type { User, NewUser, Post, NewPost, Tag, NewTag, Comment, NewComment } from './schema';