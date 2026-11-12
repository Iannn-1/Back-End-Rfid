# Quick Gmail SMTP Setup for Railway (Saturday Demo)

## Problem
SendGrid emails are being deferred by Gmail, causing delays up to 72 hours.

## Solution
Use Gmail SMTP instead of SendGrid for the demo (switch back to SendGrid later if needed).

## Railway Environment Variables to Set

Copy these EXACT values to your Railway backend service:

### Variables Tab in Railway:

```bash
# Email Configuration - Gmail SMTP
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=johneyesalva@gmail.com
SMTP_PASS=kfcqwkofbvjomvxu
SMTP_FROM=Benedicto College <johneyesalva@gmail.com>

# Disable SendGrid (comment out or delete)
# SENDGRID_API_KEY=your_sendgrid_api_key_here

# Keep these as they are
PARENT_PORTAL_URL=https://front-end-rfid.vercel.app
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## Step-by-Step Railway Setup

### 1. Open Railway Dashboard
- Go to: https://railway.app
- Sign in
- Select your project
- Click on your **backend service** (not database)

### 2. Go to Variables Tab
- Click **"Variables"** tab at the top
- You'll see all your current environment variables

### 3. Delete or Disable SendGrid
Find the line:
```
SENDGRID_API_KEY=SG.1KGPuSSURxucRT4fYlHx-g...
```

**Option A:** Delete it completely (click X button)
**Option B:** Edit it to be empty: `SENDGRID_API_KEY=`

### 4. Add/Update Gmail Variables

Check if these variables exist. If they do, **update** them. If not, **add** them:

#### Add New Variable Button:
Click **"+ New Variable"** for each one:

**Variable 1:**
- Name: `SMTP_USER`
- Value: `johneyesalva@gmail.com`

**Variable 2:**
- Name: `SMTP_PASS`
- Value: `kfcqwkofbvjomvxu`

**Variable 3:**
- Name: `SMTP_FROM`
- Value: `Benedicto College <johneyesalva@gmail.com>`

**Variable 4:**
- Name: `SMTP_HOST`
- Value: `smtp.gmail.com`

**Variable 5:**
- Name: `SMTP_PORT`
- Value: `587`

**Variable 6:**
- Name: `ENABLE_EMAIL`
- Value: `true`

### 5. Save and Wait
- Railway will automatically restart your service
- Wait 1-2 minutes for deployment
- Look for "Active" status

### 6. Test
- Go to your admin dashboard
- Create a test student
- Check parent email for welcome message
- Should arrive in **5-30 seconds** (not deferred!)

## How to Verify It's Working

### Check Railway Logs:
1. Go to Railway → Your Backend Service
2. Click **"Deployments"** tab
3. Click on the latest deployment
4. Check logs for:
   ```
   [Email] ⚠️ Using Gmail SMTP (local development only)
   [StudentWelcome] Sending via Gmail SMTP to...
   [StudentWelcome] ✓ Welcome email sent to...
   ```

### Expected Log Output:
```
[Email] Configuration check:
  - SENDGRID_API_KEY exists: false
  - Gmail SMTP_HOST exists: true
  - Gmail SMTP_USER exists: true
[Email] ⚠️ Using Gmail SMTP (local development only)
```

## Troubleshooting

### If Logs Say "Email notifications are disabled":
- Check: `ENABLE_EMAIL=true` is set in Railway
- Make sure there are no typos

### If Logs Say "No email transporter configured":
- Check all SMTP variables are set correctly
- Check for typos in variable names (case-sensitive!)

### If Emails Still Don't Arrive:
1. Check Gmail spam folder
2. Check if `johneyesalva@gmail.com` is still active
3. Try generating a new Gmail App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Create new password
   - Update `SMTP_PASS` in Railway

### If "Authentication failed" error:
- The Gmail app password might be expired
- Generate a new one from Google Account settings
- Update `SMTP_PASS` in Railway

## Why This Works Better for Demo

| Feature | SendGrid | Gmail SMTP |
|---------|----------|------------|
| Delivery Speed | 5 min - 72 hours (deferred) | 5-30 seconds |
| Success Rate | 60-70% (throttled) | 95%+ |
| Spam Filtering | High (new sender) | Low (established account) |
| Setup Time | Already done | 5 minutes |
| Demo Ready | ❌ Unreliable | ✅ Reliable |

## After Saturday Presentation

You can switch back to SendGrid later by:
1. Re-enabling `SENDGRID_API_KEY` in Railway
2. Removing or commenting out Gmail SMTP variables
3. The code will automatically use SendGrid if the API key exists

## Important Notes

- **Gmail has a sending limit:** 500 emails/day for regular Gmail, 2000/day for Google Workspace
- **For production:** Consider switching back to SendGrid with Domain Authentication
- **For now:** Gmail SMTP is perfect for demo and testing

## Quick Copy-Paste for Railway

```
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=johneyesalva@gmail.com
SMTP_PASS=kfcqwkofbvjomvxu
SMTP_FROM=Benedicto College <johneyesalva@gmail.com>
```

Delete or set to empty:
```
SENDGRID_API_KEY=
```

## Contact for Help
If issues persist, check:
1. Railway deployment logs
2. Gmail spam folder  
3. Make sure all variables are exactly as shown above
