# Student Name Migration Guide

## Overview
The student data structure has been updated to split the single `name` field into three separate fields:
- `first_name` (required)
- `last_name` (required)
- `middle_name` (optional)

This change provides better data organization and allows proper name formatting (Last Name, First Name Middle Name).

## What Changed

### Backend Changes
1. **Database Schema**: The `students` table now has `first_name`, `last_name`, and `middle_name` columns instead of `name`
2. **API**: All student endpoints now expect and return the new name structure
3. **Validation**: First name and last name are required; middle name is optional

### Frontend Changes
1. **Student Form**: Now has separate input fields for each name part
2. **Display**: Shows names in "Last, First Middle" format
3. **Search**: Updated to search across all three name fields

## Migration for Railway Deployment

### Option 1: Run Migration via Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
   railway link
   ```
   Select your backend project when prompted.

4. **Run the migration script on Railway**:
   ```bash
   railway run npx ts-node src/scripts/migrateStudentNames.ts
   ```
   
   This runs the script in Railway's environment with access to your production database.

### Option 2: Create a Migration Endpoint (Temporary API Route)

If Railway CLI doesn't work, you can create a temporary API endpoint to run the migration:

1. **Add the migration route** (already created in `src/routes/migrate.ts`)

2. **Deploy the updated code** to Railway:
   ```bash
   git add .
   git commit -m "Add database migration for student names"
   git push
   ```

3. **Trigger the migration** via HTTP request:
   ```bash
   curl -X POST https://your-app.railway.app/api/v1/migrate/student-names \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key"
   ```
   
   Or visit the endpoint in your browser (if you add a simple authentication).

4. **Remove the migration route** after successful migration for security.

### Option 3: Connect to Railway Database Directly

1. **Get database connection details** from Railway dashboard:
   - Go to your Railway project
   - Click on your MySQL database
   - Copy connection details (host, port, username, password, database)

2. **Update your local `.env`** temporarily with Railway database credentials:
   ```
   DB_HOST=your-railway-host.railway.app
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=railway
   ```

3. **Run migration locally** (pointing to Railway database):
   ```bash
   cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
   npx ts-node src/scripts/migrateStudentNames.ts
   ```

4. **Restore your local `.env`** after migration.

   ⚠️ **Warning**: Be very careful with this approach. Make sure you're connected to the right database!

### Recommended Approach

**Use Option 1 (Railway CLI)** - it's the safest and most straightforward method.

## After Migration

### Step 1: Deploy Updated Code
After running the migration successfully, deploy your updated backend and frontend:

**Backend:**
```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git add .
git commit -m "Update student model to use separate name fields"
git push
```

**Frontend:**
```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
git add .
git commit -m "Update student forms to use separate name fields"
git push
```

### Step 2: Verify the Changes
1. Visit your application
2. Try viewing existing students - names should display as "Last, First Middle"
3. Try adding a new student with the new form fields
4. Verify search functionality works across all name fields

## Adding New Students

When adding new students, you must now provide:
- **Last Name** (required)
- **First Name** (required)
- **Middle Name** (optional)

The middle name field can be left empty.

## Rollback (If Needed)

If you need to rollback the migration, you'll need to:
1. Add back the `name` column
2. Concatenate the name fields
3. Remove the new columns

**Warning**: It's recommended to backup your database before performing the migration.

## Testing

After migration:
1. Verify existing student records display correctly
2. Try adding a new student with all three name parts
3. Try adding a new student without a middle name
4. Test the search functionality
5. Verify email notifications show the correct full name

## Support

If you encounter any issues during migration, check:
- Database connection is working
- You have proper permissions to alter tables
- No other processes are accessing the database
- The migration script logs for specific error messages
