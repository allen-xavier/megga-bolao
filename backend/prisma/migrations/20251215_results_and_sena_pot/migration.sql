-- Results and sena pot
CREATE TABLE "BolaoResult" (
  "id" TEXT PRIMARY KEY DEFAULT cuid(),
  "bolaoId" TEXT NOT NULL,
  "closedAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "PrizeResult" (
  "id" TEXT PRIMARY KEY DEFAULT cuid(),
  "bolaoResultId" TEXT NOT NULL,
  "prizeType" TEXT NOT NULL,
  "totalValue" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "PrizeResultWinner" (
  "id" TEXT PRIMARY KEY DEFAULT cuid(),
  "prizeResultId" TEXT NOT NULL,
  "betId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "SenaPot" (
  "id" TEXT PRIMARY KEY,
  "amount" DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS "SenaPot_singleton_idx" ON "SenaPot"("id");
ALTER TABLE "PrizeResult" ADD CONSTRAINT "PrizeResult_bolaoResultId_fkey" FOREIGN KEY ("bolaoResultId") REFERENCES "BolaoResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrizeResultWinner" ADD CONSTRAINT "PrizeResultWinner_prizeResultId_fkey" FOREIGN KEY ("prizeResultId") REFERENCES "PrizeResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrizeResultWinner" ADD CONSTRAINT "PrizeResultWinner_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrizeResultWinner" ADD CONSTRAINT "PrizeResultWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BolaoResult" ADD CONSTRAINT "BolaoResult_bolaoId_fkey" FOREIGN KEY ("bolaoId") REFERENCES "Bolao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
