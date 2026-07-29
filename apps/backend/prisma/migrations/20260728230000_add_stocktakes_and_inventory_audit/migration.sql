ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'IMPORT';
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_IN';
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'ADJUSTMENT_OUT';
CREATE TYPE "StocktakeStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

ALTER TABLE "InventoryMovement"
  ADD COLUMN "partCatalogItemId" TEXT,
  ADD COLUMN "partCatalogItemNameSnapshot" TEXT,
  ADD COLUMN "documentType" TEXT,
  ADD COLUMN "documentId" TEXT,
  ADD COLUMN "documentNumber" TEXT;

UPDATE "InventoryMovement" movement
SET
  "partCatalogItemId" = item."partCatalogItemId",
  "partCatalogItemNameSnapshot" = catalog."name",
  "documentNumber" = movement."reference",
  "documentType" = CASE
    WHEN movement."type" IN ('PURCHASE', 'PURCHASE_CANCEL') THEN 'PURCHASE'
    WHEN movement."type" IN ('SALE', 'SALE_CANCEL') THEN 'SALE'
    WHEN movement."type" IN ('TRANSFER_IN', 'TRANSFER_OUT') THEN 'TRANSFER'
    WHEN movement."type" = 'INITIAL_BALANCE' THEN 'OPENING_BALANCE'
    ELSE 'ADJUSTMENT'
  END,
  "documentId" = CASE
    WHEN movement."type" IN ('PURCHASE', 'PURCHASE_CANCEL')
      THEN (SELECT purchase."id" FROM "Purchase" purchase WHERE purchase."number" = movement."reference" LIMIT 1)
    WHEN movement."type" IN ('SALE', 'SALE_CANCEL')
      THEN (SELECT sale."id" FROM "Sale" sale WHERE sale."number" = movement."reference" LIMIT 1)
    WHEN movement."type" IN ('TRANSFER_IN', 'TRANSFER_OUT')
      THEN (SELECT transfer."id" FROM "InventoryTransfer" transfer WHERE transfer."number" = movement."reference" AND transfer."shopId" = movement."shopId" LIMIT 1)
    ELSE NULL
  END
FROM "ShopInventoryItem" item
JOIN "PartCatalogItem" catalog ON catalog."id" = item."partCatalogItemId"
WHERE movement."inventoryItemId" = item."id";

-- Idempotent opening balance for legacy inventory whose history starts mid-stream.
-- The delta is current quantity minus all existing deltas, so current quantity is unchanged.
INSERT INTO "InventoryMovement" (
  "id", "shopId", "inventoryItemId", "userId", "warehouseId",
  "warehouseNameSnapshot", "partCatalogItemId", "partCatalogItemNameSnapshot",
  "type", "change", "quantityBefore", "quantityAfter",
  "documentType", "documentNumber", "notes", "createdAt"
)
SELECT
  gen_random_uuid()::text,
  item."shopId",
  item."id",
  NULL,
  item."warehouseId",
  warehouse."name",
  item."partCatalogItemId",
  catalog."name",
  'INITIAL_BALANCE'::"InventoryMovementType",
  item."quantity" - COALESCE(SUM(movement."change"), 0),
  0,
  item."quantity" - COALESCE(SUM(movement."change"), 0),
  'OPENING_BALANCE',
  'LEGACY-BACKFILL',
  'Начальный баланс для полной истории legacy-остатка',
  LEAST(item."createdAt", COALESCE(MIN(movement."createdAt") - INTERVAL '1 millisecond', item."createdAt"))
FROM "ShopInventoryItem" item
JOIN "PartCatalogItem" catalog ON catalog."id" = item."partCatalogItemId"
LEFT JOIN "shop_warehouses" warehouse ON warehouse."id" = item."warehouseId"
LEFT JOIN "InventoryMovement" movement ON movement."inventoryItemId" = item."id"
GROUP BY item."id", warehouse."name", catalog."name"
HAVING COUNT(*) FILTER (WHERE movement."type" = 'INITIAL_BALANCE') = 0;

CREATE INDEX "InventoryMovement_partCatalogItemId_createdAt_idx"
  ON "InventoryMovement"("partCatalogItemId", "createdAt");
CREATE INDEX "InventoryMovement_documentType_documentId_idx"
  ON "InventoryMovement"("documentType", "documentId");

CREATE TABLE "Stocktake" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "status" "StocktakeStatus" NOT NULL DEFAULT 'DRAFT',
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "Stocktake_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StocktakeItem" (
  "id" TEXT NOT NULL,
  "stocktakeId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "expectedQuantity" INTEGER NOT NULL,
  "actualQuantity" INTEGER,
  "difference" INTEGER,
  CONSTRAINT "StocktakeItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Stocktake_shopId_number_key" ON "Stocktake"("shopId", "number");
CREATE INDEX "Stocktake_shopId_createdAt_idx" ON "Stocktake"("shopId", "createdAt");
CREATE INDEX "Stocktake_warehouseId_status_idx" ON "Stocktake"("warehouseId", "status");
CREATE UNIQUE INDEX "StocktakeItem_stocktakeId_inventoryItemId_key" ON "StocktakeItem"("stocktakeId", "inventoryItemId");
CREATE INDEX "StocktakeItem_inventoryItemId_idx" ON "StocktakeItem"("inventoryItemId");
ALTER TABLE "Stocktake" ADD CONSTRAINT "Stocktake_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Stocktake" ADD CONSTRAINT "Stocktake_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "shop_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Stocktake" ADD CONSTRAINT "Stocktake_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StocktakeItem" ADD CONSTRAINT "StocktakeItem_stocktakeId_fkey" FOREIGN KEY ("stocktakeId") REFERENCES "Stocktake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StocktakeItem" ADD CONSTRAINT "StocktakeItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "ShopInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
