import { PrismaClient, VehicleManufacturerType } from '@prisma/client';

const WIKIDATA_LICENSE = 'CC0-1.0';
const WIKIDATA_LICENSE_URL = 'https://www.wikidata.org/wiki/Wikidata:Licensing';

const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const slugify = (value: string) => normalize(value).replace(/\s+/g, '-');

type ModelSeed = {
  name: string;
  sourceUrl: string;
  aliases?: string[];
};

const models: ModelSeed[] = [
  { name: 'F3R', sourceUrl: 'https://www.wikidata.org/wiki/Q797216' },
  { name: 'F6', sourceUrl: 'https://www.wikidata.org/wiki/Q5832821' },
  {
    name: 'Qin Plus',
    sourceUrl: 'https://www.wikidata.org/wiki/Q105592410',
  },
  {
    name: 'Qin L',
    sourceUrl: 'https://www.wikidata.org/wiki/Q137653130',
    aliases: ['Qin L DM-i'],
  },
  {
    name: 'Seal 07',
    sourceUrl: 'https://www.wikidata.org/wiki/Q119859458',
  },
  {
    name: 'Seal 08',
    sourceUrl:
      'https://www.byd.com/br/Supercarros-e-SUVs-BYD-inspira-tecnologia-no-Salao-do-Automovel-de-Pequim',
  },
  {
    name: 'Song L',
    sourceUrl: 'https://www.wikidata.org/wiki/Q127975175',
    aliases: ['Song L DM-i'],
  },
];

const aliasesByCanonical: Record<string, Array<{ name: string; sourceUrl: string }>> = {
  'Yuan Plus': [
    { name: 'Atto 3', sourceUrl: 'https://www.wikidata.org/wiki/Q108894190' },
  ],
  'Yuan Up': [
    {
      name: 'Atto 2',
      sourceUrl: 'https://www.wikidata.org/wiki/Q124415207',
    },
  ],
  Seagull: [
    { name: 'Atto 1', sourceUrl: 'https://www.wikidata.org/wiki/Q117628582' },
    {
      name: 'Dolphin Mini',
      sourceUrl: 'https://www.wikidata.org/wiki/Q117628582',
    },
    {
      name: 'Dolphin Surf',
      sourceUrl: 'https://www.wikidata.org/wiki/Q117628582',
    },
  ],
  'Song Plus': [
    {
      name: 'Seal U',
      sourceUrl: 'https://www.wikidata.org/wiki/Q122639994',
    },
  ],
  'Su Rui': [
    {
      name: 'F5',
      sourceUrl: 'https://www.wikidata.org/wiki/Q61767811',
    },
  ],
  'Seal 05 DM-i': [
    {
      name: 'Seal 05',
      sourceUrl: 'https://www.wikidata.org/wiki/Q131765590',
    },
  ],
  'Seal 06 DM-i': [
    {
      name: 'Seal 06',
      sourceUrl: 'https://www.wikidata.org/wiki/Q125635666',
    },
  ],
  'Sea Lion 05': [
    {
      name: 'Sealion 05',
      sourceUrl: 'https://www.wikidata.org/wiki/Q130467046',
    },
  ],
};

const subbrands = [
  { name: 'Denza', slug: 'denza', chineseName: '腾势', foundedYear: 2010 },
  { name: 'Yangwang', slug: 'yangwang', chineseName: '仰望', foundedYear: 2022 },
  {
    name: 'Fang Cheng Bao',
    slug: 'fang-cheng-bao',
    chineseName: '方程豹',
    foundedYear: 2023,
  },
];

