-- Create payment_methods table for storing bank and e-wallet info
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank_transfer', 'ewallet', 'card')),
    provider TEXT, -- 'vietqr', 'momo', 'zalopay', 'viettelmoney', etc
    account_number TEXT,
    account_name TEXT,
    bank_code TEXT,
    qr_template TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    min_amount NUMERIC DEFAULT 10000,
    max_amount NUMERIC,
    fee_percentage NUMERIC DEFAULT 0,
    fee_fixed NUMERIC DEFAULT 0,
    instructions TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create deposits table for tracking deposit transactions
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES payment_methods(id),
    amount NUMERIC NOT NULL,
    fee NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_code TEXT UNIQUE, -- Unique code for tracking (e.g., NAPTEN_UserID_Timestamp)
    transfer_content TEXT, -- Content for bank transfer
    payment_data JSONB, -- Store additional payment data (QR code, transaction ref, etc)
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_payment_code ON deposits(payment_code);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at DESC);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Anyone can view active payment methods" ON payment_methods
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" ON payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON deposits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own deposits" ON deposits
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending deposits" ON deposits
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND status = 'pending'
    );

CREATE POLICY "Admins can view all deposits" ON deposits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all deposits" ON deposits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default payment methods
INSERT INTO payment_methods (name, type, provider, account_number, account_name, bank_code, logo_url, instructions, display_order) VALUES
('Chuyển khoản ngân hàng (VietQR)', 'bank_transfer', 'vietqr', '0123456789', 'CONG TY TNHH OTP RENTAL', 'MB', '/images/vietqr-logo.png', 'Quét mã QR hoặc chuyển khoản với nội dung được cung cấp. Số dư sẽ được cập nhật tự động trong vài phút.', 1),
('Ví MoMo', 'ewallet', 'momo', '0987654321', 'OTP RENTAL', null, '/images/momo-logo.png', 'Mở ứng dụng MoMo, quét mã QR hoặc chuyển tiền đến số điện thoại với nội dung được cung cấp.', 2),
('Ví ZaloPay', 'ewallet', 'zalopay', '0987654321', 'OTP RENTAL', null, '/images/zalopay-logo.png', 'Mở ứng dụng ZaloPay, chọn Chuyển tiền và nhập thông tin được cung cấp.', 3),
('Ví Viettel Money', 'ewallet', 'viettelmoney', '0987654321', 'OTP RENTAL', null, '/images/viettelmoney-logo.png', 'Mở ứng dụng Viettel Money, quét mã QR hoặc chuyển tiền với nội dung được cung cấp.', 4)
ON CONFLICT DO NOTHING;
