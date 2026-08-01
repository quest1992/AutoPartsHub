import { Prisma, PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isApplyMode,
  printLicenseNotice,
  printMarketSummary,
  printSnapshotMetadata,
} from './tajikistan-ev-market.shared';

const prisma = new PrismaClient();
const SOURCE_LICENSE =
  'Reference-only marketplace taxonomy; no listing content redistributed';
const SNAPSHOT_FILE = join(
  __dirname,
  'data',
  'tajikistan-ev-market',
  'somon-2026-07-31.json',
);

type SourceManufacturer = {
  manufacturer: string;
  sourceUrl: string;
  listingCount: number;
  models: string[];
};
type Snapshot = {
  sourceUrl: string;
  retrievedAt: string;
  purpose: string;
  manufacturers: SourceManufacturer[];
};
type ReportRow = {
  manufacturer: string;
  targetManufacturers: Set<string>;
  found: number;
  existing: number;
  added: number;
  aliases: number;
  skipped: number;
  skipReasons: string[];
};
type RoutedModel = {
  targetManufacturerSlug: string | null;
  targetName: string;
  alias: string | null;
};

type LoadedModel = Prisma.VehicleModelGetPayload<{
  include: { aliases: true };
}>;

const MANUFACTURER_SLUG_OVERRIDES: Record<string, string> = {
  liautolixiang: 'li-auto',
  rollsroyce: 'rolls-royce',
  leopaard: 'hunan-leopaard-motors',
};

const EXACT_SUBBRAND_MODELS: Record<string, RoutedModel> = {
  'byd|leopard3': {
    targetManufacturerSlug: 'fangchengbao',
    targetName: 'Tai 3',
    alias: 'Leopard 3',
  },
  'byd|leopard5': {
    targetManufacturerSlug: 'fangchengbao',
    targetName: 'Bao 5',
    alias: 'Leopard 5',
  },
  'byd|leopard8': {
    targetManufacturerSlug: 'fangchengbao',
    targetName: 'Bao 8',
    alias: 'Leopard 8',
  },
};

const SUBBRAND_PREFIXES: Array<{
  sourceManufacturer: string;
  prefix: string;
  targetManufacturerSlug: string;
  keepPrefix?: string;
}> = [
  {
    sourceManufacturer: 'BYD',
    prefix: 'Denza ',
    targetManufacturerSlug: 'denza',
  },
  {
    sourceManufacturer: 'Changan',
    prefix: 'Deepal ',
    targetManufacturerSlug: 'deepal',
  },
  {
    sourceManufacturer: 'Dongfeng',
    prefix: 'Nammi ',
    targetManufacturerSlug: 'nammi',
  },
  {
    sourceManufacturer: 'FAW',
    prefix: 'Bestune ',
    targetManufacturerSlug: 'bestune',
  },
  {
    sourceManufacturer: 'GAC',
    prefix: 'Aion ',
    targetManufacturerSlug: 'aion',
  },
  {
    sourceManufacturer: 'GAC',
    prefix: 'Hyptec ',
    targetManufacturerSlug: 'hyptec',
  },
  {
    sourceManufacturer: 'Geely',
    prefix: 'Livan ',
    targetManufacturerSlug: 'livan',
  },
  {
    sourceManufacturer: 'Geely',
    prefix: 'Lynk & Co ',
    targetManufacturerSlug: 'lynk-co',
  },
  {
    sourceManufacturer: 'Huawei',
    prefix: 'Aito ',
    targetManufacturerSlug: 'aito',
  },
];

export function normalizeMarketName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '');
}

export function marketSlugify(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-') || 'unknown'
  );
}

