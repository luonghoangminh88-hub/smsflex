# Email Configuration Guide

## Overview

Hiện tại hệ thống OTP Rental đang sử dụng email mặc định của Supabase Auth. Để có trải nghiệm chuyên nghiệp hơn, bạn nên cấu hình email service riêng.

---

## 1. Cấu Hình SMTP Tùy Chỉnh trong Supabase

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Authentication** → **Email Templates** → **Settings**

### Bước 2: Cấu hình SMTP
Chọn 1 trong các email service providers sau:

#### Option 1: SendGrid (Khuyến nghị)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP Username: apikey
SMTP Password: [Your SendGrid API Key]
Sender Email: noreply@yourdomain.com
Sender Name: OTP Rental
```

**Lấy SendGrid API Key:**
1. Đăng ký tại [https://sendgrid.com](https://sendgrid.com)
2. Vào **Settings** → **API Keys** → **Create API Key**
3. Chọn **Full Access** và tạo key

#### Option 2: Resend (Developer-friendly)
```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: [Your Resend API Key]
Sender Email: noreply@yourdomain.com
Sender Name: OTP Rental
```

**Lấy Resend API Key:**
1. Đăng ký tại [https://resend.com](https://resend.com)
2. Vào **API Keys** → **Create API Key**
3. Copy API key

#### Option 3: AWS SES (Scalable, rẻ)
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP Username: [Your SES SMTP Username]
SMTP Password: [Your SES SMTP Password]
Sender Email: noreply@yourdomain.com
Sender Name: OTP Rental
```

---

## 2. Tùy Chỉnh Email Templates

### Supabase Auth Email Templates

Supabase cung cấp sẵn templates cho:
- **Confirmation Email** (Xác nhận đăng ký)
- **Reset Password** (Đặt lại mật khẩu)
- **Magic Link**
- **Email Change**

#### Ví dụ Confirmation Email Template:

```html
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="background: linear-gradient(135deg, #4a6fa5 0%, #3b5998 100%); 
                 -webkit-background-clip: text; 
                 -webkit-text-fill-color: transparent;">
        OTP Rental
      </h1>
    </div>
    
    <h2 style="color: #333;">Chào mừng đến với OTP Rental!</h2>
    
    <p style="color: #666; line-height: 1.6;">
      Cảm ơn bạn đã đăng ký. Vui lòng xác nhận email của bạn bằng cách nhấn vào nút bên dưới:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: linear-gradient(135deg, #4a6fa5 0%, #3b5998 100%);
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 6px;
                display: inline-block;">
        Xác nhận Email
      </a>
    </div>
    
    <p style="color: #999; font-size: 12px;">
      Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
    </p>
  </div>
</body>
</html>
```

---

## 3. Gửi Email Thông Báo Tùy Chỉnh

Để gửi email thông báo về nạp tiền, thuê số, v.v., bạn cần tích hợp email service vào API routes.

### Cài đặt (chọn 1):

#### Option 1: Resend (Khuyến nghị cho Next.js)
```bash
npm install resend
```

**Thêm env var:**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### Option 2: SendGrid
```bash
npm install @sendgrid/mail
```

**Thêm env var:**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
```

---

## 4. Email Notifications Implementation

### Tạo Email Service

```typescript
// lib/email-service.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDepositConfirmationEmail(
  to: string,
  amount: number,
  paymentCode: string
) {
  await resend.emails.send({
    from: 'OTP Rental <noreply@yourdomain.com>',
    to,
    subject: '✅ Nạp tiền thành công',
    html: `
      <h2>Nạp tiền thành công!</h2>
      <p>Số tiền: ${amount.toLocaleString('vi-VN')}đ</p>
      <p>Mã giao dịch: ${paymentCode}</p>
    `,
  })
}

export async function sendRentalSuccessEmail(
  to: string,
  phoneNumber: string,
  service: string
) {
  await resend.emails.send({
    from: 'OTP Rental <noreply@yourdomain.com>',
    to,
    subject: '📱 Thuê số thành công',
    html: `
      <h2>Thuê số thành công!</h2>
      <p>Số điện thoại: ${phoneNumber}</p>
      <p>Dịch vụ: ${service}</p>
    `,
  })
}
```

### Gọi trong API Routes

```typescript
// app/api/deposits/verify/route.ts
import { sendDepositConfirmationEmail } from '@/lib/email-service'

// After deposit verification success:
await sendDepositConfirmationEmail(
  user.email,
  deposit.amount,
  deposit.payment_code
)

// Also create in-app notification
await supabase.rpc('create_notification', {
  p_user_id: user.id,
  p_title: 'Nạp tiền thành công',
  p_message: `Bạn đã nạp ${deposit.amount.toLocaleString('vi-VN')}đ vào tài khoản`,
  p_type: 'deposit',
  p_metadata: { payment_code: deposit.payment_code }
})
```

---

## 5. Domain Setup (Quan trọng!)

Để email không bị vào spam, bạn cần verify domain:

### SendGrid Domain Authentication:
1. Vào **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Thêm DNS records vào domain provider của bạn

### Resend Domain Verification:
1. Vào **Domains** → **Add Domain**
2. Thêm DNS records vào domain provider

**DNS Records cần thêm:**
- SPF record
- DKIM record
- DMARC record

---

## 6. Testing

Test email trong development:

```typescript
// Test script
const testEmail = async () => {
  await sendDepositConfirmationEmail(
    'test@example.com',
    100000,
    'TEST123'
  )
  console.log('Email sent!')
}
```

---

## Checklist Deployment

- [ ] Cấu hình SMTP trong Supabase Dashboard
- [ ] Verify domain (SPF, DKIM, DMARC)
- [ ] Tùy chỉnh email templates trong Supabase
- [ ] Cài đặt email service package (Resend/SendGrid)
- [ ] Thêm RESEND_API_KEY hoặc SENDGRID_API_KEY vào env vars
- [ ] Implement email notifications trong API routes
- [ ] Test gửi email trong production
- [ ] Monitor email delivery rates

---

## Support

Nếu gặp vấn đề:
- SendGrid: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- Resend: [https://resend.com/docs](https://resend.com/docs)
- Supabase Auth: [https://supabase.com/docs/guides/auth/custom-smtp](https://supabase.com/docs/guides/auth/custom-smtp)
