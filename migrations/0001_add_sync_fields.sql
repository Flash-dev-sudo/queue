-- Add sync fields to categories table
ALTER TABLE categories ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE categories ADD COLUMN deleted_at TEXT;
ALTER TABLE categories ADD COLUMN content_hash TEXT;

-- Add sync fields to menu_items table
ALTER TABLE menu_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL;
ALTER TABLE menu_items ADD COLUMN deleted_at TEXT;
ALTER TABLE menu_items ADD COLUMN content_hash TEXT;

-- Update existing rows to have current timestamp for updatedAt
UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE menu_items SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;