# 🚀 Railway Deployment Guide - Email Verification

## ✅ Current Status

Based on your Railway environment, you have:
- ✅ SendGrid API Key configured
- ✅ SMTP_FROM configured (`Benedicto College <benking@gmail.com>`)
- ✅ ENABLE_EMAIL set to true
- ✅ Database (MySQL) running

## 📋 Deployment Steps

### Step 1: Run Database Migration

Connect to your Railway MySQL database and run this SQL query:

```sql
ALTER TABLE parents 
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verification_code VARCHAR(10) NULL,
ADD COLUMN verification_code_expires DATETIME NULL;
```

**Verify it worked:**
```sql
DESCRIBE parents;
```

You should see the new columns!

### Step 2: (Optional) Auto-verify Existing Parents

If you have existing parent accounts, run this to let them login immediately:

```sql
UPDATE parents SET email_verified = true WHERE email_verified = false;
```

### Step 3: Deploy Backend Code

Push your updated backend code to GitHub:

```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID

git add .
git commit -m "Add email verification for parent accounts"
git push origin main
```

Railway will automatically redeploy!

### Step 4: Deploy Frontend Code

Push your updated frontend code:

```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID

git add .
git commit -m "Add email verification UI for parents"
git push origin main
```

Your frontend will redeploy on Vercel (or wherever it's hosted).

---

## 🧪 Testing the Feature

### Test 1: Register New Parent

1. Go to: `https://your-frontend-url/parent/register`
2. Fill in the form:
   - **Full Name**: Test Parent
   - **Email**: Your actual email address
   - **Phone**: 09123456789
   - **Password**: password123
   - **RFID Tag**: Use a valid RFID tag from your students table
3. Click "Create Account"
4. Should show: "Check Your Email!"

### Test 2: Check Email

1. Check your email inbox (the one you used in registration)
2. Look for email from "Benedicto College"
3. Subject: "Verify Your Email - Benedicto College Parent Portal"
4. You should see a 6-digit code like: **123456**
5. **Note**: Check spam folder if you don't see it!

### Test 3: Verify Email

1. Click "Verify Email →" (or go to `/parent/verify`)
2. Enter the 6-digit code from your email
3. Code auto-formats as you type
4. Click "Verify Email →"
5. Should show: "Email Verified!"
6. Automatically redirects to login

### Test 4: Login

1. Go to: `https://your-frontend-url/parent`
2. Enter your email and password
3. Click "Sign In"
4. Should login successfully! ✅

### Test 5: Try Login Before Verification

1. Register another test account
2. DON'T verify the email
3. Try to login immediately
4. Should show error: "Email not verified. Redirecting to verification..."
5. Automatically redirects to verification page

---

## 🔍 Debugging

### Check Backend Logs

In Railway, go to your backend service → Logs tab and look for:

```
[Email] ✓ Using SendGrid Web API for production email delivery
[EmailVerification] Sending via SendGrid Web API to test@email.com
[EmailVerification] ✓ Verification email sent to test@email.com
```

### Check Database

Run this query to see registered parents:

```sql
SELECT id, name, email, email_verified, verification_code 
FROM parents 
ORDER BY id DESC 
LIMIT 10;
```

You should see:
- `email_verified = 0` (false) for unverified accounts
- `email_verified = 1` (true) for verified accounts
- `verification_code` should be NULL after verification

---

## 📧 SendGrid Configuration

Your Railway environment has:

```
SENDGRID_API_KEY = SG.J4UP5sS6B8enGItB1w-L4GZ5gLZez...
SMTP_FROM = Benedicto College <benking@gmail.com>
ENABLE_EMAIL = true
```

**Important**: Make sure `ENABLE_EMAIL=true` in Railway variables!

---

## 🚨 Common Issues

### Issue: Emails Not Sending

**Check:**
1. Railway logs show email sending attempts?
2. `ENABLE_EMAIL=true` in Railway?
3. SendGrid API key valid?
4. Check SendGrid dashboard for bounce/spam reports

**Solution:**
- Verify SendGrid API key is correct
- Check SendGrid sender authentication
- Look at Railway logs for specific errors

### Issue: "Invalid verification code"

**Solutions:**
- Code expires after 15 minutes - request new one
- Make sure you're using the latest code
- Check for typos

### Issue: Can't login after verification

**Check:**
```sql
SELECT email_verified FROM parents WHERE email = 'your-email@gmail.com';
```

Should return `1` (true). If not, run:
```sql
UPDATE parents SET email_verified = true WHERE email = 'your-email@gmail.com';
```

---

## 📊 API Endpoints (Production)

Replace `your-backend-url` with your Railway URL:

### Register
```bash
POST https://your-backend-url.railway.app/api/parents/register

Body:
{
  "name": "Test Parent",
  "email": "test@gmail.com",
  "password": "password123",
  "phone": "09123456789",
  "rfid_tag_uid": "VALID_RFID"
}
```

### Verify Email
```bash
POST https://your-backend-url.railway.app/api/parents/verify-email

Body:
{
  "email": "test@gmail.com",
  "code": "123456"
}
```

### Resend Code
```bash
POST https://your-backend-url.railway.app/api/parents/resend-verification

Body:
{
  "email": "test@gmail.com"
}
```

### Login
```bash
POST https://your-backend-url.railway.app/api/parents/login

Body:
{
  "email": "test@gmail.com",
  "password": "password123"
}
```

---

## ✅ Deployment Checklist

- [ ] Database migration completed
- [ ] Backend code pushed to GitHub
- [ ] Frontend code pushed to GitHub
- [ ] Railway backend redeployed
- [ ] Frontend redeployed
- [ ] `ENABLE_EMAIL=true` in Railway
- [ ] SendGrid API key verified
- [ ] Test registration with real email
- [ ] Email received successfully
- [ ] Email verification works
- [ ] Login works after verification
- [ ] Login blocked before verification

---

## 🎉 You're Done!

The email verification feature is now live on production! Parents will:

1. Register account → Receive email
2. Enter 6-digit code → Account verified
3. Login → Access parent portal ✅

**Next Steps:**
- Monitor email delivery in SendGrid dashboard
- Check Railway logs for any issues
- Test with multiple parent accounts
- Inform parents about the new registration process

---

## 📞 Support

If you encounter issues:

1. **Check Railway Logs** - Look for error messages
2. **Check SendGrid Dashboard** - See email delivery status
3. **Check Database** - Verify columns exist and data is correct
4. **Review Documentation** - See other guides for detailed info

---

**Last Updated**: November 6, 2026  
**Status**: ✅ Ready for Production
