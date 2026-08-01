import {
  Prisma,
  PrismaClient,
  VehicleGenerationKind,
  VehiclePowertrainType,
} from '@prisma/client';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isApplyMode,
  printLicenseNotice,
  printMarketSummary,
  printSnapshotMetadata,
  readMarketSnapshot,
} from './tajikistan-ev-market.shared';
import {
  buildChinaVehicleDataset,
  ChinaVehicleSeedDataset,
} from './china-vehicle-database.seed';
import {
  buildChinaVehicleSpecifications,
  VehicleSpecificationSeed,
} from './china-vehicle-specifications.seed';
import {
  buildVehicleSeedDataset,
  VehicleSeedDataset,
} from './vehicle-database.seed';

const prisma = new PrismaClient();
const SOMON_SOURCE_PREFIX = 'https://somon.tj/transport/legkovyie-avtomobili/';

type SourceGeneration = {
  sourceKey: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceLicense: string;
  year: number;
};

type TargetModel = Prisma.VehicleModelGetPayload<{
  include: {
    manufacturer: { select: { id: true; name: true; slug: true } };
    aliases: { select: { name: true } };
    generations: { select: { id: true; slug: true } };
    specifications: { select: { id: true; sourceKey: true } };
  };
}>;

type ModelPlan = {
  modelId: string;
  manufacturer: string;
  model: string;
  generations: SourceGeneration[];
  specifications: VehicleSpecificationSeed[];
  manualReviewReasons: string[];
};

export function normalizeCoverageName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function modelKeys(model: TargetModel) {
  return [
    model.name,
    model.slug,
    ...model.aliases.map((item) => item.name),
  ].map((name) => `${model.manufacturer.slug}|${normalizeCoverageName(name)}`);
}

function addGeneration(
  map: Map<string, SourceGeneration>,
  generation: SourceGeneration,
) {
  const key = `${generation.year}|${generation.sourceKey}`;
  map.set(key, generation);
}

function worldGenerationIndex(dataset: VehicleSeedDataset) {
  const index = new Map<string, SourceGeneration[]>();
  const modelNames = new Map(
    dataset.models.map((item) => [
      `${item.makeSlug}|${item.slug}`,
      normalizeCoverageName(item.name),
    ]),
  );
  for (const item of dataset.generations) {
    const name = modelNames.get(`${item.makeSlug}|${item.modelSlug}`);
    if (!name) continue;
    const key = `${item.makeSlug}|${name}`;
    const rows = index.get(key) ?? [];
    rows.push({
      sourceKey: `epa-model-year:${item.makeSlug}/${item.modelSlug}:${item.startYear}`,
      sourceTitle: 'US EPA/DOE FuelEconomy.gov model-year record',
      sourceUrl: 'https://www.fueleconomy.gov/feg/epadata/vehicles.csv',
      sourceLicense: 'United States Government public data',
      year: item.startYear,
    });
    index.set(key, rows);
  }
  return index;
}

function chinaGenerationIndex(dataset: ChinaVehicleSeedDataset) {
  const index = new Map<string, SourceGeneration[]>();
  const modelNames = new Map(
    dataset.models.map((item) => [
      `${item.makeSlug}|${item.slug}`,
      normalizeCoverageName(item.name),
    ]),
  );
  for (const item of dataset.generations) {
    const name = modelNames.get(`${item.makeSlug}|${item.modelSlug}`);
    if (!name) continue;
    const key = `${item.makeSlug}|${name}`;
    const rows = index.get(key) ?? [];
    rows.push({
      sourceKey: `open-ev-model-year:${item.makeSlug}/${item.modelSlug}:${item.startYear}`,
      sourceTitle: 'Open EV Data model-year record',
      sourceUrl: item.sourceRefs[0]!,
      sourceLicense: 'CDLA-Permissive-2.0',
      year: item.startYear,
    });
    index.set(key, rows);
  }
  return index;
}

function specificationIndex(specifications: VehicleSpecificationSeed[]) {
  const index = new Map<string, VehicleSpecificationSeed[]>();
  for (const item of specifications) {
    const key = `${item.makeSlug}|${normalizeCoverageName(item.modelName)}`;
    index.set(key, [...(index.get(key) ?? []), item]);
  }
  return index;
}

