# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
- [ ] `SMS_ACTIVATE_API_KEY` set with valid API key
- [ ] `FIVESIM_API_KEY` set (optional but recommended)
- [ ] `ADMIN_SETUP_SECRET` set securely
- [ ] All Supabase env vars auto-configured via integration
- [ ] `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` removed or set to production domain
- [ ] `RESEND_API_KEY` or `SENDGRID_API_KEY` set (optional, for email notifications)

### 2. Database
- [ ] All migration scripts executed successfully (001-110)
- [ ] Seed scripts executed (100-103)
- [ ] RLS policies verified on all tables
- [ ] Admin account created via `/setup-admin`
- [ ] Payment method configured with real bank details in admin panel
- [ ] System settings seeded with profit margin

### 3. Security
- [ ] `/setup-admin` page DELETED after admin creation
- [ ] Service Role Key never exposed to client
- [ ] Google OAuth configured (if using) - redirect URLs updated
- [ ] CORS settings reviewed
- [ ] Rate limiting considered (manual implementation needed)
- [ ] Password reset flow tested

### 4. Testing
- [ ] Auth flow tested (email/password + Google OAuth + forgot password)
- [ ] Rental flow tested end-to-end
- [ ] Payment deposit created and tested
- [ ] Admin panel accessible with admin account
- [ ] Balance deduction works correctly
- [ ] Transaction records created properly
- [ ] OTP check polling works
- [ ] Failover SMS-Activate → 5sim tested
- [ ] Notification system working (in-app notifications)
- [ ] Password reset emails received

### 5. Configuration
- [ ] Profit margin set in system_settings (default: 20%)
- [ ] Service prices synced via admin panel
- [ ] Services and countries seeded
- [ ] Payment method logo URLs working
- [ ] Bank account details updated in payment methods
- [ ] Email SMTP configured in Supabase (see EMAIL_CONFIGURATION.md)
- [ ] Email templates customized in Supabase dashboard

## During Deployment

### 1. Vercel Setup
- [ ] Project connected to GitHub repo
- [ ] Supabase integration connected
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node.js version: 18.x or higher

### 2. Domain Configuration
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate auto-provisioned
- [ ] Redirect www → non-www or vice versa
- [ ] Update Google OAuth redirect URIs to production domain
- [ ] Update Supabase Auth redirect URLs
- [ ] Verify domain for email service (if using custom SMTP)

## Post-Deployment

### 1. Verification
- [ ] Homepage loads correctly with new landing page
- [ ] Auth endpoints working (`/auth/login`, `/auth/signup`, `/auth/forgot-password`)
- [ ] Dashboard accessible for logged-in users
- [ ] Admin panel accessible for admin users (`/admin/*`)
- [ ] Rental creation works
- [ ] Deposit creation works
- [ ] Notifications appearing in notification center
- [ ] Password reset emails received and working

### 2. Admin Configuration
- [ ] Login to admin panel
- [ ] Navigate to "Phương thức thanh toán"
- [ ] Update bank account details:
  - Mã ngân hàng (e.g., MB, VCB, TCB)
  - Số tài khoản (real bank account number)
  - Tên chủ tài khoản (account holder name)
- [ ] Test VietQR generation with updated details
- [ ] Navigate to "Cài đặt"
- [ ] Adjust profit margin if needed
- [ ] Sync prices to apply new margin

### 3. Monitoring
- [ ] Set up error tracking (Sentry recommended)
- [ ] Monitor Vercel logs for errors
- [ ] Check Supabase database performance
- [ ] Monitor API quota for SMS-Activate/5sim
- [ ] Check email delivery rates (if configured)
- [ ] Monitor notification delivery

### 4. Documentation
- [ ] Share admin credentials securely
- [ ] Document manual deposit approval process
- [ ] Create user guide (optional)
- [ ] Set up support channels
- [ ] Document email configuration (see EMAIL_CONFIGURATION.md)

## Known Limitations

1. **Manual Payment Verification**: Admin must manually approve deposits via admin panel
2. **No Rate Limiting**: APIs vulnerable to abuse without rate limiting
3. **Debug Logs**: Some console.log statements present in production
4. **No Webhook**: Payment verification not automated (requires manual approval)
5. **Email Service**: Using Supabase default emails unless custom SMTP configured

## Security Reminders

- **NEVER** commit `.env` or `.env.local` files
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- **ALWAYS** use RLS policies for database access
- **DELETE** `/setup-admin` page after creating admin account
- **ROTATE** `ADMIN_SETUP_SECRET` after initial setup
- **USE** strong passwords for admin accounts

## Future Improvements

- [ ] Implement automatic payment verification via webhook
- [ ] Add rate limiting middleware
- [ ] Remove debug console.log statements
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Implement custom email service (SendGrid/Resend)
- [ ] Send email notifications for deposits, rentals, refunds
- [ ] Add CAPTCHA to prevent bot abuse
- [ ] Create public API documentation
- [ ] Add admin dashboard analytics charts
- [ ] Implement real-time notifications (WebSockets/Server-Sent Events)

## Quick Start After Deployment

1. **Create Admin Account**
   - Visit `https://yourdomain.com/setup-admin`
   - Enter admin email, password, and `ADMIN_SETUP_SECRET`
   - Click "Create Admin Account"
   - **DELETE** `/app/setup-admin/page.tsx` file immediately

2. **Configure Payment Methods**
   - Login to admin panel
   - Go to "Phương thức thanh toán"
   - Edit VietQR payment method
   - Update with real bank details

3. **Sync Prices**
   - Go to "Cài đặt"
   - Adjust profit margin if needed
   - Click "Đồng bộ giá ngay"

4. **Test End-to-End**
   - Create user account
   - Create deposit
   - Approve deposit as admin
   - Rent a phone number
   - Check OTP

5. **Configure Email (Optional)**
   - Follow `EMAIL_CONFIGURATION.md`
   - Setup SMTP in Supabase dashboard
   - Test email delivery

## Support Contacts

- **Supabase Issues**: https://supabase.com/support
- **Vercel Issues**: https://vercel.com/help
- **SMS-Activate**: https://sms-activate.org/en/api2
- **5sim**: https://5sim.net/docs
