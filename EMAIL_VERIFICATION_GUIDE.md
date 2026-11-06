# Email Verification Feature - Implementation Guide

## Overview

The email verification system ensures that parent accounts are created with valid email addresses. When parents register for the portal, they receive a 6-digit verification code via email that must be entered to activate their account.

## Features

✅ **6-digit verification codes** sent via email  
✅ **15-minute expiration** for security  
✅ **Resend functionality** if code expires or is lost  
✅ **Login blocking** until email is verified  
✅ **Professional email templates** matching school branding  
✅ **Works with both SendGrid (production) and Gmail SMTP (development)**

---

## Database Changes

### New Columns in `parents` Table

| Column | Type | Description |
|--------|------|-------------|
| `email_verified` | BOOLEAN | Whether the email has been verified (default: false) |
| `verification_code` | VARCHAR(10) | The 6-digit code sent to the email |
| `verification_code_expires` | DATETIME | When the verification code expires |

---

## API Endpoints

### 1. POST `/api/parents/register`

**Purpose**: Register a new parent account and send verification email

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "password": "securePassword123",
  "phone": "09123456789",
  "rfid_tag_uid": "ABC123DEF456"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for the verification code.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "rfid_tag_uid": "ABC123DEF456",
    "email_verified": false
  }
}
```

**What Happens**:
1. Validates RFID tag exists in students table
2. Checks for duplicate email
3. Creates parent account with `email_verified: false`
4. Generates 6-digit verification code
5. Sends verification email with the code
6. Code expires in 15 minutes

---

### 2. POST `/api/parents/verify-email`

**Purpose**: Verify the email address using the code received

**Request Body**:
```json
{
  "email": "john.doe@gmail.com",
  "code": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in."
}
```

**Error Responses**:

**Invalid Code** (400):
```json
{
  "success": false,
  "error": "Invalid verification code"
}
```

**Expired Code** (400):
```json
{
  "success": false,
  "error": "Verification code has expired. Please request a new one.",
  "code": "CODE_EXPIRED"
}
```

**Already Verified** (400):
```json
{
  "success": false,
  "error": "Email already verified"
}
```

---

### 3. POST `/api/parents/resend-verification`

**Purpose**: Resend a new verification code if the previous one expired

**Request Body**:
```json
{
  "email": "john.doe@gmail.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Verification code sent! Please check your email."
}
```

**What Happens**:
1. Generates a new 6-digit code
2. Updates the expiration time (15 minutes from now)
3. Sends a new verification email

---

### 4. POST `/api/parents/login`

**Purpose**: Login to parent portal (requires verified email)

**Request Body**:
```json
{
  "email": "john.doe@gmail.com",
  "password": "securePassword123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "parent": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@gmail.com",
      "rfid_tag_uid": "ABC123DEF456"
    }
  }
}
```

**Email Not Verified Error** (403):
```json
{
  "success": false,
  "error": "Email not verified. Please check your email for the verification code.",
  "code": "EMAIL_NOT_VERIFIED"
}
```

---

## Migration Instructions

### Step 1: Run the Database Migration

```bash
# Navigate to project directory
cd c:\Users\johne\OneDrive\Desktop\BACK-END-RFID

# Run the migration script
npm run ts-node src/scripts/addEmailVerification.ts
```

This will add the three new columns to the `parents` table.

### Step 2: Handle Existing Parent Accounts

If you have existing parent accounts in the database, you have two options:

#### Option A: Manually Verify Existing Accounts (Recommended)
```sql
-- Set all existing accounts as verified
UPDATE parents SET email_verified = true WHERE email_verified = false;
```

#### Option B: Require All Users to Verify
- Existing users will need to request a verification code on their next login attempt
- They can use the "Resend Verification" feature

---

## Email Configuration

The system works with both **SendGrid** (production) and **Gmail SMTP** (development).

### For Production (SendGrid - Recommended)

Add to `.env`:
```env
ENABLE_EMAIL=true
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SMTP_FROM=Benedicto College <noreply@your-domain.com>
```

### For Development (Gmail SMTP)

Add to `.env`:
```env
ENABLE_EMAIL=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Benedicto College <your-gmail@gmail.com>
```

⚠️ **Note**: Gmail SMTP requires an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password.

---

## Frontend Integration Examples

### Registration Flow

```javascript
// 1. Register the parent
const registerResponse = await fetch('http://localhost:3001/api/parents/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john.doe@gmail.com',
    password: 'securePassword123',
    phone: '09123456789',
    rfid_tag_uid: 'ABC123DEF456'
  })
});

