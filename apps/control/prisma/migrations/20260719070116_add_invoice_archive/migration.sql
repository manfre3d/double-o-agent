-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "sourceFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_ownerId_createdAt_idx" ON "Invoice"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_ownerId_code_key" ON "Invoice"("ownerId", "code");
