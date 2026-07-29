import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { flattenCatalogV2 } from '../src/part-categories/data/catalog-v2';

const prisma = new PrismaClient();

async function main() {
  const expected = flattenCatalogV2();
  const categories = await prisma.partCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      isActive: true,
    },
  });
  const byParentAndSlug = new Map(
    categories.map((category) => [
      `${category.parentId ?? 'root'}:${category.slug}`,
      category,
    ]),
  );
  const categoryIdByKey = new Map<string, string>();
  const errors: string[] = [];

  for (const row of expected) {
    const parentId = row.parentKey ? categoryIdByKey.get(row.parentKey) : null;
    const category = byParentAndSlug.get(`${parentId ?? 'root'}:${row.slug}`);
    if (!category) {
      errors.push(`Missing category ${row.key}.`);
      continue;
    }
    if (category.name !== row.name)
      errors.push(`Unexpected name at ${row.key}: "${category.name}".`);
    if (!category.isActive)
      errors.push(`Inactive Catalog v2 category ${row.key}.`);
    categoryIdByKey.set(row.key, category.id);
  }

  const v2CategoryIds = new Set(categoryIdByKey.values());
  const v2LeafCategoryIds = new Set(
    expected
      .filter((row) => !row.children?.length)
      .map((row) => categoryIdByKey.get(row.key))
      .filter((id): id is string => Boolean(id)),
  );
  const items = await prisma.partCatalogItem.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      categoryId: true,
      isActive: true,
    },
  });
  const activeItems = items.filter((item) => item.isActive);
  const activeCategories = categories.filter((category) => category.isActive);

  for (const category of activeCategories) {
    if (!v2CategoryIds.has(category.id))
      errors.push(`Legacy category ${category.id} is still active.`);
  }
  for (const item of activeItems) {
    if (!v2LeafCategoryIds.has(item.categoryId))
      errors.push(`Active item ${item.id} is outside a Catalog v2 leaf.`);
  }
  for (const leafCategoryId of v2LeafCategoryIds) {
    const leafItems = activeItems.filter(
      (item) => item.categoryId === leafCategoryId,
    );
    if (leafItems.length !== 1)
      errors.push(
        `Catalog v2 leaf ${leafCategoryId} has ${leafItems.length} active items.`,
      );
  }

  const activeCategorySlugs = new Set<string>();
  for (const category of activeCategories) {
    if (activeCategorySlugs.has(category.slug))
      errors.push(`Duplicate active category slug "${category.slug}".`);
    activeCategorySlugs.add(category.slug);
  }
  const activeItemSlugs = new Set<string>();
  for (const item of activeItems) {
    if (activeItemSlugs.has(item.slug))
      errors.push(`Duplicate active item slug "${item.slug}".`);
    activeItemSlugs.add(item.slug);
  }

  const parentById = new Map(
    categories.map((category) => [category.id, category.parentId]),
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

  if (errors.length)
    throw new Error(
      `Catalog v2 live verification failed:\n${errors.join('\n')}`,
    );

  process.stdout.write(
    `${JSON.stringify({
      activeCategories: activeCategories.length,
      activeCatalogItems: activeItems.length,
      archivedCategories: categories.length - activeCategories.length,
      archivedCatalogItems: items.length - activeItems.length,
      inactiveCatalogV2Categories: 0,
      inactiveCatalogV2Items: 0,
      orphanCatalogItems: 0,
      duplicateActiveCategorySlugs: 0,
      duplicateActiveItemSlugs: 0,
      categoryCycles: 0,
    })}\n`,
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
