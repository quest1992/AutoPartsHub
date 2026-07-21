-- CreateEnum
CREATE TYPE "PartCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED');

-- CreateTable
CREATE TABLE "ShopInventoryItem" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "brand" TEXT,
    "sku" TEXT,
    "oemNumber" TEXT,
    "condition" "PartCondition" NOT NULL DEFAULT 'NEW',
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TJS',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minQuantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleGenerationId" TEXT,

    CONSTRAINT "ShopInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopInventoryItem_shopId_idx" ON "ShopInventoryItem"("shopId");

-- CreateIndex
CREATE INDEX "ShopInventoryItem_partCatalogItemId_idx" ON "ShopInventoryItem"("partCatalogItemId");

-- CreateIndex
CREATE INDEX "ShopInventoryItem_isActive_idx" ON "ShopInventoryItem"("isActive");

-- CreateIndex
CREATE INDEX "ShopInventoryItem_condition_idx" ON "ShopInventoryItem"("condition");

-- CreateIndex
CREATE INDEX "ShopInventoryItem_sku_idx" ON "ShopInventoryItem"("sku");

-- AddForeignKey
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_vehicleGenerationId_fkey" FOREIGN KEY ("vehicleGenerationId") REFERENCES "VehicleGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
