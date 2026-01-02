# User Onboarding and Admin Approval Flow

## Overview
This document describes the complete user onboarding flow for AlgoEdge, including registration, OTP verification, payment, and admin approval.

## Workflow Steps

### 1. User Registration
**Page:** `/auth/register`
**API:** `POST /api/auth/register`

- User provides:
  - First Name (required)
  - Last Name (required)
  - Email (required)
  - Password (required, min 8 characters)
  - Confirm Password (required)

- Backend:
  - Creates user account with `isVerified = false` and `approvalStatus = 'pending'`
  - Generates auto-incremented username from first and last name
  - Creates default subscription and settings
  - Returns JWT token for immediate session

### 2. OTP Email Verification
**Page:** `/auth/verify-otp`
**APIs:** 
- `POST /api/auth/otp/send` - Send OTP code
- `POST /api/auth/otp/verify` - Verify OTP code

#### Step 2a: Email Confirmation
- User sees their registered email
- Can change email if needed
- Clicks "Send Verification Code"

#### Step 2b: OTP Input
- 6-digit numeric code sent to email (expires in 15 minutes)
- User enters code
- Backend validates code and marks user as verified
- Can resend code if needed

### 3. Payment Instructions
**Page:** `/auth/payment-instructions`

After successful OTP verification:
- User is redirected to payment instructions page
- Shows progress stepper: Email Verified → Payment Required → Admin Approval → Account Active
- Explains payment process via WhatsApp
- "Continue to WhatsApp" button opens WhatsApp chat in new tab
- User completes payment and submits proof via WhatsApp
- Redirects to login page

### 4. Admin Approval
**Page:** `/admin/dashboard`
**API:** `POST /api/admin/users/activate`

Admin panel shows all registered users with:
- Email, Username, Full Name
- Verification Status (Verified/Unverified)
- Approval Status (Pending/Approved/Rejected)
- Payment Status
- Join Date

Admin Actions:
- **Approve:** Activates user account, sets `approvalStatus = 'approved'`, `isActivated = true`
- **Reject:** Blocks user from login, sets `approvalStatus = 'rejected'`, can add rejection reason

### 5. User Login
**Page:** `/auth/login`
**API:** `POST /api/auth/login`

Login Validation:
1. Verify email and password
2. Check if 2FA is enabled (if yes, require 2FA code)
3. **Check approval status:**
   - If `approvalStatus = 'rejected'`: Block login, show rejection reason
   - If `approvalStatus = 'pending'` or `isActivated = false`: Block login, show pending message
   - If `approvalStatus = 'approved'` and `isActivated = true`: Allow login

Only approved users can access the dashboard and trading features.

## Database Schema Changes

### New Fields in Users Table
```sql
-- User approval status: pending, approved, rejected
approval_status VARCHAR(50) DEFAULT 'pending'

-- Reason for rejection (shown to user when blocked)
rejection_reason TEXT
```

### VerificationCode Table
Stores OTP codes for email verification:
- `email`: User's email address
- `code`: 6-digit numeric code
- `type`: 'registration_otp'
- `expiresAt`: Expiration timestamp (15 minutes)
- `used`: Boolean flag to prevent reuse

## Security Considerations

1. **OTP Security:**
   - 6-digit numeric codes
   - 15-minute expiration
   - One-time use (marked as used after verification)
   - Unique constraint on email+type prevents duplicate active codes

2. **Password Security:**
   - Minimum 8 characters required
   - Hashed with bcrypt (12 salt rounds)
   - Never stored in plain text

3. **Login Restrictions:**
   - Rejected users cannot login
   - Pending users cannot access main features
   - Clear error messages guide users through process

4. **Admin Actions:**
   - All admin actions logged in audit_logs table
   - Admin must provide JWT token for authorization
   - Rejection reason helps communicate issues to users

## Environment Variables

Required in `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/algoedge"

# SMTP for sending OTP emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="AlgoEdge <noreply@algoedge.com>"

# WhatsApp URL for payment instructions
NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/your_number"

# App URL for emails
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Testing the Flow

### Manual Testing Steps:

1. **Registration:**
   ```bash
   # Navigate to http://localhost:3000/auth/register
   # Fill in: John, Doe, john.doe@example.com, password123, password123
   # Click "Create Account"
   # Should redirect to /auth/verify-otp
   ```

2. **OTP Verification:**
   ```bash
   # Check email for 6-digit code
   # Or check console logs if email not configured
   # Enter code in verification page
   # Click "Verify Email"
   # Should redirect to /auth/payment-instructions
   ```

3. **Payment Instructions:**
   ```bash
   # Click "Continue to WhatsApp"
   # WhatsApp opens in new tab
   # Complete payment via WhatsApp
   # Return and click "Go to Login"
   ```

4. **Admin Approval:**
   ```bash
   # Login to admin panel at /admin/login
   # See pending user in Users Management tab
   # Click "Approve" to activate user
   # Or click "Reject" and provide reason
   ```

5. **User Login:**
   ```bash
   # If approved: Login successful, redirect to dashboard
   # If rejected: Login blocked with rejection reason
   # If pending: Login blocked, prompt to complete verification/payment
   ```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/otp/send` | POST | Send OTP code to email |
| `/api/auth/otp/verify` | POST | Verify OTP code |
| `/api/auth/login` | POST | Login with email/password |
| `/api/admin/users` | GET | Get all users (admin only) |
| `/api/admin/users/activate` | POST | Approve/reject user (admin only) |

## Troubleshooting

### OTP Not Received
- Check SMTP configuration in `.env`
- Verify email service credentials
- Check spam/junk folder
- Look for OTP in console logs (development mode)

### User Cannot Login
- Verify email is confirmed (OTP verified)
- Check approval status in admin panel
- If rejected, check rejection reason
- Ensure payment proof was submitted

### Admin Cannot Approve
- Verify admin is logged in with admin token
- Check `isAdmin` flag in user record
- Ensure JWT token is valid

## Future Enhancements

1. Email notification when user is approved/rejected
2. Multiple payment method support
3. Automatic payment verification integration
4. SMS OTP as alternative to email
5. Rate limiting on OTP sending
6. Account recovery for rejected users

---
**Last Updated:** January 2, 2026
**Version:** 1.0