async function snapshot(prisma: PrismaClient) {
  const manufacturers = await prisma.manufacturer.findMany({
    where: {
      OR: [
        { name: { equals: 'BYD', mode: 'insensitive' } },
        { englishName: { equals: 'BYD', mode: 'insensitive' } },
        { slug: 'byd' },
      ],
    },
    select: {
      id: true,
      name: true,
      vehicleModels: {
        select: { id: true, name: true, slug: true, aliases: { select: { name: true } } },
        orderBy: { name: 'asc' },
      },
    },
  });
  return manufacturers;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const before = await snapshot(prisma);
    const byd = before.find((item) => item.name.toLowerCase() === 'byd') ?? before[0];
    const existingNames = new Set(
      (byd?.vehicleModels ?? []).map((item) => normalize(item.name)),
    );
    const additions = models.filter((item) => !existingNames.has(normalize(item.name)));
    const existingAliases = new Set(
      (byd?.vehicleModels ?? []).flatMap((item) =>
        item.aliases.map((alias) => `${normalize(item.name)}/${normalize(alias.name)}`),
      ),
    );
    const aliasPlan = Object.entries(aliasesByCanonical).flatMap(
      ([canonical, aliases]) =>
        aliases
          .filter(
            (alias) =>
              !existingAliases.has(`${normalize(canonical)}/${normalize(alias.name)}`),
          )
          .map((alias) => ({ canonical, ...alias })),
    );

    console.log(
      JSON.stringify(
        {
          bydManufacturers: before.length,
          modelsBefore: byd?.vehicleModels.length ?? 0,
          modelsToAdd: additions.map((item) => item.name),
          aliasesToAdd: aliasPlan.map(
            (item) => `${item.canonical} <- ${item.name}`,
          ),
          subbrandsToEnsure: subbrands.map((item) => item.name),
          sourceLicense: WIKIDATA_LICENSE,
          sourceLicenseUrl: WIKIDATA_LICENSE_URL,
        },
        null,
        2,
      ),
    );

    if (!process.argv.includes('--apply')) {
      console.log('Dry run complete. No database records were changed.');
      return;
    }
    if (!byd) throw new Error('BYD manufacturer was not found');

    await prisma.$transaction(async (tx) => {
      for (const brand of subbrands) {
        const existing = await tx.manufacturer.findFirst({
          where: {
            OR: [
              { slug: brand.slug },
              { name: { equals: brand.name, mode: 'insensitive' } },
              ...(brand.name === 'Fang Cheng Bao'
                ? [{ slug: 'fangchengbao' }]
                : []),
            ],
          },
          select: { id: true },
        });
        if (!existing) {
          await tx.manufacturer.create({
            data: {
              ...brand,
              englishName: brand.name,
              country: 'China',
              parentCompany: 'BYD',
              manufacturerType: VehicleManufacturerType.SUBBRAND,
              sourceRefs: ['https://www.wikidata.org/'],
              isActive: true,
            },
          });
        }
      }

      for (const item of additions) {
        await tx.vehicleModel.create({
          data: {
            manufacturerId: byd.id,
            name: item.name,
            slug: slugify(item.name),
            sourceRefs: [item.sourceUrl, WIKIDATA_LICENSE_URL],
            isActive: true,
          },
        });
      }

      const bydModels = await tx.vehicleModel.findMany({
        where: { manufacturerId: byd.id },
        select: { id: true, name: true },
      });
      const modelByName = new Map(
        bydModels.map((item) => [normalize(item.name), item]),
      );
      for (const item of aliasPlan) {
        const model = modelByName.get(normalize(item.canonical));
        if (!model) {
          console.warn(`Alias skipped: canonical model ${item.canonical} not found`);
          continue;
        }
        await tx.vehicleModelAlias.upsert({
          where: {
            vehicleModelId_normalizedName: {
              vehicleModelId: model.id,
              normalizedName: normalize(item.name),
            },
          },
          create: {
            vehicleModelId: model.id,
            name: item.name,
            normalizedName: normalize(item.name),
            sourceUrl: item.sourceUrl,
            sourceLicense: WIKIDATA_LICENSE,
          },
          update: {},
        });
      }
    });

    const after = await snapshot(prisma);
    const afterByd = after.find((item) => item.name.toLowerCase() === 'byd') ?? after[0];
    console.log(
      JSON.stringify(
        {
          modelsBefore: byd.vehicleModels.length,
          modelsAfter: afterByd?.vehicleModels.length ?? 0,
          addedModels: additions.map((item) => item.name),
          addedAliases: aliasPlan.map((item) => item.name),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
