/**
 * Notification service for the School Attendance Monitoring System.
 * Sends parent/guardian email notifications when a student scans in or out.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import nodemailer from 'nodemailer';
import { AttendanceLogAttributes, StudentAttributes } from '../types/models';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const EMAIL_ENABLED = process.env.ENABLE_EMAIL === 'true';

// Email transporter (SendGrid for production, Gmail fallback for local)
const emailTransporter = EMAIL_ENABLED
  ? nodemailer.createTransport(
      process.env.SENDGRID_API_KEY
        ? {
            // SendGrid (production)
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY,
            },
            connectionTimeout: 10000, // 10 second timeout
            greetingTimeout: 10000,
          }
        : {
            // Gmail (local development fallback)
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000, // 10 second timeout
            greetingTimeout: 10000,
          }
    )
  : null;

// Log email configuration on startup
if (EMAIL_ENABLED && emailTransporter) {
  if (process.env.SENDGRID_API_KEY) {
    console.log('[Email] ✓ Using SendGrid for production email delivery');
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.log('[Email] ⚠️ Using Gmail SMTP (local development only - will not work on Railway)');
  } else {
    console.log('[Email] ✗ Email enabled but no valid configuration found');
  }
} else {
  console.log('[Email] Email notifications are disabled');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a Date object as "HH:MM AM/PM" (12-hour clock, leading zero for hours).
 */
function formatScanTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours = hours - 12;
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  return `${hh}:${mm} ${period}`;
}

// ---------------------------------------------------------------------------
// Send Email Notification
// ---------------------------------------------------------------------------

async function sendEmail(
  student: StudentAttributes,
  log: AttendanceLogAttributes,
  formattedTime: string,
  retryCount: number = 0
): Promise<boolean> {
  if (!EMAIL_ENABLED || !emailTransporter) {
    console.log('[Email] Email notifications disabled');
    return false;
  }

  if (!student.parent_email || !student.parent_email.includes('@')) {
    console.warn(`[Email] Invalid parent email for student ${student.name}`);
    return false;
  }

  try {
    const subject = `Attendance Alert: ${student.name} ${log.status === 'IN' ? 'Checked In' : 'Checked Out'}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #831843); padding: 20px; text-align: center;">
          <h1 style="color: #f8c22e; margin: 0;">Benedicto College</h1>
          <p style="color: white; margin: 5px 0;">RFID Attendance System</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Attendance Notification</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Student:</td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${student.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Status:</td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">
                <span style="background: ${log.status === 'IN' ? '#d1fae5' : '#fee2e2'}; color: ${log.status === 'IN' ? '#065f46' : '#991b1b'}; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                  ${log.status === 'IN' ? '✓ CHECKED IN' : '← CHECKED OUT'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Time:</td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb; font-weight: bold;">Date:</td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${new Date(log.scan_time).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
          
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
      `Benedicto College - Attendance Notification\n\n` +
      `Student: ${student.name}\n` +
      `Status: ${log.status === 'IN' ? 'CHECKED IN' : 'CHECKED OUT'}\n` +
      `Time: ${formattedTime}\n` +
      `Date: ${new Date(log.scan_time).toDateString()}\n\n` +
      `This is an automated message from the RFID Attendance System.`;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || `"Benedicto College" <${process.env.SMTP_USER}>`,
      to: student.parent_email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[Email] ✓ Sent to ${student.parent_email} for ${student.name}`);
    return true;
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    console.error(`[Email] ✗ Failed to send to ${student.parent_email}: ${errorMsg}`);
    
    // Don't retry timeout errors more than once on production to avoid long delays
    const isTimeout = errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT');
    const maxRetries = isTimeout && process.env.NODE_ENV === 'production' ? 0 : 2;
    
    // Retry logic for transient network errors
    if (retryCount < maxRetries && (isTimeout || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND'))) {
      console.log(`[Email] Retrying... (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return sendEmail(student, log, formattedTime, retryCount + 1);
    }
    
    // Log helpful message for common errors
    if (isTimeout) {
      console.error('[Email] ⚠️ SMTP connection timeout - Gmail SMTP does not work on Railway. Please set up SendGrid (see EMAIL_SETUP_GUIDE.md)');
    }
    
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main: sendParentNotification
// ---------------------------------------------------------------------------

/**
 * Sends an email notification to the student's parent/guardian after an attendance scan.
 *
 * All errors are caught and logged — this function NEVER throws.
 *
 * @param student - The student who scanned in or out
 * @param log     - The attendance log record that was just created
 */
export async function sendParentNotification(
  student: StudentAttributes,
  log: AttendanceLogAttributes,
): Promise<void> {
  try {
    const formattedTime = formatScanTime(log.scan_time);

    console.log(
      `\n[Notification] Processing for ${student.name} (${log.status} at ${formattedTime})`
    );

    const emailSent = await sendEmail(student, log, formattedTime);

    if (emailSent) {
      console.log(`[Notification] ✓ Email sent successfully\n`);
    } else {
      console.log(`[Notification] ✗ Email notification failed\n`);
    }
  } catch (error) {
    console.error('[Notification] Unexpected error:', error);
  }
}
