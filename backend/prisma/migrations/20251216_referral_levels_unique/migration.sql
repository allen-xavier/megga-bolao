-- Adjust unique constraint to allow level1 and level2 for same referred user
DROP INDEX IF EXISTS "Referral_referredUserId_key";
CREATE UNIQUE INDEX "Referral_referredUserId_level_key" ON "Referral"("referredUserId","level");
