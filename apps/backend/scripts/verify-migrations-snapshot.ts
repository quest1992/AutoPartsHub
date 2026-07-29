import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const backupPath = process.argv[2];
if (!backupPath) {
  throw new Error(
    'Usage: tsx scripts/verify-migrations-snapshot.ts <backup.dump>',
  );
}
const testUrl = process.env.DATABASE_URL_TEST;
if (!testUrl || !/test/i.test(new URL(testUrl).pathname)) {
  throw new Error('DATABASE_URL_TEST must point to a test database');
}

const databaseName = 'autostock_repair_snapshot_test';
const maintenanceUrl = new URL(testUrl);
maintenanceUrl.pathname = '/postgres';
maintenanceUrl.searchParams.delete('schema');
const snapshotUrl = new URL(testUrl);
snapshotUrl.pathname = `/${databaseName}`;
snapshotUrl.searchParams.delete('schema');

function run(command: string, args: string[], databaseUrl?: string) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
    },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

async function counts(prisma: PrismaClient) {
  const [
    categories,
    catalogItems,
    aliases,
    mappings,
    inventory,
    movement,
    sales,
    saleItems,
    purchases,
    purchaseItems,
    orders,
    orderItems,
    payments,
    payables,
    payouts,
    quantities,
  ] = await Promise.all([
    prisma.partCategory.count(),
    prisma.partCatalogItem.count(),
    prisma.partAlias.count(),
    prisma.partCategoryCatalogItemMapping.count(),
    prisma.shopInventoryItem.count(),
    prisma.inventoryMovement.count(),
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.purchase.count(),
    prisma.purchaseItem.count(),
    prisma.customerOrder.count(),
    prisma.customerOrderItem.count(),
    prisma.customerOrderPayment.count(),
    prisma.shopPayable.count(),
    prisma.shopPayout.count(),
    prisma.shopInventoryItem.aggregate({
      _sum: { quantity: true, reservedQuantity: true },
    }),
  ]);
  return {
    categories,
    catalogItems,
    aliases,
    mappings,
    inventory,
    quantity: quantities._sum.quantity ?? 0,
    reservedQuantity: quantities._sum.reservedQuantity ?? 0,
    movement,
    sales,
    saleItems,
    purchases,
    purchaseItems,
    orders,
    orderItems,
    payments,
    payables,
    payouts,
  };
}

const prismaCli = require.resolve('prisma/build/index.js');
async function main() {
  let prisma: PrismaClient | undefined;
  try {
    run('dropdb', [
      '--if-exists',
      `--maintenance-db=${maintenanceUrl.toString()}`,
      databaseName,
    ]);
    run('createdb', [
      `--maintenance-db=${maintenanceUrl.toString()}`,
      databaseName,
    ]);
    run('pg_restore', [
      '--no-owner',
      '--no-privileges',
      `--dbname=${snapshotUrl.toString()}`,
      backupPath,
    ]);
    prisma = new PrismaClient({
      datasources: { db: { url: snapshotUrl.toString() } },
    });
    const before = await counts(prisma);
    await prisma.$disconnect();
    prisma = undefined;

    run(
      process.execPath,
      [prismaCli, 'migrate', 'deploy', '--config', 'prisma.config.ts'],
      snapshotUrl.toString(),
    );
    run(
      process.execPath,
      [prismaCli, 'migrate', 'status', '--config', 'prisma.config.ts'],
      snapshotUrl.toString(),
    );
    run(
      process.execPath,
      [
        prismaCli,
        'migrate',
        'diff',
        '--from-url',
        snapshotUrl.toString(),
        '--to-schema-datamodel',
        'prisma/schema.prisma',
        '--exit-code',
      ],
      snapshotUrl.toString(),
    );
    prisma = new PrismaClient({
      datasources: { db: { url: snapshotUrl.toString() } },
    });
    const after = await counts(prisma);
    const [decisions, auditEvents] = await Promise.all([
      prisma.partTaxonomyDecision.count(),
      prisma.partTaxonomyAuditEvent.count(),
    ]);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(
        `Snapshot data invariants changed: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`,
      );
    }
    if (decisions !== 0 || auditEvents !== 0) {
      throw new Error(
        `Snapshot taxonomy tables are not empty: decisions=${decisions}, audit=${auditEvents}`,
      );
    }
    process.stdout.write(`Snapshot invariants: ${JSON.stringify(after)}\n`);
    process.stdout.write('Production snapshot migration verification passed\n');
  } finally {
    if (prisma) await prisma.$disconnect();
    run('dropdb', [
      '--if-exists',
      `--maintenance-db=${maintenanceUrl.toString()}`,
      databaseName,
    ]);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
