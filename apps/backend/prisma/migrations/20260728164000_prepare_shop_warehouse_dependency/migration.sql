-- Fresh-database compatibility shim.
-- Existing databases already have shop_warehouses, so this is a strict no-op there.
DO $repair$
BEGIN
  IF to_regclass('public.shop_warehouses') IS NULL THEN
    CREATE TABLE "shop_warehouses" (
      "id" TEXT NOT NULL,
      CONSTRAINT "shop_warehouses_repair_shim_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE "_MigrationRepairShopWarehouseShim" (
      "id" BOOLEAN NOT NULL DEFAULT true,
      CONSTRAINT "_MigrationRepairShopWarehouseShim_pkey" PRIMARY KEY ("id")
    );

    INSERT INTO "_MigrationRepairShopWarehouseShim" ("id") VALUES (true);
  END IF;
END
$repair$;
