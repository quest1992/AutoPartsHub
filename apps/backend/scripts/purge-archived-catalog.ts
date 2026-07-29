import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { buildInventoryKey } from '../src/common/utils/inventory-key';

const prisma = new PrismaClient();
const shouldApply = process.argv.includes('--apply');
const confirmation = 'PURGE_ARCHIVED_CATALOG_AFTER_BACKUP';

const itemTargets = new Map<string, string>([
  ['PRT-000001', 'bumper-cover'],
  ['PRT-000002', 'brake-pads'],
  ['PRT-000003', 'oil-filter'],
  ['PRT-000004', 'air-filter'],
  ['PRT-000005', 'shock-absorber'],
  ['PRT-000006', 'accessory-drive-belt'],
  ['PRT-000007', 'side-mirror'],
  ['PRT-000008', 'clutch-kit'],
  ['PRT-000009', 'bumper-cover'],
] as const);

async function main() {
  const archivedItems = await prisma.partCatalogItem.findMany({
    where: { isActive: false },
    select: {
      id: true,
      internalCode: true,
      name: true,
      shopInventoryItems: {
        select: {
          id: true,
          shopId: true,
          warehouseId: true,
          sku: true,
          oemNumber: true,
          brand: true,
          condition: true,
        },
      },
      _count: {
        select: {
          shopInventoryItems: true,
          saleItems: true,
          purchaseItems: true,
          customerOrderItems: true,
          inventoryTransferItems: true,
          compatibilities: true,
          vehicleFitments: true,
          partNumbers: true,
          aliases: true,
          categoryMappings: true,
          taxonomyDecisions: true,
          partCatalogSuggestions: true,
          replacements: true,
        },
      },
    },
  });
  const archivedCategories = await prisma.partCategory.findMany({
    where: { isActive: false },
    select: { id: true, parentId: true },
  });
  const referencedItems = archivedItems.filter((item) =>
    [
      item._count.shopInventoryItems,
      item._count.saleItems,
      item._count.purchaseItems,
      item._count.customerOrderItems,
      item._count.inventoryTransferItems,
      item._count.compatibilities,
      item._count.vehicleFitments,
      item._count.partNumbers,
      item._count.partCatalogSuggestions,
      item._count.replacements,
    ].some((count) => count > 0),
  );
  const missingMappings = referencedItems.filter(
    (item) => !itemTargets.has(item.internalCode),
  );
  if (missingMappings.length) {
    throw new Error(
      `Archived items require an approved target: ${missingMappings
        .map((item) => `${item.internalCode} ${item.name}`)
        .join(', ')}`,
    );
  }

  const plan = {
    archivedCategories: archivedCategories.length,
    archivedCatalogItems: archivedItems.length,
    archivedAliases: archivedItems.reduce(
      (sum, item) => sum + item._count.aliases,
      0,
    ),
    referencedCatalogItemsToRelink: referencedItems.length,
    inventoryItemsToRelink: archivedItems.reduce(
      (sum, item) => sum + item._count.shopInventoryItems,
      0,
    ),
    saleItemsToRelink: archivedItems.reduce(
      (sum, item) => sum + item._count.saleItems,
      0,
    ),
  };
  process.stdout.write(`Archive purge plan: ${JSON.stringify(plan)}\n`);

  if (!shouldApply) {
    process.stdout.write('Dry run only. No database changes were made.\n');
    return;
  }
  if (process.env.CATALOG_ARCHIVE_PURGE_CONFIRM !== confirmation) {
    throw new Error(
      `Archive purge is locked. Set CATALOG_ARCHIVE_PURGE_CONFIRM=${confirmation} only after a verified backup.`,
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const oldCategoryIds = archivedCategories.map(({ id }) => id);
      const oldItemIds = archivedItems.map(({ id }) => id);
      const resolvedTargets = new Map<string, string>();

      for (const item of referencedItems) {
        const targetSlug = itemTargets.get(item.internalCode);
        if (!targetSlug)
          throw new Error(`No Catalog v2 target for ${item.internalCode}.`);
        const target = await tx.partCatalogItem.findFirst({
          where: {
            slug: targetSlug,
            isActive: true,
            category: { isActive: true },
          },
          select: { id: true, name: true },
        });
        if (!target)
          throw new Error(
            `Active Catalog v2 target "${targetSlug}" was not found for ${item.internalCode}.`,
          );
        resolvedTargets.set(item.id, target.id);

        for (const inventory of item.shopInventoryItems) {
          const inventoryKey = buildInventoryKey({
            shopId: inventory.shopId,
            warehouseId: inventory.warehouseId,
            partCatalogItemId: target.id,
            sku: inventory.sku,
            oemNumber: inventory.oemNumber,
            brand: inventory.brand,
            condition: inventory.condition,
          });
          const collision = await tx.shopInventoryItem.findFirst({
            where: { inventoryKey, id: { not: inventory.id } },
            select: { id: true },
          });
          if (collision)
            throw new Error(
              `Inventory ${inventory.id} would collide with ${collision.id} after relinking.`,
            );
          await tx.shopInventoryItem.update({
            where: { id: inventory.id },
            data: { partCatalogItemId: target.id, inventoryKey },
          });
        }

        await Promise.all([
          tx.saleItem.updateMany({
            where: { partCatalogItemId: item.id },
            data: { partCatalogItemId: target.id },
          }),
          tx.purchaseItem.updateMany({
            where: { partCatalogItemId: item.id },
            data: { partCatalogItemId: target.id },
          }),
          tx.customerOrderItem.updateMany({
            where: { catalogItemId: item.id },
            data: { catalogItemId: target.id },
          }),
          tx.inventoryTransferItem.updateMany({
            where: { catalogItemId: item.id },
            data: { catalogItemId: target.id },
          }),
          tx.inventoryMovement.updateMany({
            where: { partCatalogItemId: item.id },
            data: { partCatalogItemId: target.id },
          }),
          tx.partNumber.updateMany({
            where: { partCatalogItemId: item.id },
            data: { partCatalogItemId: target.id },
          }),
          tx.vehicleFitment.updateMany({
            where: { catalogItemId: item.id },
            data: { catalogItemId: target.id },
          }),
          tx.partCatalogSuggestion.updateMany({
            where: { mergedIntoId: item.id },
            data: { mergedIntoId: target.id },
          }),
          tx.partCatalogItem.updateMany({
            where: { replacedById: item.id },
            data: { replacedById: target.id },
          }),
        ]);

        const compatibilities = await tx.partCompatibility.findMany({
          where: { partCatalogItemId: item.id },
        });
        for (const compatibility of compatibilities) {
          const duplicate = await tx.partCompatibility.findUnique({
            where: {
              partCatalogItemId_vehicleGenerationId: {
                partCatalogItemId: target.id,
                vehicleGenerationId: compatibility.vehicleGenerationId,
              },
            },
            select: { id: true },
          });
          if (duplicate) {
            await tx.partCompatibility.delete({
              where: { id: compatibility.id },
            });
          } else {
            await tx.partCompatibility.update({
              where: { id: compatibility.id },
              data: { partCatalogItemId: target.id },
            });
          }
        }
      }

      const mappings = await tx.partCategoryCatalogItemMapping.findMany({
        where: {
          OR: [
            { sourceCategoryId: { in: oldCategoryIds } },
            { targetCatalogItemId: { in: oldItemIds } },
          ],
        },
        select: { id: true },
      });
      const decisions = await tx.partTaxonomyDecision.findMany({
        where: {
          OR: [
            { sourceCategoryId: { in: oldCategoryIds } },
            { targetCategoryId: { in: oldCategoryIds } },
            { targetCatalogItemId: { in: oldItemIds } },
          ],
        },
        select: { id: true },
      });
      const taxonomyEntityIds = [
        ...oldCategoryIds,
        ...oldItemIds,
        ...mappings.map(({ id }) => id),
        ...decisions.map(({ id }) => id),
      ];
      const deletedAuditEvents = await tx.partTaxonomyAuditEvent.deleteMany({
        where: { entityId: { in: taxonomyEntityIds } },
      });
      const deletedDecisions = await tx.partTaxonomyDecision.deleteMany({
        where: { id: { in: decisions.map(({ id }) => id) } },
      });
      const deletedMappings =
        await tx.partCategoryCatalogItemMapping.deleteMany({
          where: { id: { in: mappings.map(({ id }) => id) } },
        });
      const deletedAliases = await tx.partAlias.deleteMany({
        where: { partCatalogItemId: { in: oldItemIds } },
      });

      await tx.partNumber.deleteMany({
        where: { partCatalogItemId: { in: oldItemIds } },
      });
      const deletedItems = await tx.partCatalogItem.deleteMany({
        where: { id: { in: oldItemIds } },
      });

      const remainingCategories = new Map(
        archivedCategories.map(({ id, parentId }) => [id, parentId]),
      );
      let deletedCategoryCount = 0;
      while (remainingCategories.size) {
        const parentIds = new Set(
          [...remainingCategories.values()].filter(
            (id): id is string =>
              id !== null && remainingCategories.has(id),
          ),
        );
        const leafIds = [...remainingCategories.keys()].filter(
          (id) => !parentIds.has(id),
        );
        if (!leafIds.length)
          throw new Error('Cycle detected in archived categories.');
        const deleted = await tx.partCategory.deleteMany({
          where: { id: { in: leafIds } },
        });
        deletedCategoryCount += deleted.count;
        leafIds.forEach((id) => remainingCategories.delete(id));
      }

      const [remainingArchivedCategories, remainingArchivedItems] =
        await Promise.all([
          tx.partCategory.count({ where: { isActive: false } }),
          tx.partCatalogItem.count({ where: { isActive: false } }),
        ]);
      if (remainingArchivedCategories || remainingArchivedItems) {
        throw new Error(
          `Archive remains after purge: categories=${remainingArchivedCategories}, items=${remainingArchivedItems}.`,
        );
      }

      return {
        deletedCategories: deletedCategoryCount,
        deletedCatalogItems: deletedItems.count,
        deletedAliases: deletedAliases.count,
        deletedTaxonomyMappings: deletedMappings.count,
        deletedTaxonomyDecisions: deletedDecisions.count,
        deletedTaxonomyAuditEvents: deletedAuditEvents.count,
        relinkedCatalogItems: resolvedTargets.size,
        relinkedInventoryItems: plan.inventoryItemsToRelink,
        relinkedSaleItems: plan.saleItemsToRelink,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
