# Multiple Children Support Feature Guide

## Overview
This feature allows parents to register and monitor attendance for **multiple children** using a single parent account. Parents can add multiple RFID tags during registration and switch between children using a dropdown selector in the dashboard.

## Features Implemented

### 1. **Backend Changes**

#### New Database Table: `parent_students`
- Junction table for many-to-many relationship between parents and students
- Columns:
  - `id`: Primary key
  - `parent_id`: Foreign key to parents table
  - `rfid_tag_uid`: RFID tag of the child
  - `is_primary`: Boolean flag for default child
  - `createdAt`, `updatedAt`: Timestamps

#### Updated Models
- **ParentStudent Model** (`src/models/ParentStudent.ts`): New model for junction table
- **Models Index** (`src/models/index.ts`): Added ParentStudent export and associations

#### Updated Controllers (`src/controllers/parentController.ts`)
1. **register()**: Now accepts multiple RFID tags
   - Accepts `rfid_tags` array (or single `rfid_tag_uid` for backward compatibility)
   - Validates all RFID tags exist in students table
   - Creates parent and links all children via ParentStudent
   - First tag becomes primary

2. **getChild()**: Returns data for a specific child
   - Accepts optional `rfid_tag_uid` query parameter
   - Returns primary child if no parameter specified
   - Validates parent has access to requested child

3. **NEW: getAllChildren()**: Returns all children for a parent
   - Returns array of students with `is_primary` flag
   - Used for child selector dropdown

4. **NEW: addChild()**: Add another child after registration
   - Accepts `rfid_tag_uid` in request body
   - Validates RFID tag exists and not already added
   - Adds child with `is_primary=false`

5. **NEW: setPrimaryChild()**: Change which child is primary
   - Updates primary flag in parent_students table
   - Updates parent's `rfid_tag_uid` for backward compatibility

#### New API Endpoints (`src/routes/parents.ts`)
```
GET    /api/v1/parents/children           - Get all children for logged-in parent
POST   /api/v1/parents/add-child          - Add another child
POST   /api/v1/parents/set-primary-child  - Set primary child
```

### 2. **Frontend Changes**

#### Registration Page (`app/parent/register/page.tsx`)
- **Multiple RFID Input Fields**: Parents can enter multiple RFID tags
- **"+" Button**: Add additional RFID tag input fields
- **"X" Button**: Remove RFID tag fields (minimum 1 required)
- **Dynamic Form**: Automatically adds/removes input fields
- **Validation**: Filters out empty tags before submission
- **Backward Compatible**: Still supports URL parameters for auto-fill

#### Parent Dashboard (`app/parent/dashboard/page.tsx`)
- **Child Selector Dropdown**: Shows in header (right side) when parent has multiple children
- **Dropdown Features**:
  - Displays all children with first and last names
  - Shows "PRIMARY" badge on primary child
  - Switches attendance data when different child is selected
  - Hover effect for better UX
- **Auto-Refresh**: Continues to refresh attendance data every 30 seconds
- **Dynamic Greeting**: Changes based on single vs multiple children
- **Backward Compatible**: Works perfectly for parents with single child (no dropdown shown)

## Database Migration

### Run Migration
Execute the SQL file to create the junction table and migrate existing data:

```sql
-- Run this in your Railway MySQL database
SOURCE MULTIPLE_CHILDREN_MIGRATION.sql;
```

Or manually execute from Railway dashboard or MySQL client:

```sql
CREATE TABLE IF NOT EXISTS parent_students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NOT NULL,
  rfid_tag_uid VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  UNIQUE KEY parent_student_unique (parent_id, rfid_tag_uid),
  INDEX idx_parent_id (parent_id),
  INDEX idx_rfid_tag (rfid_tag_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data
INSERT INTO parent_students (parent_id, rfid_tag_uid, is_primary, createdAt, updatedAt)
SELECT id, rfid_tag_uid, true, createdAt, updatedAt
FROM parents
WHERE rfid_tag_uid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM parent_students ps 
  WHERE ps.parent_id = parents.id 
  AND ps.rfid_tag_uid = parents.rfid_tag_uid
);
```

