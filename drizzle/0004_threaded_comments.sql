-- Add parent comment support for threaded comments
ALTER TABLE comment ADD COLUMN parent_id INTEGER REFERENCES comment(id) ON DELETE CASCADE;

-- Add edit/delete support
ALTER TABLE comment ADD COLUMN edit_token TEXT;
ALTER TABLE comment ADD COLUMN edited_at INTEGER;
ALTER TABLE comment ADD COLUMN deleted_at INTEGER;

-- Add indexes for better performance
CREATE INDEX idx_comment_post_id ON comment(post_id);
CREATE INDEX idx_comment_parent_id ON comment(parent_id);
CREATE INDEX idx_comment_approved ON comment(approved);
CREATE INDEX idx_comment_created_at ON comment(created_at);