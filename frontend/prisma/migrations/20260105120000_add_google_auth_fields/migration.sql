-- Add Google authentication fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_picture" TEXT;

-- Make password_hash optional for Google users
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add index for faster Google ID lookups
CREATE INDEX IF NOT EXISTS "users_google_id_idx" ON "users"("google_id");
