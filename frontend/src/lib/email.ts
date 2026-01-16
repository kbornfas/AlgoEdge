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

/**
 * Send account approval email to user
 */
export async function sendAccountApprovedEmail(
  email: string,
  username: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
  const approvalDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header with celebration -->
              <tr>
                <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 50px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 15px;">🎉</div>
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Account Approved!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 16px;">Welcome to the AlgoEdge trading family</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${username},</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Great news! Your AlgoEdge account has been <strong style="color: #10B981;">approved</strong> by our admin team. You now have full access to our automated trading platform.
                  </p>
                  
                  <!-- What you can do now -->
                  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🚀 What You Can Do Now:</h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10B981; font-size: 18px; margin-right: 10px;">✓</span>
                          <span style="color: #374151; font-size: 15px;">Connect your MT5 trading accounts</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10B981; font-size: 18px; margin-right: 10px;">✓</span>
                          <span style="color: #374151; font-size: 15px;">Configure and activate trading robots</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10B981; font-size: 18px; margin-right: 10px;">✓</span>
                          <span style="color: #374151; font-size: 15px;">Monitor your trades in real-time</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10B981; font-size: 18px; margin-right: 10px;">✓</span>
                          <span style="color: #374151; font-size: 15px;">Access detailed performance analytics</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #10B981; font-size: 18px; margin-right: 10px;">✓</span>
                          <span style="color: #374151; font-size: 15px;">Enable notifications via Email & Telegram</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${loginUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                      Login to Your Account →
                    </a>
                  </div>

                  <!-- Getting Started Tips -->
                  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">💡 Quick Start Guide</h4>
                    <ol style="color: #78350f; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                      <li>Log in to your dashboard</li>
                      <li>Navigate to <strong>MT5 Accounts</strong> and connect your trading account</li>
                      <li>Go to <strong>Robots</strong> and configure your preferred trading robot</li>
                      <li>Enable the robot and watch it trade automatically!</li>
                    </ol>
                  </div>

                  <!-- Account Details -->
                  <div style="background-color: #f9fafb; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #e5e7eb;">
                    <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 15px; font-weight: 600;">Your Account Details:</h4>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Username:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status:</td>
                        <td style="padding: 8px 0;">
                          <span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">✓ Approved</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Approved On:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${approvalDate}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Support -->
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    Need help getting started? Our support team is here for you! Reach out at 
                    <a href="mailto:support@algoedge.com" style="color: #10B981; text-decoration: none; font-weight: 500;">support@algoedge.com</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #10B981; font-size: 18px; font-weight: 700; margin: 0 0 5px 0;">AlgoEdge</p>
                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 15px 0;">
                    Automated Trading Platform | Built for Traders
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} AlgoEdge. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🎉 Your AlgoEdge Account Has Been Approved!',
    html,
  });
}

/**
 * Send account rejection email to user
 */
export async function sendAccountRejectedEmail(
  email: string,
  username: string,
  reason?: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 50px 30px; text-align: center;">
                  <div style="font-size: 64px; margin-bottom: 15px;">⚠️</div>
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Account Application Update</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${username},</h2>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Thank you for your interest in AlgoEdge. After reviewing your account application, we regret to inform you that we are unable to approve your account at this time.
                  </p>
                  
                  ${reason ? `
                  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h4 style="color: #991b1b; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">Reason:</h4>
                    <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">${reason}</p>
                  </div>
                  ` : ''}

                  <div style="background-color: #f0f9ff; border-radius: 10px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #0369a1; margin: 0 0 10px 0; font-size: 15px; font-weight: 600;">What's Next?</h4>
                    <p style="color: #0c4a6e; font-size: 14px; line-height: 1.6; margin: 0;">
                      If you believe this decision was made in error or would like to provide additional information, please contact our support team. We're happy to review your application again.
                    </p>
                  </div>

                  <div style="text-align: center; margin: 35px 0;">
                    <a href="mailto:support@algoedge.com" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      Contact Support
                    </a>
                  </div>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                    We appreciate your understanding and hope to serve you in the future.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                    © ${new Date().getFullYear()} AlgoEdge. All rights reserved.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    Automated Trading Platform | Built for Traders
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '⚠️ AlgoEdge Account Application Update',
    html,
  });
}
