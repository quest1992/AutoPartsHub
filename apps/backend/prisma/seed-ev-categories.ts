import 'dotenv/config';

import { Prisma, PrismaClient } from '@prisma/client';
import { masterPartCategories } from '../src/part-categories/data/master-part-categories';

const prisma = new PrismaClient();

type ImportReport = {
  created: number;
  existing: number;
  skipped: number;
  errors: number;
};

function normalizeName(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[\s-]+/g, ' ')
    .trim();
}

async function findExistingCategory(
  parentId: string | null,
  slug: string,
  name: string,
) {
  const bySlug = await prisma.partCategory.findFirst({
    where: { parentId, slug: { equals: slug, mode: 'insensitive' } },
    select: { id: true, slug: true, name: true },
  });
  if (bySlug) return bySlug;

  const siblings = await prisma.partCategory.findMany({
    where: { parentId },
    select: { id: true, slug: true, name: true },
  });
  return siblings.find((category) => normalizeName(category.name) === normalizeName(name));
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Part category seed cannot run when NODE_ENV=production.');
  }

  const report: ImportReport = { created: 0, existing: 0, skipped: 0, errors: 0 };
  const parents = new Map<string, { id: string; depth: number }>();

  for (const item of masterPartCategories) {
    const parent = item.parentKey ? parents.get(item.parentKey) : undefined;
    if (item.parentKey && !parent) {
      report.skipped += 1;
      console.error(`Skipped ${item.slug}: parent ${item.parentKey} was not imported.`);
      continue;
    }

    const depth = parent ? parent.depth + 1 : 1;
    if (depth > 3) {
      report.errors += 1;
      console.error(`Skipped ${item.slug}: category depth exceeds 3.`);
      continue;
    }

    const parentId = parent?.id ?? null;
    try {
      const existing = await findExistingCategory(parentId, item.slug, item.name);
      if (existing) {
        report.existing += 1;
        parents.set(item.key, { id: existing.id, depth });
        continue;
      }

      const created = await prisma.partCategory.create({
        data: {
          name: item.name,
          slug: item.slug,
          parentId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        },
        select: { id: true },
      });
      report.created += 1;
      parents.set(item.key, { id: created.id, depth });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await findExistingCategory(parentId, item.slug, item.name);
        if (existing) {
          report.existing += 1;
          parents.set(item.key, { id: existing.id, depth });
          continue;
        }
      }
      report.errors += 1;
      console.error(`Failed to import ${item.slug}:`, error);
    }
  }

  console.log('Part category import report');
  console.log(`Created: ${report.created}`);
  console.log(`Already existed: ${report.existing}`);
  console.log(`Skipped: ${report.skipped}`);
  console.log(`Errors: ${report.errors}`);

  if (report.errors > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error('Failed to import EV categories.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