async function buildPlan() {
  const targetModels = await prisma.vehicleModel.findMany({
    where: { sourceRefs: { isEmpty: false } },
    include: {
      manufacturer: { select: { id: true, name: true, slug: true } },
      aliases: { select: { name: true } },
      generations: { select: { id: true, slug: true } },
      specifications: { select: { id: true, sourceKey: true } },
    },
    orderBy: [{ manufacturer: { name: 'asc' } }, { name: 'asc' }],
  });
  const v1Models = targetModels.filter((model) =>
    model.sourceRefs.some((source) => source.startsWith(SOMON_SOURCE_PREFIX)),
  );

  const worldDataset = buildVehicleSeedDataset();
  const chinaDataset = buildChinaVehicleDataset();
  const verifiedSpecifications = buildChinaVehicleSpecifications();
  const worldIndex = worldGenerationIndex(worldDataset);
  const chinaIndex = chinaGenerationIndex(chinaDataset);
  const specsIndex = specificationIndex(verifiedSpecifications);
  const sourceKeys = [
    ...new Set(
      verifiedSpecifications.map((specification) => specification.sourceKey),
    ),
  ];
  const existingSourceKeys = await prisma.vehicleSpecification.findMany({
    where: { sourceKey: { in: sourceKeys } },
    select: { sourceKey: true, vehicleModelId: true },
  });
  const sourceKeyOwners = new Map(
    existingSourceKeys.map((item) => [item.sourceKey, item.vehicleModelId]),
  );

  const models: ModelPlan[] = [];
  for (const model of v1Models) {
    const keys = modelKeys(model);
    const generationMap = new Map<string, SourceGeneration>();
    const specificationMap = new Map<string, VehicleSpecificationSeed>();
    for (const key of keys) {
      for (const generation of worldIndex.get(key) ?? [])
        addGeneration(generationMap, generation);
      for (const generation of chinaIndex.get(key) ?? [])
        addGeneration(generationMap, generation);
      for (const specification of specsIndex.get(key) ?? []) {
        const owner = sourceKeyOwners.get(specification.sourceKey);
        if (!owner || owner === model.id) {
          specificationMap.set(specification.sourceKey, specification);
          addGeneration(generationMap, {
            sourceKey: specification.sourceKey,
            sourceTitle: specification.sourceTitle,
            sourceUrl: specification.sourceUrl,
            sourceLicense: specification.sourceLicense,
            year: specification.year,
          });
        }
      }
    }

    const existingGenerationSlugs = new Set(
      model.generations.map((item) => item.slug),
    );
    const existingSpecificationKeys = new Set(
      model.specifications.map((item) => item.sourceKey),
    );
    const generations = [...generationMap.values()]
      .filter((item) => !existingGenerationSlugs.has(`model-year-${item.year}`))
      .sort(
        (a, b) => a.year - b.year || a.sourceKey.localeCompare(b.sourceKey),
      );
    const specifications = [...specificationMap.values()]
      .filter((item) => !existingSpecificationKeys.has(item.sourceKey))
      .sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
    const manualReviewReasons: string[] = [];
    if (generationMap.size === 0)
      manualReviewReasons.push('no verified model-year source match');
    if (specificationMap.size === 0)
      manualReviewReasons.push(
        'no verified factory specification source match',
      );
    models.push({
      modelId: model.id,
      manufacturer: model.manufacturer.name,
      model: model.name,
      generations,
      specifications,
      manualReviewReasons,
    });
  }

  return {
    models,
    manufacturersProcessed: new Set(models.map((item) => item.manufacturer))
      .size,
    generationsToCreate: models.reduce(
      (sum, item) => sum + item.generations.length,
      0,
    ),
    specificationsToCreate: models.reduce(
      (sum, item) => sum + item.specifications.length,
      0,
    ),
  };
}

async function applyPlan(plan: Awaited<ReturnType<typeof buildPlan>>) {
  return prisma.$transaction(
    async (tx) => {
      let generationsCreated = 0;
      let specificationsCreated = 0;
      for (const item of plan.models) {
        const sourceByYear = new Map<number, SourceGeneration>();
        for (const source of item.generations) {
          if (!sourceByYear.has(source.year))
            sourceByYear.set(source.year, source);
        }
        for (const [year, source] of sourceByYear) {
          await tx.vehicleGeneration.upsert({
            where: {
              vehicleModelId_slug: {
                vehicleModelId: item.modelId,
                slug: `model-year-${year}`,
              },
            },
            create: {
              vehicleModelId: item.modelId,
              name: `${year} model year`,
              displayName: `${year} model year`,
              slug: `model-year-${year}`,
              code: `MY${year}`,
              startYear: year,
              endYear: year,
              kind: VehicleGenerationKind.MODEL_YEAR,
              isFacelift: false,
              sourceRefs: [source.sourceUrl],
              notes: `${source.sourceTitle}; ${source.sourceLicense}`,
              isActive: true,
            },
            update: { isActive: true },
          });
          generationsCreated += 1;
        }

        const years = [
          ...new Set([
            ...item.generations.map((source) => source.year),
            ...item.specifications.map((source) => source.year),
          ]),
        ];
        if (years.length > 0) {
          await tx.vehicleModel.update({
            where: { id: item.modelId },
            data: {
              startYear: Math.min(...years),
              endYear: Math.max(...years),
              ...(item.specifications.length > 0 && {
                powertrainType: VehiclePowertrainType.BEV,
              }),
            },
          });
        }

        const generations = await tx.vehicleGeneration.findMany({
          where: {
            vehicleModelId: item.modelId,
            slug: {
              in: item.specifications.map(
                (source) => `model-year-${source.year}`,
              ),
            },
          },
          select: { id: true, startYear: true },
        });
        const generationIdByYear = new Map(
          generations.map((generation) => [
            generation.startYear!,
            generation.id,
          ]),
        );
        for (const source of item.specifications) {
          await tx.vehicleSpecification.upsert({
            where: { sourceKey: source.sourceKey },
            create: {
              vehicleModelId: item.modelId,
              generationId: generationIdByYear.get(source.year),
              sourceKey: source.sourceKey,
              specHash: source.specHash,
              year: source.year,
              trim: source.trim,
              variant: source.variant,
              powertrainType: VehiclePowertrainType.BEV,
              driveType: source.driveType,
              motorCount: source.motorCount,
              motorPowerKw: source.motorPowerKw,
              motorTorqueNm: source.motorTorqueNm,
              motorPositions: source.motorPositions,
              batteryManufacturer: source.batteryManufacturer,
              batteryChemistry: source.batteryChemistry,
              batteryGrossKwh: source.batteryGrossKwh,
              batteryUsableKwh: source.batteryUsableKwh,
              rangeCltcKm: source.rangeCltcKm,
              rangeWltpKm: source.rangeWltpKm,
              rangeEpaKm: source.rangeEpaKm,
              rangeNedcKm: source.rangeNedcKm,
              rangeData: source.ranges as Prisma.InputJsonValue,
              acChargeKw: source.acChargeKw,
              dcChargeKw: source.dcChargeKw,
              chargeConnectors: source.chargeConnectors,
              platform: source.platform,
              doors: source.doors,
              seats: source.seats,
              sourceTitle: source.sourceTitle,
              sourceUrl: source.sourceUrl,
              sourceRetrievedAt: source.sourceRetrievedAt,
              sourceLicense: source.sourceLicense,
              sources: source.sources as Prisma.InputJsonValue,
              isActive: true,
            },
            update: {
              generationId: generationIdByYear.get(source.year),
              isActive: true,
            },
          });
          specificationsCreated += 1;
        }
      }
      return { generationsCreated, specificationsCreated };
    },
    { timeout: 120_000 },
  );
}

