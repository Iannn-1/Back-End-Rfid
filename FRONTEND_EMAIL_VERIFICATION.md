# Frontend Implementation Guide - Email Verification

## Quick Start for Frontend Developers

This guide shows you how to integrate the email verification feature into your React/Next.js frontend.

---

## User Flow

```
1. Parent fills registration form
   ↓
2. Submit registration → Backend sends verification email
   ↓
3. Show "Check your email" message
   ↓
4. Parent enters 6-digit code from email
   ↓
5. Submit verification code
   ↓
6. Success! Redirect to login
   ↓
7. Parent logs in with verified email
```

---

## Frontend Components Needed

### 1. Registration Form (Existing - needs minor update)

After successful registration, show a message and redirect to verification page:

```typescript
const handleRegister = async (formData) => {
  const response = await fetch('/api/parents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (data.success) {
    // Store email for verification step
    sessionStorage.setItem('pendingVerificationEmail', formData.email);
    
    // Show success message
    alert(data.message); // "Registration successful! Please check your email..."
    
    // Redirect to verification page
    router.push('/verify-email');
  }
};
```

---

### 2. Email Verification Form (NEW)

Create a new page/component at `/verify-email`:

```typescript
// app/verify-email/page.tsx or pages/verify-email.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // or 'next/router' for pages dir

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Get email from registration step
    const pendingEmail = sessionStorage.getItem('pendingVerificationEmail');
    if (pendingEmail) {
      setEmail(pendingEmail);
    } else {
      // If no pending email, redirect to registration
      router.push('/register');
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/parents/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Email verified successfully! Redirecting to login...');
        sessionStorage.removeItem('pendingVerificationEmail');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/parents/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('New code sent! Check your email.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a 6-digit code to <span className="font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div>
            <label htmlFor="code" className="sr-only">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              maxLength={6}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### 3. Login Form (Existing - needs update)

Update login error handling to detect unverified emails:

```typescript
const handleLogin = async (formData) => {
  const response = await fetch('/api/parents/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (response.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
    // Email not verified - redirect to verification
    sessionStorage.setItem('pendingVerificationEmail', formData.email);
    alert('Please verify your email address first.');
    router.push('/verify-email');
    return;
  }

  if (data.success) {
    // Store token and redirect to dashboard
    localStorage.setItem('parentToken', data.data.token);
    localStorage.setItem('parentData', JSON.stringify(data.data.parent));
    router.push('/parent-dashboard');
  } else {
    setError(data.error);
  }
};
```

---

## UI/UX Best Practices

### Verification Code Input

For better UX, you can use individual input boxes for each digit:

```typescript
const CodeInput = ({ value, onChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return; // Only numbers

    const newCode = value.split('');
    newCode[index] = digit;
    onChange(newCode.join(''));

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  );
};
```

### Countdown Timer for Resend

```typescript
const [countdown, setCountdown] = useState(60);
const [canResend, setCanResend] = useState(false);

useEffect(() => {
  if (countdown > 0) {
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  } else {
    setCanResend(true);
  }
}, [countdown]);

const handleResend = async () => {
  await resendVerificationCode();
  setCountdown(60);
  setCanResend(false);
};

// In JSX:
<button disabled={!canResend}>
  {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
</button>
```

---

## API Integration Summary

### Backend Base URL
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/parents/register` | POST | Register new parent |
| `/api/parents/verify-email` | POST | Verify email with code |
| `/api/parents/resend-verification` | POST | Resend verification code |
| `/api/parents/login` | POST | Login (requires verified email) |

---

## Error Handling

### Common Errors to Handle

```typescript
const ERROR_MESSAGES = {
  'EMAIL_NOT_VERIFIED': 'Please verify your email address first.',
  'CODE_EXPIRED': 'Verification code expired. Please request a new one.',
  'Invalid verification code': 'The code you entered is incorrect.',
  'Email already verified': 'This email is already verified.',
};

// Usage
if (data.code && ERROR_MESSAGES[data.code]) {
  setError(ERROR_MESSAGES[data.code]);
} else {
  setError(data.error || 'An error occurred');
}
```

---

## Testing Checklist

- [ ] User can register and receives email
- [ ] User can enter 6-digit code and verify email
- [ ] User cannot login without verifying email
- [ ] User can resend verification code if expired
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Countdown timer works for resend button
- [ ] Code input accepts only numbers
- [ ] Auto-focus between code input boxes works
- [ ] Redirects work correctly after verification

---

## Email Template Preview

The verification email sent to parents looks like this:

```
Subject: Verify Your Email - Benedicto College Parent Portal

┌─────────────────────────────────────┐
│  Benedicto College                  │
│  Parent Portal Registration         │
└─────────────────────────────────────┘

Welcome, John Doe!

Thank you for registering with the Benedicto College 
Parent Portal. To complete your registration, please 
verify your email address using the code below:

┌─────────────────────────────────────┐
│     Your Verification Code          │
│                                     │
│         1 2 3 4 5 6                │
└─────────────────────────────────────┘

This code will expire in 15 minutes.
```

---

## Environment Variables Needed

Make sure your frontend has:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Or update to your production backend URL when deploying.

---

## Questions?

Refer to the main `EMAIL_VERIFICATION_GUIDE.md` for:
- Complete API documentation
- Backend configuration
- Database migration steps
- Troubleshooting tips
