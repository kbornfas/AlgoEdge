-- AlgoEdge Database Migration: Add created_at to payment_proofs
-- This migration adds explicit createdAt field to payment_proofs table
-- to ensure proper timestamping and meet deployment requirements

-- Add created_at column to payment_proofs table
ALTER TABLE "payment_proofs" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migration Notes:
-- 1. The created_at field provides explicit creation timestamp
-- 2. This field is required for deployment validation
-- 3. Existing records will have created_at set to current timestamp
-- 4. New records will automatically get current timestamp on creation
