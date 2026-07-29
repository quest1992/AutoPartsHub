import {
  Prisma,
  PrismaClient,
  VehicleGenerationKind,
  VehiclePowertrainType,
} from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHINA_MANUFACTURER_ALIAS_TO_SLUG,
  CHINA_MANUFACTURER_IDENTITIES,
  ChinaManufacturerIdentity,
} from './china-vehicle-curated';

type BindingValue = { value: string };
type WikidataBinding = Record<string, BindingValue | undefined>;

type ChinaManufacturerSeed = {
  slug: string;
  name: string;
  englishName: string;
  chineseName: string | null;
  pinyin: string | null;
  country: 'CN';
  foundedYear: number | null;
  parentCompany: string | null;
  manufacturerType:
    | 'STATE_OWNED'
    | 'PRIVATE'
    | 'JOINT_VENTURE'
    | 'SUBBRAND'
    | 'EXPORT_BRAND'
    | 'COMMERCIAL'
    | 'HISTORIC'
    | 'OTHER';
  website: string | null;
  sourceRefs: string[];
};

type ChinaModelSeed = {
  makeSlug: string;
  slug: string;
  name: string;
  chineseName: string | null;
  exportName: string | null;
  bodyStyle: string | null;
  vehicleType: string | null;
  startYear: number | null;
  endYear: number | null;
  powertrainType:
    | 'ICE'
    | 'HEV'
    | 'PHEV'
    | 'BEV'
    | 'EREV'
    | 'FCEV'
    | 'UNKNOWN';
  sourceRefs: string[];
};

type ChinaGenerationSeed = {
  makeSlug: string;
  modelSlug: string;
  slug: string;
  name: string;
  code: string;
  startYear: number;
  endYear: number;
  kind: 'MODEL_YEAR';
  sourceRefs: string[];
};

export type ChinaVehicleSeedDataset = {
  manufacturers: ChinaManufacturerSeed[];
  models: ChinaModelSeed[];
  generations: ChinaGenerationSeed[];
};

type OpenEvRecord = {
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  vehicleType?: string;
  bodyStyle?: string;
  years: string[];
  sourcePath: string;
};

const DATA_DIR = join(__dirname, 'data', 'china-vehicle-database');
const WIKIDATA_MODELS = join(
  DATA_DIR,
  'wikidata-models-2026-07-29.json',
);
const WIKIDATA_MANUFACTURERS = join(
  DATA_DIR,
  'wikidata-manufacturers-2026-07-29.json',
);
const WIKIDATA_BRANDS = join(DATA_DIR, 'wikidata-brands-2026-07-29.json');
const OPEN_EV_DATA = join(DATA_DIR, 'open-ev-data-china.json');
const WIKIDATA_SOURCE = 'https://www.wikidata.org/wiki/';
const OPEN_EV_SOURCE =
  'https://github.com/open-ev-data/open-ev-data-dataset/';
const BATCH_SIZE = 500;

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) as T;
}

function bindings(file: string): WikidataBinding[] {
  return readJson<{ results: { bindings: WikidataBinding[] } }>(file).results
    .bindings;
}

export function chinaSlugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return slug || 'unknown';
}

function wikidataId(uri?: string): string | null {
  const match = uri?.match(/\/(Q\d+)$/);
  return match?.[1] ?? null;
}

function yearFromDate(value?: string): number | null {
  const match = value?.match(/^([+-]?\d{1,4})-/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isInteger(year) && year >= 1800 && year <= 2100 ? year : null;
}

function canonicalMakeSlug(label: string): string {
  return (
    CHINA_MANUFACTURER_ALIAS_TO_SLUG.get(label.trim().toLocaleLowerCase()) ??
    chinaSlugify(
      label
        .replace(/\b(automobile|automotive|company|corporation|limited|ltd)\b/gi, '')
        .replace(/[().,]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
  );
}

function modelNameWithoutMake(
  modelName: string,
  identity: ChinaManufacturerIdentity | undefined,
): string {
  if (!identity) return modelName.trim();
  const prefixes = [identity.name, ...identity.aliases]
    .sort((a, b) => b.length - a.length)
    .map((value) => value.trim())
    .filter(Boolean);
  for (const prefix of prefixes) {
    if (modelName.toLocaleLowerCase().startsWith(`${prefix.toLocaleLowerCase()} `)) {
      return modelName.slice(prefix.length).trim();
    }
  }
  return modelName.trim();
}

function mergeRefs(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming])].sort();
}

