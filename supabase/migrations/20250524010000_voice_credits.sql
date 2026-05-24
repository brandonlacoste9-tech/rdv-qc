-- Voice credits system for Planxo AI
-- Enables per-minute billing for AI phone calls

-- Credits table: tracks user credit balance
CREATE TABLE IF NOT EXISTS voice_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0, -- in cents (1 credit = $0.01)
    lifetime_credits INTEGER NOT NULL DEFAULT 0, -- total credits ever purchased
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Credit transactions: audit trail for all credit changes
CREATE TABLE IF NOT EXISTS voice_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = purchase/refund/bonus, negative = usage
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus', 'adjustment')),
    description TEXT,
    call_sid TEXT REFERENCES voice_calls(callSid) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT, -- for purchases
    stripe_checkout_session_id TEXT, -- for purchases
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add credit tracking to existing voice_calls table
ALTER TABLE voice_calls 
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_minute DECIMAL(10,4) DEFAULT 0.1500, -- $0.15/min default
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'custom', -- 'custom', 'retell', 'twilio'
ADD COLUMN IF NOT EXISTS provider_call_id TEXT; -- external provider's call ID

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_credits_user_id ON voice_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_credit_transactions_user_id ON voice_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_credit_transactions_created_at ON voice_credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_credit_transactions_type ON voice_credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_voice_calls_credits_used ON voice_calls(credits_used) WHERE credits_used > 0;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on voice_credits
DROP TRIGGER IF EXISTS update_voice_credits_updated_at ON voice_credits;
CREATE TRIGGER update_voice_credits_updated_at
    BEFORE UPDATE ON voice_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to deduct credits safely (prevents negative balance)
CREATE OR REPLACE FUNCTION deduct_voice_credits(
    p_user_id TEXT,
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL,
    p_call_sid TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_balance INTEGER;
BEGIN
    -- Get current balance with row lock
    SELECT balance INTO v_current_balance
    FROM voice_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE voice_credits
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO voice_credit_transactions (
        user_id, amount, type, description, call_sid
    ) VALUES (
        p_user_id, -p_amount, 'usage', COALESCE(p_description, 'Voice call usage'), p_call_sid
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits (purchase, refund, bonus)
CREATE OR REPLACE FUNCTION add_voice_credits(
    p_user_id TEXT,
    p_amount INTEGER,
    p_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_stripe_checkout_session_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Insert or update voice_credits
    INSERT INTO voice_credits (user_id, balance, lifetime_credits)
    VALUES (p_user_id, p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = voice_credits.balance + p_amount,
        lifetime_credits = voice_credits.lifetime_credits + p_amount,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO voice_credit_transactions (
        user_id, amount, type, description, 
        stripe_payment_intent_id, stripe_checkout_session_id
    ) VALUES (
        p_user_id, p_amount, p_type, p_description,
        p_stripe_payment_intent_id, p_stripe_checkout_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get credit balance
CREATE OR REPLACE FUNCTION get_voice_credit_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM voice_credits
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Create initial credits for existing users (bonus: $5 = 500 credits)
INSERT INTO voice_credits (user_id, balance, lifetime_credits)
SELECT id, 500, 500
FROM users
WHERE id NOT IN (SELECT user_id FROM voice_credits)
ON CONFLICT (user_id) DO NOTHING;

-- Row Level Security policies
ALTER TABLE voice_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own credits
CREATE POLICY voice_credits_user_isolation ON voice_credits
    FOR ALL
    USING (user_id = auth.uid()::text);

-- Users can only see their own transactions
CREATE POLICY voice_credit_transactions_user_isolation ON voice_credit_transactions
    FOR ALL
    USING (user_id = auth.uid()::text);

COMMENT ON TABLE voice_credits IS 'Stores user credit balance for voice calls';
COMMENT ON TABLE voice_credit_transactions IS 'Audit trail of all credit transactions';
COMMENT ON COLUMN voice_credits.balance IS 'Available credits in cents (1 credit = $0.01)';
COMMENT ON COLUMN voice_calls.credits_used IS 'Total credits deducted for this call';
COMMENT ON COLUMN voice_calls.cost_per_minute IS 'Rate charged per minute in dollars';
