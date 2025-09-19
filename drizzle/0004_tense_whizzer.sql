PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`author_name` text,
	`author_email` text,
	`author_id` integer,
	`post_id` integer NOT NULL,
	`parent_id` integer,
	`edit_token` text,
	`edited_at` integer,
	`deleted_at` integer,
	`approved` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `comment`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comment`("id", "content", "author_name", "author_email", "author_id", "post_id", "parent_id", "edit_token", "edited_at", "deleted_at", "approved", "created_at", "updated_at") SELECT "id", "content", "author_name", "author_email", NULL, "post_id", "parent_id", "edit_token", "edited_at", "deleted_at", "approved", "created_at", "updated_at" FROM `comment`;--> statement-breakpoint
DROP TABLE `comment`;--> statement-breakpoint
ALTER TABLE `__new_comment` RENAME TO `comment`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'reader' NOT NULL;