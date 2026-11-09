# Deploy Multiple Children Feature - Quick Guide

## ✅ What's Implemented

### Backend
- ✅ `ParentStudent` junction table model created
- ✅ Multiple RFID tags support in registration
- ✅ New endpoints: `/children`, `/add-child`, `/set-primary-child`
- ✅ Child selector with query parameter support
- ✅ Backward compatible with single-child parents
- ✅ Build successful (no errors)

### Frontend
- ✅ Registration form with "+" button for multiple RFID tags
- ✅ Dashboard dropdown selector (top right) for child switching
- ✅ "PRIMARY" badge on primary child in dropdown
- ✅ Auto-refresh attendance when switching children
- ✅ Backward compatible - dropdown hidden for single child

### Database
- ✅ Migration SQL file created: `MULTIPLE_CHILDREN_MIGRATION.sql`
- ✅ Migrates existing parent data automatically

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Backend
cd BACK-END-RFID
git add .
git commit -m "feat: add multiple children support for parents"
git push origin main

# Frontend
cd ../FRONT-END-RFID
git add .
git commit -m "feat: add multiple children UI with dropdown selector"
git push origin main
```

Both Railway (backend) and Vercel (frontend) will auto-deploy from GitHub.

### Step 2: Run Database Migration in Railway

1. Go to Railway dashboard: https://railway.app
2. Select your backend project
3. Click on your MySQL database
4. Click "Query" or "Connect"
5. Run this SQL:

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

-- Migrate existing parents
INSERT INTO parent_students (parent_id, rfid_tag_uid, is_primary, createdAt, updatedAt)
SELECT id, rfid_tag_uid, true, createdAt, updatedAt
FROM parents
WHERE rfid_tag_uid IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM parent_students ps 
  WHERE ps.parent_id = parents.id 
  AND ps.rfid_tag_uid = parents.rfid_tag_uid
);

-- Verify
SELECT 
  COUNT(*) AS total_records,
  COUNT(DISTINCT parent_id) AS unique_parents,
  SUM(is_primary) AS primary_children
FROM parent_students;
```

### Step 3: Verify Deployment

#### Test Backend API
```bash
# Test registration with multiple children
curl -X POST https://your-backend.railway.app/api/v1/parents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@example.com",
    "password": "password123",
    "rfid_tags": ["2026-7857", "2026-8813"]
  }'

# Test get children (after login)
curl https://your-backend.railway.app/api/v1/parents/children \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Frontend
1. Go to: https://front-end-rfid.vercel.app/parent/register
2. Enter parent info
3. Add multiple RFID tags using "+" button
4. Register and verify email
5. Login and check dashboard
6. Verify dropdown appears in header (if multiple children)
7. Click dropdown and switch between children

## 📋 Testing Checklist

### Registration
- [ ] Can add multiple RFID tags with "+" button
- [ ] Can remove RFID tags with "X" button (minimum 1 remains)
- [ ] Registration succeeds with multiple valid RFID tags
- [ ] Registration fails with invalid RFID tag
- [ ] Email verification works after registration

### Dashboard
- [ ] Dropdown appears in header when parent has multiple children
- [ ] Dropdown shows all children with names
- [ ] Primary child has "PRIMARY" badge
- [ ] Clicking child switches attendance data
- [ ] Dropdown closes after selection
- [ ] No dropdown shows for single-child parents
- [ ] Auto-refresh continues to work

### Backend API
- [ ] `POST /parents/register` accepts rfid_tags array
- [ ] `GET /parents/children` returns all children
- [ ] `GET /parents/child?rfid_tag_uid=XXX` returns specific child
- [ ] `POST /parents/add-child` adds new child
- [ ] `POST /parents/set-primary-child` updates primary

## 🔧 Rollback Plan

If issues occur, rollback database migration:

```sql
-- Remove parent_students table
DROP TABLE IF EXISTS parent_students;
```

Then redeploy previous version from GitHub.

## 📝 Environment Variables

No new environment variables needed! Uses existing setup.

## 🎯 Success Criteria

✅ Existing single-child parents: No disruption, works as before  
✅ New parents: Can register with multiple children  
✅ Dashboard: Dropdown selector works for multiple children  
✅ Backward compatible: Old registration links still work  
✅ Database: Existing data migrated to new table

## 📚 Documentation

Full documentation available in:
- `MULTIPLE_CHILDREN_FEATURE_GUIDE.md` - Complete feature guide
- `MULTIPLE_CHILDREN_MIGRATION.sql` - Database migration script

## 🐛 Troubleshooting

**Issue**: Migration fails  
**Solution**: Check if `parent_students` table already exists, drop it first

**Issue**: Dropdown not showing  
**Solution**: Verify parent has multiple entries in `parent_students` table

**Issue**: Can't switch children  
**Solution**: Check browser console for API errors, verify JWT token is valid

## 📞 Support

For issues or questions:
1. Check `MULTIPLE_CHILDREN_FEATURE_GUIDE.md`
2. Review database using SQL queries in the guide
3. Check Railway logs for backend errors
4. Check Vercel logs for frontend errors

---

**Status**: ✅ Ready for deployment  
**Build**: ✅ Backend builds successfully  
**Risk**: 🟢 Low (backward compatible)
