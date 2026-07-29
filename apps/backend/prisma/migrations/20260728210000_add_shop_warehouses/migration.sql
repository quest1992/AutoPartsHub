CREATE TYPE "InventoryTransferStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';

CREATE TABLE "shop_warehouses" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "address" TEXT,
  "note" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shop_warehouses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "shop_warehouses_shopId_name_key" ON "shop_warehouses"("shopId", "name");
CREATE UNIQUE INDEX "shop_warehouses_shopId_code_key" ON "shop_warehouses"("shopId", "code");
CREATE INDEX "shop_warehouses_shopId_isActive_idx" ON "shop_warehouses"("shopId", "isActive");
CREATE UNIQUE INDEX "shop_warehouses_one_default_per_shop_idx"
  ON "shop_warehouses"("shopId") WHERE "isDefault" = true;
CREATE UNIQUE INDEX "shop_warehouses_shop_name_ci_idx"
  ON "shop_warehouses"("shopId", lower(btrim("name")));
CREATE UNIQUE INDEX "shop_warehouses_shop_code_ci_idx"
  ON "shop_warehouses"("shopId", lower(btrim("code"))) WHERE "code" IS NOT NULL;
ALTER TABLE "shop_warehouses" ADD CONSTRAINT "shop_warehouses_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "shop_warehouses" (
  "id", "shopId", "name", "isDefault", "isActive", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, s."id", 'Основной склад', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Shop" s;

INSERT INTO "shop_warehouses" (
  "id", "shopId", "name", "isDefault", "isActive", "createdAt", "updatedAt"
)
SELECT gen_random_uuid()::text, grouped."shopId", grouped."name", false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON ("shopId", lower(regexp_replace(btrim("location"), '\s+', ' ', 'g')))
    "shopId",
    regexp_replace(btrim("location"), '\s+', ' ', 'g') AS "name"
  FROM "ShopInventoryItem"
  WHERE NULLIF(btrim("location"), '') IS NOT NULL
    AND lower(regexp_replace(btrim("location"), '\s+', ' ', 'g')) <> lower('Основной склад')
  ORDER BY "shopId", lower(regexp_replace(btrim("location"), '\s+', ' ', 'g')), "createdAt"
) grouped;

ALTER TABLE "ShopInventoryItem" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "ShopInventoryItem" ADD COLUMN "inventoryKey" TEXT;

UPDATE "ShopInventoryItem" item
SET "warehouseId" = warehouse."id"
FROM "shop_warehouses" warehouse
WHERE warehouse."shopId" = item."shopId"
  AND (
    (NULLIF(btrim(item."location"), '') IS NULL AND warehouse."isDefault" = true)
    OR
    (NULLIF(btrim(item."location"), '') IS NOT NULL
      AND lower(regexp_replace(btrim(warehouse."name"), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(item."location"), '\s+', ' ', 'g')))
  );

UPDATE "ShopInventoryItem"
SET "inventoryKey" = md5(
  "shopId" || '|' || COALESCE("warehouseId", '') || '|' || "partCatalogItemId" || '|' ||
  upper(regexp_replace(COALESCE("sku", ''), '[^[:alnum:]]', '', 'g')) || '|' ||
  upper(regexp_replace(COALESCE("oemNumber", ''), '[^[:alnum:]]', '', 'g')) || '|' ||
  lower(regexp_replace(btrim(COALESCE("brand", '')), '\s+', ' ', 'g')) || '|' ||
  "condition"::text
);

ALTER TABLE "ShopInventoryItem" ALTER COLUMN "inventoryKey" SET NOT NULL;
DROP INDEX "ShopInventoryItem_shopId_partCatalogItemId_key";
CREATE UNIQUE INDEX "ShopInventoryItem_inventoryKey_key" ON "ShopInventoryItem"("inventoryKey");
CREATE INDEX "ShopInventoryItem_warehouseId_idx" ON "ShopInventoryItem"("warehouseId");
CREATE INDEX "ShopInventoryItem_shopId_warehouseId_isActive_idx"
  ON "ShopInventoryItem"("shopId", "warehouseId", "isActive");
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "shop_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryMovement" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "InventoryMovement" ADD COLUMN "warehouseNameSnapshot" TEXT;
UPDATE "InventoryMovement" movement SET
  "warehouseId" = item."warehouseId",
  "warehouseNameSnapshot" = warehouse."name"
FROM "ShopInventoryItem" item
LEFT JOIN "shop_warehouses" warehouse ON warehouse."id" = item."warehouseId"
WHERE movement."inventoryItemId" = item."id";
CREATE INDEX "InventoryMovement_warehouseId_createdAt_idx" ON "InventoryMovement"("warehouseId", "createdAt");
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey"
  FOREIGN KEY ("warehouseId") REFERENCES "shop_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PurchaseItem" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN "warehouseName" TEXT;
UPDATE "PurchaseItem" document SET
  "warehouseId" = item."warehouseId",
  "warehouseName" = warehouse."name"
FROM "ShopInventoryItem" item
LEFT JOIN "shop_warehouses" warehouse ON warehouse."id" = item."warehouseId"
WHERE document."inventoryItemId" = item."id";

ALTER TABLE "SaleItem" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "SaleItem" ADD COLUMN "warehouseName" TEXT;
UPDATE "SaleItem" document SET
  "warehouseId" = item."warehouseId",
  "warehouseName" = warehouse."name"
FROM "ShopInventoryItem" item
LEFT JOIN "shop_warehouses" warehouse ON warehouse."id" = item."warehouseId"
WHERE document."inventoryItemId" = item."id";

CREATE TABLE "InventoryTransfer" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "fromWarehouseId" TEXT NOT NULL,
  "toWarehouseId" TEXT NOT NULL,
  "status" "InventoryTransferStatus" NOT NULL DEFAULT 'DRAFT',
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  CONSTRAINT "InventoryTransfer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InventoryTransferItem" (
  "id" TEXT NOT NULL,
  "transferId" TEXT NOT NULL,
  "catalogItemId" TEXT NOT NULL,
  "sourceInventoryItemId" TEXT,
  "quantity" INTEGER NOT NULL,
  "catalogItemName" TEXT NOT NULL,
  "article" TEXT,
  "oem" TEXT,
  "manufacturer" TEXT,
  "condition" "PartCondition" NOT NULL DEFAULT 'NEW',
  CONSTRAINT "InventoryTransferItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InventoryTransfer_shopId_number_key" ON "InventoryTransfer"("shopId", "number");
CREATE INDEX "InventoryTransfer_shopId_createdAt_idx" ON "InventoryTransfer"("shopId", "createdAt");
CREATE INDEX "InventoryTransfer_fromWarehouseId_idx" ON "InventoryTransfer"("fromWarehouseId");
CREATE INDEX "InventoryTransfer_toWarehouseId_idx" ON "InventoryTransfer"("toWarehouseId");
CREATE INDEX "InventoryTransferItem_transferId_idx" ON "InventoryTransferItem"("transferId");
CREATE INDEX "InventoryTransferItem_catalogItemId_idx" ON "InventoryTransferItem"("catalogItemId");
CREATE INDEX "InventoryTransferItem_sourceInventoryItemId_idx" ON "InventoryTransferItem"("sourceInventoryItemId");
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "shop_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "shop_warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransfer" ADD CONSTRAINT "InventoryTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "InventoryTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransferItem" ADD CONSTRAINT "InventoryTransferItem_sourceInventoryItemId_fkey" FOREIGN KEY ("sourceInventoryItemId") REFERENCES "ShopInventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
