-- Keep migrated keys byte-for-byte compatible with buildInventoryKey().
UPDATE "ShopInventoryItem"
SET "inventoryKey" = md5(
  "shopId" || '|' || COALESCE("warehouseId", '') || '|' || "partCatalogItemId" || '|' ||
  upper(regexp_replace(COALESCE("sku", ''), '[^A-Za-z0-9]', '', 'g')) || '|' ||
  upper(regexp_replace(COALESCE("oemNumber", ''), '[^A-Za-z0-9]', '', 'g')) || '|' ||
  lower(regexp_replace(btrim(COALESCE("brand", '')), '\s+', ' ', 'g')) || '|' ||
  "condition"::text
);
