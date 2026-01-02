import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify email configuration
transporter.verify((error) => {
  if (error) {
    console.log('❌ Email service not configured:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

// Email templates
const emailTemplates = {
  welcome: (username, verificationUrl) => ({
    subject: 'Welcome to AlgoEdge!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to AlgoEdge!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>Thank you for joining AlgoEdge - Your Automated Trading Platform!</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #6b7280;">This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (username, resetUrl) => ({
    subject: 'Reset Your Password - AlgoEdge',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #6b7280;">This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>
    `,
  }),

  verificationCode: (username, code, expiryMinutes = 10) => ({
    subject: 'Your AlgoEdge Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verification Code</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: white; border: 3px solid #667eea; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
            </div>
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 16px;">Enter this code to verify your identity</p>
          <p style="margin-top: 30px; color: #ef4444; font-weight: bold; text-align: center;">⏰ This code expires in ${expiryMinutes} minutes</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't request this code, please ignore this email or contact support immediately.
          </p>
          <p style="color: #6b7280; font-size: 12px;">
            For security reasons, never share this code with anyone.
          </p>
        </div>
      </div>
    `,
  }),

  smsVerificationCode: (code, expiryMinutes = 10) => ({
    text: `Your AlgoEdge verification code is: ${code}. Valid for ${expiryMinutes} minutes. Never share this code.`,
  }),

  tradeAlert: (username, trade) => ({
    subject: `Trade ${trade.status === 'open' ? 'Opened' : 'Closed'} - ${trade.pair}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Trade Alert</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>A trade has been ${trade.status === 'open' ? 'opened' : 'closed'} by ${trade.robot}:</p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Pair:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.pair}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.type}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Volume:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.volume}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Open Price:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.open_price}</td>
              </tr>
              ${trade.close_price ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Close Price:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.close_price}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Profit/Loss:</strong></td>
                <td style="padding: 10px; color: ${trade.profit >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                  ${trade.profit >= 0 ? '+' : ''}$${trade.profit?.toFixed(2)}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          <p style="color: #6b7280;">Login to AlgoEdge to view more details.</p>
        </div>
      </div>
    `,
  }),
};

// Generic send mail function - accepts recipient, subject, text, and optional html
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    // Validate required parameters
    if (!to || !subject) {
      throw new Error('Recipient (to) and subject are required');
    }

    // Require at least one content type
    if (!text && !html) {
      throw new Error('At least one of text or html content is required');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || `"AlgoEdge" <${process.env.SMTP_USER}>`,
      to,
      subject,
    };

    // Add content
    if (text) {
      mailOptions.text = text;
    }
    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}: ${subject}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    
    // Log error details only in development mode to avoid exposing sensitive info
    if (process.env.NODE_ENV !== 'production') {
      console.error(`📋 Error details:`, {
        code: error.code,
        command: error.command,
      });
    }
    
    return { success: false, error: error.message };
  }
};

// Send email function (template-based)
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](...data);
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"AlgoEdge" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`✅ Email sent to ${to}: ${emailContent.subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    
    // Log error details only in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error(`📋 Error details:`, {
        code: error.code,
        template: template,
      });
    }
    
    return false;
  }
};

// Generate random 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via email
export const sendVerificationCodeEmail = async (email, username, code, expiryMinutes = 10) => {
  try {
    await sendEmail(email, 'verificationCode', [username, code, expiryMinutes]);
    console.log(`✅ Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send verification code to ${email}:`, error.message);
    return false;
  }
};

// Send verification code via SMS (placeholder - requires SMS service like Twilio)
export const sendVerificationCodeSMS = async (phoneNumber, code, expiryMinutes = 10) => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, just log it
    const message = `Your AlgoEdge verification code is: ${code}. Valid for ${expiryMinutes} minutes. Never share this code.`;
    
    console.log(`📱 SMS would be sent to ${phoneNumber}: ${message}`);
    
    // Example Twilio integration (uncomment and configure when ready):
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error.message);
    return false;
  }
};

export default { 
  sendMail,
  sendEmail, 
  emailTemplates, 
  generateVerificationCode,
  sendVerificationCodeEmail,
  sendVerificationCodeSMS
};