### Verify Migration
```sql
SELECT 
  COUNT(*) AS total_records,
  COUNT(DISTINCT parent_id) AS unique_parents,
  COUNT(DISTINCT rfid_tag_uid) AS unique_children,
  SUM(is_primary) AS primary_children
FROM parent_students;
```

## API Request/Response Examples

### 1. Register with Multiple Children

**Request:**
```json
POST /api/v1/parents/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+63912345678",
  "rfid_tags": ["2026-7857", "2026-8813", "2026-9001"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "rfid_tags": ["2026-7857", "2026-8813", "2026-9001"],
    "email_verified": false
  }
}
```

### 2. Get All Children

**Request:**
```
GET /api/v1/parents/children
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": 1,
        "rfid_tag_uid": "2026-7857",
        "first_name": "Maria",
        "last_name": "Doe",
        "grade_level": "Grade 7",
        "section": "St. John",
        "student_level": "Junior High School",
        "is_primary": true
      },
      {
        "id": 2,
        "rfid_tag_uid": "2026-8813",
        "first_name": "Juan",
        "last_name": "Doe",
        "grade_level": "Grade 5",
        "section": "St. Peter",
        "student_level": "Elementary",
        "is_primary": false
      }
    ]
  }
}
```

### 3. Get Specific Child's Attendance

**Request:**
```
GET /api/v1/parents/child?rfid_tag_uid=2026-8813
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": { /* student details */ },
    "currentStatus": "IN",
    "logs": [ /* attendance logs */ ]
  }
}
```

### 4. Add Another Child

**Request:**
```json
POST /api/v1/parents/add-child
Authorization: Bearer <token>
{
  "rfid_tag_uid": "2026-9999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child added successfully!",
  "data": {
    "student": { /* student details */ }
  }
}
```

### 5. Set Primary Child

**Request:**
```json
POST /api/v1/parents/set-primary-child
Authorization: Bearer <token>
{
  "rfid_tag_uid": "2026-8813"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Primary child updated successfully!"
}
```

## User Workflows

### Workflow 1: Parent Registers with Multiple Children
1. Parent navigates to `/parent/register`
2. Fills in name, email, password, phone
3. Enters first child's RFID tag
4. Clicks "+ Add Another Child" button
5. Enters additional children's RFID tags
6. Clicks "Create Account"
7. Receives verification email
8. Verifies email and logs in

### Workflow 2: Parent Views Multiple Children
1. Parent logs into dashboard
2. Sees dropdown selector in header (top right)
3. Clicks dropdown to see all children
4. Selects a child from dropdown
5. Dashboard updates to show selected child's attendance
6. Can switch between children anytime

### Workflow 3: Parent Adds Child After Registration
1. Parent logs in and uses API endpoint `/api/v1/parents/add-child`
2. Provides new child's RFID tag
3. System validates and adds child
4. Child appears in dashboard dropdown

## Backward Compatibility

✅ **Single RFID Tag Registration**: Still supported via `rfid_tag_uid` field  
✅ **Existing Parents**: Automatically migrated to use `parent_students` table  
✅ **Parent Model**: Keeps `rfid_tag_uid` field for primary child  
✅ **Old Email Links**: URL parameters still auto-fill registration form  
✅ **Single Child Parents**: Dashboard shows no dropdown (clean UI)

## Testing Checklist

