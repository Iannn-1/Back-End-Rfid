-- Add archived column to students table
-- This allows soft-delete functionality instead of permanently deleting student records

ALTER TABLE students 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false
AFTER parent_phone;

-- Create index for faster queries on archived students
CREATE INDEX idx_archived ON students(archived);

-- Optional: Archive any students that have status='Inactive'
-- Uncomment the line below if you want to automatically archive inactive students
-- UPDATE students SET archived = true WHERE status = 'Inactive';