export function routeMarketModel(
  sourceManufacturer: string,
  sourceModel: string,
  defaultManufacturerSlug: string | null,
): RoutedModel {
  const exact =
    EXACT_SUBBRAND_MODELS[
      `${normalizeMarketName(sourceManufacturer)}|${normalizeMarketName(sourceModel)}`
    ];
  if (exact) return exact;

  const rule = SUBBRAND_PREFIXES.find(
    (item) =>
      item.sourceManufacturer === sourceManufacturer &&
      sourceModel
        .toLocaleLowerCase()
        .startsWith(item.prefix.toLocaleLowerCase()),
  );
  if (!rule) {
    return {
      targetManufacturerSlug: defaultManufacturerSlug,
      targetName: sourceModel,
      alias: null,
    };
  }

  const suffix = sourceModel.slice(rule.prefix.length).trim();
  return {
    targetManufacturerSlug: rule.targetManufacturerSlug,
    targetName: `${rule.keepPrefix ?? ''}${suffix}`.trim(),
    alias: sourceModel,
  };
}

function readSnapshot(): Snapshot {
  return JSON.parse(
    readFileSync(SNAPSHOT_FILE, 'utf8').replace(/^\uFEFF/, ''),
  ) as Snapshot;
}

function resolveCanonicalModel(
  model: LoadedModel,
  modelsById: Map<string, LoadedModel>,
): LoadedModel | null {
  if (model.isActive && !model.mergedIntoId) return model;
  if (!model.mergedIntoId) return null;
  const target = modelsById.get(model.mergedIntoId);
  return target?.isActive ? target : null;
}

