import {
  Prisma,
  PrismaClient,
  VehicleGenerationKind,
  VehiclePowertrainType,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MANUFACTURER_METADATA } from './vehicle-manufacturer-metadata';

type ManufacturerSeed = {
  name: string;
  slug: string;
  englishName: string;
  country: string | null;
  foundedYear: number | null;
};

type ModelSeed = {
  makeSlug: string;
  name: string;
  slug: string;
  vehicleType: string;
  startYear: number | null;
  endYear: number | null;
};

type GenerationSeed = {
  makeSlug: string;
  modelSlug: string;
  name: string;
  slug: string;
  code: string;
  startYear: number;
  endYear: number;
};

export type VehicleSeedDataset = {
  manufacturers: ManufacturerSeed[];
  models: ModelSeed[];
  generations: GenerationSeed[];
};

type ExistingManufacturer = {
  id: string;
  name: string;
  slug: string;
};

type VehicleDatabasePreflight = {
  manufacturerIdByDatasetSlug: Map<string, string>;
  manufacturersToCreate: ManufacturerSeed[];
  manufacturersMatched: number;
  modelsToCreate: ModelSeed[];
  modelsMatched: number;
  generationsToCreate: GenerationSeed[];
  generationsMatched: number;
  specificationSourceKeysToCreate: string[];
  specificationsMatched: number;
  unresolvedConflicts: string[];
  ambiguousConflicts: string[];
};

const DATA_DIR = join(__dirname, 'data', 'vehicle-database');
const VEHICLES_DB_FILE = join(DATA_DIR, 'vehiclesdb-2026.07.6.csv');
const EPA_FILE = join(DATA_DIR, 'epa-model-years.csv');
const BATCH_SIZE = 750;
const EPA_SOURCE_URL = 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv';
const EPA_SOURCE_LICENSE = 'United States Government public data';
const EPA_NOTES = 'US EPA/DOE FuelEconomy.gov model-year record';
const PRODUCTION_WRITE_ENV = 'VEHICLE_DB_ALLOW_WRITE';
const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000;

