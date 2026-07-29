import 'dotenv/config';
import { PartPosition, PartSide, Prisma, PrismaClient } from '@prisma/client';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../src/common/utils/part-name-normalizer';

const prisma = new PrismaClient();

type Candidate = {
  id: string;
  name: string;
  slug: string;
  path: string;
  needsReview: boolean;
  existingCatalogItemId: string | null;
};

function selectedCategoryIds() {
  return process.argv
    .filter((argument) => argument.startsWith('--category-id='))
    .map((argument) => argument.slice('--category-id='.length))
    .filter(Boolean);
}

async function loadCandidates(): Promise<Candidate[]> {
  const categories = await prisma.partCategory.findMany({
    where: { isActive: true, children: { none: {} } },
    select: {
      id: true,
      name: true,
      slug: true,
      needsReview: true,
      parent: {
        select: {
          name: true,
          parent: { select: { name: true } },
        },
      },
      partCatalogItems: {
        where: {
          side: PartSide.NONE,
          position: PartPosition.NONE,
        },
        select: {
          id: true,
          name: true,
          normalizedName: true,
          slug: true,
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  return categories.map((category) => {
    const normalizedName = normalizePartName(category.name);
    const existing = category.partCatalogItems.find(
      (item) =>
        item.normalizedName === normalizedName ||
        item.slug.toLocaleLowerCase('ru-RU') ===
          category.slug.toLocaleLowerCase('ru-RU'),
    );
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      path: [
        category.parent?.parent?.name,
        category.parent?.name,
        category.name,
      ]
        .filter(Boolean)
        .join(' > '),
      needsReview: category.needsReview,
      existingCatalogItemId: existing?.id ?? null,
    };
  });
}

async function createCatalogItem(category: Candidate) {
  return prisma.$transaction(async (tx) => {
    const freshCategory = await tx.partCategory.findFirst({
      where: {
        id: category.id,
        isActive: true,
        children: { none: {} },
      },
      select: { id: true, name: true, slug: true },
    });
    if (!freshCategory) {
      throw new Error(
        `Категория ${category.id} больше не является активным листом`,
      );
    }

    const normalizedName = normalizePartName(freshCategory.name);
    const duplicate = await tx.partCatalogItem.findFirst({
      where: {
        categoryId: freshCategory.id,
        side: PartSide.NONE,
        position: PartPosition.NONE,
        OR: [
          { normalizedName },
          {
            name: {
              equals: freshCategory.name,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              equals: freshCategory.slug,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { id: true },
    });
    if (duplicate) return { status: 'existing' as const, id: duplicate.id };

    const sequence = await tx.appSequence.upsert({
      where: { key: 'PART_CATALOG' },
      create: { key: 'PART_CATALOG', value: 1 },
      update: { value: { increment: 1 } },
    });
    const created = await tx.partCatalogItem.create({
      data: {
        internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
        name: freshCategory.name,
        normalizedName,
        searchTokens: getPartNameSearchTokens(freshCategory.name),
        slug: freshCategory.slug,
        categoryId: freshCategory.id,
        side: PartSide.NONE,
        position: PartPosition.NONE,
        isUniversal: false,
        isActive: true,
      },
      select: { id: true },
    });
    return { status: 'created' as const, id: created.id };
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Скрипт запрещён в production. Сначала выполните preview и резервное копирование.',
    );
  }

  const apply = process.argv.includes('--apply');
  const ids = selectedCategoryIds();
  const candidates = await loadCandidates();
  const missing = candidates.filter((item) => !item.existingCatalogItemId);

  console.log(`Активных листовых категорий: ${candidates.length}`);
  console.log(
    `Уже имеют одноимённую позицию в своей категории: ${
      candidates.length - missing.length
    }`,
  );
  console.log(`Кандидатов без позиции: ${missing.length}`);
  console.table(
    missing.slice(0, 100).map((item) => ({
      id: item.id,
      path: item.path,
      needsReview: item.needsReview,
    })),
  );

  if (!apply) {
    console.log(
      'PREVIEW ONLY: данные не изменены. Для явно проверенных категорий используйте --apply и повторяемый --category-id=<uuid>.',
    );
    return;
  }
  if (ids.length === 0) {
    throw new Error(
      'Для --apply требуется хотя бы один явный --category-id=<uuid>. Массовое создание всех листьев запрещено.',
    );
  }

  const selected = ids.map((id) => {
    const candidate = candidates.find((item) => item.id === id);
    if (!candidate) {
      throw new Error(
        `Категория ${id} не найдена среди активных листовых категорий`,
      );
    }
    return candidate;
  });

  for (const category of selected) {
    try {
      const result = await createCatalogItem(category);
      console.log(`${result.status}: ${category.path} -> ${result.id}`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.log(`existing (unique conflict): ${category.path}`);
        continue;
      }
      throw error;
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
