import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartCategoryClassification,
  PartTaxonomyDecisionStatus,
  PartTaxonomyDuplicateStrategy,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../../common/utils/part-name-normalizer';
import { PartTaxonomyService } from './part-taxonomy.service';

type Actor = { id: string };

@Injectable()
export class PartTaxonomyApplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxonomy: PartTaxonomyService,
  ) {}

  async apply(actor: Actor, id: string) {
    return this.applyBatch(actor, [id]);
  }

  async applyBatch(actor: Actor, decisionIds: string[]) {
    const ids = [...new Set(decisionIds)];
    if (!ids.length || ids.length > 50)
      throw new BadRequestException(
        'Пакет должен содержать от 1 до 50 решений',
      );
    const decisions = await this.prisma.partTaxonomyDecision.findMany({
      where: { id: { in: ids } },
      include: { sourceCategory: true, targetCategory: true },
    });
    if (decisions.length !== ids.length)
      throw new NotFoundException('Часть решений не найдена');
    if (
      decisions.some(
        (item) => item.status !== PartTaxonomyDecisionStatus.APPROVED,
      )
    )
      throw new ConflictException('Применять можно только APPROVED решения');
    if (decisions.some((item) => item.riskLevel === 'CRITICAL'))
      throw new ConflictException('CRITICAL risk блокирует пакет');
    if (
      decisions.some(
        (item) => item.classification === PartCategoryClassification.REVIEW,
      )
    )
      throw new ConflictException('REVIEW не применяется');
    const validations = await Promise.all(
      decisions.map((item) => this.taxonomy.validateDecision(item.id)),
    );
    const errors = validations.flatMap((item) => item.errors);
    if (errors.length) throw new BadRequestException(errors);

    const batchId = randomUUID();
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const applied: Array<Record<string, unknown>> = [];
          for (const decision of decisions) {
            await tx.partTaxonomyDecision.update({
              where: { id: decision.id },
              data: { status: 'APPLYING' },
            });
            const outcome = await this.applyOne(tx, decision);
            const updated = await tx.partTaxonomyDecision.update({
              where: { id: decision.id },
              data: {
                status: 'APPLIED',
                appliedById: actor.id,
                appliedAt: new Date(),
                errorMessage: null,
              },
            });
            await tx.partTaxonomyAuditEvent.create({
              data: {
                userId: actor.id,
                entityType: 'PartTaxonomyDecision',
                entityId: decision.id,
                action: 'APPLY',
                batchId,
                oldValues: { status: decision.status },
                newValues: { status: updated.status, outcome },
              },
            });
            applied.push({ decisionId: decision.id, ...outcome });
          }
          return applied;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return { batchId, applied: result.length, results: result };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.slice(0, 1000)
          : 'Неизвестная ошибка apply';
      await this.prisma.$transaction([
        this.prisma.partTaxonomyDecision.updateMany({
          where: { id: { in: ids }, status: 'APPROVED' },
          data: { status: 'FAILED', errorMessage: message },
        }),
        ...ids.map((id) =>
          this.prisma.partTaxonomyAuditEvent.create({
            data: {
              userId: actor.id,
              entityType: 'PartTaxonomyDecision',
              entityId: id,
              action: 'FAILED_APPLY',
              batchId,
              newValues: { errorMessage: message },
            },
          }),
        ),
      ]);
      throw error;
    }
  }

  private async applyOne(tx: Prisma.TransactionClient, decision: any) {
    const existingMapping = await tx.partCategoryCatalogItemMapping.findFirst({
      where: { sourceCategoryId: decision.sourceCategoryId },
    });
    if (existingMapping)
      throw new ConflictException('Source category уже имеет mapping');

    if (decision.classification === PartCategoryClassification.CATEGORY) {
      await tx.partCategory.update({
        where: { id: decision.sourceCategoryId },
        data: { needsReview: false },
      });
      return {
        categoryId: decision.sourceCategoryId,
        mappingId: null,
        catalogItemId: null,
      };
    }
    if (decision.classification === PartCategoryClassification.INVALID) {
      await tx.partCategory.update({
        where: { id: decision.sourceCategoryId },
        data: { isActive: false, needsReview: false },
      });
      return {
        categoryId: decision.sourceCategoryId,
        mappingId: null,
        catalogItemId: null,
      };
    }
    if (decision.classification !== PartCategoryClassification.CATALOG_ITEM)
      throw new ConflictException('Классификация не поддерживает apply');

    let itemId = decision.targetCatalogItemId as string | null;
    if (
      decision.duplicateStrategy === PartTaxonomyDuplicateStrategy.USE_EXISTING
    ) {
      if (!itemId)
        throw new BadRequestException(
          'Для USE_EXISTING нужен targetCatalogItemId',
        );
      const item = await tx.partCatalogItem.findUnique({
        where: { id: itemId },
      });
      if (!item?.isActive)
        throw new ConflictException(
          'Выбранная позиция не существует или неактивна',
        );
    } else {
      if (!decision.targetCategoryId || !decision.canonicalName)
        throw new BadRequestException(
          'Не заполнены target category или canonical name',
        );
      const normalizedName = normalizePartName(decision.canonicalName);
      const slug =
        decision.canonicalSlug || this.slugify(decision.canonicalName);
      const conflicting = await tx.partCatalogItem.findFirst({
        where: {
          categoryId: decision.targetCategoryId,
          slug,
          side: decision.side,
          position: decision.position,
        },
      });
      if (conflicting)
        throw new ConflictException(
          'Позиция с таким slug уже существует; выберите USE_EXISTING',
        );
      const sequence = await tx.appSequence.upsert({
        where: { key: 'PART_CATALOG' },
        create: { key: 'PART_CATALOG', value: 1 },
        update: { value: { increment: 1 } },
      });
      const item = await tx.partCatalogItem.create({
        data: {
          internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
          name: decision.canonicalName,
          normalizedName,
          searchTokens: getPartNameSearchTokens(decision.canonicalName),
          slug,
          categoryId: decision.targetCategoryId,
          side: decision.side,
          position: decision.position,
        },
      });
      itemId = item.id;
    }

    const mapping = await tx.partCategoryCatalogItemMapping.create({
      data: {
        sourceCategoryId: decision.sourceCategoryId,
        targetCatalogItemId: itemId,
        migrationKey: `taxonomy-studio:${decision.sourceCategoryId}`,
        classification: 'CATALOG_ITEM',
        canonicalName: decision.canonicalName || decision.sourceCategory.name,
        notes: decision.notes,
        createdById: decision.createdById,
      },
    });
    const aliases = Array.isArray(decision.aliases)
      ? decision.aliases.filter(
          (item: unknown): item is string => typeof item === 'string',
        )
      : [];
    aliases.push(decision.sourceCategory.name);
    for (const alias of aliases) {
      const normalizedAlias = normalizePartName(alias);
      if (!normalizedAlias) continue;
      await tx.partAlias.upsert({
        where: {
          partCatalogItemId_normalizedAlias: {
            partCatalogItemId: itemId,
            normalizedAlias,
          },
        },
        create: {
          partCatalogItemId: itemId,
          alias: alias.trim(),
          normalizedAlias,
          source: 'TAXONOMY_STUDIO',
          isApproved: true,
        },
        update: {},
      });
    }
    if (decision.deactivateSource)
      await tx.partCategory.update({
        where: { id: decision.sourceCategoryId },
        data: { isActive: false, needsReview: false },
      });
    return {
      categoryId: decision.sourceCategoryId,
      mappingId: mapping.id,
      catalogItemId: itemId,
    };
  }

  private slugify(value: string) {
    const slug = normalizePartName(value)
      .replace(/\s+/g, '-')
      .replace(/[^a-zа-я0-9-]/gi, '');
    return slug || randomUUID();
  }
}
