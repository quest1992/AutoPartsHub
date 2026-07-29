import 'dotenv/config';
import { PartPosition, PartSide, Prisma, PrismaClient } from '@prisma/client';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../src/common/utils/part-name-normalizer';
import {
  flattenCatalogV2,
  getCatalogV2Stats,
  validateCatalogV2,
} from '../src/part-categories/data/catalog-v2';

const shouldApply = process.argv.includes('--apply');
const confirmation = 'ARCHIVE_OLD_AND_ACTIVATE_V2';

async function verifyCatalogV2(
  prisma: Prisma.TransactionClient,
  expectedCategoryIds: Set<string>,
  expectedItemIds: Set<string>,
) {
  const [activeCategories, activeItems] = await Promise.all([
    prisma.partCategory.findMany({
      where: { isActive: true },
      select: { id: true, parentId: true, slug: true },
    }),
    prisma.partCatalogItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        categoryId: true,
        slug: true,
        category: { select: { isActive: true } },
      },
    }),
  ]);

  const errors: string[] = [];
  if (activeCategories.length !== expectedCategoryIds.size) {
    errors.push(
      `Expected ${expectedCategoryIds.size} active Catalog v2 categories, found ${activeCategories.length}.`,
    );
  }
  if (activeItems.length !== expectedItemIds.size) {
    errors.push(
      `Expected ${expectedItemIds.size} active Catalog v2 items, found ${activeItems.length}.`,
    );
  }

  const activeCategoryIds = new Set(activeCategories.map(({ id }) => id));
  for (const category of activeCategories) {
    if (!expectedCategoryIds.has(category.id))
      errors.push(`Unexpected active legacy category ${category.id}.`);
    if (category.parentId && !activeCategoryIds.has(category.parentId))
      errors.push(`Category ${category.id} has no active Catalog v2 parent.`);
  }
  for (const item of activeItems) {
    if (!expectedItemIds.has(item.id))
      errors.push(`Unexpected active legacy catalog item ${item.id}.`);
    if (!activeCategoryIds.has(item.categoryId) || !item.category.isActive)
      errors.push(`Catalog item ${item.id} has an inactive category.`);
  }

  const categorySlugs = new Set<string>();
  for (const category of activeCategories) {
    if (categorySlugs.has(category.slug))
      errors.push(`Duplicate active category slug "${category.slug}".`);
    categorySlugs.add(category.slug);
  }
  const itemSlugs = new Set<string>();
  for (const item of activeItems) {
    if (itemSlugs.has(item.slug))
      errors.push(`Duplicate active catalog item slug "${item.slug}".`);
    itemSlugs.add(item.slug);
  }

  const parentById = new Map(
    activeCategories.map(({ id, parentId }) => [id, parentId]),
  );
  for (const category of activeCategories) {
    const visited = new Set<string>();
    let currentId: string | null = category.id;
    while (currentId) {
      if (visited.has(currentId)) {
        errors.push(`Cycle detected from category ${category.id}.`);
        break;
      }
      visited.add(currentId);
      currentId = parentById.get(currentId) ?? null;
    }
  }

  if (errors.length) {
    throw new Error(`Catalog v2 integrity check failed:\n${errors.join('\n')}`);
  }

  return {
    activeCategories: activeCategories.length,
    activeCatalogItems: activeItems.length,
  };
}

