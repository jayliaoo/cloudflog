DROP TABLE `post_categories`;--> statement-breakpoint
ALTER TABLE `post` ADD `category_id` integer REFERENCES categories(id);