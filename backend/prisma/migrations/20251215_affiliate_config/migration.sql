CREATE TABLE "AffiliateConfig" (
  "id" TEXT PRIMARY KEY,
  "firstLevelPercent" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
  "secondLevelPercent" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "firstBetBonus" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "AffiliateConfig_singleton_idx" ON "AffiliateConfig"("id");
