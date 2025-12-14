-- Add bolao linkage to draws
ALTER TABLE "Draw" ADD COLUMN IF NOT EXISTS "bolaoId" TEXT;
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_bolaoId_fkey" FOREIGN KEY ("bolaoId") REFERENCES "Bolao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Draw_bolaoId_idx" ON "Draw"("bolaoId");
