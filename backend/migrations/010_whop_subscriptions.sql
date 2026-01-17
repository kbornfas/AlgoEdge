-- Migration: Add Whop subscription fields
-- This migration updates the subscriptions table to support Whop payments

-- Add Whop-specific columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS whop_membership_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whop_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whop_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS whop_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';

-- Add subscription_status to users table for quick access checks
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_membership_id ON subscriptions(whop_membership_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_user_id ON subscriptions(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Update existing users to have 'trial' status
UPDATE users SET subscription_status = 'trial' WHERE subscription_status IS NULL;
