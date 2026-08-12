# Email Notification Setup Guide
## Benedicto College RFID Attendance System

---

## 📧 Overview

The system sends **automated email notifications** to parents when students scan in/out using RFID tags or barcode scanning.

### Email Features:
- ✓ Beautiful HTML email template with school branding
- ✓ Instant notifications (CHECK IN / CHECK OUT)
- ✓ Automatic retry on network failures
- ✓ Works with barcode scanner on phone (testing) or RFID reader (production)
- ✓ Parent email field: `student.parent_email` (set when creating students)

---

## 🚨 Current Issue: Gmail SMTP Timeout on Railway

Gmail SMTP works perfectly **locally** but fails on **Railway deployment** with timeout errors:

```
Error: Connection timeout at Connection._onSocketTimeout
```

**Why?** Railway (and most cloud platforms) restrict outbound SMTP port 587 for security reasons.

---

## ✅ Solution: Migrate to SendGrid

**SendGrid** is a cloud-native email service designed for production deployments.

### Why SendGrid?
- ✓ **Free tier**: 100 emails/day (perfect for school use)
- ✓ **No port restrictions**: Works on all cloud platforms
- ✓ **Better deliverability**: Professional email infrastructure
- ✓ **Production-ready**: Built for reliability

---

## 🔧 SendGrid Setup Instructions

### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up with your email (use school email if available)
3. Verify your email address by clicking the link sent to your inbox

### Step 2: Generate API Key

1. Log in to SendGrid: https://app.sendgrid.com/
2. Click **Settings** (left sidebar) → **API Keys**
3. Click **Create API Key** (blue button, top right)
4. Configure:
   - **API Key Name**: `Benedicto College RFID System`
   - **API Key Permissions**: Select **Full Access** (or minimum: **Mail Send**)