function curatedManufacturer(
  item: ChinaManufacturerIdentity,
): ChinaManufacturerSeed {
  return {
    slug: item.slug,
    name: item.name,
    englishName: item.name,
    chineseName: item.chineseName ?? null,
    pinyin: item.pinyin ?? null,
    country: 'CN',
    foundedYear: item.foundedYear ?? null,
    parentCompany: item.parentCompany ?? null,
    manufacturerType: item.manufacturerType,
    website: item.website ?? null,
    sourceRefs: [
      `${WIKIDATA_SOURCE}Wikidata:WikiProject_Automobiles`,
      ...(item.website ? [item.website] : []),
    ],
  };
}

export function buildChinaVehicleDataset(): ChinaVehicleSeedDataset {
  const manufacturerMap = new Map<string, ChinaManufacturerSeed>(
    CHINA_MANUFACTURER_IDENTITIES.map((item) => [
      item.slug,
      curatedManufacturer(item),
    ]),
  );
  const modelMap = new Map<string, ChinaModelSeed>();
  const generationMap = new Map<string, ChinaGenerationSeed>();
  const identityMap = new Map(
    CHINA_MANUFACTURER_IDENTITIES.map((item) => [item.slug, item]),
  );

  for (const row of [
    ...bindings(WIKIDATA_MANUFACTURERS),
    ...bindings(WIKIDATA_BRANDS),
  ]) {
    const label = row.manufacturerLabel?.value?.trim();
    const entityId = wikidataId(row.manufacturer?.value);
    if (!label || !entityId || /^Q\d+$/.test(label)) continue;
    const slug = canonicalMakeSlug(label);
    const existing = manufacturerMap.get(slug);
    const inception = yearFromDate(row.inception?.value);
    const sourceRef = `${WIKIDATA_SOURCE}${entityId}`;
    if (existing) {
      existing.chineseName ??= row.manufacturerZh?.value ?? null;
      existing.foundedYear ??= inception;
      existing.website ??= row.website?.value ?? null;
      existing.parentCompany ??= row.parentLabel?.value ?? null;
      existing.sourceRefs = mergeRefs(existing.sourceRefs, [sourceRef]);
    } else {
      manufacturerMap.set(slug, {
        slug,
        name: label,
        englishName: label,
        chineseName: row.manufacturerZh?.value ?? null,
        pinyin: null,
        country: 'CN',
        foundedYear: inception,
        parentCompany: row.parentLabel?.value ?? null,
        manufacturerType: /volkswagen|honda|ford|nissan|benz|stellantis|kia|general motors/i.test(
          label,
        )
          ? 'JOINT_VENTURE'
          : 'OTHER',
        website: row.website?.value ?? null,
        sourceRefs: [sourceRef],
      });
    }
  }

  for (const row of bindings(WIKIDATA_MODELS)) {
    const rawMake = row.manufacturerLabel?.value?.trim();
    const rawModel = row.modelLabel?.value?.trim();
    const modelEntityId = wikidataId(row.model?.value);
    if (
      !rawMake ||
      !rawModel ||
      !modelEntityId ||
      /^Q\d+$/.test(rawMake) ||
      /^Q\d+$/.test(rawModel)
    ) {
      continue;
    }
    const makeSlug = canonicalMakeSlug(rawMake);
    if (!manufacturerMap.has(makeSlug)) continue;
    const identity = identityMap.get(makeSlug);
    const name = modelNameWithoutMake(rawModel, identity);
    const slug = chinaSlugify(name);
    const key = `${makeSlug}/${slug}`;
    const startYear = yearFromDate(row.inception?.value);
    const endYear = yearFromDate(row.end?.value);
    const sourceRef = `${WIKIDATA_SOURCE}${modelEntityId}`;
    const existing = modelMap.get(key);
    if (existing) {
      existing.chineseName ??= row.modelZh?.value ?? null;
      existing.startYear ??= startYear;
      existing.endYear ??= endYear;
      existing.sourceRefs = mergeRefs(existing.sourceRefs, [sourceRef]);
    } else {
      modelMap.set(key, {
        makeSlug,
        slug,
        name,
        chineseName: row.modelZh?.value ?? null,
        exportName: rawModel !== name ? rawModel : null,
        bodyStyle: null,
        vehicleType: 'car',
        startYear,
        endYear,
        powertrainType: 'UNKNOWN',
        sourceRefs: [sourceRef],
      });
    }
  }

  const openEvSlugMap: Record<string, string> = {
    gac_aion: 'aion',
    gwm: 'great-wall',
    im_motors: 'im-motors',
    m_hero: 'm-hero',
    rising_auto: 'rising-auto',
  };
  for (const row of readJson<OpenEvRecord[]>(OPEN_EV_DATA)) {
    const makeSlug =
      openEvSlugMap[row.makeSlug] ??
      canonicalMakeSlug(row.makeName || row.makeSlug);
    const manufacturer =
      manufacturerMap.get(makeSlug) ??
      curatedManufacturer({
        slug: makeSlug,
        name: row.makeName,
        manufacturerType: 'OTHER',
        aliases: [],
      });
    manufacturer.sourceRefs = mergeRefs(manufacturer.sourceRefs, [
      OPEN_EV_SOURCE,
    ]);
    manufacturerMap.set(makeSlug, manufacturer);

    const slug = chinaSlugify(row.modelSlug || row.modelName);
    const key = `${makeSlug}/${slug}`;
    const years = row.years
      .map(Number)
      .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100);
    const sourceRef = `${OPEN_EV_SOURCE}tree/main/${row.sourcePath}`;
    const existing = modelMap.get(key);
    const model: ChinaModelSeed = existing ?? {
      makeSlug,
      slug,
      name: row.modelName,
      chineseName: null,
      exportName: null,
      bodyStyle: null,
      vehicleType: null,
      startYear: null,
      endYear: null,
      powertrainType: 'BEV',
      sourceRefs: [],
    };
    model.bodyStyle ??= row.bodyStyle ?? null;
    model.vehicleType ??= row.vehicleType ?? null;
    model.powertrainType = 'BEV';
    if (years.length > 0) {
      model.startYear =
        model.startYear === null
          ? Math.min(...years)
          : Math.min(model.startYear, ...years);
      model.endYear =
        model.endYear === null
          ? Math.max(...years)
          : Math.max(model.endYear, ...years);
    }
    model.sourceRefs = mergeRefs(model.sourceRefs, [sourceRef]);
    modelMap.set(key, model);

    for (const year of years) {
      const generationKey = `${key}/model-year-${year}`;
      generationMap.set(generationKey, {
        makeSlug,
        modelSlug: slug,
        slug: `model-year-${year}`,
        name: `${year} model year`,
        code: `MY${year}`,
        startYear: year,
        endYear: year,
        kind: 'MODEL_YEAR',
        sourceRefs: [sourceRef],
      });
    }
  }

  const dataset: ChinaVehicleSeedDataset = {
    manufacturers: [...manufacturerMap.values()].sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    models: [...modelMap.values()].sort((a, b) =>
      `${a.makeSlug}/${a.slug}`.localeCompare(`${b.makeSlug}/${b.slug}`),
    ),
    generations: [...generationMap.values()].sort((a, b) =>
      `${a.makeSlug}/${a.modelSlug}/${a.slug}`.localeCompare(
        `${b.makeSlug}/${b.modelSlug}/${b.slug}`,
      ),
    ),
  };
  assertChinaDataset(dataset);
  return dataset;
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function assertChinaDataset(dataset: ChinaVehicleSeedDataset) {
  assertUnique(
    dataset.manufacturers.map((item) => item.slug),
    'manufacturer slug',
  );
  assertUnique(
    dataset.manufacturers.map((item) => item.name.trim().toLocaleLowerCase()),
    'manufacturer name',
  );
  assertUnique(
    dataset.models.map((item) => `${item.makeSlug}/${item.slug}`),
    'model slug',
  );
  assertUnique(
    dataset.generations.map(
      (item) => `${item.makeSlug}/${item.modelSlug}/${item.slug}`,
    ),
    'generation slug',
  );
  const makes = new Set(dataset.manufacturers.map((item) => item.slug));
  const models = new Set(
    dataset.models.map((item) => `${item.makeSlug}/${item.slug}`),
  );
  for (const model of dataset.models) {
    if (!makes.has(model.makeSlug)) {
      throw new Error(`Orphan model: ${model.makeSlug}/${model.slug}`);
    }
    if (
      model.startYear !== null &&
      model.endYear !== null &&
      model.endYear < model.startYear
    ) {
      throw new Error(`Invalid model years: ${model.makeSlug}/${model.slug}`);
    }
  }
  for (const generation of dataset.generations) {
    if (!models.has(`${generation.makeSlug}/${generation.modelSlug}`)) {
      throw new Error(
        `Orphan model year: ${generation.makeSlug}/${generation.modelSlug}`,
      );
    }
    if (
      generation.kind !== 'MODEL_YEAR' ||
      generation.startYear !== generation.endYear
    ) {
      throw new Error(`Unverified generation: ${generation.slug}`);
    }
  }
}

