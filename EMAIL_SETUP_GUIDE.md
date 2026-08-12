# 📧 Gmail Email Notification Setup Guide

Follow these steps **exactly** to set up automatic email notifications for parents.

---

## 🎯 **STEP 1: Get Your Gmail App Password** (5 minutes)

### 1.1 Open Google Account Security

1. Go to: **https://myaccount.google.com/security**
2. Log in with the Gmail account you want to use for sending emails

### 1.2 Enable 2-Step Verification (if not already enabled)

1. Scroll down to **"How you sign in to Google"**
2. Click on **"2-Step Verification"**
3. Click **"Get Started"**
4. Follow the prompts:
   - Enter your phone number
   - You'll receive a code via SMS
   - Enter the code
   - Click **"Turn On"**

### 1.3 Generate App Password

1. Go back to: **https://myaccount.google.com/security**
2. Scroll to **"How you sign in to Google"**
3. Click **"App passwords"**
   - ⚠️ If you don't see it, try searching "App passwords" in the search bar at the top
4. You may need to sign in again
5. Click **"Select app"** → Choose **"Mail"**
6. Click **"Select device"** → Choose **"Other (Custom name)"**
7. Type: **"School Attendance System"**
8. Click **"Generate"**
9. **IMPORTANT:** You'll see a 16-character password like: `abcd efgh ijkl mnop`
10. **Copy this password immediately** (you won't see it again!)

---

## 🎯 **STEP 2: Install Required Package** (2 minutes)

### 2.1 Open Terminal

1. Open **Command Prompt** or **PowerShell**
2. Navigate to your backend folder:

```bash
cd C:\Users\johne\OneDrive\Desktop\BACK-END-RFID
```

### 2.2 Install Nodemailer

```bash
npm install nodemailer @types/nodemailer
```

Wait for installation to complete (should take 10-30 seconds).

---

## 🎯 **STEP 3: Update Your .env File** (3 minutes)

### 3.1 Open .env File

Open this file in any text editor:
```
C:\Users\johne\OneDrive\Desktop\BACK-END-RFID\.env
```

### 3.2 Add Email Configuration

**At the bottom of the file**, add these lines:

```env
# Email Notifications (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=Benedicto College <your-gmail@gmail.com>
ENABLE_EMAIL=true
```

### 3.3 Replace with YOUR Information

Replace these **3 things**:

1. **`your-gmail@gmail.com`** (appears twice)
   - Replace with your actual Gmail address
   - Example: `johnsmith@gmail.com`

2. **`abcd efgh ijkl mnop`**
   - Replace with the 16-character password from Step 1.3
   - **Remove all spaces!** Example: `abcdefghijklmnop`

### 3.4 Example of Correct .env

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=johnsmith@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=Benedicto College <johnsmith@gmail.com>
ENABLE_EMAIL=true
```

### 3.5 Save the File

Press **Ctrl+S** to save.

---

## 🎯 **STEP 4: Restart Your Backend Server** (1 minute)

### 4.1 Stop Current Server

If your backend is running, press **Ctrl+C** in the terminal.

### 4.2 Start Server Again

```bash
npm run dev
```

Wait until you see:
```
School Attendance API is running on port 3001
```

---

## 🎯 **STEP 5: Test Email Notifications** (5 minutes)

### 5.1 Make Sure You Have a Student with Parent Email

1. Go to your frontend: `http://localhost:3000/dashboard/students`
2. Pick any student (or create a test student)
3. Make sure they have a **valid parent email** (your own email for testing)

### 5.2 Scan RFID Card

**Option A: Use Test Scan Page**
1. Go to `http://localhost:3000/test-scan`
2. Enter the student's RFID tag UID
3. Click "Scan"

**Option B: Use Real RFID Scanner**
1. Scan a physical RFID card at the device

### 5.3 Check Backend Console

You should see this in your backend terminal:

```
[Notification] Processing for John Doe (IN at 08:30 AM)
[Email] ✓ Sent to parent@email.com for John Doe
[Notification] ✓ Email sent successfully
```

### 5.4 Check Email Inbox

1. Open the parent's email inbox (Gmail, Yahoo, etc.)
2. Look for email from your Gmail
3. Subject: **"Attendance Alert: [Student Name] Checked In"**
4. Open the email — it should look nice with colors and a table

⚠️ **If you don't see it:**
- Check the **Spam/Junk folder**
- Mark it as "Not Spam" so future emails go to inbox

---

## ✅ **DONE!**

Every time a student scans their RFID card:
1. ✅ Attendance is recorded
2. ✅ Email is sent to their parent automatically
3. ✅ Parent receives a beautiful notification

---

## 🚨 **TROUBLESHOOTING**

### Problem: "Invalid login: 535-5.7.8 Username and Password not accepted"

**Solution:**
- Make sure you enabled **2-Step Verification** on your Gmail
- Make sure you're using the **App Password**, not your regular Gmail password
- Remove any spaces from the app password in `.env`

### Problem: "self signed certificate in certificate chain"

**Solution:**
Add this to your `.env` file (development only):
```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Problem: Email not received

**Check:**
1. ✅ Parent email is valid and spelled correctly
2. ✅ Check spam/junk folder
3. ✅ Check backend console for error messages
4. ✅ Verify `.env` file has no typos

**Test your Gmail credentials:**
```bash
cd BACK-END-RFID
node -e "require('dotenv').config(); console.log('User:', process.env.SMTP_USER, 'Pass:', process.env.SMTP_PASS)"
```

If it prints `User: undefined Pass: undefined`, your `.env` is not loading.

### Problem: Emails go to spam

**Solution:**
- This is normal for new senders
- Ask parents to:
  1. Mark email as "Not Spam"
  2. Add your Gmail to their contacts
- After a few successful deliveries, Gmail will trust you more

---

## 📧 **WHAT THE EMAIL LOOKS LIKE**

Parents receive this beautiful email:

```
┌─────────────────────────────────────┐
│   Benedicto College                 │
│   RFID Attendance System            │
└─────────────────────────────────────┘

Attendance Notification

┌─────────────────────────────────────┐
│ Student:    John Doe                │
│ Status:     ✓ CHECKED IN            │
│ Time:       08:30 AM                │
│ Date:       Monday, August 12, 2026 │
└─────────────────────────────────────┘

This is an automated message from
Benedicto College RFID Attendance System.
```

With nice colors and formatting!

---

## 💰 **COST**

**Gmail email notifications are 100% FREE!**
- No credit card required
- Unlimited emails
- No hidden fees

**Gmail limits:**
- 500 emails per day (more than enough for a school)
- If you need more, create multiple Gmail accounts

---

## 🚀 **DEPLOY TO PRODUCTION**

Once you've tested locally and it works:

### 1. Update Railway Environment Variables

1. Go to https://railway.app
2. Open your backend project
3. Go to **Variables** tab
4. Add these variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-app-password-here
   SMTP_FROM=Benedicto College <your-gmail@gmail.com>
   ENABLE_EMAIL=true
   ```
5. Click **Deploy** or wait for auto-deploy

### 2. Push Code to GitHub

```bash
cd C:\Users\johne\OneDrive\Desktop\BACK-END-RFID
git add .
git commit -m "add email notifications for parents"
git push origin main
```

Railway will automatically rebuild and deploy.

### 3. Test on Live Site

1. Go to your deployed frontend: `https://front-end-rfid.vercel.app`
2. Log in
3. Scan an RFID card
4. Check if parent receives email

---

## 📝 **NOTES**

- Emails are sent **immediately** when a student scans
- Works for both **CHECK IN** and **CHECK OUT**
- If sending fails, it's logged in the backend console (won't crash the system)
- Parents can reply to the email (it goes to your Gmail inbox)

---

## ✅ **CHECKLIST**

Before testing, make sure:
- [ ] 2-Step Verification is enabled on your Gmail
- [ ] You generated an App Password
- [ ] You installed `nodemailer` package
- [ ] Your `.env` file has all 5 email variables
- [ ] You removed spaces from the app password
- [ ] You restarted the backend server
- [ ] Student has a valid parent email address

---

**That's it! You're done! 🎉**

If you have any issues, check the troubleshooting section above or look at the backend console for error messages.
