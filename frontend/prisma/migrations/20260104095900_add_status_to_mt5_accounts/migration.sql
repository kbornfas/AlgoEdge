-- AlterTable
ALTER TABLE "mt5_accounts" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) NOT NULL DEFAULT 'disconnected';

-- Update existing records that are connected
UPDATE "mt5_accounts" 
SET "status" = CASE 
  WHEN "is_connected" = true THEN 'connected' 
  ELSE 'disconnected' 
END
WHERE "is_connected" = true AND "status" = 'disconnected';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_mt5_accounts_status" ON "mt5_accounts"("status");
