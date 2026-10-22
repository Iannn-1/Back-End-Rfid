# 🚀 Deploy School ID Feature to Production

## 📋 Pre-Deployment Checklist

✅ Local migration completed (ran `npm run migrate:schoolid`)  
✅ Backend builds successfully (`npm run build`)  
✅ Frontend builds successfully (`npm run build`)  
✅ All TypeScript errors resolved  
✅ Feature tested locally  

---

## 🎯 Deployment Overview

We need to:
1. **Push backend code** to Railway (includes migration script)
2. **Run migration** on production database
3. **Push frontend code** to Vercel
4. **Verify** everything works

---

## 📦 Step 1: Deploy Backend to Railway

### 1.1 Check Git Status
```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git status
```

### 1.2 Commit All Changes
```bash
git add .
git commit -m "feat: Add School ID feature with auto-generation and validation"
```

### 1.3 Push to GitHub (triggers Railway deployment)
```bash
git push origin main
```
*Replace `main` with your branch name if different (could be `master`)*

### 1.4 Monitor Railway Deployment
1. Go to [Railway Dashboard](https://railway.app/)
2. Open your backend project
3. Watch the deployment logs
4. Wait for **"Deployment successful"** message (~2-3 minutes)

---

## 🗄️ Step 2: Run Migration on Production Database

### Option A: Using Railway CLI (Recommended)

**2.1 Install Railway CLI** (if not installed):
```bash
npm install -g @railway/cli
```

**2.2 Login to Railway**:
```bash
railway login
```

**2.3 Link to your project**:
```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
railway link
```
*Select your backend project from the list*

**2.4 Run the migration**:
```bash
railway run npm run migrate:schoolid
```

**Expected Output**:
```
🔧 Starting school_id column migration...
✅ Database connection established
📝 Adding school_id column...
✅ school_id column added successfully
🔄 Generating school_id for existing students...
  ✓ Student #1: 2026-0001
  ✓ Student #2: 2026-0002
  ...
✅ Generated X school IDs
🎉 Migration completed successfully!
```

---

### Option B: Using Migration API Endpoint (Alternative)

**2.1 Create API Migration Endpoint**

Add this route to your backend (already done if you follow this guide):

Create `src/routes/schoolIdMigration.ts`:
```typescript
import { Router } from 'express';
import { sequelize } from '../config/database';
import Student from '../models/Student';

const router = Router();

router.post('/migrate-schoolid', async (req, res) => {
  try {
    // Check if column exists
    const [results]: any = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'school_id'
    `);

    if (results && results.length > 0) {
      return res.json({ 
        success: true, 
        message: 'school_id column already exists',
        alreadyMigrated: true 
      });
    }

    // Add column
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN school_id VARCHAR(20) NULL UNIQUE
    `);

    // Generate IDs
    const { Op } = require('sequelize');
    const students = await Student.findAll({
      where: { 
        [Op.or]: [
          { school_id: null },
          { school_id: '' }
        ]
      },
      order: [['id', 'ASC']]
    });

    const currentYear = new Date().getFullYear();
    const migratedStudents = [];
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const schoolId = `${currentYear}-${String(i + 1).padStart(4, '0')}`;
      await student.update({ school_id: schoolId });
      migratedStudents.push({
        id: student.id,
        name: `${student.last_name}, ${student.first_name}`,
        school_id: schoolId
      });
    }

    res.json({
      success: true,
      message: 'Migration completed successfully',
      studentsCount: students.length,
      students: migratedStudents
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

**2.2 Add route to `src/routes/index.ts`**:
```typescript
import schoolIdMigrationRoutes from './schoolIdMigration';

// ... other routes ...

router.use('/migrate', schoolIdMigrationRoutes);
```

**2.3 Deploy this change, then call the endpoint**:
```bash
curl -X POST https://your-railway-app.up.railway.app/api/v1/migrate/migrate-schoolid
```

---

### Option C: Direct Database Access (Advanced)

**2.1 Get Railway Database Credentials**:
1. Go to Railway Dashboard
2. Open your MySQL database service
3. Go to "Variables" tab
4. Note: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`

**2.2 Connect using MySQL Client**:
```bash
mysql -h [MYSQLHOST] -u [MYSQLUSER] -p[MYSQLPASSWORD] -P [MYSQLPORT] [MYSQLDATABASE]
```

