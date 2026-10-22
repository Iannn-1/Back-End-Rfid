# School ID Feature Migration Guide

## Overview
This migration adds a `school_id` field to the students table with the format `YYYY-NNNN` where:
- `YYYY` = Current year (automatically updates)
- `NNNN` = 4-digit number (editable, numbers only)

## Features Added

### Backend Changes
1. **Database**: Added `school_id` column to students table
2. **Model**: Updated Student model with school_id field and validation
3. **Controller**: Added auto-generation and validation logic for school_id
4. **API**: Create/Update endpoints now accept and return school_id

### Frontend Changes
1. **Add/Edit Student Form**: New School ID input field with year prefix and numeric validation
2. **Student Table**: School ID column displays instead of RFID Tag UID
3. **Student Profile**: Shows School ID prominently
4. **Mobile RFID Monitor**: Displays School ID instead of RFID Tag UID on scan

## Migration Steps

### 1. Backend Migration

Navigate to the backend directory and run the migration:

```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
npm run migrate:schoolid
```

This script will:
- Add the `school_id` column to the students table
- Auto-generate school IDs for all existing students (format: 2026-0001, 2026-0002, etc.)

### 2. Verify Migration

Check the migration was successful:

```bash
# Start the backend server
npm run dev

# Check a student record to verify school_id field exists
```

### 3. Frontend Update

The frontend changes are already in place. Just ensure you have the latest code and restart the dev server:

```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
npm run dev
```

## Usage Guide

### Adding a New Student

1. Navigate to Dashboard → Students → Add Student
2. Fill in the student information
3. **School ID field**: 
   - Year prefix (e.g., "2026-") is automatically shown and non-editable
   - Enter only the last 4 digits (e.g., "8813")
   - Only numbers are allowed (letters will be filtered out)
   - If left empty, a school ID will be auto-generated

### Editing Student School ID

1. Open student profile → Edit
2. Modify the last 4 digits of the School ID
3. The year prefix updates automatically based on the current year
4. Only numeric input is accepted

### Mobile RFID Monitor

When scanning a student's RFID card:
- The monitor now displays the **School ID** (e.g., "2026-8813") instead of the RFID Tag UID
- Recent scans list shows School ID for easy identification
- RFID Tag UID is still stored in the backend for scanning purposes

## Field Validation

### School ID Format
- **Pattern**: `YYYY-NNNN` (e.g., `2026-8813`)
- **Year**: Auto-populated with current year
- **Digits**: Must be exactly 4 numeric digits (0-9)
- **Unique**: Each school ID must be unique across all students

### Input Restrictions
- Letters are automatically filtered out
- Maximum 4 digits allowed
- Hyphen is automatically added between year and digits
- Year updates automatically each calendar year

## Database Schema

```sql
ALTER TABLE students 
ADD COLUMN school_id VARCHAR(20) NULL UNIQUE;
```

## API Changes

### POST /api/v1/students (Create Student)
**New Field**:
```json
{
  "school_id": "2026-8813",  // Optional, auto-generated if omitted
  // ... other fields
}
```

### PUT /api/v1/students/:id (Update Student)
**New Field**:
```json
{
  "school_id": "2026-9999",  // Optional, editable (only last 4 digits)
  // ... other fields
}
```

### Response
All student responses now include:
```json
{
  "id": 1,
  "school_id": "2026-8813",
  "rfid_tag_uid": "69BCD80D",
  // ... other fields
}
```

## Troubleshooting

### Migration Failed
If migration fails:
1. Check database connection in `.env`
2. Ensure MySQL server is running
3. Check for existing `school_id` column (script will skip if exists)

### Duplicate School ID Error
If you encounter "School ID already in use":
1. The system prevents duplicate school IDs
2. Try a different 4-digit number
3. Leave field empty to auto-generate

### Year Not Updating
The year prefix updates based on:
- Server system time when creating/editing
- Displayed year in the UI uses client-side `new Date().getFullYear()`

## Rollback (If Needed)

To remove the school_id feature:

```sql
ALTER TABLE students DROP COLUMN school_id;
```

Then revert the code changes in both frontend and backend.

## Notes

- School IDs are **optional** during migration to support existing data
- Auto-generation ensures no conflicts
- Year automatically increments every January 1st
- Old RFID Tag UID field is still stored and used for scanning
- School ID is for display and identification purposes
