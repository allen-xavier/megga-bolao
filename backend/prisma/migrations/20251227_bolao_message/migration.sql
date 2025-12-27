-- Add bolao message to general config and bolao
ALTER TABLE "GeneralConfig"
ADD COLUMN "bolaoMessage" TEXT;

ALTER TABLE "Bolao"
ADD COLUMN "bolaoMessage" TEXT;
