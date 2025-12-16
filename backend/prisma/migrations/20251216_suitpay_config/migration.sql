-- CreateTable
CREATE TABLE "SuitpayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "apiUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