const data = await registerResponse.json();
console.log(data.message); // "Registration successful! Please check your email..."

// 2. Show verification code input form
// User receives email with 6-digit code

// 3. Verify the email
const verifyResponse = await fetch('http://localhost:3001/api/parents/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@gmail.com',
    code: '123456' // Code from email
  })
});

const verifyData = await verifyResponse.json();
if (verifyData.success) {
  console.log('Email verified! You can now log in.');
}
```

### Resend Code Flow

```javascript
const resendResponse = await fetch('http://localhost:3001/api/parents/resend-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@gmail.com'
  })
});

const data = await resendResponse.json();
console.log(data.message); // "Verification code sent! Please check your email."
```

### Login with Verification Check

```javascript
const loginResponse = await fetch('http://localhost:3001/api/parents/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.doe@gmail.com',
    password: 'securePassword123'
  })
});

const loginData = await loginResponse.json();

if (loginResponse.status === 403 && loginData.code === 'EMAIL_NOT_VERIFIED') {
  // Redirect to verification page
  console.log('Please verify your email first');
} else if (loginData.success) {
  // Store token and proceed
  localStorage.setItem('token', loginData.data.token);
}
```

---

## Testing the Feature

### Test Scenario 1: New Registration

1. Register a new parent account
2. Check the email inbox for the verification code
3. Use the code to verify the email
4. Try logging in (should succeed)

### Test Scenario 2: Expired Code

1. Register a new parent account
2. Wait 16+ minutes
3. Try to verify with the code (should fail)
4. Request a new code via resend endpoint
5. Verify with the new code (should succeed)

### Test Scenario 3: Login Without Verification

1. Register a new parent account
2. Try to login WITHOUT verifying (should fail with 403 error)
3. Verify the email
4. Try to login again (should succeed)

---

## Security Features

✅ **Time-limited codes**: Codes expire after 15 minutes  
✅ **One-time use**: Code is cleared after successful verification  
✅ **Login blocking**: Cannot access the portal until verified  
✅ **Secure storage**: Codes are stored in the database, not sent in URLs  
✅ **Rate limiting**: Consider adding rate limiting on resend endpoint to prevent abuse

---

## Troubleshooting

### Emails Not Being Sent

1. Check `.env` file has correct email configuration
2. Verify `ENABLE_EMAIL=true`
3. Check server logs for email errors
4. For Gmail: Ensure you're using an App Password, not regular password
5. For SendGrid: Verify API key is valid and starts with `SG.`

### "Email Not Verified" Error on Login

This is expected behavior. The user must:
1. Check their email for the verification code
2. Use the `/verify-email` endpoint with the code
3. Then retry login

### Code Expired

Users can request a new code using the `/resend-verification` endpoint.

---

## Next Steps for Production

1. ✅ Run the database migration
2. ✅ Configure SendGrid for production emails
3. ✅ Update frontend to handle verification flow
4. ✅ Test thoroughly in development
5. 🔄 Consider adding rate limiting on resend endpoint
6. 🔄 Add monitoring for failed email deliveries
7. 🔄 Consider adding SMS verification as backup option

---

## Files Modified/Created

### Created:
- `src/services/emailVerificationService.ts` - Email verification service
- `src/scripts/addEmailVerification.ts` - Database migration script
- `EMAIL_VERIFICATION_GUIDE.md` - This documentation

### Modified:
- `src/models/Parent.ts` - Added email verification fields
- `src/controllers/parentController.ts` - Added verification logic
- `src/routes/parents.ts` - Added new endpoints

---

## Support

For questions or issues, contact the development team or refer to:
- SendGrid Documentation: https://docs.sendgrid.com/
- Nodemailer Documentation: https://nodemailer.com/
