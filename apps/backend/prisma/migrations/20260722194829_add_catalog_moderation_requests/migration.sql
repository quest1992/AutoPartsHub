-- CreateEnum
CREATE TYPE "CatalogModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CatalogModerationRequest" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "importJobId" TEXT,
    "requestedCategoryName" TEXT,
    "requestedSubcategoryName" TEXT,
    "suggestedCategoryId" TEXT,
    "status" "CatalogModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogModerationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_shopId_status_idx" ON "CatalogModerationRequest"("shopId", "status");

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_inventoryItemId_idx" ON "CatalogModerationRequest"("inventoryItemId");

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_importJobId_idx" ON "CatalogModerationRequest"("importJobId");

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_suggestedCategoryId_idx" ON "CatalogModerationRequest"("suggestedCategoryId");

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_resolvedByUserId_idx" ON "CatalogModerationRequest"("resolvedByUserId");

-- CreateIndex
CREATE INDEX "CatalogModerationRequest_createdAt_idx" ON "CatalogModerationRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "CatalogModerationRequest" ADD CONSTRAINT "CatalogModerationRequest_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogModerationRequest" ADD CONSTRAINT "CatalogModerationRequest_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "ShopInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogModerationRequest" ADD CONSTRAINT "CatalogModerationRequest_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "InventoryImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogModerationRequest" ADD CONSTRAINT "CatalogModerationRequest_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "PartCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogModerationRequest" ADD CONSTRAINT "CatalogModerationRequest_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