5. Click **Create & View**
6. **IMPORTANT**: Copy the API key now (you'll only see it once!)
   - Example: `SG.abc123xyz...` (starts with `SG.`)

### Step 3: Verify Sender Email

SendGrid requires sender verification to prevent spam.

1. In SendGrid dashboard, go to: **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Click **Create New Sender** (blue button)
4. Fill in the form:
   ```
   From Name: Benedicto College
   From Email Address: johneyesalva@gmail.com
   Reply To: johneyesalva@gmail.com
   Company Address: [Your school address]
   City: [Your city]
   Country: Philippines
   ```
5. Click **Create**
6. **Check your email** (johneyesalva@gmail.com) and click the verification link
7. Once verified, you'll see a green checkmark in SendGrid

### Step 4: Update Railway Environment Variables

Log in to Railway dashboard and update your backend service environment variables:

#### Remove These (Old Gmail Variables):
```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

#### Add This (New SendGrid Variable):
```
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

#### Keep These (Unchanged):
```
SMTP_FROM=Benedicto College <johneyesalva@gmail.com>
ENABLE_EMAIL=true
```

### Step 5: Deploy Updated Code

The code is already updated to support SendGrid! Just push to GitHub:

```bash
# Navigate to backend folder
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID

# Stage all changes
git add .

# Commit with message
git commit -m "Fix email notifications: migrate from Gmail to SendGrid for Railway deployment"

# Push to GitHub (triggers automatic Railway deployment)
git push origin main
```

Wait 2-3 minutes for Railway to automatically redeploy.

---

## 🎯 How It Works (Automatic Provider Detection)

The system automatically chooses the right email provider:

### Production (Railway) - Uses SendGrid:
```env
SENDGRID_API_KEY=SG.xyz...  ← System detects this and uses SendGrid
```

### Local Development - Uses Gmail:
```env
SMTP_HOST=smtp.gmail.com    ← No SendGrid key found, falls back to Gmail
SMTP_USER=johneyesalva@gmail.com
SMTP_PASS=kfcqwkofbvjomvxu
```

**No code changes needed!** The system adapts automatically.

---

## 🧪 Testing After Setup

### 1. Check Railway Deployment Logs

After pushing to GitHub and Railway redeploys:

```
✓ Look for: "[Email] Using SendGrid for production email delivery"
✓ Look for: "[Email] ✓ Sent to parent@email.com for Student Name"
✗ Should NOT see: "Connection timeout" errors
```

### 2. Test with Barcode Scanning

Since you're using phone barcode scanning for testing:

1. Open your student management page
2. Find a student with a valid `parent_email` set
3. Scan the student's barcode with your phone app
4. Check the parent's email inbox within 30 seconds
5. **Check spam folder** if not in inbox (first time only)

### 3. Verify in SendGrid Dashboard

1. Go to: https://app.sendgrid.com/
2. Click **Activity** (left sidebar)
3. You should see the email delivery status:
   - ✓ **Delivered**: Success!
   - ⚠️ **Processed**: Sent but not yet delivered (wait 1-2 min)
   - ✗ **Bounce/Drop**: Check sender verification or recipient email

---

## 📧 Email Template Preview

Parents receive professionally formatted emails:

```
┌─────────────────────────────────────┐
│  🎓 Benedicto College               │
│     RFID Attendance System          │
├─────────────────────────────────────┤
│                                     │
│  Attendance Notification            │
│                                     │
│  Student:   Juan Dela Cruz          │
│  Status:    ✓ CHECKED IN            │
│  Time:      07:45 AM                │
│  Date:      Wednesday, Aug 12, 2026 │
│                                     │
│  This is an automated message...    │
│                                     │
└─────────────────────────────────────┘
```

**Colors:**
- Header: School gradient (blue/maroon)
- CHECK IN: Green badge
- CHECK OUT: Red badge
- Professional, mobile-friendly design

---

## ⚙️ Configuration Reference

### Railway (Production) Environment Variables:
```env
# SendGrid (Required for production)
SENDGRID_API_KEY=SG.your_actual_key_here

# Email Settings
SMTP_FROM=Benedicto College <johneyesalva@gmail.com>
ENABLE_EMAIL=true

# Database (Keep existing)
DB_HOST=your_railway_db_host
DB_USER=root
DB_PASSWORD=your_db_password
# ... (other variables unchanged)
```

### Local (.env) File:
```env
# Gmail (Local testing only)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=johneyesalva@gmail.com
SMTP_PASS=kfcqwkofbvjomvxu
SMTP_FROM=Benedicto College <johneyesalva@gmail.com>
ENABLE_EMAIL=true

# Database (Local)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bcrfid
DB_USER=root
DB_PASSWORD=your_local_password

# Don't add SENDGRID_API_KEY to local .env!
```

---

## 📊 Important Notes

### Parent Email Field
- Emails are sent to the `student.parent_email` field
- This is **different** from the parent registration email
- Set when creating/editing students in the admin dashboard
- Must be a valid email format (validated before sending)

### SendGrid Free Tier Limits
- **100 emails per day** (sufficient for typical school use)
- If you need more, upgrade to paid plan (starts at $15/month for 40k emails)
- System logs a warning if limit is reached

### Barcode vs RFID Scanner
- **Barcode scanning** (phone app): Works now for testing ✓
- **RFID scanner** (hardware): Will work the same way when you get it
- Both trigger the same notification flow
- Parent receives email regardless of scanning method

### Error Handling & Retry
- Automatically retries failed sends (up to 2 attempts)
- Retries on: timeout, connection refused, DNS errors
- Waits 2 seconds between retries
- Never crashes the system (errors are logged, scan still succeeds)

### Email Deliverability Tips
1. **First email goes to spam?** Ask parents to mark as "Not Spam"
2. **Verify sender email** in SendGrid (required!)
3. Use consistent "From" address (don't change frequently)
4. Monitor SendGrid Activity feed for bounces

---

## 🛠️ Troubleshooting

### Problem: Emails not sending after deployment

**Solution:**
1. Check Railway logs for error messages
2. Verify `SENDGRID_API_KEY` is set in Railway (not in code!)
3. Confirm sender email is verified in SendGrid
4. Check SendGrid Activity feed for delivery status

### Problem: "Sender email not verified" error

**Solution:**
1. Go to SendGrid → Settings → Sender Authentication
2. Find your email in the list
3. If not verified (red ✗), click Resend Verification
4. Check your email and click the verification link

### Problem: Emails go to spam

**Solution:**
1. This is normal for first few emails from a new sender
2. Ask a test parent to mark as "Not Spam" or move to inbox
3. Future emails will go to inbox automatically
4. Consider using a school domain email (more trustworthy)

### Problem: SendGrid API key invalid

**Solution:**
1. API keys expire if not used within 30 days
2. Generate a new key in SendGrid dashboard
3. Update `SENDGRID_API_KEY` in Railway
4. Railway will auto-restart the backend

---

## 📚 Additional Resources

- **SendGrid Documentation**: https://docs.sendgrid.com/
- **SendGrid Activity Feed**: https://app.sendgrid.com/email_activity
- **Railway Logs**: https://railway.app/ → Your Project → Deployments
- **API Key Management**: https://app.sendgrid.com/settings/api_keys

---

## ✅ Next Steps Checklist

- [ ] Create SendGrid account
- [ ] Generate API key and save it securely
- [ ] Verify sender email (johneyesalva@gmail.com)
- [ ] Remove Gmail variables from Railway
- [ ] Add `SENDGRID_API_KEY` to Railway
- [ ] Push updated code to GitHub (`git push origin main`)
- [ ] Wait for Railway auto-deployment (2-3 min)
- [ ] Test with barcode scan
- [ ] Check parent email inbox (and spam folder)
- [ ] Monitor SendGrid Activity feed
- [ ] Celebrate successful email notifications! 🎉

---

**Questions?** Check the Railway logs or SendGrid Activity feed for detailed debugging information.