### Backend Tests
- [ ] Register parent with single RFID tag
- [ ] Register parent with multiple RFID tags
- [ ] Register with duplicate RFID tags (should be deduplicated)
- [ ] Register with invalid RFID tag (should fail)
- [ ] GET `/children` returns all children with correct `is_primary` flag
- [ ] GET `/child` without parameter returns primary child
- [ ] GET `/child?rfid_tag_uid=XXX` returns specific child
- [ ] GET `/child` with unauthorized RFID returns 403
- [ ] POST `/add-child` adds new child successfully
- [ ] POST `/add-child` with duplicate tag returns 409
- [ ] POST `/set-primary-child` updates primary correctly

### Frontend Tests
- [ ] Registration form allows adding multiple RFID inputs
- [ ] "+" button adds new RFID input field
- [ ] "X" button removes RFID input field (minimum 1 remains)
- [ ] Form submits with multiple RFID tags correctly
- [ ] Dashboard shows dropdown only when multiple children exist
- [ ] Dropdown displays all children correctly
- [ ] Clicking child in dropdown switches attendance data
- [ ] Primary child has "PRIMARY" badge in dropdown
- [ ] Dropdown closes when child is selected
- [ ] Single-child parents see no dropdown

## Deployment Steps

### 1. Backend (Railway)
```bash
# Build backend
cd BACK-END-RFID
npm run build

# Deploy to Railway (auto-deploys from GitHub)
git add .
git commit -m "feat: add multiple children support"
git push origin main
```

### 2. Run Database Migration
- Log into Railway dashboard
- Open MySQL database
- Run `MULTIPLE_CHILDREN_MIGRATION.sql` script
- Verify with the verification query

### 3. Frontend (Vercel)
```bash
# Frontend auto-deploys from GitHub
cd FRONT-END-RFID
git add .
git commit -m "feat: add multiple children support UI"
git push origin main
```

### 4. Test Deployed Version
- Test registration with multiple RFID tags
- Test dashboard child switching
- Test API endpoints with Postman/Insomnia

## Environment Variables

No new environment variables required! Uses existing:
- `JWT_SECRET`
- `DATABASE_URL`
- `SENDGRID_API_KEY` or email SMTP settings
- `PARENT_PORTAL_URL`

## Files Modified

### Backend
- ✅ `src/models/ParentStudent.ts` (created)
- ✅ `src/models/index.ts` (updated)
- ✅ `src/controllers/parentController.ts` (updated)
- ✅ `src/routes/parents.ts` (updated)
- ✅ `MULTIPLE_CHILDREN_MIGRATION.sql` (created)

### Frontend
- ✅ `app/parent/register/page.tsx` (updated)
- ✅ `app/parent/dashboard/page.tsx` (updated)

## Support & Maintenance

### Common Issues

**Issue: Parent can't see dropdown**
- Check if parent has multiple children in `parent_students` table
- Verify API `/children` endpoint returns multiple records

**Issue: Child not showing in dropdown**
- Verify RFID tag exists in `parent_students` table
- Check API `/children` response includes all children

**Issue: Registration fails with multiple tags**
- Verify all RFID tags exist in `students` table
- Check for duplicate tags in request

### Database Queries for Debugging

```sql
-- Check parent's children
SELECT ps.*, s.first_name, s.last_name 
FROM parent_students ps
JOIN students s ON ps.rfid_tag_uid = s.rfid_tag_uid
WHERE ps.parent_id = <PARENT_ID>;

-- Find parents with multiple children
SELECT parent_id, COUNT(*) as child_count
FROM parent_students
GROUP BY parent_id
HAVING child_count > 1;

-- Check primary child for parent
SELECT * FROM parent_students
WHERE parent_id = <PARENT_ID> AND is_primary = true;
```

## Future Enhancements

- [ ] Allow parents to remove children from account
- [ ] Add child nickname/label in parent_students table
- [ ] Parent dashboard: compare attendance across multiple children
- [ ] Email notifications for each child separately
- [ ] Mobile app with child quick-switch widget
- [ ] Admin dashboard to view parent-child relationships

---

**Feature Status**: ✅ **COMPLETE & READY FOR DEPLOYMENT**

**Last Updated**: November 9, 2026
