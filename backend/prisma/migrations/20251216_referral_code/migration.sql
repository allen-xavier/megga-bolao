-- Add referralCode to users (idempotent)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- populate existing with random codes where null
UPDATE "User"
SET "referralCode" = concat('ref_', to_hex(floor(random() * 1e15)::bigint))
WHERE "referralCode" IS NULL;

-- enforce not null and unique (safe even if already set)
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
