import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalize = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const exportMerges = [
  { source: 'Atto 3', target: 'Yuan Plus', alias: 'Atto 3' },
  { source: 'Atto 2', target: 'Yuan Up', alias: 'Atto 2' },
  { source: 'Dolphin Mini', target: 'Seagull', alias: 'Dolphin Mini' },
  { source: 'Dolphin Surf', target: 'Seagull', alias: 'Dolphin Surf' },
  { source: 'Seal U', target: 'Song Plus', alias: 'Seal U' },
] as const;

const spellingMerges = [
  { source: 'Sea Lion 07', target: 'Sealion 07' },
] as const;

const subbrandPrefixes = [
  { prefix: 'Denza ', manufacturerSlug: 'denza' },
  { prefix: 'Yangwang ', manufacturerSlug: 'yangwang' },
  { prefix: 'Fangchengbao ', manufacturerSlug: 'fangchengbao' },
] as const;

type LoadedModel = Awaited<ReturnType<typeof loadModel>>;
type MergePlanItem = {
  type: string;
  source: {
    id: string;
    name: string;
    isActive: boolean;
    mergedIntoId: string | null;
    [key: string]: unknown;
  };
  target: { id: string; name: string; [key: string]: unknown };
  confirmedAlias: boolean;
  conflicts: string[];
};
type SubbrandPlanItem =
  | {
      type: 'subbrandMerge';
      manufacturer: { id: string; name: string; slug: string };
      cleanName: string;
      source: { id: string; name: string; [key: string]: unknown };
      target: { id: string; name: string; [key: string]: unknown };
      conflicts: string[];
    }
  | {
      type: 'subbrandMove';
      manufacturer: { id: string; name: string; slug: string };
      cleanName: string;
      cleanSlug: string;
      source: { id: string; name: string; [key: string]: unknown };
      target: null;
      conflicts: string[];
    };