async function currentDatabaseComparison(
  prisma: PrismaClient,
  dataset: ChinaVehicleSeedDataset,
) {
  const aliases = new Set(
    CHINA_MANUFACTURER_IDENTITIES.flatMap((item) => [
      item.name.toLocaleLowerCase(),
      ...item.aliases.map((alias) => alias.toLocaleLowerCase()),
    ]),
  );
  const existingManufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true, slug: true },
  });
  const bySeedSlug = new Map(
    dataset.manufacturers.map((item) => [item.slug, item]),
  );
  const matchedExisting = existingManufacturers.filter(
    (item) =>
      bySeedSlug.has(item.slug) ||
      aliases.has(item.name.trim().toLocaleLowerCase()),
  );
  const matchedSlugs = new Set(
    matchedExisting.map(
      (item) =>
        bySeedSlug.get(item.slug)?.slug ??
        CHINA_MANUFACTURER_ALIAS_TO_SLUG.get(
          item.name.trim().toLocaleLowerCase(),
        ) ??
        item.slug,
    ),
  );
  const newManufacturers = dataset.manufacturers.filter(
    (item) => !matchedSlugs.has(item.slug),
  );

  const relevantIds = new Set(matchedExisting.map((item) => item.id));
  const existingModels = await prisma.vehicleModel.findMany({
    where: { manufacturerId: { in: [...relevantIds] } },
    select: {
      slug: true,
      manufacturer: { select: { name: true, slug: true } },
    },
  });
  const existingModelKeys = new Set(
    existingModels.map((item) => {
      const makeSlug =
        bySeedSlug.get(item.manufacturer.slug)?.slug ??
        CHINA_MANUFACTURER_ALIAS_TO_SLUG.get(
          item.manufacturer.name.trim().toLocaleLowerCase(),
        ) ??
        item.manufacturer.slug;
      return `${makeSlug}/${item.slug}`;
    }),
  );

  return {
    newManufacturers,
    updatedManufacturers: dataset.manufacturers.length - newManufacturers.length,
    newModels: dataset.models.filter(
      (item) => !existingModelKeys.has(`${item.makeSlug}/${item.slug}`),
    ).length,
    updatedModels: dataset.models.filter((item) =>
      existingModelKeys.has(`${item.makeSlug}/${item.slug}`),
    ).length,
  };
}

