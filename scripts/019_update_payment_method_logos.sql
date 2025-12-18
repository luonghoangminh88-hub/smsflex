-- Update payment method logos with local image paths
UPDATE payment_methods 
SET logo_url = '/images/vietqr.png',
    instructions = 'Quét mã QR hoặc chuyển khoản với nội dung được cung cấp. Số dư sẽ được cập nhật tự động trong vài phút.'
WHERE provider = 'vietqr';

UPDATE payment_methods 
SET logo_url = '/images/momo.webp',
    instructions = 'Mở ứng dụng MoMo, quét mã QR hoặc chuyển tiền đến số điện thoại với nội dung được cung cấp.'
WHERE provider = 'momo';

UPDATE payment_methods 
SET logo_url = '/images/zalopay.webp',
    instructions = 'Mở ứng dụng ZaloPay, chọn Chuyển tiền và nhập thông tin được cung cấp.'
WHERE provider = 'zalopay';

UPDATE payment_methods 
SET logo_url = '/images/viettel-money.webp',
    instructions = 'Mở ứng dụng Viettel Money, quét mã QR hoặc chuyển tiền với nội dung được cung cấp.'
WHERE provider = 'viettel_money';
