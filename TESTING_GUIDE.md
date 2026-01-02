# Manual Testing Guide for User Onboarding Flow

This guide provides step-by-step instructions for manually testing the complete user onboarding and admin approval flow.

## Prerequisites

1. **Database Setup:**
   ```bash
   # Ensure PostgreSQL is running
   # Copy .env.example to .env and configure DATABASE_URL
   
   # Run migrations
   npm run prisma:migrate
   
   # Or push schema changes
   npm run prisma:push
   ```

2. **Email Configuration:**
   ```bash
   # In .env file, configure SMTP settings:
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="AlgoEdge <noreply@algoedge.com>"
   ```

3. **WhatsApp URL:**
   ```bash
   # In .env file:
   NEXT_PUBLIC_WHATSAPP_URL="https://wa.me/1234567890"
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   # Server should start on http://localhost:3000
   ```

## Test Scenario 1: Successful User Registration and Approval

### Step 1: User Registration
1. Navigate to `http://localhost:3000/auth/register`
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"

**Expected Result:**
- Success message appears
- Redirected to `/auth/verify-otp`
- User stored in database with:
  - `isVerified = false`
  - `approvalStatus = 'pending'`
  - `isActivated = false`

**Verification:**
```sql
SELECT id, email, username, "isVerified", "approvalStatus", "isActivated" 
FROM users 
WHERE email = 'john.doe@example.com';
```

### Step 2: Email Confirmation Page
1. Should see email address displayed
2. Email field is editable
3. Click "Send Verification Code"

**Expected Result:**
- Loading indicator appears
- Success message: "Verification code sent to your email!"
- UI changes to show OTP input field
- Email sent with 6-digit code

**Verification:**
```sql
SELECT email, code, type, "expiresAt", used 
FROM verification_codes 
WHERE email = 'john.doe@example.com' AND type = 'registration_otp';
```

### Step 3: OTP Verification
1. Check email inbox for OTP code
2. Enter the 6-digit code
3. Click "Verify Email"

**Expected Result:**
- Loading indicator appears
- Success message: "Email verified successfully!"
- After 2 seconds, redirected to `/auth/payment-instructions`
- User's `isVerified` updated to `true` in database

**Verification:**
```sql
SELECT id, email, "isVerified" 
FROM users 
WHERE email = 'john.doe@example.com';

SELECT used FROM verification_codes 
WHERE email = 'john.doe@example.com' AND type = 'registration_otp';
```

### Step 4: Payment Instructions
1. Should see progress stepper showing current step
2. Payment instructions displayed
3. "Continue to WhatsApp" button visible

**Expected Result:**
- Click button opens WhatsApp in new tab
- After 3 seconds, redirected to `/auth/login`

### Step 5: Login Attempt (Before Approval)
1. Navigate to `/auth/login`
2. Enter:
   - Email: `john.doe@example.com`
   - Password: `password123`
3. Click "Sign In"

**Expected Result:**
- Error message: "Account not activated. Please complete email verification, submit payment proof, and wait for admin approval."
- Login blocked
- No redirect

### Step 6: Admin Approval
1. Login to admin panel at `/admin/login` with admin credentials
2. Navigate to Users Management tab
3. Find user `john.doe@example.com`
4. Should see:
   - Verified: ✓
   - Status: pending
   - Payment: pending
   - "Approve" button visible

5. Click "Approve" button

**Expected Result:**
- User status updates to "Active"
- Approval status shows "approved"
- Payment status shows "approved"
- Database updated:
  - `isActivated = true`
  - `approvalStatus = 'approved'`
  - `paymentStatus = 'approved'`
  - `activatedAt` set to current timestamp

