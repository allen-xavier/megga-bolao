-- Add withdraw receipt preference
ALTER TABLE "SuitpayConfig"
ADD COLUMN "withdrawReceiptPreference" TEXT NOT NULL DEFAULT 'SUITPAY';
