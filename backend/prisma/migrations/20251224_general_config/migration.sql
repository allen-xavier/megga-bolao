CREATE TABLE "GeneralConfig" (
  "id" TEXT PRIMARY KEY,
  "senaRollPercent" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  "defaultPrizeConfig" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "GeneralConfig_singleton_idx" ON "GeneralConfig"("id");
