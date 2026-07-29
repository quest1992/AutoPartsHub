import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const phase = process.argv[2];
if (phase !== 'pre' && phase !== 'post') {
  throw new Error(
    'Usage: tsx scripts/capture-production-taxonomy-counts.ts <pre|post>',
  );
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');
const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, '');
if (databaseName !== 'autostock') {
  throw new Error(
    `Expected production database "autostock", got "${databaseName}"`,
  );
}

const prisma = new PrismaClient();

async function main() {
  const [
    categories,
    activeCategories,
    catalogItems,
    activeCatalogItems,
    aliases,
    mappings,
    inventory,
    inventoryTotals,
    movements,
    sales,
    saleItems,
    saleTotals,
    purchases,
    purchaseItems,
    purchaseTotals,
    orders,
    orderItems,
    orderTotals,
    payments,
    paymentTotals,
    payables,
    payableTotals,
    payouts,
    payoutTotals,
    warehouses,
    warehouseRows,
    warehouseOrphans,
  ] = await Promise.all([
    prisma.partCategory.count(),
    prisma.partCategory.count({ where: { isActive: true } }),
    prisma.partCatalogItem.count(),
    prisma.partCatalogItem.count({ where: { isActive: true } }),
    prisma.partAlias.count(),
    prisma.partCategoryCatalogItemMapping.count(),
    prisma.shopInventoryItem.count(),
    prisma.shopInventoryItem.aggregate({
      _sum: { quantity: true, reservedQuantity: true },
    }),
    prisma.inventoryMovement.count(),
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    prisma.purchase.count(),
    prisma.purchaseItem.count(),
    prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
    prisma.customerOrder.count(),
    prisma.customerOrderItem.count(),
    prisma.customerOrder.aggregate({ _sum: { total: true } }),
    prisma.customerOrderPayment.count(),
    prisma.customerOrderPayment.aggregate({ _sum: { amount: true } }),
    prisma.shopPayable.count(),
    prisma.shopPayable.aggregate({ _sum: { payableAmount: true } }),
    prisma.shopPayout.count(),
    prisma.shopPayout.aggregate({ _sum: { amount: true } }),
    prisma.shopWarehouse.count(),
    prisma.shopWarehouse.findMany({
      select: { id: true, shopId: true, name: true, isActive: true },
      orderBy: { id: 'asc' },
    }),
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "CustomerOrderItem" coi
      LEFT JOIN "shop_warehouses" sw ON sw.id = coi."warehouseId"
      WHERE sw.id IS NULL
    `,
  ]);

  const warehouseDigest = createHash('sha256')
    .update(JSON.stringify(warehouseRows))
    .digest('hex');
  const taxonomyTables =
    phase === 'post'
      ? {
          decisions: await prisma.partTaxonomyDecision.count(),
          auditEvents: await prisma.partTaxonomyAuditEvent.count(),
        }
      : null;
  const snapshot = {
    capturedAt: new Date().toISOString(),
    databaseName,
    counts: {
      categories,
      activeCategories,
      catalogItems,
      activeCatalogItems,
      aliases,
      mappings,
      inventory,
      movements,
      sales,
      saleItems,
      purchases,
      purchaseItems,
      orders,
      orderItems,
      payments,
      payables,
      payouts,
      warehouses,
    },
    sums: {
      physicalQuantity: inventoryTotals._sum.quantity ?? 0,
      reservedQuantity: inventoryTotals._sum.reservedQuantity ?? 0,
      salesTotal: saleTotals._sum.totalAmount?.toString() ?? '0',
      purchasesTotal: purchaseTotals._sum.totalAmount?.toString() ?? '0',
      ordersTotal: orderTotals._sum.total?.toString() ?? '0',
      paymentsAmount: paymentTotals._sum.amount?.toString() ?? '0',
      payablesAmount: payableTotals._sum.payableAmount?.toString() ?? '0',
      payoutsAmount: payoutTotals._sum.amount?.toString() ?? '0',
    },
    warehouseIntegrity: {
      digest: warehouseDigest,
      orphanCustomerOrderItems: Number(warehouseOrphans[0]?.count ?? 0n),
    },
    taxonomyTables,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirectory = resolve(process.cwd(), '..', '..', 'backups');
  mkdirSync(backupDirectory, { recursive: true });
  const outputPath = resolve(
    backupDirectory,
    `production-${phase}-taxonomy-counts-${timestamp}.json`,
  );
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  process.stdout.write(`${outputPath}\n`);
  process.stdout.write(`${JSON.stringify(snapshot)}\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
