-- Add senaPotReserved to link pot to a specific bolao until first draw is processed
ALTER TABLE "Bolao" ADD COLUMN "senaPotReserved" DECIMAL(12,2) NOT NULL DEFAULT 0;
