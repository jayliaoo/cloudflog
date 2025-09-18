PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_post_tags` (
	`post_id` integer NOT NULL,
	`tag_slug` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	PRIMARY KEY(`post_id`, `tag_slug`),
	FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_slug`) REFERENCES `tags`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_post_tags`("post_id", "tag_slug", "created_at") SELECT "post_id", "tag_slug", "created_at" FROM `post_tags`;--> statement-breakpoint
DROP TABLE `post_tags`;--> statement-breakpoint
ALTER TABLE `__new_post_tags` RENAME TO `post_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`name` text NOT NULL,
	`slug` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tags`("name", "slug", "created_at", "updated_at") SELECT "name", "slug", "created_at", "updated_at" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);