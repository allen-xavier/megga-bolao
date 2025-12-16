-- CreateTable (idempotent)
DROP TABLE IF EXISTS "SuitpayConfig";
CREATE TABLE "SuitpayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "apiUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