async function buildPlan() {
  const snapshot = readSnapshot();
  const manufacturers = await prisma.manufacturer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, englishName: true, slug: true },
  });
  const manufacturerBySlug = new Map(
    manufacturers.map((item) => [item.slug, item]),
  );
  const manufacturerByName = new Map<string, (typeof manufacturers)[number]>();
  for (const item of manufacturers) {
    for (const name of [item.name, item.englishName]) {
      if (name) manufacturerByName.set(normalizeMarketName(name), item);
    }
  }

  const sourceManufacturerTargets = new Map<string, string | null>();
  for (const source of snapshot.manufacturers) {
    const normalized = normalizeMarketName(source.manufacturer);
    const overrideSlug = MANUFACTURER_SLUG_OVERRIDES[normalized];
    const target = overrideSlug
      ? manufacturerBySlug.get(overrideSlug)
      : manufacturerByName.get(normalized);
    sourceManufacturerTargets.set(source.manufacturer, target?.slug ?? null);
  }

  const targetSlugs = new Set<string>();
  for (const source of snapshot.manufacturers) {
    const defaultSlug =
      sourceManufacturerTargets.get(source.manufacturer) ?? null;
    for (const model of source.models) {
      const routed = routeMarketModel(source.manufacturer, model, defaultSlug);
      if (routed.targetManufacturerSlug)
        targetSlugs.add(routed.targetManufacturerSlug);
    }
  }
  const targetIds = [...targetSlugs]
    .map((slug) => manufacturerBySlug.get(slug)?.id)
    .filter((id): id is string => Boolean(id));
  const databaseModels = await prisma.vehicleModel.findMany({
    where: { manufacturerId: { in: targetIds } },
    include: { aliases: true },
  });
  const modelsById = new Map(databaseModels.map((item) => [item.id, item]));
  const lookup = new Map<string, LoadedModel[]>();
  for (const model of databaseModels) {
    const keys = [
      model.name,
      model.slug,
      ...model.aliases.map((alias) => alias.name),
    ];
    for (const value of keys) {
      const key = `${model.manufacturerId}|${normalizeMarketName(value)}`;
      lookup.set(key, [...(lookup.get(key) ?? []), model]);
    }
  }

  const reports: ReportRow[] = snapshot.manufacturers.map((source) => ({
    manufacturer: source.manufacturer,
    targetManufacturers: new Set<string>(),
    found: source.models.length,
    existing: 0,
    added: 0,
    aliases: 0,
    skipped: 0,
    skipReasons: [],
  }));
  const reportByManufacturer = new Map(
    reports.map((item) => [item.manufacturer, item]),
  );
  const creates: Array<{
    sourceManufacturer: string;
    sourceModel: string;
    manufacturerId: string;
    manufacturerSlug: string;
    name: string;
    slug: string;
    sourceUrl: string;
    alias: string | null;
  }> = [];
  const aliases: Array<{
    sourceManufacturer: string;
    vehicleModelId: string;
    name: string;
    normalizedName: string;
    sourceUrl: string;
  }> = [];
  const plannedKeys = new Set<string>();

  for (const source of snapshot.manufacturers) {
    const report = reportByManufacturer.get(source.manufacturer)!;
    const defaultSlug =
      sourceManufacturerTargets.get(source.manufacturer) ?? null;

    for (const sourceModel of source.models) {
      const routed = routeMarketModel(
        source.manufacturer,
        sourceModel,
        defaultSlug,
      );
      const targetManufacturer = routed.targetManufacturerSlug
        ? manufacturerBySlug.get(routed.targetManufacturerSlug)
        : null;
      if (!targetManufacturer) {
        report.skipped += 1;
        report.skipReasons.push(
          `${sourceModel}: target manufacturer ${routed.targetManufacturerSlug ?? 'unresolved'} not found`,
        );
        continue;
      }
      report.targetManufacturers.add(targetManufacturer.name);

      const key = `${targetManufacturer.id}|${normalizeMarketName(routed.targetName)}`;
      const candidates = [
        ...new Map(
          (lookup.get(key) ?? []).map((item) => [item.id, item]),
        ).values(),
      ];
      const canonical = [
        ...new Map(
          candidates
            .map((item) => resolveCanonicalModel(item, modelsById))
            .filter((item): item is LoadedModel => Boolean(item))
            .map((item) => [item.id, item]),
        ).values(),
      ];

      if (canonical.length > 1) {
        report.skipped += 1;
        report.skipReasons.push(`${sourceModel}: ambiguous normalized match`);
        continue;
      }
      if (canonical.length === 1) {
        const existing = canonical[0];
        report.existing += 1;
        const aliasName = routed.alias;
        if (
          aliasName &&
          normalizeMarketName(aliasName) !==
            normalizeMarketName(existing.name) &&
          !existing.aliases.some(
            (item) =>
              normalizeMarketName(item.name) === normalizeMarketName(aliasName),
          )
        ) {
          aliases.push({
            sourceManufacturer: source.manufacturer,
            vehicleModelId: existing.id,
            name: aliasName,
            normalizedName: aliasName
              .normalize('NFKC')
              .toLocaleLowerCase()
              .replace(/[^a-z0-9]+/g, ' ')
              .trim(),
            sourceUrl: source.sourceUrl,
          });
          report.aliases += 1;
        }
        continue;
      }

      if (plannedKeys.has(key)) {
        report.skipped += 1;
        report.skipReasons.push(
          `${sourceModel}: duplicate within market snapshot`,
        );
        continue;
      }
      plannedKeys.add(key);
      creates.push({
        sourceManufacturer: source.manufacturer,
        sourceModel,
        manufacturerId: targetManufacturer.id,
        manufacturerSlug: targetManufacturer.slug,
        name: routed.targetName,
        slug: marketSlugify(routed.targetName),
        sourceUrl: source.sourceUrl,
        alias: routed.alias,
      });
      report.added += 1;
      if (routed.alias) report.aliases += 1;
    }
  }

  return { snapshot, reports, creates, aliases };
}