function powertrainCounts(dataset: ChinaVehicleSeedDataset) {
  return Object.fromEntries(
    ['BEV', 'PHEV', 'EREV', 'HEV', 'ICE', 'FCEV', 'UNKNOWN'].map((type) => [
      type,
      dataset.models.filter((item) => item.powertrainType === type).length,
    ]),
  );
}

async function printPlan(
  prisma: PrismaClient,
  dataset: ChinaVehicleSeedDataset,
) {
  const comparison = await currentDatabaseComparison(prisma, dataset);
  const subbrands = dataset.manufacturers.filter((item) =>
    ['SUBBRAND', 'EXPORT_BRAND'].includes(item.manufacturerType),
  );
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'plan',
        manufacturers: dataset.manufacturers.length,
        subbrands: subbrands.length,
        models: dataset.models.length,
        confirmedGenerations: 0,
        modelYears: dataset.generations.length,
        powertrains: powertrainCounts(dataset),
        newBrands: comparison.newManufacturers.map((item) => item.name),
        newBrandCount: comparison.newManufacturers.length,
        existingBrandsToUpdate: comparison.updatedManufacturers,
        newModels: comparison.newModels,
        existingModelsToUpdate: comparison.updatedModels,
      },
      null,
      2,
    ),
  );
}

async function batches<T>(
  items: T[],
  operation: (batch: T[]) => Promise<unknown>,
) {
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    await operation(items.slice(start, start + BATCH_SIZE));
  }
}