**Verification:**
```sql
SELECT id, email, "isActivated", "approvalStatus", "paymentStatus", "activatedAt" 
FROM users 
WHERE email = 'john.doe@example.com';

SELECT action, details 
FROM audit_logs 
WHERE action = 'USER_APPROVED' 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

### Step 7: Login After Approval
1. Return to `/auth/login`
2. Enter:
   - Email: `john.doe@example.com`
   - Password: `password123`
3. Click "Sign In"

**Expected Result:**
- Login successful
- Redirected to `/dashboard`
- User has full access to all features

## Test Scenario 2: User Rejection

### Step 1: Register Another User
1. Register with email `jane.smith@example.com`
2. Complete OTP verification

### Step 2: Admin Rejection
1. Login to admin panel
2. Find user `jane.smith@example.com`
3. Click "Reject" button (shown as red "X")
4. Rejection dialog appears
5. Enter rejection reason: "Invalid payment proof"
6. Click "Reject User"

**Expected Result:**
- User disappears from pending list or shows as "Rejected"
- Database updated:
  - `approvalStatus = 'rejected'`
  - `rejectionReason = 'Invalid payment proof'`

**Verification:**
```sql
SELECT id, email, "approvalStatus", "rejectionReason" 
FROM users 
WHERE email = 'jane.smith@example.com';
```

### Step 3: Login Attempt After Rejection
1. Try to login with `jane.smith@example.com`
2. Enter correct password

**Expected Result:**
- Login blocked
- Error message: "Invalid payment proof" (the rejection reason)
- User cannot access dashboard

## Test Scenario 3: OTP Expiration and Resend

### Step 1: Wait for OTP to Expire
1. Register new user
2. Send OTP code
3. Wait 16 minutes (OTP expires after 15 minutes)
4. Try to verify with the old code

**Expected Result:**
- Error message: "Verification code has expired. Please request a new code."

### Step 2: Resend OTP
1. Click "Didn't receive the code? Resend"
2. New code sent to email

**Expected Result:**
- New code generated in database
- Previous code remains but is still expired
- New email sent with new code

## Test Scenario 4: Change Email Before OTP

### Step 1: Register User
1. Register with `wrong@example.com`
2. Land on OTP verification page

### Step 2: Change Email
1. See email displayed
2. Modify email field to `correct@example.com`
3. Click "Send Verification Code"

**Expected Result:**
- OTP sent to `correct@example.com`
- User can verify with code sent to new email

## Test Scenario 5: Invalid OTP Code

### Step 1: Enter Wrong Code
1. Register and receive OTP
2. Enter incorrect 6-digit code
3. Click "Verify Email"

**Expected Result:**
- Error message: "Invalid verification code. Please try again."
- Verification fails
- Can retry with correct code

## Test Scenario 6: OTP Reuse Prevention

### Step 1: Use Code Once
1. Register and receive OTP
2. Verify successfully
3. Try to use the same code again

**Expected Result:**
- Code marked as `used = true` in database
- Subsequent attempts fail

## Common Issues and Troubleshooting

### Issue: Email Not Received
**Check:**
- SMTP credentials in .env
- Email service logs
- Spam/junk folder
- Console logs for OTP code (development mode)

### Issue: Build Fails
**Check:**
```bash
npm install
npm run build
```
- Ensure all dependencies installed
- Check for TypeScript errors

### Issue: Database Connection Error
**Check:**
- PostgreSQL is running
- DATABASE_URL in .env is correct
- Run `npm run prisma:generate`

### Issue: WhatsApp URL Not Working
**Check:**
- NEXT_PUBLIC_WHATSAPP_URL is set in .env
- URL format: `https://wa.me/1234567890`
- Not using placeholder `your_number`

## Automated Testing Commands

```bash
# Type checking
npm run build

# Lint code
npm run lint

# Generate Prisma client
npm run prisma:generate

# View database in Prisma Studio
npx prisma studio
```

## Test Data Cleanup

After testing, clean up test users:

```sql
-- Delete test users
DELETE FROM users WHERE email IN (
  'john.doe@example.com',
  'jane.smith@example.com',
  'wrong@example.com',
  'correct@example.com'
);

-- Delete verification codes
DELETE FROM verification_codes WHERE email IN (
  'john.doe@example.com',
  'jane.smith@example.com',
  'wrong@example.com',
  'correct@example.com'
);
```

## Success Criteria

All tests pass when:
- ✅ Users can register with first and last name
- ✅ OTP codes are sent and received
- ✅ OTP verification works correctly
- ✅ Users redirected to WhatsApp for payment
- ✅ Admin can approve users
- ✅ Admin can reject users with reason
- ✅ Approved users can login
- ✅ Rejected users cannot login
- ✅ Pending users cannot login
- ✅ OTP codes expire after 15 minutes
- ✅ OTP codes can be resent
- ✅ Email can be changed before sending OTP
- ✅ All database constraints work
- ✅ Audit logs record admin actions

---
**Last Updated:** January 2, 2026
