import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function count(table: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM "${table}"`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function main() {
  const migration = await prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >(
    'SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration_name = $1',
    '20260729120000_add_vehicle_database_foundation',
  );

  const tables = [
    'Manufacturer',
    'VehicleModel',
    'VehicleGeneration',
    'Engine',
    'VehicleFitment',
    'PartCatalogItem',
    'ShopInventoryItem',
    'InventoryMovement',
    'Shop',
    'User',
  ];
  const counts = Object.fromEntries(
    await Promise.all(tables.map(async (table) => [table, await count(table)])),
  );
  const inventory = await prisma.$queryRawUnsafe<
    Array<{ quantity: bigint; reserved_quantity: bigint }>
  >(
    'SELECT COALESCE(SUM("quantity"), 0)::bigint AS quantity, COALESCE(SUM("reservedQuantity"), 0)::bigint AS reserved_quantity FROM "ShopInventoryItem"',
  );
  const registryCounts = Object.fromEntries(
    await Promise.all(
      [
        'BodyType',
        'FuelType',
        'DriveType',
        'TransmissionType',
        'SteeringPosition',
        'MarketRegion',
        'VehicleModification',
      ].map(async (table) => [table, await count(table)]),
    ),
  );
  const diagnostics = await prisma.$queryRawUnsafe<
    Array<{
      engines_without_manufacturer: bigint;
      engines_without_fuel_type: bigint;
      engine_manufacturer_mismatch: bigint;
      engine_fuel_mismatch: bigint;
      orphan_modifications: bigint;
    }>
  >(`
    SELECT
      (SELECT COUNT(*) FROM "Engine" WHERE "manufacturerId" IS NULL)::bigint AS engines_without_manufacturer,
      (SELECT COUNT(*) FROM "Engine" WHERE "fuelTypeId" IS NULL)::bigint AS engines_without_fuel_type,
      (
        SELECT COUNT(*) FROM "Engine" e
        JOIN "VehicleGeneration" g ON g.id = e."generationId"
        JOIN "VehicleModel" vm ON vm.id = g."vehicleModelId"
        WHERE e."manufacturerId" <> vm."manufacturerId"
      )::bigint AS engine_manufacturer_mismatch,
      (
        SELECT COUNT(*) FROM "Engine" e
        JOIN "FuelType" f ON f.id = e."fuelTypeId"
        WHERE lower(trim(e.fuel)) <> lower(trim(f.name))
      )::bigint AS engine_fuel_mismatch,
      (
        SELECT COUNT(*) FROM "VehicleModification" m
        LEFT JOIN "VehicleGeneration" g ON g.id = m."generationId"
        LEFT JOIN "Engine" e ON e.id = m."engineId"
        LEFT JOIN "BodyType" b ON b.id = m."bodyTypeId"
        LEFT JOIN "TransmissionType" t ON t.id = m."transmissionTypeId"
        LEFT JOIN "DriveType" d ON d.id = m."driveTypeId"
        LEFT JOIN "FuelType" f ON f.id = m."fuelTypeId"
        LEFT JOIN "SteeringPosition" s ON s.id = m."steeringPositionId"
        LEFT JOIN "MarketRegion" r ON r.id = m."marketRegionId"
        WHERE g.id IS NULL OR e.id IS NULL OR b.id IS NULL OR t.id IS NULL
          OR d.id IS NULL OR f.id IS NULL OR s.id IS NULL OR r.id IS NULL
      )::bigint AS orphan_modifications
  `);

  console.log(
    JSON.stringify(
      {
        migration: migration.map((row) => ({
          ...row,
          finished_at: row.finished_at?.toISOString() ?? null,
          rolled_back_at: row.rolled_back_at?.toISOString() ?? null,
        })),
        counts,
        registryCounts,
        inventory: {
          quantity: Number(inventory[0]?.quantity ?? 0),
          reservedQuantity: Number(inventory[0]?.reserved_quantity ?? 0),
        },
        diagnostics: Object.fromEntries(
          Object.entries(diagnostics[0] ?? {}).map(([key, value]) => [
            key,
            Number(value),
          ]),
        ),
      },
      null,
      2,
    ),
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
