-- AlgoEdge Database Migration: Add Approval Status and Rejection Reason
-- This migration adds support for user approval workflow with OTP verification

-- Add approval_status column (pending, approved, rejected)
ALTER TABLE "users" ADD COLUMN "approval_status" VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Add rejection_reason column to store reason when admin rejects a user
ALTER TABLE "users" ADD COLUMN "rejection_reason" TEXT;

-- Create index on approval_status for faster queries
CREATE INDEX "users_approval_status_idx" ON "users"("approval_status");

-- Update existing users to have approved status if they are activated
UPDATE "users" SET "approval_status" = 'approved' WHERE "is_activated" = true;

-- Migration Notes:
-- 1. All new users will have approval_status = 'pending' by default
-- 2. Admin can approve or reject users through the admin panel
-- 3. Rejected users cannot login and will see the rejection_reason
-- 4. Users must complete OTP verification before payment
-- 5. After payment verification, admin approves to activate the account
