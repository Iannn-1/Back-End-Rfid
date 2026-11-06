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
