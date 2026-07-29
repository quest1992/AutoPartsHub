CREATE TYPE "InventoryImportStatus" AS ENUM (
  'PREVIEW',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'EXPIRED'
);

CREATE TABLE "InventoryImportSession" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "InventoryImportStatus" NOT NULL DEFAULT 'PREVIEW',
  "fileName" TEXT NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "previewData" JSONB NOT NULL,
  "resultData" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryImportSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryImportSession_shopId_status_idx"
  ON "InventoryImportSession"("shopId", "status");
CREATE INDEX "InventoryImportSession_userId_idx"
  ON "InventoryImportSession"("userId");
CREATE INDEX "InventoryImportSession_expiresAt_idx"
  ON "InventoryImportSession"("expiresAt");

ALTER TABLE "InventoryImportSession"
  ADD CONSTRAINT "InventoryImportSession_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryImportSession"
  ADD CONSTRAINT "InventoryImportSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
