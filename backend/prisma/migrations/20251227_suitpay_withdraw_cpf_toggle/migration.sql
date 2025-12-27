-- Add toggle to enforce CPF validation on withdraws
ALTER TABLE "SuitpayConfig"
ADD COLUMN "enforceWithdrawCpfMatch" BOOLEAN NOT NULL DEFAULT true;
