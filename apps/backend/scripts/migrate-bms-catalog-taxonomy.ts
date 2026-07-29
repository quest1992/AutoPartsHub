import 'dotenv/config';
import {
  PartCategoryClassification,
  PartPosition,
  PartSide,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../src/common/utils/part-name-normalizer';

const testMode = process.argv.includes('--test');
const datasourceUrl = testMode
  ? process.env.DATABASE_URL_TEST
  : process.env.DATABASE_URL;
if (testMode && !datasourceUrl)
  throw new Error('DATABASE_URL_TEST is required with --test');
if (testMode && !/test/i.test(new URL(datasourceUrl!).pathname))
  throw new Error(
    'Refusing --test for a database whose name does not contain "test"',
  );
const prisma = new PrismaClient({
  ...(datasourceUrl && { datasources: { db: { url: datasourceUrl } } }),
});
const apply = process.argv.includes('--apply');
const ROOT_ID = '5bf4487f-5faf-455d-af27-cdeaaab3fe33';
const SYSTEM_ID = '3e03133c-17ae-4859-9366-558f807f09ac';
const BMS_SLUG = 'bms';

const definitions = [
  [
    '05fb7828-bb34-432b-9819-18d6d68fa946',
    'Контроллер BMS',
    [
      'Контроллер BMS',
      'Блок BMS',
      'Блок управления BMS',
      'Блок управления батареей',
      'Блок управления батареей BMS',
      'Блоки управления батареей BMS',
      'Контроллер батареи',
    ],
  ],
  [
    'b23a97c7-c0ab-4da1-aaff-5bba11ae75d1',
    'Главная плата BMS',
    [
      'Главная плата BMS',
      'Главные платы BMS',
      'Главная плата',
      'Основная плата BMS',
      'Материнская плата BMS',
    ],
  ],
  [
    '53f5bd40-011d-4472-9f60-74333db058e9',
    'Плата контроля модуля BMS',
    [
      'Плата контроля модуля BMS',
      'Платы контроля модулей BMS',
      'Плата контроля модуля',
      'Модульная плата BMS',
      'Slave BMS',
      'BMS slave board',
    ],
  ],
  [
    'b031c269-e106-43d9-91e9-e2105e810647',
    'Балансировочная плата BMS',
    [
      'Балансировочная плата BMS',
      'Балансировочные платы',
      'Балансир BMS',
      'Плата балансировки батареи',
    ],
  ],
  [
    '2d484acc-bbf8-46d3-b86b-ddead117cf2c',
    'Датчик температуры батареи',
    [
      'Датчик температуры батареи',
      'Датчики температуры батареи',
      'Температурный датчик батареи',
      'BMS temperature sensor',
    ],
  ],
  [
    '347f82e3-f7e3-40bf-ba87-0c60dc6856ad',
    'Датчик тока батареи',
    [
      'Датчик тока батареи',
      'Датчики тока батареи',
      'Датчик тока BMS',
      'BMS current sensor',
    ],
  ],
  [
    'b6d6d652-0eb6-45f0-8858-ac66ee2e998d',
    'Датчик напряжения батареи',
    [
      'Датчик напряжения батареи',
      'Датчики напряжения батареи',
      'Датчик напряжения BMS',
      'BMS voltage sensor',
    ],
  ],
  [
    'cbe8bc63-0a8f-424b-831d-35d588ac8e6b',
    'Жгут проводов BMS',
    [
      'Жгут проводов BMS',
      'Жгуты проводов BMS',
      'Проводка BMS',
      'Кабель BMS',
      'BMS wiring harness',
    ],
  ],
] as const;

const invalidIds = [
  'd339db74-5949-4545-96f6-4bc4a491655d',
  'b836a385-c109-4c44-8fe1-0ed0cdea79af',
  '80ee1b3f-b5e9-4fc3-9843-fe105cbf81a9',
  'c2c3b949-42c4-449d-b177-ec4a50738a43',
  '31ee077a-eb32-4d38-a000-a81234a142aa',
] as const;

async function inspect() {
  const sourceIds = definitions.map(([id]) => id);
  const [root, system, sources, bms, mappings, invalid] = await Promise.all([
    prisma.partCategory.findUnique({
      where: { id: ROOT_ID },
      select: { id: true, name: true },
    }),
    prisma.partCategory.findUnique({
      where: { id: SYSTEM_ID },
      select: { id: true, name: true, parentId: true },
    }),
    prisma.partCategory.findMany({
      where: { id: { in: sourceIds } },
      select: {
        id: true,
        name: true,
        parentId: true,
        isActive: true,
        _count: {
          select: {
            children: true,
            partCatalogItems: true,
            partCatalogSuggestions: true,
            suggestedForModeration: true,
          },
        },
      },
    }),
    prisma.partCategory.findFirst({
      where: { parentId: SYSTEM_ID, slug: BMS_SLUG },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.partCategoryCatalogItemMapping.findMany({
      where: { migrationKey: { startsWith: 'BMS:' } },
      include: { targetCatalogItem: { select: { id: true, name: true } } },
    }),
    prisma.partCategory.findMany({
      where: { id: { in: [...invalidIds] } },
      select: {
        id: true,
        name: true,
        isActive: true,
        _count: {
          select: {
            children: true,
            partCatalogItems: true,
            partCatalogSuggestions: true,
            suggestedForModeration: true,
          },
        },
      },
    }),
  ]);
  const rows = definitions.map(([sourceCategoryId, canonicalName, aliases]) => {
    const source = sources.find((item) => item.id === sourceCategoryId);
    const mapping = mappings.find(
      (item) => item.migrationKey === `BMS:${sourceCategoryId}`,
    );
    return {
      sourceCategoryId,
      sourceName: source?.name ?? 'НЕ НАЙДЕНА',
      canonicalName,
      sourceActive: source?.isActive ?? false,
      dependencies: source?._count ?? null,
      targetItem: mapping?.targetCatalogItem ?? null,
      mappingExists: Boolean(mapping),
      aliases: aliases.length,
    };
  });
  const conflicts = [
    ...(!root ? ['Не найден корень Электромобили и гибриды'] : []),
    ...(!system || system.parentId !== ROOT_ID
      ? ['Неверный родитель Системы управления батареей']
      : []),
    ...rows
      .filter((row) => row.sourceName === 'НЕ НАЙДЕНА')
      .map((row) => `Не найдена ${row.sourceCategoryId}`),
    ...sources
      .filter((source) => source.parentId !== SYSTEM_ID)
      .map((source) => `Источник ${source.name} находится вне ожидаемой ветки`),
    ...sources
      .filter((source) => source._count.children > 0)
      .map((source) => `Источник ${source.name} имеет children`),
  ];
  return { root, system, bms, rows, invalid, conflicts };
}

async function execute() {
  const preview = await inspect();
  console.log(
    JSON.stringify({ mode: apply ? 'APPLY' : 'PREVIEW', ...preview }, null, 2),
  );
  if (!apply) return;
  if (preview.conflicts.length)
    throw new Error(`Apply остановлен: ${preview.conflicts.join('; ')}`);

  await prisma.$transaction(
    async (tx) => {
      const bms = await tx.partCategory.upsert({
        where: { parentId_slug: { parentId: SYSTEM_ID, slug: BMS_SLUG } },
        create: {
          name: 'BMS',
          slug: BMS_SLUG,
          parentId: SYSTEM_ID,
          isActive: true,
          needsReview: false,
        },
        update: { name: 'BMS', isActive: true, needsReview: false },
      });

      for (const [sourceCategoryId, canonicalName, aliases] of definitions) {
        const key = `BMS:${sourceCategoryId}`;
        const existingMapping =
          await tx.partCategoryCatalogItemMapping.findUnique({
            where: { migrationKey: key },
          });
        let itemId = existingMapping?.targetCatalogItemId ?? null;
        if (!itemId) {
          const normalizedName = normalizePartName(canonicalName);
          const existing = await tx.partCatalogItem.findFirst({
            where: {
              categoryId: bms.id,
              normalizedName,
              side: PartSide.NONE,
              position: PartPosition.NONE,
            },
            select: { id: true },
          });
          if (existing) itemId = existing.id;
          else {
            const sequence = await tx.appSequence.upsert({
              where: { key: 'PART_CATALOG' },
              create: { key: 'PART_CATALOG', value: 1 },
              update: { value: { increment: 1 } },
            });
            const item = await tx.partCatalogItem.create({
              data: {
                internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
                name: canonicalName,
                normalizedName,
                searchTokens: getPartNameSearchTokens(canonicalName),
                slug: `bms-${sourceCategoryId.slice(0, 8)}`,
                categoryId: bms.id,
              },
            });
            itemId = item.id;
          }
        }
        await tx.partCategoryCatalogItemMapping.upsert({
          where: { migrationKey: key },
          create: {
            sourceCategoryId,
            targetCatalogItemId: itemId,
            migrationKey: key,
            classification: PartCategoryClassification.CATALOG_ITEM,
            canonicalName,
            notes: 'Approved BMS taxonomy migration',
          },
          update: {
            targetCatalogItemId: itemId,
            classification: PartCategoryClassification.CATALOG_ITEM,
            canonicalName,
          },
        });
        for (const alias of aliases) {
          const normalizedAlias = normalizePartName(alias);
          await tx.partAlias.upsert({
            where: {
              partCatalogItemId_normalizedAlias: {
                partCatalogItemId: itemId,
                normalizedAlias,
              },
            },
            create: {
              partCatalogItemId: itemId,
              alias,
              normalizedAlias,
              source: 'BMS_TAXONOMY_MIGRATION',
              isApproved: true,
            },
            update: {
              alias,
              source: 'BMS_TAXONOMY_MIGRATION',
              isApproved: true,
            },
          });
        }
        const source = await tx.partCategory.findUniqueOrThrow({
          where: { id: sourceCategoryId },
          select: {
            _count: {
              select: {
                children: true,
                partCatalogItems: true,
                partCatalogSuggestions: true,
                suggestedForModeration: true,
              },
            },
          },
        });
        if (Object.values(source._count).every((count) => count === 0))
          await tx.partCategory.update({
            where: { id: sourceCategoryId },
            data: { isActive: false, needsReview: false },
          });
      }

      for (const sourceCategoryId of invalidIds) {
        const source = await tx.partCategory.findUniqueOrThrow({
          where: { id: sourceCategoryId },
          select: {
            name: true,
            _count: {
              select: {
                children: true,
                partCatalogItems: true,
                partCatalogSuggestions: true,
                suggestedForModeration: true,
              },
            },
          },
        });
        await tx.partCategoryCatalogItemMapping.upsert({
          where: { migrationKey: `INVALID:${sourceCategoryId}` },
          create: {
            sourceCategoryId,
            migrationKey: `INVALID:${sourceCategoryId}`,
            classification: PartCategoryClassification.INVALID,
            canonicalName: source.name,
            notes: 'Imported source-document metadata; not a catalog node',
          },
          update: {
            classification: PartCategoryClassification.INVALID,
            canonicalName: source.name,
          },
        });
        if (Object.values(source._count).every((count) => count === 0))
          await tx.partCategory.update({
            where: { id: sourceCategoryId },
            data: { isActive: false, needsReview: false },
          });
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    },
  );
}

execute()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
