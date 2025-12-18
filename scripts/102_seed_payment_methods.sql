-- Seed VietQR payment method
INSERT INTO payment_methods (
  name, 
  type, 
  provider, 
  is_active, 
  min_amount, 
  max_amount, 
  fee_percentage, 
  fee_fixed,
  display_order,
  instructions,
  bank_code,
  account_number,
  account_name,
  logo_url
) VALUES (
  'Chuyển khoản ngân hàng',
  'bank_transfer',
  'vietqr',
  true,
  10000,
  50000000,
  0,
  0,
  1,
  'Quét mã QR hoặc chuyển khoản thủ công với nội dung chính xác',
  'MB',  -- Thay bằng mã ngân hàng thực của bạn
  '0123456789',  -- Thay bằng số tài khoản thực
  'CONG TY OTP RENTAL',  -- Thay bằng tên chủ tài khoản thực
  '/images/bank-transfer.png'
)
ON CONFLICT DO NOTHING;

-- Note: Bạn cần cập nhật bank_code, account_number, account_name với thông tin thật
