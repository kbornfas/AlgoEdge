# AlgoEdge Admin Quick Reference

## 🔑 Admin Access

**Login URL**: `https://your-domain.vercel.app/admin/login`

**Default Credentials**:
- Email: `kbonface03@gmail.com` (or your configured ADMIN_EMAIL)
- Password: `BRBros@1234` (or your configured ADMIN_PASSWORD)

⚠️ **IMPORTANT**: Change the default password immediately after first login!

---

## 📊 Admin Dashboard Overview

### Main Features

1. **User Management**
   - View all registered users
   - Activate/deactivate accounts
   - View user payment status
   - Search and filter users

2. **Payment Proof Review**
   - Review submitted payment proofs
   - Approve or reject submissions
   - Add review notes
   - View submission history

3. **Statistics**
   - Total users
   - Pending payments
   - Active users
   - Revenue tracking

---

## 👥 User Management

### View All Users
1. Navigate to Admin Dashboard
2. Click "Users" tab
3. See list of all registered users

### User Status Indicators
- 🟢 **Green Badge** - Account activated and verified
- 🟡 **Yellow Badge** - Payment pending review
- 🔴 **Red Badge** - Account not activated
- ✅ **Checkmark** - Email verified

### Activate a User Manually
1. Find user in list
2. Click "Activate" button
3. User will receive activation email
4. User can now access trading features

### Deactivate a User
1. Find user in list
2. Click "Deactivate" button
3. User loses access to trading features
4. User can resubmit payment proof

### Search Users
- Search by email, username, or full name
- Filter by status (activated, pending, all)
- Use pagination for large user lists

---

## 💰 Payment Proof Management

### Review Payment Proofs

#### Step-by-Step Process:
1. Go to "Payment Proofs" tab
2. See list of pending submissions
3. Click on a proof to view details
4. Review payment screenshot/proof
5. Choose action:
   - **Approve**: User gets activated automatically
   - **Reject**: User can resubmit with notes

#### What to Check:
- ✅ Payment amount matches subscription plan
- ✅ Transaction date is recent
- ✅ Receipt shows payment to correct account
- ✅ Screenshot is clear and readable
- ✅ No signs of tampering or editing

### Approve Payment
1. Click "Approve" button
2. Add optional approval note
3. Confirm action
4. User is automatically activated
5. User receives activation email

### Reject Payment
1. Click "Reject" button
2. **Required**: Add rejection reason
   - Example: "Payment amount incorrect"
   - Example: "Receipt unclear, please resubmit"
   - Example: "Payment not received in account"
3. Confirm action
4. User receives rejection email with notes
5. User can resubmit payment proof

### Payment Status Types
- **Pending** - Awaiting admin review
- **Approved** - Payment verified, user activated
- **Rejected** - Payment rejected, user can resubmit

---

## 🤖 Robot Management

### View All Trading Robots
- See all 10 trading robots
- View robot performance statistics
- Check robot activation status

### Robot Information Displayed
- Robot name and strategy
- Timeframe (M1, M5, M15, H1, H4, D1)
- Win rate percentage
- Risk level
- Number of active users

---

## 📧 Email Management

### Automatic Emails Sent by System

1. **Welcome Email** - After user registration
2. **Email Verification** - With verification link
3. **Account Activation** - After payment approval
4. **Payment Rejection** - When payment is rejected
5. **Password Reset** - When requested by user

### Manual Email Actions
- Resend verification email (if requested)
- Contact user via their registered email

---

## 🔒 Security Best Practices

### Admin Account Security

1. **Change Default Password**
   ```
   First login → Settings → Change Password
   ```

2. **Enable 2FA** (if available)
   ```
   Settings → Security → Enable Two-Factor Authentication
   ```

3. **Regular Password Updates**
   - Change password every 90 days
   - Use strong, unique passwords
   - Never share admin credentials

### Session Management
- Sessions expire after inactivity
- Always logout when finished
- Don't use public computers

