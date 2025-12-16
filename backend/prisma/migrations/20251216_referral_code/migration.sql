-- Add referralCode to users
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT NOT NULL DEFAULT cuid();
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
