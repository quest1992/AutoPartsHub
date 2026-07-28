DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ShopInventoryItem"
    GROUP BY "shopId", "partCatalogItemId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add ShopInventoryItem shop/catalog uniqueness: duplicate rows exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "ShopInventoryItem_shopId_partCatalogItemId_key"
ON "ShopInventoryItem"("shopId", "partCatalogItemId");
