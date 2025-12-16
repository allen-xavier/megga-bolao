-- Add referralCode to users (no DB-side default to avoid missing cuid() function)
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;

-- populate existing with random codes
UPDATE "User"
SET "referralCode" = concat('ref_', to_hex(floor(random() * 1e15)::bigint))
WHERE "referralCode" IS NULL;

-- enforce not null and unique
ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
