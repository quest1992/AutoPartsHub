-- On a fresh database, remove the temporary warehouse shim immediately before
-- the original warehouse migration creates the complete table.
-- Existing databases have no marker and therefore remain untouched.
DO $repair$
BEGIN
  IF to_regclass('public."_MigrationRepairShopWarehouseShim"') IS NOT NULL THEN
    ALTER TABLE "CustomerOrderItem"
      DROP CONSTRAINT IF EXISTS "CustomerOrderItem_warehouseId_fkey";

    DROP TABLE "shop_warehouses";
  END IF;
END
$repair$;
