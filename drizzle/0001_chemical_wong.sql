PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_post_views` (
	`post_id` integer NOT NULL,
	`user_id` integer DEFAULT 0,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	PRIMARY KEY(`post_id`, `user_id`),
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_views`("post_id", "user_id", "view_count", "created_at", "updated_at") SELECT "post_id", "user_id", "view_count", "created_at", "updated_at" FROM `post_views`;--> statement-breakpoint
DROP TABLE `post_views`;--> statement-breakpoint
ALTER TABLE `__new_post_views` RENAME TO `post_views`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`image` text,
	`role` text DEFAULT 'reader' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "created_at", "image", "role") SELECT "id", "name", "email", "created_at", "image", "role" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
CREATE TABLE `__new_image` (
	`object_key` text PRIMARY KEY NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_image`("object_key", "original_name", "mime_type", "size", "created_at") SELECT "object_key", "original_name", "mime_type", "size", "created_at" FROM `image`;--> statement-breakpoint
DROP TABLE `image`;--> statement-breakpoint
ALTER TABLE `__new_image` RENAME TO `image`;--> statement-breakpoint
CREATE TABLE `__new_post` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`cover_image` text,
	`published` integer DEFAULT false NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_post`("id", "title", "slug", "content", "excerpt", "cover_image", "published", "featured", "view_count", "created_at", "updated_at") SELECT "id", "title", "slug", "content", "excerpt", "cover_image", "published", "featured", "view_count", "created_at", "updated_at" FROM `post`;--> statement-breakpoint
DROP TABLE `post`;--> statement-breakpoint
ALTER TABLE `__new_post` RENAME TO `post`;--> statement-breakpoint
CREATE UNIQUE INDEX `post_slug_unique` ON `post` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_comment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`author_id` integer,
	`post_id` integer NOT NULL,
	`parent_id` integer,
	`deleted_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comment`("id", "content", "author_id", "post_id", "parent_id", "deleted_at", "created_at", "updated_at") SELECT "id", "content", "author_id", "post_id", "parent_id", "deleted_at", "created_at", "updated_at" FROM `comment`;--> statement-breakpoint
DROP TABLE `comment`;--> statement-breakpoint
ALTER TABLE `__new_comment` RENAME TO `comment`;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_session`("session_token", "user_id", "expires") SELECT "session_token", "user_id", "expires" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `updated_at`;