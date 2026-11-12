# Student Archive Feature Implementation Guide

## Overview
Instead of permanently deleting students, they are now "archived" (soft delete). This preserves historical data while keeping the main student list clean.

## Database Changes

### Step 1: Add archived column to students table

Run this SQL in your Railway database:

```sql
-- Add archived column
ALTER TABLE students 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false
AFTER parent_phone;

-- Create index for faster queries
CREATE INDEX idx_archived ON students(archived);
```

**Or** run the provided SQL file: `ADD_ARCHIVED_COLUMN.sql`

## Backend Changes Made

### 1. Student Model (`src/models/Student.ts`)
- Added `archived: boolean` field (default: false)

### 2. Student Controller (`src/controllers/studentController.ts`)

#### Updated Functions:
- **`listStudents()`**: Now excludes archived students by default
  - `GET /api/v1/students` → Returns only active (non-archived) students
  - `GET /api/v1/students?archived=true` → Returns only archived students
  - `GET /api/v1/students?archived=all` → Returns all students (active + archived)

- **`deleteStudent()`**: Now archives instead of deleting
  - `DELETE /api/v1/students/:id` → Sets `archived = true` instead of deleting record
  - Returns message: "Student archived successfully"

#### New Functions:
- **`restoreStudent()`**: Restores an archived student
  - `POST /api/v1/students/:id/restore` → Sets `archived = false`
  - Returns message: "Student restored successfully"

### 3. Routes (`src/routes/students.ts`)
- Added new route: `POST /students/:id/restore`

## API Endpoints

### List Students (Modified)
```
GET /api/v1/students
GET /api/v1/students?archived=true    # Get archived only
GET /api/v1/students?archived=all     # Get all (active + archived)
```

### Archive Student (Modified Delete)
```
DELETE /api/v1/students/:id
Response: { "success": true, "data": { "message": "Student archived successfully" } }
```

### Restore Archived Student (New)
```
POST /api/v1/students/:id/restore
Response: { "success": true, "data": { "message": "Student restored successfully" } }
```

## Frontend Implementation Needed

### 1. Update Student List
- Students list should automatically exclude archived students (no change needed)
- Add "View Archived" toggle/tab

### 2. Create Archived Students Section
Create new component: `app/dashboard/students/archived/page.tsx`

Features:
- Show list of archived students
- Display "ARCHIVED" badge on student cards
- "Restore" button for each student
- Search/filter archived students

### 3. Update Delete Button UI
- Change "Delete" button text to "Archive"
- Update confirmation message:
  - Old: "Are you sure you want to delete this student?"
  - New: "Are you sure you want to archive this student? You can restore them later from the Archived section."

### 4. Add Navigation
Add "Archived Students" link in:
- Students page header/toolbar
- Sidebar menu (optional)

## Frontend API Calls

### Get Archived Students
```typescript
// In hooks/useStudents.ts or similar
const fetchArchivedStudents = async () => {
  const response = await api.get('/students?archived=true');
  return response.data.data;
};
```

### Archive Student (existing delete call works as-is)
```typescript
await api.delete(`/students/${studentId}`);
// Message will be "Student archived successfully"
```

### Restore Student
```typescript
await api.post(`/students/${studentId}/restore`);
// Message will be "Student restored successfully"
```

## Benefits

1. **Data Preservation**: Attendance records remain intact
2. **Recovery**: Accidentally "deleted" students can be restored
3. **Compliance**: Better for auditing and record-keeping
4. **Performance**: Archived students don't clutter main list
5. **Safety**: No risk of permanent data loss

## Testing Checklist

### Backend (Railway)
- [ ] Run SQL migration to add `archived` column
- [ ] Deploy updated code to Railway
- [ ] Test: `GET /students` should NOT include archived students
- [ ] Test: `GET /students?archived=true` should return only archived
- [ ] Test: `DELETE /students/:id` should archive, not delete
- [ ] Test: `POST /students/:id/restore` should restore archived student

### Frontend (Vercel)
- [ ] Delete button archives student (not permanent delete)
- [ ] Archived student disappears from main list
- [ ] Create "Archived Students" page
- [ ] Archived students page shows archived list
- [ ] Restore button works and student reappears in main list
- [ ] UI shows appropriate messages ("archived" vs "deleted")

## Migration Steps

1. **Database**: Run `ADD_ARCHIVED_COLUMN.sql` in Railway database
2. **Backend**: Deploy backend changes (already done)
3. **Frontend**: Implement archived students UI (next step)
4. **Test**: Verify archive/restore functionality works
5. **Deploy**: Push frontend changes to Vercel

## Next Steps

Focus on frontend implementation:
1. Create archived students page component
2. Add "View Archived" button/link
3. Update delete button messaging
4. Add restore functionality
5. Test end-to-end flow

## Rollback Plan

If needed, you can revert to permanent delete:

```sql
-- Remove archived column
ALTER TABLE students DROP COLUMN archived;
```

Then revert code changes in:
- `src/models/Student.ts`
- `src/controllers/studentController.ts`
- `src/routes/students.ts`
