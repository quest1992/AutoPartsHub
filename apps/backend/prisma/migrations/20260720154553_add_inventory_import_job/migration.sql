-- CreateEnum
CREATE TYPE "InventoryImportJobStatus" AS ENUM ('PREVIEW', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateTable
CREATE TABLE "InventoryImportJob" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "InventoryImportJobStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "updatedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "requiresReviewRows" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryImportJob_shopId_idx" ON "InventoryImportJob"("shopId");

-- CreateIndex
CREATE INDEX "InventoryImportJob_status_idx" ON "InventoryImportJob"("status");

-- CreateIndex
CREATE INDEX "InventoryImportJob_createdAt_idx" ON "InventoryImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryImportJob_createdByUserId_idx" ON "InventoryImportJob"("createdByUserId");

-- AddForeignKey
ALTER TABLE "InventoryImportJob" ADD CONSTRAINT "InventoryImportJob_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryImportJob" ADD CONSTRAINT "InventoryImportJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