### Audit Trail
- All admin actions are logged
- Review audit logs regularly
- Check for suspicious activity

---

## 📈 Analytics & Reports

### Key Metrics to Monitor

1. **User Growth**
   - New registrations per day/week
   - Activation rate
   - Churn rate

2. **Payment Metrics**
   - Pending payment proofs
   - Average approval time
   - Rejection reasons

3. **Trading Activity**
   - Active robots
   - Total trades
   - User engagement

---

## 🆘 Common Admin Tasks

### Task: Approve Multiple Payments
1. Sort payment proofs by date
2. Review oldest first
3. Process in batches
4. Keep notes of rejection patterns

### Task: Handle User Support Inquiry
1. Find user in user management
2. Check payment status
3. Review submission history
4. Take appropriate action
5. Respond via email or WhatsApp

### Task: Monthly User Report
1. Export user list
2. Filter by activated users
3. Generate statistics
4. Review growth trends

### Task: Handle Disputed Payment
1. Review payment proof carefully
2. Check transaction records
3. Contact user if needed (via email)
4. Make informed decision
5. Document decision reason

---

## 🔧 Troubleshooting

### Can't Login to Admin Panel
- Check email and password spelling
- Verify you're using `/admin/login` not `/auth/login`
- Clear browser cache and cookies
- Try incognito/private window

### Payment Proof Image Won't Load
- Check your internet connection
- Try refreshing the page
- Image may be corrupted (reject and ask for resubmit)
- Check browser console for errors

### User Says They Paid But No Proof Submitted
- Ask user to submit proof via payment proof page
- Provide direct link: `/payment-proof`
- Guide them through submission process
- Check if proof is in rejected status

### Email Notifications Not Sending
- This is a system issue, not admin panel
- Contact technical support
- Check SMTP configuration
- Verify in system logs

---

## 📱 Contact & Support

### For Technical Issues
- Email: kbonface03@gmail.com
- Check TROUBLESHOOTING.md
- Review system logs

### For User Support
- WhatsApp: Use configured number
- Instagram: Use configured account
- Email: Support email address

### For Platform Issues
- Vercel Dashboard: Check deployment logs
- Database: Check connection status
- API: Monitor API routes

---

## ⚡ Quick Actions

### Daily Tasks
- [ ] Review pending payment proofs
- [ ] Check new user registrations
- [ ] Monitor system health
- [ ] Respond to user inquiries

### Weekly Tasks
- [ ] Generate user statistics
- [ ] Review audit logs
- [ ] Check robot performance
- [ ] Update payment information if needed

### Monthly Tasks
- [ ] Generate comprehensive reports
- [ ] Review security settings
- [ ] Update admin documentation
- [ ] Plan system improvements

---

## 🎯 Tips for Efficient Admin Work

1. **Set a Schedule**: Review payments at same time daily
2. **Be Consistent**: Apply same standards to all reviews
3. **Document Decisions**: Always add notes for rejections
4. **Fast Response**: Try to review within 24 hours
5. **Clear Communication**: Rejection notes should be helpful
6. **Stay Organized**: Use filters and search effectively
7. **Monitor Trends**: Watch for patterns in submissions

---

## 📋 Admin Checklist

### First Time Setup
- [ ] Login with default credentials
- [ ] Change admin password
- [ ] Review all users
- [ ] Check pending payments
- [ ] Familiarize with dashboard
- [ ] Test approval process
- [ ] Test rejection process
- [ ] Update contact information

### Before Each Session
- [ ] Check for pending tasks
- [ ] Review new submissions
- [ ] Check user inquiries
- [ ] Monitor system status

### After Each Session
- [ ] Clear completed tasks
- [ ] Logout properly
- [ ] Document any issues
- [ ] Update task list

---

**Remember**: You're the gatekeeper to the trading platform. Fair and timely reviews keep users happy and maintain platform integrity.

For detailed technical documentation, see README.md and DEPLOYMENT_GUIDE.md.
