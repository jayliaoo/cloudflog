import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Helper function for timestamp fields
const timestampField = () => integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch('subsec') * 1000)`);

// Single user blog - simplified schema

export const users = sqliteTable('user', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text(),
  email: text().notNull(),
  createdAt: timestampField(),
  image: text(),
  role: text().notNull().default('reader'), // 'owner' or 'reader'
});

export const sessions = sqliteTable('session', {
  sessionToken: text().notNull().primaryKey(),
  userId: integer().notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestampField(),
});

export const posts = sqliteTable('post', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  slug: text().notNull().unique(),
  content: text().notNull(),
  excerpt: text(),
  coverImage: text(),
  published: integer({ mode: 'boolean' }).notNull().default(false),
  featured: integer({ mode: 'boolean' }).notNull().default(false),
  viewCount: integer().notNull().default(0), // New view count column
  createdAt: timestampField(),
  updatedAt: timestampField(),
});

export const comments = sqliteTable('comment', {
  id: integer().primaryKey({ autoIncrement: true }),
  content: text().notNull(),
  authorId: integer().references(() => users.id, { onDelete: 'set null' }), // Reference to user if signed in
  postId: integer().notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: integer(),
  deletedAt: integer({ mode: 'timestamp_ms' }),
  createdAt: timestampField(),
  updatedAt: timestampField(),
});

export const images = sqliteTable('image', {
  objectKey: text().primaryKey(), // UUID as primary key
  originalName: text().notNull(),
  mimeType: text().notNull(),
  size: integer().notNull(),
  createdAt: timestampField(),
});

export const tags = sqliteTable('tags', {
  name: text().notNull().unique(),
  slug: text().primaryKey(),
  createdAt: timestampField(),
});

export const postTags = sqliteTable('post_tags', {
  postId: integer().notNull().references(() => posts.id, { onDelete: 'cascade' }),
  tagSlug: text().notNull().references(() => tags.slug, { onDelete: 'cascade' }),
  createdAt: timestampField(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagSlug] }),
}));

// New table for tracking user-specific views
export const postViews = sqliteTable('post_views', {
  postId: integer().notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: integer().default(0), // 0 for anonymous users
  viewCount: integer().notNull().default(0), // New view count column
  createdAt: timestampField(),
  updatedAt: timestampField(),
}, (table) => ({
  uniquePostUser: primaryKey({ columns: [table.postId, table.userId] }),
}));



// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type PostTag = typeof postTags.$inferSelect;
export type NewPostTag = typeof postTags.$inferInsert;

export type PostView = typeof postViews.$inferSelect;
export type NewPostView = typeof postViews.$inferInsert;