const MANUFACTURER_IDENTITY_OVERRIDES: Record<string, string[]> = {
  'lynk-co': ['lynk-and-co'],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function records(file: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(readFileSync(file, 'utf8'));
  if (!header) throw new Error(`CSV is empty: ${file}`);
  header[0] = header[0]?.replace(/^\uFEFF/, '') ?? '';
  return rows.map((row) =>
    Object.fromEntries(header.map((name, index) => [name, row[index] ?? ''])),
  );
}

export function slugify(value: string): string {
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

function preferredType(types: Set<string>): string {
  const priority = ['car', 'van', 'truck', 'bus', 'motorcycle', 'moped'];
  return priority.find((type) => types.has(type)) ?? [...types].sort()[0]!;
}

export function buildVehicleSeedDataset(): VehicleSeedDataset {
  const manufacturers = new Map<string, ManufacturerSeed>();
  const models = new Map<
    string,
    Omit<ModelSeed, 'vehicleType'> & { types: Set<string> }
  >();
  const modelYears = new Map<string, GenerationSeed>();

  const ensureManufacturer = (
    slug: string,
    name: string,
  ): ManufacturerSeed => {
    const canonicalSlug = slugify(slug || name);
    const existing = manufacturers.get(canonicalSlug);
    if (existing) return existing;
    const metadata = MANUFACTURER_METADATA[canonicalSlug];
    const item: ManufacturerSeed = {
      name: name.trim(),
      englishName: name.trim(),
      slug: canonicalSlug,
      country: metadata?.country ?? null,
      foundedYear: metadata?.foundedYear ?? null,
    };
    manufacturers.set(canonicalSlug, item);
    return item;
  };

  const ensureModel = (
    makeSlug: string,
    name: string,
    sourceSlug: string,
    vehicleType: string,
  ) => {
    const modelSlug = slugify(sourceSlug || name);
    const key = `${makeSlug}|${modelSlug}`;
    const existing = models.get(key);
    if (existing) {
      existing.types.add(vehicleType);
      return existing;
    }
    const item = {
      makeSlug,
      name: name.trim(),
      slug: modelSlug,
      types: new Set([vehicleType]),
      startYear: null,
      endYear: null,
    };
    models.set(key, item);
    return item;
  };

  for (const row of records(VEHICLES_DB_FILE)) {
    const make = ensureManufacturer(row.make_slug, row.make_name);
    ensureModel(make.slug, row.model_name, row.model_slug, row.kind);
  }

  for (const row of records(EPA_FILE)) {
    const year = Number(row.year);
    if (!Number.isInteger(year) || year < 1886 || year > 2100) {
      throw new Error(`Invalid EPA model year: ${row.year}`);
    }
    const make = ensureManufacturer(row.make, row.make);
    const model = ensureModel(make.slug, row.model, row.model, 'car');
    model.startYear =
      model.startYear === null ? year : Math.min(model.startYear, year);
    model.endYear =
      model.endYear === null ? year : Math.max(model.endYear, year);

    const generationKey = `${make.slug}|${model.slug}|${year}`;
    modelYears.set(generationKey, {
      makeSlug: make.slug,
      modelSlug: model.slug,
      name: `${year} model year`,
      slug: `model-year-${year}`,
      code: `MY${year}`,
      startYear: year,
      endYear: year,
    });
  }

  const result: VehicleSeedDataset = {
    manufacturers: [...manufacturers.values()].sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
    models: [...models.values()]
      .map(({ types, ...model }) => ({
        ...model,
        vehicleType: preferredType(types),
      }))
      .sort((a, b) =>
        `${a.makeSlug}/${a.slug}`.localeCompare(`${b.makeSlug}/${b.slug}`),
      ),
    generations: [...modelYears.values()].sort((a, b) =>
      `${a.makeSlug}/${a.modelSlug}/${a.startYear}`.localeCompare(
        `${b.makeSlug}/${b.modelSlug}/${b.startYear}`,
      ),
    ),
  };

  assertDataset(result);
  return result;
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function assertDataset(dataset: VehicleSeedDataset) {
  assertUnique(
    dataset.manufacturers.map((item) => item.slug),
    'manufacturer slug',
  );
  assertUnique(
    dataset.manufacturers.map((item) => item.name.toLocaleLowerCase()),
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
      throw new Error(`Broken model manufacturer: ${model.makeSlug}`);
    }
  }
  for (const generation of dataset.generations) {
    if (!models.has(`${generation.makeSlug}/${generation.modelSlug}`)) {
      throw new Error(
        `Broken generation model: ${generation.makeSlug}/${generation.modelSlug}`,
      );
    }
  }
}

function normalizedIdentity(value: string): string {
  return slugify(value);
}

function addIndexValue(
  index: Map<string, ExistingManufacturer[]>,
  key: string,
  manufacturer: ExistingManufacturer,
) {
  const values = index.get(key) ?? [];
  values.push(manufacturer);
  index.set(key, values);
}

function buildManufacturerIndexes(manufacturers: ExistingManufacturer[]) {
  const bySlug = new Map<string, ExistingManufacturer[]>();
  const byName = new Map<string, ExistingManufacturer[]>();
  for (const manufacturer of manufacturers) {
    addIndexValue(bySlug, manufacturer.slug, manufacturer);
    addIndexValue(byName, normalizedIdentity(manufacturer.name), manufacturer);
  }
  return { bySlug, byName };
}

function manufacturerCandidates(
  seed: ManufacturerSeed,
  indexes: ReturnType<typeof buildManufacturerIndexes>,
) {
  const candidates: ExistingManufacturer[] = [
    ...(indexes.bySlug.get(seed.slug) ?? []),
    ...(indexes.byName.get(normalizedIdentity(seed.name)) ?? []),
  ];
  for (const aliasSlug of MANUFACTURER_IDENTITY_OVERRIDES[seed.slug] ?? []) {
    candidates.push(...(indexes.bySlug.get(aliasSlug) ?? []));
  }
  return [
    ...new Map(candidates.map((item) => [item.id, item])).values(),
  ];
}

function generationDatasetKey(generation: GenerationSeed) {
  return `${generation.makeSlug}/${generation.modelSlug}/${generation.slug}`;
}

function specificationSourceKey(generation: GenerationSeed) {
  return `epa-model-year:${generation.makeSlug}/${generation.modelSlug}:${generation.startYear}`;
}

async function buildPreflight(
  prisma: PrismaClient,
  dataset: VehicleSeedDataset,
): Promise<VehicleDatabasePreflight> {
  const existingManufacturers = await prisma.manufacturer.findMany({
    select: { id: true, name: true, slug: true },
  });
  const indexes = buildManufacturerIndexes(existingManufacturers);
  const manufacturerIdByDatasetSlug = new Map<string, string>();
  const manufacturersToCreate: ManufacturerSeed[] = [];
  const unresolvedConflicts: string[] = [];
  const ambiguousConflicts: string[] = [];

  for (const seed of dataset.manufacturers) {
    const candidates = manufacturerCandidates(seed, indexes);
    if (candidates.length > 1) {
      ambiguousConflicts.push(
        `${seed.name} [${seed.slug}] matched: ${candidates
          .map((item) => `${item.name} [${item.slug}]`)
          .join(', ')}`,
      );
    } else if (candidates.length === 1) {
      manufacturerIdByDatasetSlug.set(seed.slug, candidates[0].id);
    } else {
      manufacturersToCreate.push(seed);
    }
  }

  const resolvedManufacturerIds = [...manufacturerIdByDatasetSlug.values()];
  const existingModels = resolvedManufacturerIds.length
    ? await prisma.vehicleModel.findMany({
        where: { manufacturerId: { in: resolvedManufacturerIds } },
        select: { id: true, manufacturerId: true, slug: true },
      })
    : [];
  const datasetSlugByManufacturerId = new Map(
    [...manufacturerIdByDatasetSlug.entries()].map(([slug, id]) => [id, slug]),
  );
  const modelIdByDatasetKey = new Map<string, string>();
  for (const model of existingModels) {
    const makeSlug = datasetSlugByManufacturerId.get(model.manufacturerId);
    if (makeSlug) modelIdByDatasetKey.set(`${makeSlug}/${model.slug}`, model.id);
  }

  const modelsToCreate: ModelSeed[] = [];
  for (const model of dataset.models) {
    const key = `${model.makeSlug}/${model.slug}`;
    if (!manufacturerIdByDatasetSlug.has(model.makeSlug)) {
      if (!manufacturersToCreate.some((item) => item.slug === model.makeSlug)) {
        unresolvedConflicts.push(`Model parent unresolved: ${key}`);
      }
      modelsToCreate.push(model);
    } else if (!modelIdByDatasetKey.has(key)) {
      modelsToCreate.push(model);
    }
  }

  const resolvedModelIds = [...modelIdByDatasetKey.values()];
  const existingGenerations = resolvedModelIds.length
    ? await prisma.vehicleGeneration.findMany({
        where: {
          vehicleModelId: { in: resolvedModelIds },
          kind: VehicleGenerationKind.MODEL_YEAR,
        },
        select: { id: true, vehicleModelId: true, slug: true },
      })
    : [];
  const datasetModelKeyById = new Map(
    [...modelIdByDatasetKey.entries()].map(([key, id]) => [id, key]),
  );
  const existingGenerationKeys = new Set(
    existingGenerations.flatMap((generation) => {
      const modelKey = datasetModelKeyById.get(generation.vehicleModelId);
      return modelKey ? [`${modelKey}/${generation.slug}`] : [];
    }),
  );
  const generationsToCreate = dataset.generations.filter(
    (generation) => !existingGenerationKeys.has(generationDatasetKey(generation)),
  );

  const sourceKeys = dataset.generations.map(specificationSourceKey);
  const existingSpecifications = await prisma.vehicleSpecification.findMany({
    where: { sourceKey: { in: sourceKeys } },
    select: { sourceKey: true },
  });
  const existingSourceKeys = new Set(
    existingSpecifications.map((item) => item.sourceKey),
  );
  const specificationSourceKeysToCreate = sourceKeys.filter(
    (sourceKey) => !existingSourceKeys.has(sourceKey),
  );

  return {
    manufacturerIdByDatasetSlug,
    manufacturersToCreate,
    manufacturersMatched:
      dataset.manufacturers.length - manufacturersToCreate.length,
    modelsToCreate,
    modelsMatched: dataset.models.length - modelsToCreate.length,
    generationsToCreate,
    generationsMatched: dataset.generations.length - generationsToCreate.length,
    specificationSourceKeysToCreate,
    specificationsMatched:
      dataset.generations.length - specificationSourceKeysToCreate.length,
    unresolvedConflicts: [...new Set(unresolvedConflicts)],
    ambiguousConflicts: [...new Set(ambiguousConflicts)],
  };
}

function assertPreflightSafe(preflight: VehicleDatabasePreflight) {
  if (
    preflight.unresolvedConflicts.length === 0 &&
    preflight.ambiguousConflicts.length === 0
  ) {
    return;
  }
  throw new Error(
    JSON.stringify(
      {
        message: 'Vehicle database preflight failed before writes',
        unresolvedConflicts: preflight.unresolvedConflicts,
        ambiguousConflicts: preflight.ambiguousConflicts,
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
  dataset: VehicleSeedDataset,
  preflight: VehicleDatabasePreflight,
) {
  assertPreflightSafe(preflight);
  await prisma.$transaction(
    async (tx) => {
      await batches(preflight.manufacturersToCreate, (batch) =>
        tx.manufacturer.createMany({
          data: batch.map((item) => ({ ...item, isActive: true })),
          skipDuplicates: true,
        }),
      );

      // Existing manufacturers are deliberately read-only. This seed never changes
      // their isActive, country, englishName, foundedYear, or any other field.
      const manufacturers = await tx.manufacturer.findMany({
        select: { id: true, name: true, slug: true },
      });
      const indexes = buildManufacturerIndexes(manufacturers);
      const manufacturerIds = new Map<string, string>();
      for (const seed of dataset.manufacturers) {
        const candidates = manufacturerCandidates(seed, indexes);
        if (candidates.length !== 1) {
          throw new Error(
            `Manufacturer resolution changed inside transaction: ${seed.name} [${seed.slug}]`,
          );
        }
        manufacturerIds.set(seed.slug, candidates[0].id);
      }

      await batches(dataset.models, (batch) =>
        tx.vehicleModel.createMany({
          data: batch.map((item) => ({
            manufacturerId: manufacturerIds.get(item.makeSlug)!,
            name: item.name,
            slug: item.slug,
            startYear: item.startYear,
            endYear: item.endYear,
            vehicleType: item.vehicleType,
            isActive: true,
          })),
          skipDuplicates: true,
        }),
      );

      const databaseModels = await tx.vehicleModel.findMany({
        where: { manufacturerId: { in: [...manufacturerIds.values()] } },
        select: { id: true, manufacturerId: true, slug: true },
      });
      const datasetSlugByManufacturerId = new Map(
        [...manufacturerIds.entries()].map(([slug, id]) => [id, slug]),
      );
      const modelIds = new Map<string, string>();
      for (const model of databaseModels) {
        const makeSlug = datasetSlugByManufacturerId.get(model.manufacturerId);
        if (makeSlug) modelIds.set(`${makeSlug}/${model.slug}`, model.id);
      }
      const unresolvedModels = dataset.models.filter(
        (item) => !modelIds.has(`${item.makeSlug}/${item.slug}`),
      );
      if (unresolvedModels.length) {
        throw new Error(
          `Models could not be resolved: ${unresolvedModels
            .slice(0, 20)
            .map((item) => `${item.makeSlug}/${item.slug}`)
            .join(', ')}`,
        );
      }

      await batches(dataset.generations, (batch) =>
        tx.vehicleGeneration.createMany({
          data: batch.map((item) => ({
            vehicleModelId: modelIds.get(`${item.makeSlug}/${item.modelSlug}`)!,
            name: item.name,
            displayName: item.name,
            slug: item.slug,
            code: item.code,
            startYear: item.startYear,
            endYear: item.endYear,
            isFacelift: false,
            kind: VehicleGenerationKind.MODEL_YEAR,
            notes: EPA_NOTES,
            isActive: true,
          })),
          skipDuplicates: true,
        }),
      );

      const databaseGenerations = await tx.vehicleGeneration.findMany({
        where: {
          vehicleModelId: { in: [...modelIds.values()] },
          kind: VehicleGenerationKind.MODEL_YEAR,
        },
        select: { id: true, slug: true, vehicleModelId: true, startYear: true },
      });
      const modelKeysById = new Map(
        [...modelIds.entries()].map(([key, id]) => [id, key]),
      );
      const epaGenerationKeys = new Set(
        dataset.generations.map(generationDatasetKey),
      );
      const epaGenerations = databaseGenerations.filter((generation) => {
        const modelKey = modelKeysById.get(generation.vehicleModelId);
        return (
          modelKey !== undefined &&
          epaGenerationKeys.has(`${modelKey}/${generation.slug}`)
        );
      });
      if (epaGenerations.length !== dataset.generations.length) {
        throw new Error(
          `Generation resolution failed: expected ${dataset.generations.length}, resolved ${epaGenerations.length}`,
        );
      }

      await batches(epaGenerations, (batch) =>
        tx.vehicleSpecification.createMany({
          data: batch.map((generation) => {
            const modelKey = modelKeysById.get(generation.vehicleModelId)!;
            const sourceKey = `epa-model-year:${modelKey}:${generation.startYear}`;
            return {
              vehicleModelId: generation.vehicleModelId,
              generationId: generation.id,
              sourceKey,
              specHash: createHash('sha256').update(sourceKey).digest('hex'),
              year: generation.startYear!,
              powertrainType: VehiclePowertrainType.UNKNOWN,
              rangeData: {},
              sourceTitle: EPA_NOTES,
              sourceUrl: EPA_SOURCE_URL,
              sourceRetrievedAt: new Date('2026-07-29T00:00:00.000Z'),
              sourceLicense: EPA_SOURCE_LICENSE,
              sources: [
                {
                  title: 'US EPA/DOE FuelEconomy.gov',
                  url: EPA_SOURCE_URL,
                  license: EPA_SOURCE_LICENSE,
                },
              ],
              isActive: true,
            };
          }),
          skipDuplicates: true,
        }),
      );
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 30_000,
      timeout: TRANSACTION_TIMEOUT_MS,
    },
  );
}

function printPlan(
  dataset: VehicleSeedDataset,
  preflight: VehicleDatabasePreflight,
) {
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'plan',
        safety: {
          productionWriteGuard: `${PRODUCTION_WRITE_ENV}=true`,
          existingManufacturersUpdated: 0,
          existingManufacturersReactivated: 0,
          transactionIsolation: 'Serializable',
          transactionMaxWaitMs: 30_000,
          transactionTimeoutMs: TRANSACTION_TIMEOUT_MS,
        },
        dataset: {
          manufacturers: dataset.manufacturers.length,
          models: dataset.models.length,
          generations: dataset.generations.length,
          specifications: dataset.generations.length,
        },
        databaseDiff: {
          manufacturersToCreate: preflight.manufacturersToCreate.length,
          manufacturersMatched: preflight.manufacturersMatched,
          modelsToCreate: preflight.modelsToCreate.length,
          modelsMatched: preflight.modelsMatched,
          generationsToCreate: preflight.generationsToCreate.length,
          generationsMatched: preflight.generationsMatched,
          specificationsToCreate:
            preflight.specificationSourceKeysToCreate.length,
          specificationsMatched: preflight.specificationsMatched,
          unresolvedConflicts: preflight.unresolvedConflicts,
          ambiguousConflicts: preflight.ambiguousConflicts,
        },
        samples: {
          manufacturersToCreate: preflight.manufacturersToCreate
            .slice(0, 20)
            .map((item) => `${item.name} [${item.slug}]`),
          modelsToCreate: preflight.modelsToCreate
            .slice(0, 20)
            .map((item) => `${item.makeSlug}/${item.slug}`),
          generationsToCreate: preflight.generationsToCreate
            .slice(0, 20)
            .map(generationDatasetKey),
          specificationsToCreate: preflight.specificationSourceKeysToCreate.slice(
            0,
            20,
          ),
        },
      },
      null,
      2,
    ),
  );
}

function assertIdempotent(preflight: VehicleDatabasePreflight) {
  const pending = {
    manufacturers: preflight.manufacturersToCreate.length,
    models: preflight.modelsToCreate.length,
    generations: preflight.generationsToCreate.length,
    specifications: preflight.specificationSourceKeysToCreate.length,
    unresolvedConflicts: preflight.unresolvedConflicts.length,
    ambiguousConflicts: preflight.ambiguousConflicts.length,
  };
  if (Object.values(pending).some((count) => count !== 0)) {
    throw new Error(
      `Post-apply idempotency verification failed: ${JSON.stringify(pending)}`,
    );
  }
}

async function main() {
  const dataset = buildVehicleSeedDataset();
  const prisma = new PrismaClient();
  try {
    const preflight = await buildPreflight(prisma, dataset);
    printPlan(dataset, preflight);
    assertPreflightSafe(preflight);

    if (!process.argv.includes('--apply')) {
      console.log('Dry run complete. No database records were changed.');
      return;
    }

    if (
      process.env.NODE_ENV === 'production' &&
      process.env[PRODUCTION_WRITE_ENV] !== 'true'
    ) {
      throw new Error(
        `Production write blocked. Set ${PRODUCTION_WRITE_ENV}=true explicitly.`,
      );
    }

    await applyDataset(prisma, dataset, preflight);
    const postApply = await buildPreflight(prisma, dataset);
    printPlan(dataset, postApply);
    assertPreflightSafe(postApply);
    assertIdempotent(postApply);
    console.log('World vehicle database seed applied successfully and verified.');
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