function slugify(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadModel(id: string) {
  return prisma.vehicleModel.findUniqueOrThrow({
    where: { id },
    include: {
      manufacturer: { select: { id: true, name: true, slug: true } },
      aliases: true,
      generations: {
        include: {
          _count: {
            select: {
              specifications: true,
              compatibilities: true,
              engines: true,
              modifications: true,
              inventoryItems: true,
              oemPartFitments: true,
            },
          },
        },
      },
      specifications: true,
      _count: {
        select: {
          generations: true,
          specifications: true,
          oemPartFitments: true,
          aliases: true,
        },
      },
    },
  });
}

function references(model: LoadedModel) {
  return {
    vehicleGenerations: model._count.generations,
    vehicleSpecifications: model._count.specifications,
    oemPartFitments: model._count.oemPartFitments,
    aliases: model._count.aliases,
    catalogPartCompatibilities: model.generations.reduce(
      (sum, item) => sum + item._count.compatibilities,
      0,
    ),
    inventoryItems: model.generations.reduce(
      (sum, item) => sum + item._count.inventoryItems,
      0,
    ),
    engines: model.generations.reduce(
      (sum, item) => sum + item._count.engines,
      0,
    ),
    modifications: model.generations.reduce(
      (sum, item) => sum + item._count.modifications,
      0,
    ),
    generationFitments: model.generations.reduce(
      (sum, item) => sum + item._count.oemPartFitments,
      0,
    ),
  };
}

function semanticSpecKey(spec: LoadedModel['specifications'][number]) {
  return [
    spec.year,
    spec.trim ?? '',
    spec.variant ?? '',
    spec.powertrainType,
    spec.driveType ?? '',
    spec.engineCode ?? '',
    spec.motorPowerKw?.toString() ?? '',
    spec.batteryGrossKwh?.toString() ?? '',
  ].join('|');
}

function mergeConflicts(source: LoadedModel, target: LoadedModel) {
  const conflicts: string[] = [];
  const targetGenerations = new Set(target.generations.map((item) => item.slug));
  for (const generation of source.generations) {
    if (targetGenerations.has(generation.slug))
      conflicts.push(`generation slug conflict: ${generation.slug}`);
  }
  const targetSpecs = new Map(
    target.specifications.map((item) => [semanticSpecKey(item), item]),
  );
  for (const spec of source.specifications) {
    const existing = targetSpecs.get(semanticSpecKey(spec));
    if (existing && existing.specHash !== spec.specHash)
      conflicts.push(
        `specification conflict: ${spec.sourceKey} vs ${existing.sourceKey}`,
      );
  }
  return conflicts;
}

async function buildPlan() {
  const manufacturers = await prisma.manufacturer.findMany({
    where: {
      slug: { in: ['byd', 'denza', 'yangwang', 'fangchengbao'] },
    },
    select: { id: true, name: true, slug: true },
  });
  const bySlug = new Map(manufacturers.map((item) => [item.slug, item]));
  const byd = bySlug.get('byd');
  if (!byd) throw new Error('BYD manufacturer not found');

  const bydRows = await prisma.vehicleModel.findMany({
    where: { manufacturerId: byd.id },
    select: { id: true, name: true, slug: true, isActive: true, mergedIntoId: true },
    orderBy: { name: 'asc' },
  });
  const byName = new Map(bydRows.map((item) => [item.name.toLowerCase(), item]));

  const normalizedGroups = new Map<string, typeof bydRows>();
  for (const row of bydRows) {
    const key = normalize(row.name);
    normalizedGroups.set(key, [...(normalizedGroups.get(key) ?? []), row]);
  }
  const normalizedDuplicates = [...normalizedGroups.values()]
    .filter((items) => items.length > 1)
    .map((items) => items.map((item) => item.name));

  const merges: MergePlanItem[] = [];
  const manualReview: Array<Record<string, unknown>> = [];
  for (const mapping of exportMerges) {
    const sourceRow = byName.get(mapping.source.toLowerCase());
    const targetRow = byName.get(mapping.target.toLowerCase());
    if (!sourceRow || !targetRow) {
      manualReview.push({ type: 'missingExportPair', ...mapping });
      continue;
    }
    const [source, target] = await Promise.all([
      loadModel(sourceRow.id),
      loadModel(targetRow.id),
    ]);
    const confirmedAlias = target.aliases.some(
      (alias) => normalize(alias.name) === normalize(mapping.alias),
    );
    const conflicts = mergeConflicts(source, target);
    if (!confirmedAlias)
      conflicts.push(`confirmed alias missing on ${mapping.target}`);
    const item = {
      type: 'exportAlias',
      source: {
        id: source.id,
        name: source.name,
        isActive: source.isActive,
        mergedIntoId: source.mergedIntoId,
        references: references(source),
        generations: source.generations.map((generation) => ({
          id: generation.id,
          name: generation.name,
          slug: generation.slug,
          references: generation._count,
        })),
        specifications: source.specifications.map((spec) => ({
          id: spec.id,
          sourceKey: spec.sourceKey,
          specHash: spec.specHash,
          generationId: spec.generationId,
        })),
        aliases: source.aliases.map((alias) => alias.name),
      },
      target: {
        id: target.id,
        name: target.name,
        references: references(target),
      },
      confirmedAlias,
      conflicts,
    };
    if (conflicts.length) manualReview.push(item);
    else if (source.isActive || source.mergedIntoId !== target.id) merges.push(item);
  }

  for (const mapping of spellingMerges) {
    const sourceRow = byName.get(mapping.source.toLowerCase());
    const targetRow = byName.get(mapping.target.toLowerCase());
    if (!sourceRow || !targetRow) {
      manualReview.push({ type: 'missingSpellingPair', ...mapping });
      continue;
    }
    const [source, target] = await Promise.all([
      loadModel(sourceRow.id),
      loadModel(targetRow.id),
    ]);
    const conflicts = mergeConflicts(source, target);
    const item = {
      type: 'spellingDuplicate',
      source: {
        id: source.id,
        name: source.name,
        isActive: source.isActive,
        mergedIntoId: source.mergedIntoId,
        references: references(source),
        generations: source.generations.map((generation) => ({
          id: generation.id,
          name: generation.name,
          slug: generation.slug,
          references: generation._count,
        })),
        specifications: source.specifications.map((spec) => ({
          id: spec.id,
          sourceKey: spec.sourceKey,
          specHash: spec.specHash,
          generationId: spec.generationId,
        })),
        aliases: source.aliases.map((alias) => alias.name),
      },
      target: {
        id: target.id,
        name: target.name,
        references: references(target),
      },
      confirmedAlias: true,
      conflicts,
    };
    if (conflicts.length) manualReview.push(item);
    else if (source.isActive || source.mergedIntoId !== target.id) merges.push(item);
  }

  const subbrandModels: SubbrandPlanItem[] = [];
  for (const row of bydRows) {
    const rule = subbrandPrefixes.find((item) => row.name.startsWith(item.prefix));
    if (!rule) continue;
    const manufacturer = bySlug.get(rule.manufacturerSlug);
    if (!manufacturer) {
      manualReview.push({
        type: 'missingSubbrandManufacturer',
        model: row.name,
        manufacturerSlug: rule.manufacturerSlug,
      });
      continue;
    }
    const source = await loadModel(row.id);
    const cleanName = row.name.slice(rule.prefix.length);
    const cleanSlug = slugify(cleanName);
    if (rule.manufacturerSlug === 'fangchengbao' && cleanName === 'Ti3') {
      const possibleTarget = await prisma.vehicleModel.findFirst({
        where: { manufacturerId: manufacturer.id, slug: 'tai-3' },
        select: { id: true, name: true, slug: true },
      });
      if (possibleTarget) {
        manualReview.push({
          type: 'possibleSubbrandSpellingConflict',
          source: {
            id: source.id,
            name: source.name,
            references: references(source),
          },
          possibleTarget,
          reason: 'Ti3 and Tai 3 require source-level identity confirmation',
        });
        continue;
      }
    }
    const existing = await prisma.vehicleModel.findFirst({
      where: {
        manufacturerId: manufacturer.id,
        OR: [
          { name: { equals: cleanName, mode: 'insensitive' } },
          { slug: cleanSlug },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      const target = await loadModel(existing.id);
      const conflicts = mergeConflicts(source, target);
      const item = {
        type: 'subbrandMerge' as const,
        manufacturer,
        cleanName,
        source: {
          id: source.id,
          name: source.name,
          references: references(source),
        },
        target: {
          id: target.id,
          name: target.name,
          references: references(target),
        },
        conflicts,
      };
      if (conflicts.length) manualReview.push(item);
      else if (source.isActive || source.mergedIntoId !== target.id)
        subbrandModels.push(item);
    } else {
      subbrandModels.push({
        type: 'subbrandMove' as const,
        manufacturer,
        cleanName,
        cleanSlug,
        source: {
          id: source.id,
          name: source.name,
          references: references(source),
        },
        target: null,
        conflicts: [],
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    bydManufacturerId: byd.id,
    totalBydModels: bydRows.length,
    normalizedDuplicates,
    exportRecordsCoveredByAliases: merges,
    subbrandModels,
    manualReview,
    summary: {
      normalizedDuplicateGroups: normalizedDuplicates.length,
      mergeCandidates: merges.length,
      subbrandCandidates: subbrandModels.length,
      manualReview: manualReview.length,
    },
  };
}

async function transferAndMerge(
  tx: Prisma.TransactionClient,
  sourceId: string,
  targetId: string,
  batchId: string,
  action: string,
  targetManufacturerId?: string,
) {
  const [source, target] = await Promise.all([
    tx.vehicleModel.findUniqueOrThrow({
      where: { id: sourceId },
      include: { aliases: true },
    }),
    tx.vehicleModel.findUniqueOrThrow({ where: { id: targetId } }),
  ]);
  if (!source.isActive && source.mergedIntoId === targetId) return 0;

  for (const alias of source.aliases) {
    await tx.vehicleModelAlias.upsert({
      where: {
        vehicleModelId_normalizedName: {
          vehicleModelId: targetId,
          normalizedName: alias.normalizedName,
        },
      },
      create: {
        vehicleModelId: targetId,
        name: alias.name,
        normalizedName: alias.normalizedName,
        sourceUrl: alias.sourceUrl,
        sourceLicense: alias.sourceLicense,
      },
      update: {},
    });
  }
  await tx.vehicleModelAlias.upsert({
    where: {
      vehicleModelId_normalizedName: {
        vehicleModelId: targetId,
        normalizedName: source.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
      },
    },
    create: {
      vehicleModelId: targetId,
      name: source.name,
      normalizedName: source.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
      sourceUrl: source.sourceRefs[0] ?? 'internal://vehicle-data-cleanup',
      sourceLicense: source.sourceRefs.some((ref) => ref.includes('wikidata.org'))
        ? 'CC0-1.0'
        : 'Existing project data; identity confirmed by cleanup plan',
    },
    update: {},
  });
  const generationResult = await tx.vehicleGeneration.updateMany({
    where: { vehicleModelId: sourceId },
    data: { vehicleModelId: targetId },
  });
  const specificationResult = await tx.vehicleSpecification.updateMany({
    where: { vehicleModelId: sourceId },
    data: { vehicleModelId: targetId },
  });
  const fitmentResult = await tx.oemPartFitment.updateMany({
    where: { vehicleModelId: sourceId },
    data: {
      vehicleModelId: targetId,
      ...(targetManufacturerId && { manufacturerId: targetManufacturerId }),
    },
  });
  await tx.vehicleModel.update({
    where: { id: sourceId },
    data: { isActive: false, mergedIntoId: targetId },
  });
  const moved =
    generationResult.count + specificationResult.count + fitmentResult.count;
  await tx.vehicleDataAuditLog.create({
    data: {
      batchId,
      action,
      sourceModelId: sourceId,
      targetModelId: targetId,
      beforeJson: {
        manufacturerId: source.manufacturerId,
        isActive: source.isActive,
        mergedIntoId: source.mergedIntoId,
      },
      afterJson: {
        isActive: false,
        mergedIntoId: targetId,
        targetManufacturerId: target.manufacturerId,
      },
      metadata: {
        generationsMoved: generationResult.count,
        specificationsMoved: specificationResult.count,
        fitmentsMoved: fitmentResult.count,
      },
    },
  });
  return moved;
}

async function applyPlan(plan: Awaited<ReturnType<typeof buildPlan>>) {
  if (plan.manualReview.length)
    console.warn(
      `${plan.manualReview.length} item(s) remain in manualReview and will be skipped.`,
    );
  const batchId = randomUUID();
  return prisma.$transaction(
    async (tx) => {
      let merged = 0;
      let movedRelations = 0;
      let fixedSubbrandModels = 0;

      for (const item of plan.exportRecordsCoveredByAliases) {
        movedRelations += await transferAndMerge(
          tx,
          item.source.id,
          item.target.id,
          batchId,
          'MERGE_EXPORT_MODEL',
        );
        merged += 1;
      }
      for (const item of plan.subbrandModels) {
        if (item.type === 'subbrandMerge' && item.target) {
          movedRelations += await transferAndMerge(
            tx,
            item.source.id,
            item.target.id,
            batchId,
            'MERGE_SUBBRAND_MODEL',
            item.manufacturer.id,
          );
          merged += 1;
          fixedSubbrandModels += 1;
          continue;
        }
        if (item.type === 'subbrandMove') {
          const source = await tx.vehicleModel.findUniqueOrThrow({
            where: { id: item.source.id },
          });
          if (source.manufacturerId === item.manufacturer.id) continue;
          const fitments = await tx.oemPartFitment.updateMany({
            where: { vehicleModelId: source.id },
            data: { manufacturerId: item.manufacturer.id },
          });
          await tx.vehicleModel.update({
            where: { id: source.id },
            data: {
              manufacturerId: item.manufacturer.id,
              name: item.cleanName,
              slug: item.cleanSlug,
            },
          });
          await tx.vehicleDataAuditLog.create({
            data: {
              batchId,
              action: 'MOVE_SUBBRAND_MODEL',
              sourceModelId: source.id,
              beforeJson: {
                manufacturerId: source.manufacturerId,
                name: source.name,
                slug: source.slug,
              },
              afterJson: {
                manufacturerId: item.manufacturer.id,
                name: item.cleanName,
                slug: item.cleanSlug,
              },
              metadata: { fitmentsUpdated: fitments.count },
            },
          });
          movedRelations += fitments.count;
          fixedSubbrandModels += 1;
        }
      }
      return { batchId, merged, movedRelations, fixedSubbrandModels };
    },
    { timeout: 60_000 },
  );
}

async function main() {
  const plan = await buildPlan();
  console.log(JSON.stringify(plan, null, 2));
  if (!process.argv.includes('--apply')) {
    console.log('Dry run complete. No database records were changed.');
    return;
  }
  const result = await applyPlan(plan);
  console.log(JSON.stringify({ applied: result }, null, 2));
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