async function main() {
  const errors = validateCatalogV2();
  if (errors.length)
    throw new Error(`Catalog v2 is invalid:\n${errors.join('\n')}`);

  const rows = flattenCatalogV2();
  const leaves = rows.filter((row) => !row.children?.length);
  const stats = getCatalogV2Stats();
  process.stdout.write(
    `Catalog v2 switch plan: ${JSON.stringify({ ...stats, catalogItems: leaves.length })}\n`,
  );

  if (!shouldApply) {
    process.stdout.write(
      'Dry run only. No database connection or changes were made. Use --apply with the explicit switch confirmation after a verified backup.\n',
    );
    return;
  }
  if (process.env.CATALOG_V2_SWITCH_CONFIRM !== confirmation) {
    throw new Error(
      `Catalog v2 switch is locked. Set CATALOG_V2_SWITCH_CONFIRM=${confirmation} only after a verified backup.`,
    );
  }

  const prisma = new PrismaClient();
  try {
    const before = await prisma.$transaction(async (tx) => {
      const categoryIds = new Map<string, string>();
      const itemIds = new Set<string>();
      let createdCategories = 0;
      let createdCatalogItems = 0;

      for (const row of rows) {
        const parentId = row.parentKey ? categoryIds.get(row.parentKey) : null;
        if (row.parentKey && !parentId)
          throw new Error(`Missing Catalog v2 parent ${row.parentKey}.`);

        const existing = await tx.partCategory.findFirst({
          where: { parentId, slug: row.slug },
          select: { id: true, name: true },
        });
        if (existing && existing.name !== row.name) {
          throw new Error(
            `Catalog v2 slug collision at ${row.key}: existing name "${existing.name}".`,
          );
        }
        const category =
          existing ??
          (await tx.partCategory.create({
            data: {
              name: row.name,
              slug: row.slug,
              description: row.description,
              parentId,
              sortOrder: row.sortOrder,
              isActive: false,
              needsReview: false,
            },
            select: { id: true, name: true },
          }));
        if (!existing) createdCategories += 1;
        categoryIds.set(row.key, category.id);
      }

      const v2CategoryIds = [...categoryIds.values()];
      const oldCategoryCount = await tx.partCategory.count({
        where: { id: { notIn: v2CategoryIds }, isActive: true },
      });
      const oldCatalogItemCount = await tx.partCatalogItem.count({
        where: {
          categoryId: { notIn: v2CategoryIds },
          isActive: true,
        },
      });

      for (const leaf of leaves) {
        const categoryId = categoryIds.get(leaf.key);
        if (!categoryId)
          throw new Error(`Missing Catalog v2 leaf category ${leaf.key}.`);
        const existing = await tx.partCatalogItem.findFirst({
          where: {
            categoryId,
            slug: leaf.slug,
            side: PartSide.NONE,
            position: PartPosition.NONE,
          },
          select: { id: true, name: true },
        });
        if (existing && existing.name !== leaf.name) {
          throw new Error(
            `Catalog v2 item collision at ${leaf.key}: existing name "${existing.name}".`,
          );
        }
        let item = existing;
        if (!item) {
          const sequence = await tx.appSequence.upsert({
            where: { key: 'PART_CATALOG' },
            create: { key: 'PART_CATALOG', value: 1 },
            update: { value: { increment: 1 } },
          });
          item = await tx.partCatalogItem.create({
            data: {
              internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
              name: leaf.name,
              normalizedName: normalizePartName(leaf.name),
              searchTokens: getPartNameSearchTokens(leaf.name),
              slug: leaf.slug,
              description: leaf.description,
              categoryId,
              side: PartSide.NONE,
              position: PartPosition.NONE,
              isUniversal: false,
              isActive: false,
            },
            select: { id: true, name: true },
          });
          createdCatalogItems += 1;
        }
        itemIds.add(item.id);
      }

      await tx.partCatalogItem.updateMany({
        where: { id: { notIn: [...itemIds] } },
        data: { isActive: false },
      });
      await tx.partCategory.updateMany({
        where: { id: { notIn: v2CategoryIds } },
        data: { isActive: false },
      });
      await tx.partCategory.updateMany({
        where: { id: { in: v2CategoryIds } },
        data: { isActive: true, needsReview: false },
      });
      await tx.partCatalogItem.updateMany({
        where: { id: { in: [...itemIds] } },
        data: { isActive: true },
      });

      const integrity = await verifyCatalogV2(
        tx,
        new Set(v2CategoryIds),
        itemIds,
      );
      return {
        categoryIds: v2CategoryIds,
        itemIds: [...itemIds],
        createdCategories,
        createdCatalogItems,
        deactivatedOldCategories: oldCategoryCount,
        deactivatedOldCatalogItems: oldCatalogItemCount,
        ...integrity,
      };
    });
    process.stdout.write(
      `${JSON.stringify({ ...before, categoryIds: undefined, itemIds: undefined })}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
