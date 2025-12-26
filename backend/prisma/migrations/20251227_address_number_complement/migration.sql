-- Add address number and complement to user profile
ALTER TABLE "User"
ADD COLUMN "addressNumber" TEXT,
ADD COLUMN "addressComplement" TEXT;
