import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const expectedMigrations = [
  '20260728164000_prepare_shop_warehouse_dependency',
  '20260728205000_release_shop_warehouse_dependency',
  '20260728211000_restore_shop_warehouse_dependency',
  '20260729223000_add_part_taxonomy_studio',
  '20260729224000_align_generated_index_names',
];
const expectedIndexes = [
  'PartCategoryCatalogItemMapping_sourceCategoryId_targetCatal_key',
  'VehicleModification_generationId_bodyTypeId_engineId_transm_key',
];
const oldIndexes = [
  'PartCategoryCatalogItemMapping_sourceCategoryId_targetCatalogIt',
  'VehicleModification_identity_key',
];

const prisma = new PrismaClient();

async function main() {
  const migrations = await prisma.$queryRaw<
    Array<{
      migration_name: string;
      finished: boolean;
      rolled_back: boolean;
      has_logs: boolean;
      records: bigint;
    }>
  >`
    SELECT migration_name,
           bool_and(finished_at IS NOT NULL) AS finished,
           bool_or(rolled_back_at IS NOT NULL) AS rolled_back,
           bool_or(logs IS NOT NULL AND logs <> '') AS has_logs,
           COUNT(*)::bigint AS records
    FROM "_prisma_migrations"
    WHERE migration_name = ANY(${expectedMigrations}::text[])
    GROUP BY migration_name
    ORDER BY migration_name
  `;
  const indexes = await prisma.$queryRaw<
    Array<{ indexname: string; indexdef: string }>
  >`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = ANY(${[...expectedIndexes, ...oldIndexes]}::text[])
    ORDER BY indexname
  `;
  const foreignKeys = await prisma.$queryRaw<
    Array<{ constraint_name: string; definition: string }>
  >`
    SELECT c.conname AS constraint_name, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'CustomerOrderItem'
      AND c.conname = 'CustomerOrderItem_warehouseId_fkey'
  `;

  const invalidMigration = migrations.find(
    (migration) =>
      !migration.finished ||
      migration.rolled_back ||
      migration.has_logs ||
      migration.records !== 1n,
  );
  if (migrations.length !== expectedMigrations.length || invalidMigration) {
    throw new Error('Production migration records failed integrity checks');
  }
  if (
    indexes.length !== expectedIndexes.length ||
    indexes.some((index) => oldIndexes.includes(index.indexname))
  ) {
    throw new Error('Production index names failed integrity checks');
  }
  if (
    foreignKeys.length !== 1 ||
    !foreignKeys[0].definition.includes('shop_warehouses')
  ) {
    throw new Error('Warehouse foreign key failed integrity checks');
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        migrations: migrations.map((migration) => ({
          ...migration,
          records: Number(migration.records),
        })),
        indexes,
        foreignKeys,
      },
      null,
      2,
    )}\n`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
