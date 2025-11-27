-- Add admin_role column to users table
ALTER TABLE users ADD COLUMN admin_role TEXT DEFAULT 'admin';

-- Update existing admin user to be reports_viewer
UPDATE users SET admin_role = 'reports_viewer' WHERE admin_id = 'admin';