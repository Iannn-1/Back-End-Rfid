-- ============================================================================
-- MULTIPLE CHILDREN SUPPORT MIGRATION
-- ============================================================================
-- This migration creates the parent_students junction table to support
-- parents monitoring multiple children
-- ============================================================================

-- Step 1: Create parent_students junction table
CREATE TABLE IF NOT EXISTS parent_students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NOT NULL,
  rfid_tag_uid VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key to parents table
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  
  -- Unique constraint: prevent duplicate parent-child pairs
  UNIQUE KEY parent_student_unique (parent_id, rfid_tag_uid),
  
  -- Index for faster queries
  INDEX idx_parent_id (parent_id),
  INDEX idx_rfid_tag (rfid_tag_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate existing parent data to parent_students table
-- For each existing parent, create a parent_student record with is_primary=true
INSERT INTO parent_students (parent_id, rfid_tag_uid, is_primary, createdAt, updatedAt)
SELECT 
  id AS parent_id,
  rfid_tag_uid,
  true AS is_primary,
  createdAt,
  updatedAt
FROM parents
WHERE rfid_tag_uid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM parent_students ps 
  WHERE ps.parent_id = parents.id 
  AND ps.rfid_tag_uid = parents.rfid_tag_uid
);

-- Step 3: Verify migration
-- This query should show how many parents and children were migrated
SELECT 
  COUNT(*) AS total_parent_student_records,
  COUNT(DISTINCT parent_id) AS unique_parents,
  COUNT(DISTINCT rfid_tag_uid) AS unique_children,
  SUM(is_primary) AS primary_children
FROM parent_students;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration:
-- DROP TABLE IF EXISTS parent_students;
-- ============================================================================
