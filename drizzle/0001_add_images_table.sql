CREATE TABLE `image` (
	`objectKey` text PRIMARY KEY NOT NULL,
	`originalName` text NOT NULL,
	`mimeType` text NOT NULL,
	`size` integer NOT NULL,
	`uploadedBy` integer,
	`createdAt` integer NOT NULL DEFAULT (unixepoch('subsec') * 1000),
	FOREIGN KEY (`uploadedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);