**2.3 Run SQL manually**:
```sql
-- Add column
ALTER TABLE students 
ADD COLUMN school_id VARCHAR(20) NULL UNIQUE;

-- Generate IDs for existing students
SET @year = YEAR(NOW());
SET @counter = 0;

UPDATE students 
SET school_id = CONCAT(@year, '-', LPAD((@counter := @counter + 1), 4, '0'))
WHERE school_id IS NULL OR school_id = ''
ORDER BY id ASC;
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Commit Frontend Changes
```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
git status
git add .
git commit -m "feat: Add School ID display and input with validation"
```

### 3.2 Push to GitHub (triggers Vercel deployment)
```bash
git push origin main
```
*Replace `main` with your branch name if different*

### 3.3 Monitor Vercel Deployment
1. Go to [Vercel Dashboard](https://vercel.com/)
2. Open your frontend project
3. Watch the deployment progress
4. Wait for **"Deployment completed"** (~3-5 minutes)

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Backend API

**Check if migration ran successfully**:
```bash
curl https://your-railway-app.up.railway.app/api/v1/students
```

Look for `school_id` field in the response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "school_id": "2026-0001",  ← Should be present
      "first_name": "John",
      "last_name": "Doe",
      ...
    }
  ]
}
```

### 4.2 Test Frontend

1. **Open your production URL**: `https://your-app.vercel.app`
2. **Login** to the dashboard
3. **Go to Students page**
4. **Check the table** - You should see "School ID" column
5. **Click "Add Student"** - You should see the School ID input field
6. **Test input validation**:
   - Type letters → should be filtered out
   - Type more than 4 digits → should be limited
   - Year prefix should be "2026-" (non-editable)

### 4.3 Test Mobile Monitor

1. Open `/mobile-rfid` on your production site
2. If you have RFID scanner, test scanning a card
3. Should display **"ID: 2026-XXXX"** instead of RFID UID

---

## 🎯 Quick Deployment Commands

### Fast Track (if everything is committed):
```bash
# Backend
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git push origin main

# Wait for Railway deployment, then run migration:
railway run npm run migrate:schoolid

# Frontend
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
git push origin main
```

---

## 🐛 Troubleshooting

### Issue: "school_id column already exists"
**Solution**: Migration already ran. This is fine, just verify data looks correct.

### Issue: Railway deployment fails
**Solution**: 
1. Check Railway logs for errors
2. Verify all TypeScript compiles: `npm run build`
3. Check environment variables are set in Railway

### Issue: Frontend shows old version without School ID
**Solution**:
1. Clear browser cache (Ctrl + Shift + R)
2. Check Vercel deployment completed successfully
3. Verify correct branch is deployed

### Issue: Migration fails with "Cannot add column"
**Solution**:
1. Check database connection
2. Verify you have ALTER TABLE permissions
3. Try Option C (direct database access)

### Issue: School IDs not generating
**Solution**:
1. Check if migration completed successfully
2. Verify the migration log shows "Generated X school IDs"
3. Check database directly to see if school_id column has values

---

## 📊 Expected Results After Deployment

### Students Table
| Name | School ID | Type | Grade/Year | Status |
|------|-----------|------|------------|--------|
| Doe, John | **2026-0001** | College | Year 4 | Active |
| Smith, Jane | **2026-0002** | Senior High | Grade 12 | Active |

### Add Student Form
```
School ID
[2026-] [____]
         ↑ User enters 4 digits
```

### Mobile Monitor Display
```
✅ Success!
John Doe
ID: 2026-0001    ← Shows School ID
Action: IN
```

---

## 🔒 Post-Deployment Security

### Optional: Remove Migration Endpoint

After successful migration, you may want to remove the migration API endpoint:

1. Comment out or delete migration route in `src/routes/index.ts`
2. Push the change
3. This prevents unauthorized migration attempts

---

## 📝 Deployment Checklist

- [ ] Backend code pushed to GitHub
- [ ] Railway deployment successful
- [ ] Database migration completed
- [ ] Migration verified (students have school_id)
- [ ] Frontend code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Frontend displays School ID column
- [ ] Add Student form shows School ID input
- [ ] Input validation works (numbers only)
- [ ] Mobile monitor shows School ID
- [ ] Test adding new student with School ID
- [ ] Test auto-generation (leave School ID empty)

---

## 🎉 Success!

Once all steps are complete, your School ID feature will be live in production! 🚀

**Need Help?** 
- Check Railway logs for backend issues
- Check Vercel logs for frontend issues
- Review browser console for client-side errors