async function applyPlan(plan: Awaited<ReturnType<typeof buildPlan>>) {
  return prisma.$transaction(
    async (tx) => {
      let modelsCreated = 0;
      let aliasesCreated = 0;
      for (const item of plan.creates) {
        const existingSlug = await tx.vehicleModel.findFirst({
          where: {
            manufacturerId: item.manufacturerId,
            slug: item.slug,
          },
          select: { id: true, name: true },
        });
        if (existingSlug) {
          throw new Error(
            `Slug conflict for ${item.manufacturerSlug}/${item.slug}: ${existingSlug.name} vs ${item.name}`,
          );
        }
        const created = await tx.vehicleModel.create({
          data: {
            manufacturerId: item.manufacturerId,
            name: item.name,
            slug: item.slug,
            vehicleType: 'car',
            sourceRefs: [item.sourceUrl],
            isActive: true,
          },
          select: { id: true },
        });
        modelsCreated += 1;
        if (item.alias) {
          await tx.vehicleModelAlias.create({
            data: {
              vehicleModelId: created.id,
              name: item.alias,
              normalizedName: item.alias
                .normalize('NFKC')
                .toLocaleLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim(),
              sourceUrl: item.sourceUrl,
              sourceLicense: SOURCE_LICENSE,
            },
          });
          aliasesCreated += 1;
        }
      }
      for (const item of plan.aliases) {
        await tx.vehicleModelAlias.upsert({
          where: {
            vehicleModelId_normalizedName: {
              vehicleModelId: item.vehicleModelId,
              normalizedName: item.normalizedName,
            },
          },
          create: {
            vehicleModelId: item.vehicleModelId,
            name: item.name,
            normalizedName: item.normalizedName,
            sourceUrl: item.sourceUrl,
            sourceLicense: SOURCE_LICENSE,
          },
          update: {},
        });
        aliasesCreated += 1;
      }
      return { modelsCreated, aliasesCreated };
    },
    { timeout: 120_000 },
  );
}

function printableReport(plan: Awaited<ReturnType<typeof buildPlan>>) {
  return {
    source: plan.snapshot.sourceUrl,
    retrievedAt: plan.snapshot.retrievedAt,
    mode: process.argv.includes('--apply') ? 'apply' : 'plan',
    summary: {
      manufacturers: plan.reports.length,
      modelsFound: plan.reports.reduce((sum, item) => sum + item.found, 0),
      alreadyExisting: plan.reports.reduce(
        (sum, item) => sum + item.existing,
        0,
      ),
      modelsToAdd: plan.creates.length,
      aliasesToCreate:
        plan.aliases.length + plan.creates.filter((item) => item.alias).length,
      skipped: plan.reports.reduce((sum, item) => sum + item.skipped, 0),
    },
    manufacturers: plan.reports.map((item) => ({
      manufacturer: item.manufacturer,
      targetManufacturers: [...item.targetManufacturers].sort(),
      found: item.found,
      existing: item.existing,
      added: item.added,
      aliases: item.aliases,
      skipped: item.skipped,
      skipReasons: [...new Set(item.skipReasons)],
    })),
  };
}

async function main() {
  const startedAt = Date.now();
  const apply = isApplyMode();
  const plan = await buildPlan();
  const report = printableReport(plan);

  printSnapshotMetadata(plan.snapshot);
  printMarketSummary({
    manufacturers: report.summary.manufacturers,
    modelsFound: report.summary.modelsFound,
    existing: report.summary.alreadyExisting,
    added: report.summary.modelsToAdd,
    aliases: report.summary.aliasesToCreate,
    skipped: report.summary.skipped,
    manualReview: report.summary.skipped,
    durationMs: Date.now() - startedAt,
    mode: apply ? 'apply' : 'plan',
  });
  console.log(JSON.stringify(report, null, 2));

  if (!apply) {
    if (process.env.NODE_ENV === 'production') {
      console.log(
        'Production safety: --apply is absent; no writes are allowed.',
      );
    }
    console.log('Dry run complete. No database records were changed.');
    return;
  }

  printLicenseNotice(plan.snapshot);
  const applied = await applyPlan(plan);
  console.log(JSON.stringify({ applied }, null, 2));

  console.log('\nPost-apply dry-run:');
  const verificationPlan = await buildPlan();
  const verification = printableReport(verificationPlan);
  printMarketSummary({
    manufacturers: verification.summary.manufacturers,
    modelsFound: verification.summary.modelsFound,
    existing: verification.summary.alreadyExisting,
    added: verification.summary.modelsToAdd,
    aliases: verification.summary.aliasesToCreate,
    skipped: verification.summary.skipped,
    manualReview: verification.summary.skipped,
    durationMs: Date.now() - startedAt,
    mode: 'plan',
  });
  if (
    verification.summary.modelsToAdd !== 0 ||
    verification.summary.aliasesToCreate !== 0
  ) {
    throw new Error('Post-apply idempotency check failed.');
  }
  console.log(
    'Idempotency check passed: 0 manufacturers, 0 models, 0 aliases to add.',
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
