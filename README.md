# OTP Rental System

Hệ thống thuê số điện thoại ảo nhận OTP chuyên nghiệp, hỗ trợ nhiều dịch vụ và quốc gia.

## Tính năng chính

- 🔐 **Authentication**: Email/Password + Google OAuth 2.0
- 📱 **OTP Rental**: Multi-provider (SMS-Activate, 5sim) với auto-failover
- 💰 **Payment**: VietQR bank transfer integration
- 👨‍💼 **Admin Panel**: Quản lý users, services, pricing với profit margin động
- 📊 **Dashboard**: Theo dõi balance, rental history, transactions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Deployment**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- Vercel account (recommended)
- Supabase project
- SMS-Activate API key
- 5sim API key (optional)

### 2. Environment Variables

Copy `.env.example` to `.env.local` và điền đầy đủ:

```bash
cp .env.example .env.local
```

**Biến bắt buộc:**
- `SMS_ACTIVATE_API_KEY`: Đăng ký tại https://sms-activate.org
- `FIVESIM_API_KEY`: Đăng ký tại https://5sim.net (optional)
- `ADMIN_SETUP_SECRET`: Random string bảo mật cho admin setup

### 3. Database Setup

Chạy các migration scripts theo thứ tự trong folder `scripts/`:

```bash
# Connect to Supabase project and run SQL scripts
# hoặc sử dụng v0 để execute scripts
```

**Thứ tự chạy:**
1. `001_create_profiles_and_users.sql`
2. `002_create_services_and_countries.sql`
3. `003_create_rentals.sql`
4. `004_create_transactions.sql`
5. ... (các scripts khác)
6. `100_seed_services.sql` (seed data)
7. `101_seed_countries.sql`
8. `102_seed_payment_methods.sql`
9. `103_seed_system_settings.sql`

### 4. Tạo Admin Account

Truy cập `/setup-admin` và sử dụng `ADMIN_SETUP_SECRET` để tạo admin đầu tiên.

**Sau khi setup xong, XÓA file `app/setup-admin/page.tsx` để bảo mật!**

### 5. Cấu hình Google OAuth (Optional)

1. Vào Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Thêm Authorized redirect URIs: `https://yourdomain.com/api/auth/callback`

### 6. Cấu hình Payment Method

Cập nhật thông tin ngân hàng thật trong bảng `payment_methods`:

```sql
UPDATE payment_methods 
SET 
  bank_code = 'YOUR_BANK_CODE',
  account_number = 'YOUR_ACCOUNT_NUMBER',
  account_name = 'YOUR_ACCOUNT_NAME'
WHERE provider = 'vietqr';
```

### 7. Run Development

```bash
npm install
npm run dev
```

### 8. Deploy to Production

Push code lên Vercel. Đảm bảo:
- ✅ Tất cả env vars được set trong Vercel dashboard
- ✅ Supabase integration connected
- ✅ Database scripts đã chạy
- ✅ Admin account đã tạo
- ✅ Payment method configured
- ✅ XÓA `/setup-admin` page

## API Flow

### Rental Flow
1. User chọn service + country → Check balance
2. System gọi `rentNumberWithFailover()` → Try SMS-Activate → Fallback 5sim
3. Create rental record + Deduct balance + Create transaction
4. User nhận phone number → Check OTP periodically
5. OTP arrives → Display to user → Complete rental

### Payment Flow
1. User chọn amount + payment method
2. System generate payment code + VietQR URL
3. User scan QR/transfer manually với payment code
4. **Manual verification by admin** (auto-verify coming soon)
5. Admin approve → Add balance + Create transaction

## Admin Functions

- **Dashboard**: Overview stats (users, revenue, rentals)
- **Users**: Manage user accounts, adjust balance
- **Rentals**: Monitor all rental activities
- **Services**: Add/edit services
- **Transactions**: View all financial transactions
- **Settings**: Adjust profit margin (10-50%)

## Security Checklist

- [x] RLS policies enabled on all tables
- [x] Service Role Key only in API routes
- [x] Admin protected by role check
- [x] Input validation on all endpoints
- [x] Session refresh via middleware
- [ ] Rate limiting (TODO)
- [ ] CAPTCHA on auth endpoints (TODO)

## Performance

- Multi-provider failover ensures high success rate
- Supabase connection pooling
- Next.js 16 optimizations (React 19, Turbopack)
- Image optimization for logos/flags

## Support

For issues or questions, contact: support@otprental.com

## License

Proprietary - All rights reserved
```
