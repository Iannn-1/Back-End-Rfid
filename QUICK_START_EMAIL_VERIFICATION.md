# 🚀 Email Verification - Quick Start (5 Minutes)

## ⚡ TL;DR - Get Started Now!

### 1️⃣ Run Migration (30 seconds)
```bash
npm run migrate:emailverification
```

### 2️⃣ Add to .env (1 minute)
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Benedicto College <your-email@gmail.com>
```

📝 **Get Gmail App Password**: https://myaccount.google.com/apppasswords

### 3️⃣ Test It (2 minutes)
Open `email-verification-tester.html` in your browser and test the flow!

---

## 🎯 What This Feature Does

**Before:**
- Parents register → Immediate access ❌

**Now:**
- Parents register → Email sent ✉️
- Parents verify code → Access granted ✅

---

## 📱 How It Works for Users

### Registration Flow
```
1. Parent registers account
   ↓
2. "Check your email!" message
   ↓
3. Opens email, sees 6-digit code: 123456
   ↓
4. Enters code on verification page
   ↓
5. "Email verified! You can login."
   ↓
6. Logs in successfully 🎉
```

### If Code Expires
```
1. Try to login → "Email not verified"
   ↓
2. Click "Resend Code"
   ↓
3. New email sent with new code
   ↓
4. Enter new code → Verified ✅
```

---

## 🧪 Test the Feature Now

### Option 1: Use HTML Tester (Easiest)
1. Open `email-verification-tester.html` in browser
2. Fill in registration form
3. Check email for code
4. Enter code to verify
5. Login successfully!

### Option 2: Use cURL
```bash
# 1. Register
curl -X POST http://localhost:3001/api/parents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "email": "test@gmail.com",
    "password": "password123",
    "phone": "09123456789",
    "rfid_tag_uid": "YOUR_VALID_RFID"
  }'

# 2. Check email, get code (e.g., 123456)

# 3. Verify
curl -X POST http://localhost:3001/api/parents/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com", "code": "123456"}'

# 4. Login
curl -X POST http://localhost:3001/api/parents/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com", "password": "password123"}'
```

---

## 🔥 New API Endpoints

| What | Endpoint | When to Use |
|------|----------|-------------|
| Register | `POST /api/parents/register` | Creating new account |
| Verify | `POST /api/parents/verify-email` | After receiving email code |
| Resend | `POST /api/parents/resend-verification` | Code expired/lost |
| Login | `POST /api/parents/login` | After verification ✅ |

---

## ⚠️ Common Issues & Fixes

### Issue: "Emails not sending"
**Fix**: Check `.env` file - is `ENABLE_EMAIL=true`?

### Issue: "Invalid verification code"
**Fix**: 
- Check for typos
- Code expires in 15 minutes - request new one

### Issue: "Can't login" (403 error)
**Fix**: This is expected! Verify email first, then login works

### Issue: "Migration failed"
**Fix**: Make sure MySQL is running and .env has correct DB credentials

---

## 📊 Database Changes

The migration adds 3 new columns to `parents` table:

| Column | Type | Purpose |
|--------|------|---------|
| `email_verified` | BOOLEAN | Is email verified? |
| `verification_code` | VARCHAR(10) | The 6-digit code |
| `verification_code_expires` | DATETIME | When code expires |

---

## 🎨 Frontend Integration (Quick Version)

### 1. After Registration
```javascript
// Redirect to verification page
router.push('/verify-email');
```

### 2. Verification Page
```javascript
// Send code
const response = await fetch('/api/parents/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code })
});

if (response.ok) {
  // Success! Redirect to login
  router.push('/login');
}
```

### 3. Login Page
```javascript
if (response.status === 403) {
  // Not verified yet
  alert('Please verify your email first');
  router.push('/verify-email');
}
```

**Full frontend code**: See `FRONTEND_EMAIL_VERIFICATION.md`

---

## 🎯 Production Checklist

Ready to deploy? Check these:

- [ ] Migration completed (`npm run migrate:emailverification`)
- [ ] `.env` configured with email settings
- [ ] Email sending tested (check spam folder!)
- [ ] Switched to SendGrid for production
- [ ] Frontend verification page implemented
- [ ] Tested complete flow: register → verify → login
- [ ] Existing parents handled (auto-verify or notify)

---

## 📚 Need More Details?

| Document | What's Inside |
|----------|---------------|
| `EMAIL_VERIFICATION_SUMMARY.md` | Complete overview |
| `EMAIL_VERIFICATION_GUIDE.md` | Full technical docs |
| `FRONTEND_EMAIL_VERIFICATION.md` | React/Next.js code |
| `SETUP_EMAIL_VERIFICATION.md` | Detailed setup |
| `email-verification-tester.html` | Testing tool |

---

## 🆘 Quick Help

### Getting Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in to your Google Account
3. Select "Mail" and your device
4. Click "Generate"
5. Copy the 16-character password
6. Add to `.env` as `SMTP_PASS`

### Existing Parent Accounts
Run this SQL to auto-verify them:
```sql
UPDATE parents SET email_verified = true;
```

### Check If It's Working
```bash
# Start server
npm run dev

# Look for this in logs:
[Email] ✓ Using SendGrid Web API for production email delivery
# or
[Email] ⚠️ Using Gmail SMTP (local development only)
```

---

## ✅ You're Done!

The email verification feature is now:
- ✅ Implemented in backend
- ✅ Database migrated
- ✅ Ready for testing
- 🔄 Waiting for frontend integration

**Next**: Implement the frontend verification page!

---

**Questions?** Check the detailed guides or test with `email-verification-tester.html`!