async function applyDataset(
  prisma: PrismaClient,
  dataset: ChinaVehicleSeedDataset,
) {
  const existingManufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true, slug: true, sourceRefs: true },
  });
  const existingBySlug = new Map(
    existingManufacturers.map((item) => [item.slug, item]),
  );
  const existingByAlias = new Map(
    existingManufacturers.map((item) => [
      item.name.trim().toLocaleLowerCase(),
      item,
    ]),
  );

  for (const item of dataset.manufacturers) {
    const existing =
      existingBySlug.get(item.slug) ??
      [...CHINA_MANUFACTURER_ALIAS_TO_SLUG.entries()]
        .filter(([, slug]) => slug === item.slug)
        .map(([alias]) => existingByAlias.get(alias))
        .find(Boolean);
    const updateData = {
      englishName: item.englishName,
      country: item.country,
      manufacturerType: item.manufacturerType,
      ...(item.chineseName !== null && { chineseName: item.chineseName }),
      ...(item.pinyin !== null && { pinyin: item.pinyin }),
      ...(item.foundedYear !== null && { foundedYear: item.foundedYear }),
      ...(item.parentCompany !== null && {
        parentCompany: item.parentCompany,
      }),
      ...(item.website !== null && { website: item.website }),
      sourceRefs: mergeRefs(existing?.sourceRefs ?? [], item.sourceRefs),
      isActive: true,
    } satisfies Prisma.ManufacturerUpdateInput;
    if (existing) {
      await prisma.manufacturer.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.manufacturer.create({
        data: {
          name: item.name,
          slug: item.slug,
          ...updateData,
          chineseName: item.chineseName,
          pinyin: item.pinyin,
          foundedYear: item.foundedYear,
          parentCompany: item.parentCompany,
          website: item.website,
        },
      });
    }
  }

  const manufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true, slug: true },
  });
  const manufacturerIds = new Map<string, string>();
  for (const item of manufacturers) {
    const canonical =
      CHINA_MANUFACTURER_ALIAS_TO_SLUG.get(
        item.name.trim().toLocaleLowerCase(),
      ) ?? item.slug;
    manufacturerIds.set(canonical, item.id);
  }

  for (const item of dataset.models) {
    const manufacturerId = manufacturerIds.get(item.makeSlug);
    if (!manufacturerId) {
      throw new Error(`Manufacturer not resolved: ${item.makeSlug}`);
    }
    const existing = await prisma.vehicleModel.findUnique({
      where: { manufacturerId_slug: { manufacturerId, slug: item.slug } },
      select: { id: true, sourceRefs: true },
    });
    const updateData = {
      ...(item.chineseName !== null && { chineseName: item.chineseName }),
      ...(item.exportName !== null && { exportName: item.exportName }),
      ...(item.bodyStyle !== null && { bodyStyle: item.bodyStyle }),
      ...(item.vehicleType !== null && { vehicleType: item.vehicleType }),
      ...(item.startYear !== null && { startYear: item.startYear }),
      ...(item.endYear !== null && { endYear: item.endYear }),
      ...(item.powertrainType !== 'UNKNOWN' && {
        powertrainType: item.powertrainType as VehiclePowertrainType,
      }),
      sourceRefs: mergeRefs(existing?.sourceRefs ?? [], item.sourceRefs),
      isActive: true,
    } satisfies Prisma.VehicleModelUpdateInput;
    if (existing) {
      await prisma.vehicleModel.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.vehicleModel.create({
        data: {
          manufacturerId,
          name: item.name,
          slug: item.slug,
          ...updateData,
          chineseName: item.chineseName,
          exportName: item.exportName,
          bodyStyle: item.bodyStyle,
          vehicleType: item.vehicleType,
          startYear: item.startYear,
          endYear: item.endYear,
          powertrainType: item.powertrainType as VehiclePowertrainType,
        },
      });
    }
  }

  const models = await prisma.vehicleModel.findMany({
    where: { manufacturerId: { in: [...manufacturerIds.values()] } },
    select: { id: true, slug: true, manufacturerId: true },
  });
  const makeById = new Map(
    [...manufacturerIds.entries()].map(([slug, id]) => [id, slug]),
  );
  const modelIds = new Map(
    models.map((item) => [
      `${makeById.get(item.manufacturerId)}/${item.slug}`,
      item.id,
    ]),
  );

  await batches(dataset.generations, (batch) =>
    prisma.vehicleGeneration.createMany({
      data: batch.map((item) => ({
        vehicleModelId: modelIds.get(`${item.makeSlug}/${item.modelSlug}`)!,
        name: item.name,
        displayName: item.name,
        slug: item.slug,
        code: item.code,
        startYear: item.startYear,
        endYear: item.endYear,
        kind: VehicleGenerationKind.MODEL_YEAR,
        isFacelift: false,
        sourceRefs: item.sourceRefs,
        notes: 'Verified OpenEV Data model-year record',
        isActive: true,
      })),
      skipDuplicates: true,
    }),
  );
}

async function main() {
  const dataset = buildChinaVehicleDataset();
  const prisma = new PrismaClient();
  try {
    await printPlan(prisma, dataset);
    if (!process.argv.includes('--apply')) {
      console.log('Dry run complete. No database records were changed.');
      return;
    }
    await applyDataset(prisma, dataset);
    assertChinaDataset(dataset);
    console.log('China vehicle database seed applied successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
