-- Idempotent add of bonus enabled flag
ALTER TABLE "AffiliateConfig" ADD COLUMN IF NOT EXISTS "firstBetBonusEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Ensure default row exists
INSERT INTO "AffiliateConfig" (id, "firstLevelPercent", "secondLevelPercent", "firstBetBonus", "firstBetBonusEnabled", "updatedAt")
VALUES ('global', 2.0, 1.0, 0.0, false, now())
ON CONFLICT (id) DO NOTHING;
