# Quick Setup - Email Verification Feature

## 🚀 5-Minute Setup Guide

### Step 1: Run Database Migration

```bash
npm run migrate:emailverification
```

This adds three new columns to the `parents` table:
- `email_verified` (boolean)
- `verification_code` (string)
- `verification_code_expires` (datetime)

---

### Step 2: Update Environment Variables

Add email configuration to your `.env` file:

#### For Development (Gmail):
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Benedicto College <your-gmail@gmail.com>
```

**⚠️ Note**: You need a Gmail App Password. Get one here:  
https://myaccount.google.com/apppasswords

#### For Production (SendGrid):
```env
ENABLE_EMAIL=true
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SMTP_FROM=Benedicto College <noreply@benedicto.edu.ph>
```

---

### Step 3: Handle Existing Parent Accounts (Optional)

If you already have parent accounts in the database:

**Option A**: Auto-verify all existing accounts (recommended)
```sql
UPDATE parents SET email_verified = true WHERE email_verified = false;
```

**Option B**: Let existing users verify their email on next login
- They'll be prompted to verify
- They can use the "Resend Code" feature

---

### Step 4: Test the Feature

#### Test Registration:
```bash
curl -X POST http://localhost:3001/api/parents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@gmail.com",
    "password": "password123",
    "phone": "09123456789",
    "rfid_tag_uid": "VALID_RFID_TAG"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code."
}
```

Check the email inbox for a 6-digit code like: `123456`

#### Test Email Verification:
```bash
curl -X POST http://localhost:3001/api/parents/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "code": "123456"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in."
}
```

#### Test Login (After Verification):
```bash
curl -X POST http://localhost:3001/api/parents/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "password123"
  }'
```

Should return token and parent data.

#### Test Login (Before Verification):
Try logging in without verifying first - should get:
```json
{
  "success": false,
  "error": "Email not verified. Please check your email for the verification code.",
  "code": "EMAIL_NOT_VERIFIED"
}
```

#### Test Resend Code:
```bash
curl -X POST http://localhost:3001/api/parents/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com"
  }'
```

---

## 📋 Checklist

- [ ] Database migration completed (`npm run migrate:emailverification`)
- [ ] Email configuration added to `.env`
- [ ] Email sending tested (check spam folder if not received)
- [ ] Registration flow tested
- [ ] Verification flow tested
- [ ] Login blocked before verification ✓
- [ ] Login works after verification ✓
- [ ] Resend code tested
- [ ] Frontend updated (see `FRONTEND_EMAIL_VERIFICATION.md`)

---

## 🎯 New API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parents/register` | POST | Register + send verification email |
| `/api/parents/verify-email` | POST | Verify email with code |
| `/api/parents/resend-verification` | POST | Resend verification code |
| `/api/parents/login` | POST | Login (requires verified email) |

---

## 🔧 Troubleshooting

### Problem: Emails not sending

**Check:**
1. Is `ENABLE_EMAIL=true` in `.env`?
2. Are SMTP credentials correct?
3. For Gmail: Using App Password (not regular password)?
4. Check server logs for email errors

**Quick Test:**
```bash
# Restart the server to reload .env
npm run dev
```

### Problem: "Invalid verification code"

**Solutions:**
- Check for typos in the code
- Code expires after 15 minutes - request a new one
- Case-sensitive email address

### Problem: Login fails with "Email not verified"

**This is expected!** Users must verify their email first:
1. Check email for verification code
2. Call `/api/parents/verify-email` with the code
3. Then try login again

---

## 📚 Full Documentation

- **Backend Details**: See `EMAIL_VERIFICATION_GUIDE.md`
- **Frontend Integration**: See `FRONTEND_EMAIL_VERIFICATION.md`
- **Email Config**: See `EMAIL_SETUP_GUIDE.md` (if exists)

---

## 🚀 Ready for Production?

Before deploying:

1. ✅ Switch to SendGrid (SMTP ports blocked on Railway)
2. ✅ Update `SMTP_FROM` to your domain email
3. ✅ Test thoroughly in staging
4. ✅ Update frontend to handle verification flow
5. ✅ Monitor email delivery rates
6. ✅ Consider rate limiting on resend endpoint

---

## 💡 Tips

- **Gmail**: Works great for development but has daily limits (500 emails/day)
- **SendGrid**: Recommended for production (100 emails/day free tier)
- **Code expiration**: 15 minutes is secure but reasonable
- **Resend**: Consider adding cooldown (60 seconds) to prevent spam
- **UI/UX**: Show countdown timer for resend button on frontend

---

## 🎉 That's It!

You now have a fully functional email verification system for parent accounts!

**Next Steps:**
1. Implement the frontend verification form
2. Test end-to-end flow
3. Deploy to production
