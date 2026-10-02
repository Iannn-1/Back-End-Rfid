# Railway Database Migration - Step by Step Guide

## 🎯 Goal
Migrate the `students` table from a single `name` field to separate `first_name`, `last_name`, and `middle_name` fields.

## ⚠️ Before You Start

1. **Backup Recommendation**: Railway automatically creates backups, but it's good practice to manually backup before major schema changes.
2. **Downtime**: This migration should take only a few seconds. Your app will remain online during the migration.
3. **Testing**: If possible, test this on a staging environment first.

## 📋 Step-by-Step Instructions

### Method 1: Using the Migration API Endpoint (Easiest)

This is the **recommended method** - no CLI installation needed!

#### Step 1: Deploy the Migration Code

1. **Commit and push your changes**:
   ```bash
   cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
   git add .
   git commit -m "Add migration endpoint for student names"
   git push
   ```

2. **Wait for Railway to deploy** (usually takes 2-3 minutes)
   - Go to your Railway dashboard
   - Watch the deployment logs
   - Wait for "Build successful" and "Deployment live"

#### Step 2: Open the Migration Helper Tool

1. **Open the migration helper** in your browser:
   - Open `migration-helper.html` from your BACK-END-RFID folder
   - Or drag and drop it into your browser

2. **Enter your Railway backend URL**:
   - Example: `https://back-end-rfid-production.up.railway.app`
   - Get this from your Railway dashboard

3. **Check the migration status**:
   - Click "📊 Check Status" button
   - This will show if migration is needed or already done

4. **Run the migration**:
   - Click "🚀 Run Migration" button
   - Confirm when prompted
   - Wait for completion (should take a few seconds)

5. **Verify success**:
   - You should see "✅ Migration Completed Successfully!"
   - Check the migration log for details

#### Step 3: Remove the Migration Endpoint (Security)

After successful migration, remove the migration route:

1. **Edit `src/routes/index.ts`**:
   - Comment out or remove: `router.use('/api/v1/migrate', migrateRouter)`

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Remove migration endpoint after successful migration"
   git push
   ```

#### Step 4: Deploy Your Frontend

1. **Deploy frontend changes**:
   ```bash
   cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
   git add .
   git commit -m "Update student forms to use separate name fields"
   git push
   ```

2. **Verify the changes**:
   - Visit your application
   - Try viewing existing students
   - Try adding a new student
   - Test the search functionality

---

### Method 2: Using Railway CLI (Alternative)

If you prefer using the command line:

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login and Link Project

```bash
# Login to Railway
railway login

# Link to your project
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
railway link
```

Select your backend project when prompted.

#### Step 3: Run Migration

```bash
railway run npx ts-node src/scripts/migrateStudentNames.ts
```

This will run the migration script directly on Railway's environment.

---

### Method 3: Direct Database Connection (Advanced)

⚠️ **Use with caution** - only if other methods don't work.

#### Step 1: Get Database Credentials

1. Go to Railway dashboard
2. Click on your MySQL database
3. Go to "Variables" tab
4. Copy these values:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

#### Step 2: Connect with MySQL Client

Option A - Using Railway's Built-in Query Tool:
1. In Railway dashboard, click on your database
2. Go to "Query" tab
3. Run the migration SQL manually (see SQL commands below)

Option B - Using MySQL Workbench or CLI:
1. Connect using the credentials from Step 1
2. Run the migration script

#### SQL Commands (Manual Migration):

```sql
-- Step 1: Check if migration is needed
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'students' 
AND COLUMN_NAME = 'name';

-- If 'name' column exists, continue:

-- Step 2: Add new columns
ALTER TABLE students 
ADD COLUMN first_name VARCHAR(255) NULL AFTER rfid_tag_uid,
ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name,
ADD COLUMN middle_name VARCHAR(255) NULL AFTER last_name;

-- Step 3: Migrate data (simple approach - splits on spaces)
-- For more complex name splitting, use the API endpoint method
UPDATE students 
SET 
  first_name = SUBSTRING_INDEX(name, ' ', 1),
  last_name = SUBSTRING_INDEX(name, ' ', -1),
  middle_name = CASE 
    WHEN LENGTH(name) - LENGTH(REPLACE(name, ' ', '')) > 1 
    THEN SUBSTRING_INDEX(SUBSTRING_INDEX(name, ' ', -1), ' ', 1)
    ELSE NULL 
  END
WHERE name IS NOT NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE students 
MODIFY COLUMN first_name VARCHAR(255) NOT NULL,
MODIFY COLUMN last_name VARCHAR(255) NOT NULL;

-- Step 5: Drop old column
ALTER TABLE students DROP COLUMN name;
```

---

## ✅ Verification Checklist

After migration, verify these items:

- [ ] Old `name` column is removed
- [ ] New columns exist: `first_name`, `last_name`, `middle_name`
- [ ] Existing student records display correctly
- [ ] Can add new student with all three name fields
- [ ] Can add new student without middle name
- [ ] Search works across all name fields
- [ ] Email notifications show correct full names
- [ ] Parent dashboard shows correct student names

## 🔍 Troubleshooting

### Issue: Migration endpoint returns 404
- **Solution**: Make sure you've pushed the code and Railway has deployed successfully

### Issue: Database connection error
- **Solution**: Check that your DATABASE_URL environment variable is set correctly in Railway

### Issue: Migration says "already completed" but frontend still broken
- **Solution**: The database is fine, just deploy your frontend changes

### Issue: Some names didn't split correctly
- **Solution**: You can manually update specific records through the Railway Query tool or your admin panel

### Issue: Can't access migration-helper.html
- **Solution**: 
  1. Open it directly from file explorer (double-click)
  2. Or use curl/Postman to call the API directly:
     ```bash
     curl -X POST https://your-app.railway.app/api/v1/migrate/student-names
     ```

## 📞 Need Help?

If you encounter any issues:
1. Check Railway deployment logs
2. Check your backend application logs
3. Verify database credentials are correct
4. Try the alternative methods above

## 🔒 Security Note

**Important**: After successful migration, remove the migration endpoint from your code to prevent unauthorized access:

1. Remove the migration route from `src/routes/index.ts`
2. Delete `src/routes/migrate.ts` (optional but recommended)
3. Push changes to Railway

This ensures the migration endpoint cannot be called again.
