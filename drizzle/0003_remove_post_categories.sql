-- Remove post_categories table and add categoryId to posts table
-- This migration assumes a post can only belong to one category

-- Step 1: Add categoryId column to posts table
ALTER TABLE post ADD COLUMN categoryId INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data (if any)
-- For posts that have categories, we'll take the first category found
-- This is a simplified approach - you might want to review and adjust manually
UPDATE post 
SET categoryId = (
  SELECT categoryId 
  FROM post_categories 
  WHERE post_categories.postId = post.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM post_categories 
  WHERE post_categories.postId = post.id
);

-- Step 3: Drop the post_categories table
DROP TABLE post_categories;