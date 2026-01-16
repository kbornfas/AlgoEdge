import nodemailer from 'nodemailer';

// Constants for email styling and configuration
const BRAND_PRIMARY_COLOR = '#10B981';
const BRAND_SECONDARY_COLOR = '#8B5CF6';
const SUCCESS_COLOR = '#10B981';
const ERROR_COLOR = '#EF4444';
const WHATSAPP_GREEN = '#25D366';

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using configured SMTP service
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'AlgoEdge <noreply@algoedge.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send verification email with token link
 */
export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AlgoEdge!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10B981; margin-top: 0;">Hi ${username}!</h2>
          <p>Thank you for registering with AlgoEdge. Please verify your email address to get started with automated trading.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #10B981; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your AlgoEdge Account',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10B981; margin-top: 0;">Hi ${username}!</h2>
          <p>We received a request to reset your AlgoEdge account password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link into your browser:</p>
          <p style="color: #10B981; word-break: break-all; font-size: 14px;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your AlgoEdge Password',
    html,
  });
}

/**
 * Send OTP verification code email
 */
export async function sendOTPEmail(
  email: string,
  username: string,
  code: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10B981; margin-top: 0;">Hi ${username}!</h2>
          <p>Thank you for registering with AlgoEdge. Please use the verification code below to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 8px; border: 2px solid #10B981;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10B981;">${code}</span>
            </div>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">Enter this code in the verification page to continue.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This code will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">If you didn't create an account, please ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Your AlgoEdge Verification Code',
    html,
  });
}

/**
 * Send trade alert email
 */
export async function sendTradeAlertEmail(
  email: string,
  username: string,
  tradeData: {
    pair: string;
    type: string;
    profit: number;
    status: string;
  }
): Promise<void> {
  const profitColor = tradeData.profit >= 0 ? '#10B981' : '#EF4444';
  const profitSign = tradeData.profit >= 0 ? '+' : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Trade ${tradeData.status === 'closed' ? 'Closed' : 'Alert'}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10B981; margin-top: 0;">Hi ${username}!</h2>
          <p>Your trade has been ${tradeData.status}.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Pair:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${tradeData.pair}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${tradeData.type}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${tradeData.status}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Profit/Loss:</strong></td>
                <td style="padding: 10px; text-align: right; color: ${profitColor}; font-weight: bold; font-size: 18px;">
                  ${profitSign}$${tradeData.profit.toFixed(2)}
                </td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #10B981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Dashboard</a>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">You're receiving this because you have trade alerts enabled in your AlgoEdge settings.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Trade Alert: ${tradeData.pair} ${tradeData.status}`,
    html,
  });
}