function printable(plan: Awaited<ReturnType<typeof buildPlan>>) {
  const manualReview = plan.models
    .filter((item) => item.manualReviewReasons.length > 0)
    .map((item) => ({
      manufacturer: item.manufacturer,
      model: item.model,
      reasons: item.manualReviewReasons,
    }));
  return {
    mode: isApplyMode() ? 'apply' : 'plan',
    manufacturersProcessed: plan.manufacturersProcessed,
    modelsProcessed: plan.models.length,
    vehicleGenerationsToCreate: plan.generationsToCreate,
    vehicleSpecificationsToCreate: plan.specificationsToCreate,
    modelsRequiringManualReview: manualReview.length,
    coveredModels: plan.models
      .filter(
        (item) => item.generations.length > 0 || item.specifications.length > 0,
      )
      .map((item) => ({
        manufacturer: item.manufacturer,
        model: item.model,
        generations: item.generations.length,
        specifications: item.specifications.length,
      })),
    manualReview,
  };
}

async function main() {
  const startedAt = Date.now();
  const apply = isApplyMode();
  const snapshot = readMarketSnapshot();
  const plan = await buildPlan();
  const report = printable(plan);

  printSnapshotMetadata(snapshot);
  printMarketSummary({
    manufacturers: plan.manufacturersProcessed,
    modelsFound: plan.models.length,
    existing: plan.models.length,
    added: plan.generationsToCreate + plan.specificationsToCreate,
    aliases: 0,
    skipped: 0,
    manualReview: report.modelsRequiringManualReview,
    durationMs: Date.now() - startedAt,
    mode: apply ? 'apply' : 'plan',
  });
  console.log(JSON.stringify(report, null, 2));

  if (process.argv.includes('--report-file')) {
    writeFileSync(
      join(
        __dirname,
        'data',
        'tajikistan-ev-market',
        'v2-coverage-report-2026-07-31.json',
      ),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
  }
  if (!apply) {
    if (process.env.NODE_ENV === 'production') {
      console.log(
        'Production safety: --apply is absent; no writes are allowed.',
      );
    }
    console.log('Dry run complete. No database records were changed.');
    return;
  }

  printLicenseNotice(snapshot);
  console.log(
    'V2 scope: only verified VehicleGeneration and VehicleSpecification records; no marketplace listing content.',
  );
  console.log(JSON.stringify({ applied: await applyPlan(plan) }, null, 2));

  console.log('\nPost-apply dry-run:');
  const verificationPlan = await buildPlan();
  const verification = printable(verificationPlan);
  printMarketSummary({
    manufacturers: verificationPlan.manufacturersProcessed,
    modelsFound: verificationPlan.models.length,
    existing: verificationPlan.models.length,
    added:
      verificationPlan.generationsToCreate +
      verificationPlan.specificationsToCreate,
    aliases: 0,
    skipped: 0,
    manualReview: verification.modelsRequiringManualReview,
    durationMs: Date.now() - startedAt,
    mode: 'plan',
  });
  if (
    verificationPlan.generationsToCreate !== 0 ||
    verificationPlan.specificationsToCreate !== 0
  ) {
    throw new Error('Post-apply idempotency check failed.');
  }
  console.log(
    'Idempotency check passed: 0 generations and 0 specifications to add.',
  );
}

if (require.main === module) {
  void main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
