-- Complete the fresh-database repair after the unchanged original migration
-- has created the real shop_warehouses table.
DO $repair$
BEGIN
  IF to_regclass('public."_MigrationRepairShopWarehouseShim"') IS NOT NULL THEN
    ALTER TABLE "CustomerOrderItem"
      ADD CONSTRAINT "CustomerOrderItem_warehouseId_fkey"
      FOREIGN KEY ("warehouseId") REFERENCES "shop_warehouses"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;

    DROP TABLE "_MigrationRepairShopWarehouseShim";
  END IF;
END
$repair$;
