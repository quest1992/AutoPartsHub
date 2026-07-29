import { PrismaClient, VehicleGenerationKind } from '@prisma/client';
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

const DATA_DIR = join(__dirname, 'data', 'vehicle-database');
const VEHICLES_DB_FILE = join(DATA_DIR, 'vehiclesdb-2026.07.6.csv');
const EPA_FILE = join(DATA_DIR, 'epa-model-years.csv');
const BATCH_SIZE = 750;

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

async function batches<T>(
  items: T[],
  operation: (batch: T[]) => Promise<unknown>,
) {
  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    await operation(items.slice(start, start + BATCH_SIZE));
  }
}

async function applyDataset(prisma: PrismaClient, dataset: VehicleSeedDataset) {
  await batches(dataset.manufacturers, (batch) =>
    prisma.manufacturer.createMany({
      data: batch.map((item) => ({ ...item, isActive: true })),
      skipDuplicates: true,
    }),
  );

  for (const item of dataset.manufacturers.filter(
    (manufacturer) => manufacturer.country !== null,
  )) {
    await prisma.manufacturer.updateMany({
      where: { slug: item.slug },
      data: {
        englishName: item.englishName,
        country: item.country,
        foundedYear: item.foundedYear,
        isActive: true,
      },
    });
  }

  const manufacturers = await prisma.manufacturer.findMany({
    select: { id: true, slug: true },
  });
  const manufacturerIds = new Map(
    manufacturers.map((item) => [item.slug, item.id]),
  );

  const missingMakes = dataset.manufacturers
    .map((item) => item.slug)
    .filter((slug) => !manufacturerIds.has(slug));
  if (missingMakes.length > 0) {
    throw new Error(
      `Manufacturers could not be resolved: ${missingMakes.slice(0, 10).join(', ')}`,
    );
  }

  await batches(dataset.models, (batch) =>
    prisma.vehicleModel.createMany({
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

  const databaseModels = await prisma.vehicleModel.findMany({
    select: { id: true, manufacturerId: true, slug: true },
  });
  const manufacturerSlugs = new Map(
    manufacturers.map((item) => [item.id, item.slug]),
  );
  const modelIds = new Map(
    databaseModels.map((item) => [
      `${manufacturerSlugs.get(item.manufacturerId)}/${item.slug}`,
      item.id,
    ]),
  );

  const unresolvedModels = dataset.models.filter(
    (item) => !modelIds.has(`${item.makeSlug}/${item.slug}`),
  );
  if (unresolvedModels.length > 0) {
    throw new Error(
      `Models could not be resolved: ${unresolvedModels
        .slice(0, 10)
        .map((item) => `${item.makeSlug}/${item.slug}`)
        .join(', ')}`,
    );
  }

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
        isFacelift: false,
        kind: VehicleGenerationKind.MODEL_YEAR,
        notes: 'US EPA/DOE FuelEconomy.gov model-year record',
        isActive: true,
      })),
      skipDuplicates: true,
    }),
  );
}

function printPlan(dataset: VehicleSeedDataset) {
  const countries = new Map<string, number>();
  for (const item of dataset.manufacturers) {
    if (item.country) {
      countries.set(item.country, (countries.get(item.country) ?? 0) + 1);
    }
  }
  const modelsByMake = new Map<string, number>();
  for (const item of dataset.models) {
    modelsByMake.set(
      item.makeSlug,
      (modelsByMake.get(item.makeSlug) ?? 0) + 1,
    );
  }
  const largest = [...modelsByMake.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  const requestedExamples = ['toyota', 'bmw', 'byd'];

  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'plan',
        manufacturers: dataset.manufacturers.length,
        models: dataset.models.length,
        modelYearRecords: dataset.generations.length,
        knownOriginCountries: countries.size,
        manufacturersWithKnownOrigin: [...countries.values()].reduce(
          (sum, count) => sum + count,
          0,
        ),
        manufacturersByCountry: Object.fromEntries(
          [...countries.entries()].sort((a, b) => b[1] - a[1]),
        ),
        largestManufacturers: Object.fromEntries(largest),
        requestedManufacturerExamples: Object.fromEntries(
          requestedExamples.map((slug) => [slug, modelsByMake.get(slug) ?? 0]),
        ),
      },
      null,
      2,
    ),
  );
}

async function main() {
  const dataset = buildVehicleSeedDataset();
  printPlan(dataset);
  if (!process.argv.includes('--apply')) {
    console.log('Dry run complete. Use --apply to write to the database.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    await applyDataset(prisma, dataset);
    console.log('World vehicle database seed applied successfully.');
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
