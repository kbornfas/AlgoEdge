# Email Service Usage Examples

This document provides examples of how to use the email service utility in the AlgoEdge backend.

## Import the Email Service

```javascript
import { sendMail, sendEmail } from '../services/emailService.js';
```

## Basic Usage - Generic sendMail Function

### Send Plain Text Email

```javascript
const result = await sendMail({
  to: 'user@example.com',
  subject: 'Account Update',
  text: 'Your account has been updated successfully.'
});

if (result.success) {
  console.log('Email sent! Message ID:', result.messageId);
} else {
  console.error('Failed to send email:', result.error);
}
```

### Send HTML Email

```javascript
const result = await sendMail({
  to: 'user@example.com',
  subject: 'Welcome to AlgoEdge',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>Welcome!</h1>
      <p>Thank you for joining AlgoEdge.</p>
      <a href="https://algoedge.com/dashboard">Go to Dashboard</a>
    </div>
  `
});
```

### Send Email with Both Text and HTML

```javascript
const result = await sendMail({
  to: 'user@example.com',
  subject: 'Trading Alert',
  text: 'Your trade has been executed. Check your dashboard for details.',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Trade Executed</h2>
      <p>Your trade has been executed.</p>
      <p><a href="https://algoedge.com/dashboard">View Details</a></p>
    </div>
  `
});
```

## Using Pre-built Templates

The email service includes pre-built templates for common use cases:

### Welcome Email

```javascript
import { sendEmail } from '../services/emailService.js';

await sendEmail(
  'user@example.com',
  'welcome',
  [username, verificationUrl]
);
```

### Password Reset Email

```javascript
await sendEmail(
  'user@example.com',
  'passwordReset',
  [username, resetUrl]
);
```

### Verification Code Email

```javascript
await sendEmail(
  'user@example.com',
  'verificationCode',
  [username, '123456', 10] // code and expiry in minutes
);
```

### Trade Alert Email

```javascript
const tradeData = {
  status: 'closed',
  pair: 'EUR/USD',
  type: 'BUY',
  volume: 0.1,
  open_price: 1.0850,
  close_price: 1.0875,
  profit: 25.00,
  robot: 'Scalper Pro M1'
};

await sendEmail(
  'user@example.com',
  'tradeAlert',
  [username, tradeData]
);
```

## Error Handling

The `sendMail` function returns a structured response:

```javascript
const result = await sendMail({
  to: 'user@example.com',
  subject: 'Test',
  text: 'Test email'
});

if (result.success) {
  // Email sent successfully
  console.log('Message ID:', result.messageId);
} else {
  // Error occurred
  console.error('Error:', result.error);
  // Handle error appropriately
}
```

## Validation Rules

The `sendMail` function validates parameters:

- `to` (required): Recipient email address
- `subject` (required): Email subject line
- `text` or `html` (at least one required): Email content

Example of validation errors:

```javascript
// Missing required parameters
const result1 = await sendMail({});
// Returns: { success: false, error: 'Recipient (to) and subject are required' }

// Missing content
const result2 = await sendMail({
  to: 'user@example.com',
  subject: 'Test'
});
// Returns: { success: false, error: 'At least one of text or html content is required' }
```

## Environment Variables

Make sure these variables are configured in your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="AlgoEdge <noreply@algoedge.com>"
```

## Production Considerations

1. **Error Logging**: Detailed error information is only logged in development mode
2. **Return Values**: Always check the `success` property in the returned object
3. **Error Messages**: The `error` property contains user-friendly error messages
4. **Message IDs**: Store the `messageId` for tracking and debugging

## Common Use Cases

### 1. User Notifications

```javascript
async function notifyUserOfPaymentApproval(userId, userEmail, username) {
  const result = await sendMail({
    to: userEmail,
    subject: 'Payment Approved - Account Activated',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Congratulations!</h2>
        <p>Hi ${username},</p>
        <p>Your payment has been approved and your account is now active.</p>
        <p>You can now access all trading features.</p>
        <a href="https://algoedge.com/dashboard/robots">View Trading Robots</a>
      </div>
    `,
    text: `Hi ${username}, Your payment has been approved and your account is now active.`
  });

  return result.success;
}
```

### 2. Admin Notifications

```javascript
async function notifyAdminOfNewPayment(adminEmail, username, amount) {
  const result = await sendMail({
    to: adminEmail,
    subject: 'New Payment Proof Submitted',
    html: `
      <div>
        <h3>New Payment Proof</h3>
        <p><strong>User:</strong> ${username}</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><a href="https://algoedge.com/admin">Review Payment</a></p>
      </div>
    `,
    text: `New payment proof from ${username} for $${amount}`
  });

  return result.success;
}
```

### 3. Trading Alerts

```javascript
async function sendTradeNotification(userEmail, username, tradeDetails) {
  const result = await sendMail({
    to: userEmail,
    subject: `Trade ${tradeDetails.status} - ${tradeDetails.pair}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Trade ${tradeDetails.status === 'open' ? 'Opened' : 'Closed'}</h2>
        <p>Hi ${username},</p>
        <table>
          <tr><td>Pair:</td><td>${tradeDetails.pair}</td></tr>
          <tr><td>Type:</td><td>${tradeDetails.type}</td></tr>
          <tr><td>Volume:</td><td>${tradeDetails.volume}</td></tr>
          <tr><td>Price:</td><td>${tradeDetails.price}</td></tr>
        </table>
      </div>
    `
  });

  return result.success;
}
```

## Testing

To test the email service without sending actual emails, you can use a test SMTP server like Ethereal:

```javascript
// Development/Testing setup
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'test@ethereal.email',
    pass: 'test-password'
  }
});
```

---

**Note**: Always test email functionality in a development environment before deploying to production.
