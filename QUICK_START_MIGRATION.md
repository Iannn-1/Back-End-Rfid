# 🚀 Quick Start: Railway Migration

## What You Need to Do

Your database needs to be updated to support separate name fields (First Name, Last Name, Middle Name) instead of a single Full Name field.

## ⚡ Fastest Method (5 Minutes)

### Step 1: Deploy Migration Code
```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git add .
git commit -m "Add migration for student names"
git push
```

Wait 2-3 minutes for Railway to deploy.

### Step 2: Run Migration

**Option A - Using the Visual Tool (Easiest):**
1. Open `migration-helper.html` in your browser (double-click it)
2. Enter your Railway URL (e.g., `https://your-app.railway.app`)
3. Click "Check Status" to verify
4. Click "Run Migration"
5. Wait for success message

**Option B - Using curl/Postman:**
```bash
curl -X POST https://your-app.railway.app/api/v1/migrate/student-names
```

### Step 3: Deploy Frontend
```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID
git add .
git commit -m "Update student forms for separate names"
git push
```

### Step 4: Clean Up (Remove Migration Endpoint)

Edit `src/routes/index.ts` and comment out:
```typescript
// router.use('/api/v1/migrate', migrateRouter)
```

Then:
```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git add .
git commit -m "Remove migration endpoint"
git push
```

## ✅ Done!

Your application now uses:
- **Last Name** (required)
- **First Name** (required)
- **Middle Name** (optional)

## 🆘 Need More Help?

See `RAILWAY_MIGRATION_STEPS.md` for detailed instructions and troubleshooting.
