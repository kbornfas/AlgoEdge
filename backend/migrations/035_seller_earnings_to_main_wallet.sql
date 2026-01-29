-- Migration: Update seller earnings to go to main user_wallets
-- seller_wallets now only tracks stats, actual money goes to user_wallets

-- Update the record_marketplace_sale function to credit user_wallets
CREATE OR REPLACE FUNCTION record_marketplace_sale(
    p_seller_id INTEGER,
    p_sale_amount DECIMAL,
    p_commission_rate DECIMAL,
    p_reference_type VARCHAR,
    p_reference_id INTEGER,
    p_description TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_wallet_id INTEGER;
    v_user_wallet_balance DECIMAL;
    v_commission DECIMAL;
    v_earnings DECIMAL;
    v_new_balance DECIMAL;
BEGIN
    -- Get or create seller wallet (for stats only)
    v_wallet_id := get_or_create_seller_wallet(p_seller_id);
    
    -- Calculate commission and earnings
    v_commission := p_sale_amount * (p_commission_rate / 100);
    v_earnings := p_sale_amount - v_commission;
    
    -- Update seller_wallets stats only (no actual balance)
    UPDATE seller_wallets
    SET total_earned = total_earned + v_earnings,
        total_sales = total_sales + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_wallet_id;
    
    -- Get or create user's main wallet
    INSERT INTO user_wallets (user_id, balance, total_deposited, total_spent)
    VALUES (p_seller_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current balance
    SELECT balance INTO v_user_wallet_balance 
    FROM user_wallets WHERE user_id = p_seller_id;
    
    v_user_wallet_balance := COALESCE(v_user_wallet_balance, 0);
    v_new_balance := v_user_wallet_balance + v_earnings;
    
    -- Credit the seller's main wallet
    UPDATE user_wallets
    SET balance = balance + v_earnings,
        total_deposited = total_deposited + v_earnings,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_seller_id;
    
    -- Record transaction in main wallet_transactions
    INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
    VALUES (p_seller_id, 'sale_earning', v_earnings, v_user_wallet_balance, v_new_balance, 
            COALESCE(p_description, 'Sale earnings'), p_reference_type, p_reference_id);
    
    -- Also record in seller_transactions for seller dashboard stats
    INSERT INTO seller_transactions (wallet_id, user_id, type, amount, balance_after, reference_type, reference_id, description)
    VALUES (v_wallet_id, p_seller_id, 'sale', v_earnings, v_new_balance, p_reference_type, p_reference_id, 
            COALESCE(p_description, 'Sale earnings'));
END;
$$ LANGUAGE plpgsql;

-- Note: The clear_pending_seller_earnings function is no longer needed since
-- earnings go directly to user_wallets. We can keep seller_wallets.pending_balance
-- for legacy compatibility but it won't be used.
