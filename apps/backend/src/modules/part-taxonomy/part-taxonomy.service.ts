import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PartCategoryClassification,
  PartTaxonomyDecisionStatus,
  PartTaxonomyRiskLevel,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import {
  CreateTaxonomyDecisionDto,
  DecisionQueryDto,
  TaxonomyBatchDto,
  TaxonomyCategoryQueryDto,
  UpdateTaxonomyDecisionDto,
} from './dto/part-taxonomy.dto';
import { recommendCategory } from './part-taxonomy-recommendation';

type Actor = { id: string };

const decisionInclude = {
  sourceCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      needsReview: true,
    },
  },
  targetCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      needsReview: true,
    },
  },
  targetCatalogItem: {
    select: { id: true, internalCode: true, name: true, isActive: true },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  appliedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PartTaxonomyDecisionInclude;

@Injectable()
export class PartTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(query: TaxonomyCategoryQueryDto) {
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive: true },
      include: {
        parent: { select: { id: true, name: true, parentId: true } },
        children: { select: { id: true } },
        partCatalogItems: { select: { id: true } },
        catalogItemMappings: {
          select: { id: true, classification: true, targetCatalogItemId: true },
        },
        taxonomySourceDecisions: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    });
    const rows = this.buildCategoryRows(categories);
    let filtered = rows.filter((row) => {
      if (!query.includeProcessed && !row.requiresDecision) return false;
      if (
        query.search &&
        !normalizePartName(row.name).includes(normalizePartName(query.search))
      )
        return false;
      if (query.uuid && row.id !== query.uuid) return false;
      if (query.rootCategoryId && row.rootCategoryId !== query.rootCategoryId)
        return false;
      if (query.level !== undefined && row.level !== query.level) return false;
      if (query.isActive !== undefined && row.isActive !== query.isActive)
        return false;
      if (query.leafOnly !== undefined && row.isLeaf !== query.leafOnly)
        return false;
      if (
        query.hasItems !== undefined &&
        row.directItemsCount > 0 !== query.hasItems
      )
        return false;
      if (
        query.hasMapping !== undefined &&
        row.mappingCount > 0 !== query.hasMapping
      )
        return false;
      if (
        query.needsReview !== undefined &&
        row.needsReview !== query.needsReview
      )
        return false;
      if (
        query.duplicates !== undefined &&
        row.duplicateCount > 0 !== query.duplicates
      )
        return false;
      if (query.suspicious !== undefined && row.suspicious !== query.suspicious)
        return false;
      if (
        query.classification &&
        row.currentClassification !== query.classification
      )
        return false;
      if (query.status && row.decision?.status !== query.status) return false;
      return true;
    });
    const direction = query.sortOrder === 'desc' ? -1 : 1;
    filtered = filtered.sort((a, b) => {
      const field = query.sortBy ?? 'risk';
      const values = {
        name: [a.name, b.name],
        path: [a.path, b.path],
        items: [a.subtreeItemsCount, b.subtreeItemsCount],
        children: [a.childrenCount, b.childrenCount],
        updatedAt: [a.updatedAt, b.updatedAt],
        risk: [
          this.riskRank(a.recommendation.riskLevel),
          this.riskRank(b.recommendation.riskLevel),
        ],
      }[field] ?? [a.name, b.name];
      return (
        String(values[0]).localeCompare(String(values[1]), 'ru', {
          numeric: true,
        }) * direction
      );
    });
    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    const stats = this.buildStats(rows);
    return {
      data: filtered.slice(start, start + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      stats,
    };
  }

  async category(id: string) {
    const category = await this.prisma.partCategory.findFirst({
      where: { id, isActive: true },
      include: {
        parent: true,
        children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        partCatalogItems: {
          include: {
            aliases: true,
            _count: {
              select: {
                shopInventoryItems: true,
                saleItems: true,
                purchaseItems: true,
                customerOrderItems: true,
              },
            },
          },
        },
        catalogItemMappings: { include: { targetCatalogItem: true } },
        taxonomySourceDecisions: {
          include: decisionInclude,
          orderBy: { updatedAt: 'desc' },
        },
        suggestedForModeration: true,
        partCatalogSuggestions: true,
      },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    const recommendation = await this.recommendation(id);
    const normalized = normalizePartName(category.name);
    const duplicates = await this.prisma.partCategory
      .findMany({
        where: { id: { not: id }, isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { name: true } },
        },
      })
      .then((items) =>
        items.filter(
          (item) =>
            normalizePartName(item.name) === normalized ||
            item.slug === category.slug,
        ),
      );
    return { ...category, recommendation, duplicates };
  }

  async recommendation(id: string) {
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive: true },
      include: {
        children: { select: { id: true } },
        partCatalogItems: { select: { id: true } },
        catalogItemMappings: { select: { id: true } },
      },
    });
    const category = categories.find((item) => item.id === id);
    if (!category) throw new NotFoundException('Категория не найдена');
    const normalized = normalizePartName(category.name);
    const duplicateCount = categories.filter(
      (item) => item.id !== id && normalizePartName(item.name) === normalized,
    ).length;
    let level = 0;
    let parentId = category.parentId;
    while (parentId) {
      level += 1;
      parentId =
        categories.find((item) => item.id === parentId)?.parentId ?? null;
    }
    return recommendCategory({
      name: category.name,
      level,
      childrenCount: category.children.length,
      directItemsCount: category.partCatalogItems.length,
      duplicateCount,
      mappingCount: category.catalogItemMappings.length,
      dependencyCount: category.partCatalogItems.length,
    });
  }

  async duplicateGroups() {
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        parent: { select: { name: true } },
        catalogItemMappings: { include: { targetCatalogItem: true } },
        _count: { select: { partCatalogItems: true } },
      },
    });
    const groups = new Map<string, typeof categories>();
    for (const category of categories) {
      const key = normalizePartName(category.name);
      groups.set(key, [...(groups.get(key) ?? []), category]);
    }
    return [...groups.entries()]
      .filter(([, entries]) => entries.length > 1)
      .map(([normalizedName, entries]) => ({ normalizedName, entries }));
  }

  async createDecision(actor: Actor, dto: CreateTaxonomyDecisionDto) {
    await this.ensureEditableSource(dto.sourceCategoryId);
    const recommendation = await this.recommendation(dto.sourceCategoryId);
    const decision = await this.prisma.partTaxonomyDecision.create({
      data: {
        ...this.decisionData(dto),
        riskLevel: recommendation.riskLevel,
        createdById: actor.id,
      },
      include: decisionInclude,
    });
    await this.audit(actor.id, decision.id, 'CREATE', null, decision);
    return decision;
  }

  async updateDecision(
    actor: Actor,
    id: string,
    dto: UpdateTaxonomyDecisionDto,
  ) {
    const existing = await this.decision(id);
    if (existing.status !== PartTaxonomyDecisionStatus.DRAFT)
      throw new ConflictException('Редактировать можно только DRAFT');
    const updated = await this.prisma.partTaxonomyDecision.update({
      where: { id },
      data: this.decisionData(dto),
      include: decisionInclude,
    });
    await this.audit(actor.id, id, 'UPDATE', existing, updated);
    return updated;
  }

  async decisions(query: DecisionQueryDto) {
    const where: Prisma.PartTaxonomyDecisionWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.classification && { classification: query.classification }),
      ...(query.riskLevel && { riskLevel: query.riskLevel }),
      ...(query.sourceCategoryId && {
        sourceCategoryId: query.sourceCategoryId,
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.partTaxonomyDecision.findMany({
        where,
        include: decisionInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.partTaxonomyDecision.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async decision(id: string) {
    const result = await this.prisma.partTaxonomyDecision.findUnique({
      where: { id },
      include: decisionInclude,
    });
    if (!result) throw new NotFoundException('Решение не найдено');
    return result;
  }

  async validateDecision(id: string) {
    const decision = await this.decision(id);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (decision.classification === PartCategoryClassification.REVIEW)
      errors.push('REVIEW нельзя переводить в READY или применять');
    if (decision.classification === PartCategoryClassification.CATALOG_ITEM) {
      if (!decision.targetCategoryId)
        errors.push('Не выбрана целевая структурная категория');
      if (!decision.canonicalName?.trim())
        errors.push('Не задано каноническое название');
      if (!decision.duplicateStrategy)
        errors.push('Не выбрана стратегия дублей');
      if (decision.targetCategoryId === decision.sourceCategoryId)
        errors.push('Legacy-категория не может быть целевой');
      if (
        decision.targetCategory &&
        (!decision.targetCategory.isActive ||
          decision.targetCategory.needsReview)
      )
        errors.push('Целевая категория должна быть активной и подтверждённой');
      if (
        decision.targetCatalogItemId &&
        decision.duplicateStrategy !== 'USE_EXISTING'
      )
        warnings.push(
          'Existing item обычно используется со стратегией USE_EXISTING',
        );
      if (
        decision.duplicateStrategy === 'KEEP_SEPARATE' &&
        decision.canonicalName
      ) {
        const sameName = await this.prisma.partCatalogItem.findFirst({
          where: {
            normalizedName: normalizePartName(decision.canonicalName),
            isActive: true,
            ...(decision.targetCatalogItemId && {
              id: { not: decision.targetCatalogItemId },
            }),
          },
          select: { id: true },
        });
        if (sameName)
          errors.push(
            'KEEP_SEPARATE требует отличимое каноническое имя; найдена неразличимая активная позиция',
          );
      }
      const applied =
        await this.prisma.partCategoryCatalogItemMapping.findFirst({
          where: { sourceCategoryId: decision.sourceCategoryId },
        });
      if (applied) errors.push('Для source category уже существует mapping');
      const aliases = this.aliases(decision.aliases);
      if (new Set(aliases.map(normalizePartName)).size !== aliases.length)
        warnings.push('В aliases есть нормализованные дубли');
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  async ready(actor: Actor, id: string) {
    const decision = await this.decision(id);
    if (
      decision.status !== PartTaxonomyDecisionStatus.DRAFT &&
      decision.status !== PartTaxonomyDecisionStatus.FAILED
    )
      throw new ConflictException(
        'В READY можно перевести только DRAFT или FAILED',
      );
    const validation = await this.validateDecision(id);
    if (!validation.valid) throw new BadRequestException(validation.errors);
    return this.changeStatus(
      actor.id,
      id,
      PartTaxonomyDecisionStatus.READY,
      'READY',
    );
  }

  async approve(actor: Actor, id: string) {
    const decision = await this.decision(id);
    if (decision.status !== PartTaxonomyDecisionStatus.READY)
      throw new ConflictException('Утвердить можно только READY');
    const updated = await this.prisma.partTaxonomyDecision.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: actor.id,
        approvedAt: new Date(),
      },
      include: decisionInclude,
    });
    await this.audit(actor.id, id, 'APPROVE', decision, updated);
    return updated;
  }

  async cancel(actor: Actor, id: string) {
    const decision = await this.decision(id);
    if (decision.status === PartTaxonomyDecisionStatus.APPLIED)
      throw new ConflictException('Применённое решение нельзя отменить');
    return this.changeStatus(
      actor.id,
      id,
      PartTaxonomyDecisionStatus.CANCELLED,
      'CANCEL',
    );
  }

  async preview(actor: Actor, id: string) {
    const decision = await this.decision(id);
    const validation = await this.validateDecision(id);
    const preview = this.previewForDecision(decision, validation);
    await this.audit(actor.id, id, 'PREVIEW', null, preview);
    return preview;
  }

  async batchPreview(actor: Actor, dto: TaxonomyBatchDto) {
    const decisions = await this.batchDecisions(dto.decisionIds);
    const previews = await Promise.all(
      decisions.map((decision) =>
        this.validateDecision(decision.id).then((validation) =>
          this.previewForDecision(decision, validation),
        ),
      ),
    );
    const batchId = randomUUID();
    await this.audit(
      actor.id,
      batchId,
      'BATCH_PREVIEW',
      null,
      { decisionIds: dto.decisionIds },
      batchId,
    );
    return {
      batchId,
      count: decisions.length,
      previews,
      blocked: previews.some(
        (item) => !item.validation.valid || item.riskLevel === 'CRITICAL',
      ),
    };
  }

  async batchReady(actor: Actor, dto: TaxonomyBatchDto) {
    const results: unknown[] = [];
    for (const id of dto.decisionIds) results.push(await this.ready(actor, id));
    return results;
  }

  async batchApprove(actor: Actor, dto: TaxonomyBatchDto) {
    const decisions = await this.batchDecisions(dto.decisionIds);
    if (decisions.some((item) => item.status !== 'READY'))
      throw new ConflictException(
        'Все решения пакета должны иметь статус READY',
      );
    return Promise.all(decisions.map((item) => this.approve(actor, item.id)));
  }

  async exportCsv(query: DecisionQueryDto) {
    const result = await this.decisions({ ...query, page: 1, limit: 100 });
    const header = [
      'sourceCategoryId',
      'name',
      'path',
      'classification',
      'targetCategoryId',
      'canonicalName',
      'aliases',
      'duplicateStrategy',
      'riskLevel',
      'status',
      'notes',
    ];
    const rows = result.data.map((item) =>
      [
        item.sourceCategoryId,
        item.sourceCategory.name,
        item.sourceCategory.name,
        item.classification,
        item.targetCategoryId ?? '',
        item.canonicalName ?? '',
        this.aliases(item.aliases).join('|'),
        item.duplicateStrategy ?? '',
        item.riskLevel,
        item.status,
        item.notes ?? '',
      ]
        .map(this.csvCell)
        .join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  async importCsvPreview(csv: string) {
    const lines = csv
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter(Boolean);
    if (lines.length < 2)
      throw new BadRequestException('CSV не содержит строк данных');
    const headers = this.parseCsvLine(lines[0]);
    const required = ['sourceCategoryId', 'classification'];
    const missing = required.filter((item) => !headers.includes(item));
    if (missing.length)
      throw new BadRequestException(`Нет колонок: ${missing.join(', ')}`);
    const seenSources = new Set<string>();
    const rows = await Promise.all(
      lines.slice(1).map(async (line, index) => {
        const values = this.parseCsvLine(line);
        const row = Object.fromEntries(
          headers.map((header, position) => [header, values[position] ?? '']),
        );
        const errors: string[] = [];
        if (!/^[0-9a-f-]{36}$/i.test(row.sourceCategoryId))
          errors.push('Некорректный sourceCategoryId');
        if (
          !Object.values(PartCategoryClassification).includes(
            row.classification as PartCategoryClassification,
          )
        )
          errors.push('Некорректная classification');
        if (seenSources.has(row.sourceCategoryId))
          errors.push('Дублирующийся sourceCategoryId в CSV');
        seenSources.add(row.sourceCategoryId);
        if (/^[0-9a-f-]{36}$/i.test(row.sourceCategoryId)) {
          const source = await this.prisma.partCategory.findUnique({
            where: { id: row.sourceCategoryId },
            select: { id: true },
          });
          if (!source) errors.push('Source category не найдена');
          const applied = await this.prisma.partTaxonomyDecision.findFirst({
            where: {
              sourceCategoryId: row.sourceCategoryId,
              status: 'APPLIED',
            },
            select: { id: true },
          });
          if (applied)
            errors.push('Для source category уже есть APPLIED решение');
        }
        if (row.targetCategoryId) {
          if (!/^[0-9a-f-]{36}$/i.test(row.targetCategoryId)) {
            errors.push('Некорректный targetCategoryId');
          } else {
            const target = await this.prisma.partCategory.findUnique({
              where: { id: row.targetCategoryId },
              select: { isActive: true, needsReview: true },
            });
            if (!target) errors.push('Target category не найдена');
            else if (!target.isActive || target.needsReview)
              errors.push('Target category не подтверждена');
          }
        }
        if (
          row.duplicateStrategy &&
          ![
            'CREATE_NEW',
            'USE_EXISTING',
            'MERGE_WITH_EXISTING',
            'KEEP_SEPARATE',
            'REQUIRE_REVIEW',
          ].includes(row.duplicateStrategy)
        )
          errors.push('Некорректная duplicate strategy');
        if (row.status && row.status !== 'DRAFT')
          errors.push('CSV import разрешает только DRAFT');
        return { line: index + 2, row, errors };
      }),
    );
    return {
      rows,
      valid: rows.every((item) => item.errors.length === 0),
      summary: {
        total: rows.length,
        invalid: rows.filter((item) => item.errors.length).length,
      },
    };
  }

  async importCsv(actor: Actor, csv: string) {
    const preview = await this.importCsvPreview(csv);
    if (!preview.valid)
      throw new BadRequestException(
        'CSV содержит ошибки; сначала исправьте preview',
      );
    const results: unknown[] = [];
    for (const entry of preview.rows) {
      const row = entry.row;
      const existing = await this.prisma.partTaxonomyDecision.findFirst({
        where: { sourceCategoryId: row.sourceCategoryId, status: 'DRAFT' },
      });
      const data = {
        classification: row.classification as PartCategoryClassification,
        targetCategoryId: row.targetCategoryId || null,
        canonicalName: row.canonicalName || null,
        aliases: (row.aliases || '').split('|').filter(Boolean),
        duplicateStrategy: (row.duplicateStrategy || null) as never,
        notes: row.notes || null,
      };
      if (existing)
        results.push(
          await this.prisma.partTaxonomyDecision.update({
            where: { id: existing.id },
            data,
          }),
        );
      else
        results.push(
          await this.prisma.partTaxonomyDecision.create({
            data: {
              ...data,
              sourceCategoryId: row.sourceCategoryId,
              riskLevel: 'MEDIUM',
              createdById: actor.id,
            },
          }),
        );
    }
    await this.audit(actor.id, randomUUID(), 'CSV_IMPORT_DRAFT', null, {
      count: results.length,
    });
    return { imported: results.length, status: 'DRAFT' };
  }

  private buildCategoryRows(categories: any[]) {
    const byId = new Map(categories.map((item) => [item.id, item]));
    const normalizedCounts = new Map<string, number>();
    categories.forEach((item) =>
      normalizedCounts.set(
        normalizePartName(item.name),
        (normalizedCounts.get(normalizePartName(item.name)) ?? 0) + 1,
      ),
    );
    const pathOf = (item: any) => {
      const names = [item.name];
      let current = item;
      const seen = new Set([item.id]);
      while (
        current.parentId &&
        byId.has(current.parentId) &&
        !seen.has(current.parentId)
      ) {
        current = byId.get(current.parentId);
        seen.add(current.id);
        names.unshift(current.name);
      }
      return {
        path: names.join(' > '),
        level: names.length - 1,
        rootCategoryId: current.id,
      };
    };
    const subtreeItems = (id: string): number => {
      const item = byId.get(id);
      if (!item) return 0;
      return (
        item.partCatalogItems.length +
        item.children.reduce(
          (sum: number, child: any) => sum + subtreeItems(child.id),
          0,
        )
      );
    };
    return categories.map((item) => {
      const location = pathOf(item);
      const duplicateCount =
        (normalizedCounts.get(normalizePartName(item.name)) ?? 1) - 1;
      const recommendation = recommendCategory({
        name: item.name,
        level: location.level,
        childrenCount: item.children.length,
        directItemsCount: item.partCatalogItems.length,
        duplicateCount,
        mappingCount: item.catalogItemMappings.length,
        dependencyCount: item.partCatalogItems.length,
      });
      const decision = item.taxonomySourceDecisions[0] ?? null;
      const currentClassification =
        decision?.classification ??
        item.catalogItemMappings[0]?.classification ??
        null;
      const suspicious =
        item.children.length > 0 && item.partCatalogItems.length > 0;
      const processed =
        item.catalogItemMappings.length > 0 ||
        decision?.status === 'APPLIED' ||
        (!item.needsReview && currentClassification === 'CATEGORY');
      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        ...location,
        isActive: item.isActive,
        needsReview: item.needsReview,
        updatedAt: item.updatedAt,
        isLeaf: item.children.length === 0,
        childrenCount: item.children.length,
        directItemsCount: item.partCatalogItems.length,
        subtreeItemsCount: subtreeItems(item.id),
        mappingCount: item.catalogItemMappings.length,
        duplicateCount,
        suspicious,
        currentClassification,
        decision,
        recommendation,
        requiresDecision:
          !processed ||
          suspicious ||
          duplicateCount > 0 ||
          (!item.isActive && item.catalogItemMappings.length === 0),
      };
    });
  }

  private buildStats(rows: any[]) {
    const decisions = rows.map((row) => row.decision).filter(Boolean);
    return {
      total: rows.length,
      requiresDecision: rows.filter((row) => row.requiresDecision).length,
      categories: rows.filter((row) => row.currentClassification === 'CATEGORY')
        .length,
      catalogItems: rows.filter(
        (row) => row.currentClassification === 'CATALOG_ITEM',
      ).length,
      invalid: rows.filter((row) => row.currentClassification === 'INVALID')
        .length,
      review: rows.filter((row) => row.currentClassification === 'REVIEW')
        .length,
      duplicateGroups: new Set(
        rows
          .filter((row) => row.duplicateCount > 0)
          .map((row) => normalizePartName(row.name)),
      ).size,
      highRisk: rows.filter((row) =>
        ['HIGH', 'CRITICAL'].includes(row.recommendation.riskLevel),
      ).length,
      statuses: Object.fromEntries(
        Object.values(PartTaxonomyDecisionStatus).map((status) => [
          status,
          decisions.filter((item) => item.status === status).length,
        ]),
      ),
      processed: rows.filter((row) => !row.requiresDecision).length,
    };
  }

  private decisionData(
    dto: Partial<CreateTaxonomyDecisionDto>,
  ): Prisma.PartTaxonomyDecisionUncheckedCreateInput {
    return {
      ...(dto.sourceCategoryId !== undefined && {
        sourceCategoryId: dto.sourceCategoryId,
      }),
      ...(dto.classification !== undefined && {
        classification: dto.classification,
      }),
      ...(dto.targetCategoryId !== undefined && {
        targetCategoryId: dto.targetCategoryId || null,
      }),
      ...(dto.targetCatalogItemId !== undefined && {
        targetCatalogItemId: dto.targetCatalogItemId || null,
      }),
      ...(dto.canonicalName !== undefined && {
        canonicalName: dto.canonicalName.trim(),
      }),
      ...(dto.canonicalSlug !== undefined && {
        canonicalSlug: dto.canonicalSlug.trim().toLowerCase(),
      }),
      ...(dto.side !== undefined && { side: dto.side }),
      ...(dto.position !== undefined && { position: dto.position }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.aliases !== undefined && {
        aliases: dto.aliases,
      }),
      ...(dto.duplicateStrategy !== undefined && {
        duplicateStrategy: dto.duplicateStrategy,
      }),
      ...(dto.deactivateSource !== undefined && {
        deactivateSource: dto.deactivateSource,
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.reviewReason !== undefined && { reviewReason: dto.reviewReason }),
    } as Prisma.PartTaxonomyDecisionUncheckedCreateInput;
  }

  private previewForDecision(decision: any, validation: any) {
    const creates =
      decision.classification === 'CATALOG_ITEM' &&
      decision.duplicateStrategy !== 'USE_EXISTING'
        ? ['PartCatalogItem', 'PartCategoryCatalogItemMapping']
        : decision.classification === 'CATALOG_ITEM'
          ? ['PartCategoryCatalogItemMapping']
          : [];
    return {
      decisionId: decision.id,
      classification: decision.classification,
      riskLevel: decision.riskLevel,
      validation,
      creates,
      updates:
        decision.classification === 'CATEGORY'
          ? ['PartCategory.needsReview']
          : [],
      deactivates:
        decision.classification === 'INVALID' ||
        (decision.classification === 'CATALOG_ITEM' &&
          decision.deactivateSource)
          ? [decision.sourceCategory.name]
          : [],
      aliases: this.aliases(decision.aliases),
      targetCategory: decision.targetCategory,
      existingItem: decision.targetCatalogItem,
      mapping: decision.classification === 'CATALOG_ITEM',
      unchanged: [
        'ShopInventoryItem',
        'InventoryMovement',
        'SaleItem',
        'PurchaseItem',
        'CustomerOrderItem',
      ],
    };
  }

  private async ensureEditableSource(sourceCategoryId: string) {
    const source = await this.prisma.partCategory.findUnique({
      where: { id: sourceCategoryId },
    });
    if (!source) throw new NotFoundException('Source category не найдена');
    const existing = await this.prisma.partTaxonomyDecision.findFirst({
      where: {
        sourceCategoryId,
        status: { in: ['READY', 'APPROVED', 'APPLYING'] },
      },
    });
    if (existing)
      throw new ConflictException('Для категории уже есть активное решение');
  }

  private async batchDecisions(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length !== ids.length)
      throw new BadRequestException('Пакет содержит повторяющиеся решения');
    const decisions = await this.prisma.partTaxonomyDecision.findMany({
      where: { id: { in: unique } },
      include: decisionInclude,
    });
    if (decisions.length !== unique.length)
      throw new NotFoundException('Часть решений пакета не найдена');
    return decisions;
  }

  private async changeStatus(
    userId: string,
    id: string,
    status: PartTaxonomyDecisionStatus,
    action: string,
  ) {
    const before = await this.decision(id);
    const updated = await this.prisma.partTaxonomyDecision.update({
      where: { id },
      data: { status, errorMessage: null },
      include: decisionInclude,
    });
    await this.audit(userId, id, action, before, updated);
    return updated;
  }

  private aliases(value: Prisma.JsonValue | null): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private async audit(
    userId: string,
    entityId: string,
    action: string,
    oldValues: unknown,
    newValues: unknown,
    batchId?: string,
  ) {
    await this.prisma.partTaxonomyAuditEvent.create({
      data: {
        userId,
        entityType: 'PartTaxonomyDecision',
        entityId,
        action,
        oldValues: oldValues
          ? JSON.parse(JSON.stringify(oldValues))
          : Prisma.JsonNull,
        newValues: newValues
          ? JSON.parse(JSON.stringify(newValues))
          : Prisma.JsonNull,
        batchId,
      },
    });
  }

  private riskRank(value: PartTaxonomyRiskLevel) {
    return { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[value];
  }
  private csvCell(value: unknown) {
    const text = String(value ?? '');
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }
  private parseCsvLine(line: string) {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        values.push(value);
        value = '';
      } else value += char;
    }
    values.push(value);
    return values;
  }
}
