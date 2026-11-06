# 🔑 Forgot Password Feature - Setup Guide

## ✅ Complete Implementation Ready!

The forgot password feature is fully implemented with:
- ✅ Email-based password reset
- ✅ 6-digit verification codes
- ✅ 15-minute code expiration
- ✅ Professional email templates
- ✅ Complete frontend UI

---

## 📋 Quick Setup (3 Steps)

### Step 1: Database Migration (Railway)

Go to Railway → MySQL → Database tab → Run this SQL:

```sql
ALTER TABLE parents 
ADD COLUMN reset_password_code VARCHAR(10) NULL,
ADD COLUMN reset_password_code_expires DATETIME NULL;
```

**Verify it worked:**
```sql
DESCRIBE parents;
```

You should see the 2 new columns!

---

### Step 2: Deploy Backend

```bash
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID

git add .
git commit -m "Add forgot password feature"
git push
```

Railway will auto-deploy! ✅

---

### Step 3: Deploy Frontend

```bash
cd c:\Users\johne\OneDrive\Desktop\FRONT-END-RFID

git add .
git commit -m "Add forgot password UI"
git push
```

Your hosting will redeploy! ✅

---

## 🎬 How It Works for Parents

### Step 1: Request Reset
1. Parent goes to login page
2. Clicks "Forgot password?"
3. Enters email address
4. Clicks "Send Reset Code"

### Step 2: Check Email
- Receives email with 6-digit code
- Subject: "Reset Your Password - Benedicto College"
- Code is RED colored (different from verification emails)

### Step 3: Enter Code
- Automatically redirected to reset page
- Enters 6-digit code from email
- Code verified

### Step 4: Set New Password
- Enters new password (min 6 characters)
- Confirms password
- Password reset successfully!

### Step 5: Login
- Redirected to login page
- Logs in with new password ✅

---

## 🔌 New API Endpoints

### 1. Request Password Reset
```
POST /api/parents/forgot-password

Body: { "email": "parent@email.com" }

Response: {
  "success": true,
  "message": "If an account exists with this email, a password reset code has been sent."
}
```

### 2. Verify Reset Code
```
POST /api/parents/verify-reset-code

Body: {
  "email": "parent@email.com",
  "code": "123456"
}

Response: {
  "success": true,
  "message": "Reset code verified. You can now reset your password."
}
```

### 3. Reset Password
```
POST /api/parents/reset-password

Body: {
  "email": "parent@email.com",
  "code": "123456",
  "newPassword": "newpass123"
}

Response: {
  "success": true,
  "message": "Password reset successfully! You can now login with your new password."
}
```

---

## 📧 Email Template

**Subject**: Reset Your Password - Benedicto College Parent Portal

**Preview**:
```
╔════════════════════════════════╗
║   Benedicto College            ║
║   Password Reset Request       ║
╚════════════════════════════════╝

Hello, John Doe

We received a request to reset your password.

Your Reset Code:

    ┌─────────────┐
    │  1 2 3 4 5 6  │  (RED colored)
    └─────────────┘

Code expires in 15 minutes.
```

---

## 🎨 Frontend Pages Created

### 1. Forgot Password Page
**URL**: `/parent/forgot-password`
- Email input field
- "Send Reset Code" button
- Professional UI matching login page

### 2. Reset Password Page  
**URL**: `/parent/reset-password`
- **Step 1**: 6-digit code input
- **Step 2**: New password + confirm password
- Show/hide password toggles
- Password strength validation

### 3. Updated Login Page
**URL**: `/parent`
- Added "Forgot password?" link
- Links to forgot password page

---

## 🔒 Security Features

✅ **Codes expire after 15 minutes**  
✅ **One-time use** - Code cleared after reset  
✅ **Email privacy** - Doesn't reveal if email exists  
✅ **Separate from verification** - Different codes  
✅ **Password validation** - Min 6 characters  
✅ **Confirm password** - Prevents typos  

---

## 🧪 Testing the Feature

### Test Flow:

1. **Go to login**: `your-frontend-url/parent`
2. **Click**: "Forgot password?"
3. **Enter**: Your actual email
4. **Click**: "Send Reset Code"
5. **Check email**: Look for reset code (check spam!)
6. **Enter code**: On reset page
7. **Set new password**: Enter twice to confirm
8. **Login**: With new password ✅

---

## 📊 Database Changes

### New Columns in `parents` Table

| Column | Type | Purpose |
|--------|------|---------|
| `reset_password_code` | VARCHAR(10) | The 6-digit reset code |
| `reset_password_code_expires` | DATETIME | When the code expires |

**Note**: These are separate from `verification_code` fields!

---

## 🚨 Common Issues

### Issue: "Code expired"
**Solution**: Code expires in 15 minutes. Request a new reset.

### Issue: "Invalid code"
**Solutions**:
- Check for typos
- Make sure using latest code
- Check spam folder for email

### Issue: "Passwords do not match"
**Solution**: Re-enter password carefully in both fields

### Issue: Email not received
**Check**:
- Spam folder
- Email address is correct
- Railway logs show email sent
- SendGrid dashboard

---

## 📁 Files Created/Modified

### Backend (4 files):
- ✅ `src/models/Parent.ts` - Added 2 new fields
- ✅ `src/services/emailVerificationService.ts` - Added reset email function
- ✅ `src/controllers/parentController.ts` - Added 3 new functions
- ✅ `src/routes/parents.ts` - Added 3 new endpoints

### Frontend (3 files):
- ✅ `app/parent/forgot-password/page.tsx` - NEW
- ✅ `app/parent/reset-password/page.tsx` - NEW
- ✅ `app/parent/page.tsx` - Added forgot password link

---

## ✅ Pre-Deployment Checklist

- [ ] Database migration completed (2 new columns)
- [ ] Backend code ready (compiled successfully)
- [ ] Frontend code ready
- [ ] SendGrid configured on Railway
- [ ] Test with real email
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] End-to-end test

---

## 🎯 Complete Feature Set

You now have:

1. ✅ **Email Verification** (for new registrations)
2. ✅ **Forgot Password** (for password resets)
3. ✅ **Professional email templates** (both features)
4. ✅ **Complete UI** (all pages designed)
5. ✅ **Security features** (code expiration, validation)

---

## 📚 Related Documentation

- **Email Verification**: See `EMAIL_VERIFICATION_GUIDE.md`
- **Railway Deployment**: See `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Complete Checklist**: See `COMPLETE_DEPLOYMENT_CHECKLIST.md`

---

## 🚀 Ready to Deploy!

Follow the 3 steps at the top and you're done!

**Questions?** Check the Railway deployment guide for detailed instructions.

---

**Status**: ✅ **READY TO DEPLOY**  
**Last Updated**: November 6, 2026
