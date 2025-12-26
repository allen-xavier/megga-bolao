ALTER TABLE "Payment"
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerId" TEXT,
ADD COLUMN "externalId" TEXT,
ADD COLUMN "receiptPath" TEXT,
ADD COLUMN "receiptMime" TEXT,
ADD COLUMN "receiptFilename" TEXT;
