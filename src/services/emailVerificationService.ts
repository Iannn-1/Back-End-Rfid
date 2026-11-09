/**
 * Email Verification Service for Parent Account Registration
 * Sends verification codes via email to verify parent email addresses
 */

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

// Configuration
const EMAIL_ENABLED = process.env.ENABLE_EMAIL === 'true';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const USE_SENDGRID_API = !!(EMAIL_ENABLED && SENDGRID_API_KEY);

// Initialize SendGrid
if (USE_SENDGRID_API) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Gmail SMTP transporter (for local development)
const gmailTransporter = EMAIL_ENABLED && !USE_SENDGRID_API && process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    })
  : null;

/**
 * Generates a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends an email verification code to the parent's email address
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationCode: string
): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('[EmailVerification] Email notifications disabled');
    return false;
  }

  if (!email || !email.includes('@')) {
    console.warn('[EmailVerification] Invalid email address provided');
    return false;
  }

  const subject = 'Verify Your Email - Benedicto College Parent Portal';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #831843); padding: 20px; text-align: center;">
        <h1 style="color: #f8c22e; margin: 0;">Benedicto College</h1>
        <p style="color: white; margin: 5px 0;">Parent Portal Registration</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${name}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for registering with the Benedicto College Parent Portal. 
          To complete your registration, please verify your email address using the code below:
        </p>
        
        <div style="background: white; border: 2px solid #1e3a8a; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your Verification Code</p>
          <p style="font-size: 36px; font-weight: bold; color: #1e3a8a; letter-spacing: 8px; margin: 0;">
            ${verificationCode}
          </p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          <strong>This code will expire in 15 minutes.</strong> If you didn't request this verification, 
          please ignore this email.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Benedicto College RFID Attendance System.
          <br>If you have any questions, please contact the school administration.
        </p>
      </div>
      
      <div style="background: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Benedicto College. All rights reserved.</p>
      </div>
    </div>
  `;

  const textBody = 
    `Benedicto College - Email Verification\n\n` +
    `Welcome, ${name}!\n\n` +
    `Thank you for registering with the Benedicto College Parent Portal.\n` +
    `To complete your registration, please verify your email address using the code below:\n\n` +
    `Verification Code: ${verificationCode}\n\n` +
    `This code will expire in 15 minutes.\n\n` +
    `If you didn't request this verification, please ignore this email.\n\n` +
    `This is an automated message from the RFID Attendance System.`;

  try {
    if (USE_SENDGRID_API) {
      // Use SendGrid Web API (production)
      console.log(`[EmailVerification] Sending via SendGrid Web API to ${email}`);
      
      await sgMail.send({
        to: email,
        from: process.env.SMTP_FROM || 'noreply@school.com',
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[EmailVerification] ✓ Verification email sent to ${email}`);
      return true;
    } else if (gmailTransporter) {
      // Use Gmail SMTP (local development)
      console.log(`[EmailVerification] Sending via Gmail SMTP to ${email}`);
      
      await gmailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"Benedicto College" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[EmailVerification] ✓ Verification email sent to ${email}`);
      return true;
    } else {
      console.error('[EmailVerification] No email transporter configured');
      return false;
    }
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    console.error(`[EmailVerification] ✗ Failed to send to ${email}: ${errorMsg}`);
    return false;
  }
}


/**
 * Sends a password reset code to the parent's email address
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetCode: string
): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('[PasswordReset] Email notifications disabled');
    return false;
  }

  if (!email || !email.includes('@')) {
    console.warn('[PasswordReset] Invalid email address provided');
    return false;
  }

  const subject = 'Reset Your Password - Benedicto College Parent Portal';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #831843); padding: 20px; text-align: center;">
        <h1 style="color: #f8c22e; margin: 0;">Benedicto College</h1>
        <p style="color: white; margin: 5px 0;">Password Reset Request</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello, ${name}</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for the Benedicto College Parent Portal. 
          Use the code below to reset your password:
        </p>
        
        <div style="background: white; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your Reset Code</p>
          <p style="font-size: 36px; font-weight: bold; color: #ef4444; letter-spacing: 8px; margin: 0;">
            ${resetCode}
          </p>
        </div>
        
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          <strong>This code will expire in 15 minutes.</strong> If you didn't request this password reset, 
          please ignore this email and your password will remain unchanged.
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from Benedicto College RFID Attendance System.
          <br>If you have any questions, please contact the school administration.
        </p>
      </div>
      
      <div style="background: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Benedicto College. All rights reserved.</p>
      </div>
    </div>
  `;

  const textBody = 
    `Benedicto College - Password Reset\n\n` +
    `Hello, ${name}\n\n` +
    `We received a request to reset your password for the Benedicto College Parent Portal.\n` +
    `Use the code below to reset your password:\n\n` +
    `Reset Code: ${resetCode}\n\n` +
    `This code will expire in 15 minutes.\n\n` +
    `If you didn't request this password reset, please ignore this email.\n\n` +
    `This is an automated message from the RFID Attendance System.`;

  try {
    if (USE_SENDGRID_API) {
      console.log(`[PasswordReset] Sending via SendGrid Web API to ${email}`);
      
      await sgMail.send({
        to: email,
        from: process.env.SMTP_FROM || 'noreply@school.com',
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[PasswordReset] ✓ Password reset email sent to ${email}`);
      return true;
    } else if (gmailTransporter) {
      console.log(`[PasswordReset] Sending via Gmail SMTP to ${email}`);
      
      await gmailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"Benedicto College" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[PasswordReset] ✓ Password reset email sent to ${email}`);
      return true;
    } else {
      console.error('[PasswordReset] No email transporter configured');
      return false;
    }
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    console.error(`[PasswordReset] ✗ Failed to send to ${email}: ${errorMsg}`);
    return false;
  }
}


/**
 * Sends a welcome email to parents when their child is added to the system
 * Contains RFID tag information and registration link
 */
export async function sendStudentWelcomeEmail(
  parentEmail: string,
  parentName: string,
  studentName: string,
  rfidTag: string,
  registrationUrl: string
): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('[StudentWelcome] Email notifications disabled');
    return false;
  }

  if (!parentEmail || !parentEmail.includes('@')) {
    console.warn('[StudentWelcome] Invalid email address provided');
    return false;
  }

  const subject = 'Welcome to Benedicto College Parent Portal - Student Registered';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #831843); padding: 20px; text-align: center;">
        <h1 style="color: #f8c22e; margin: 0;">Benedicto College</h1>
        <p style="color: white; margin: 5px 0;">RFID Attendance System</p>
      </div>
      
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${parentName}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Your child <strong style="color: #1e3a8a;">${studentName}</strong> has been successfully registered 
          in our RFID Attendance Monitoring System.
        </p>
        
        <div style="background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">📇 Student RFID Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Student Name:</td>
              <td style="padding: 10px 0; color: #1f2937; font-weight: 600; text-align: right;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">RFID Tag ID:</td>
              <td style="padding: 10px 0; color: #1e3a8a; font-weight: 700; text-align: right; font-family: monospace; font-size: 16px;">${rfidTag}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
            <strong>📋 Important:</strong> Please keep this RFID Tag ID safe. You'll need it to register for the Parent Portal 
            and monitor your child's attendance.
          </p>
        </div>
        
        <h3 style="color: #1f2937; margin-top: 30px; font-size: 18px;">🔐 Create Your Parent Account</h3>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
          To monitor your child's attendance in real-time, create your parent account now:
        </p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${registrationUrl}?rfid=${encodeURIComponent(rfidTag)}&email=${encodeURIComponent(parentEmail)}" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981, #059669); 
                    color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            Register Now →
          </a>
        </div>
        
        <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #0c4a6e; margin: 0 0 10px 0; font-size: 15px;">✨ With your Parent Account, you can:</h4>
          <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
            <li>View real-time attendance updates</li>
            <li>Receive instant notifications when your child checks in/out</li>
            <li>Access attendance history and reports</li>
            <li>Monitor your child's school attendance patterns</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 13px; margin-top: 30px; line-height: 1.6;">
          <strong>Need Help?</strong><br>
          If you have any questions or need assistance, please contact the school administration.
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          This is an automated message from Benedicto College RFID Attendance System.
        </p>
      </div>
      
      <div style="background: #1f2937; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Benedicto College. All rights reserved.</p>
      </div>
    </div>
  `;

  const textBody = 
    `Benedicto College - Student Registration Confirmation\n\n` +
    `Welcome, ${parentName}!\n\n` +
    `Your child ${studentName} has been successfully registered in our RFID Attendance Monitoring System.\n\n` +
    `STUDENT RFID INFORMATION\n` +
    `========================\n` +
    `Student Name: ${studentName}\n` +
    `RFID Tag ID: ${rfidTag}\n\n` +
    `IMPORTANT: Please keep this RFID Tag ID safe. You'll need it to register for the Parent Portal.\n\n` +
    `CREATE YOUR PARENT ACCOUNT\n` +
    `==========================\n` +
    `To monitor your child's attendance in real-time, register here:\n` +
    `${registrationUrl}?rfid=${encodeURIComponent(rfidTag)}&email=${encodeURIComponent(parentEmail)}\n\n` +
    `With your Parent Account, you can:\n` +
    `- View real-time attendance updates\n` +
    `- Receive instant notifications\n` +
    `- Access attendance history\n` +
    `- Monitor attendance patterns\n\n` +
    `Need Help? Contact the school administration.\n\n` +
    `This is an automated message from Benedicto College RFID Attendance System.`;

  try {
    if (USE_SENDGRID_API) {
      console.log(`[StudentWelcome] Sending via SendGrid Web API to ${parentEmail}`);
      
      await sgMail.send({
        to: parentEmail,
        from: process.env.SMTP_FROM || 'noreply@school.com',
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[StudentWelcome] ✓ Welcome email sent to ${parentEmail} for student ${studentName}`);
      return true;
    } else if (gmailTransporter) {
      console.log(`[StudentWelcome] Sending via Gmail SMTP to ${parentEmail}`);
      
      await gmailTransporter.sendMail({
        from: process.env.SMTP_FROM || `"Benedicto College" <${process.env.SMTP_USER}>`,
        to: parentEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });
      
      console.log(`[StudentWelcome] ✓ Welcome email sent to ${parentEmail} for student ${studentName}`);
      return true;
    } else {
      console.error('[StudentWelcome] No email transporter configured');
      return false;
    }
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    console.error(`[StudentWelcome] ✗ Failed to send to ${parentEmail}: ${errorMsg}`);
    return false;
  }
}
