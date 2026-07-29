import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartPosition, PartSide, Prisma } from '@prisma/client';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogService } from '../part-catalog/part-catalog.service';
import { CreateCatalogBootstrapItemsDto } from './dto/create-catalog-bootstrap-items.dto';
import {
  isUnsafeAutoCreateCategory,
  suggestCatalogItem,
} from './catalog-bootstrap.rules';

@Injectable()
export class CatalogBootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partCatalogService: PartCatalogService,
  ) {}

  async findAll() {
    const [categories, catalogItems] = await Promise.all([
      this.prisma.partCategory.findMany({
        where: { isActive: true, children: { none: {} } },
        select: {
          id: true,
          name: true,
          slug: true,
          needsReview: true,
          parent: {
            select: {
              id: true,
              name: true,
              parent: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.partCatalogItem.findMany({
        select: {
          id: true,
          categoryId: true,
          normalizedName: true,
          slug: true,
          side: true,
          position: true,
        },
      }),
    ]);

    const items = categories.map((category) => {
      const suggestion = suggestCatalogItem(category.name);
      const normalizedName = normalizePartName(suggestion.suggestedName);
      const existing = catalogItems.find(
        (item) =>
          item.side === suggestion.suggestedSide &&
          item.position === suggestion.suggestedPosition &&
          (item.normalizedName === normalizedName ||
            item.slug.toLocaleLowerCase('ru-RU') ===
              category.slug.toLocaleLowerCase('ru-RU')),
      );
      const warnings = [
        ...(suggestion.warning ? [suggestion.warning] : []),
        ...(category.needsReview ? ['Категория ещё не прошла модерацию'] : []),
      ];
      return {
        categoryId: category.id,
        categoryName: category.name,
        parentCategory: category.parent?.name ?? null,
        rootCategory:
          category.parent?.parent?.name ??
          category.parent?.name ??
          category.name,
        path: [
          category.parent?.parent?.name,
          category.parent?.name,
          category.name,
        ]
          .filter(Boolean)
          .join(' > '),
        suggestedName: suggestion.suggestedName,
        suggestedSide: suggestion.suggestedSide,
        suggestedPosition: suggestion.suggestedPosition,
        existsInCatalog: Boolean(existing),
        existingCatalogItemId: existing?.id ?? null,
        warning: warnings.length ? warnings.join('. ') : null,
      };
    });

    return {
      items,
      summary: {
        categoriesFound: items.length,
        alreadyExisted: items.filter((item) => item.existsInCatalog).length,
        newCandidates: items.filter((item) => !item.existsInCatalog).length,
        warnings: items.filter((item) => item.warning).length,
      },
    };
  }

  async createSelected(dto: CreateCatalogBootstrapItemsDto) {
    const categoryIds = [...new Set(dto.items.map((item) => item.categoryId))];
    if (categoryIds.length !== dto.items.length) {
      throw new ConflictException('Одна категория передана несколько раз');
    }
    const categories = await this.prisma.partCategory.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
        children: { none: {} },
      },
      select: { id: true, slug: true },
    });
    if (categories.length !== categoryIds.length) {
      throw new NotFoundException(
        'Одна или несколько категорий не найдены, отключены или не являются листовыми',
      );
    }

    const results: Array<{
      categoryId: string;
      status: 'CREATED' | 'EXISTING' | 'SKIPPED';
      catalogItemId: string | null;
      message: string | null;
    }> = [];

    for (const item of dto.items) {
      const category = categories.find(
        (entry) => entry.id === item.categoryId,
      )!;
      const name = item.name.trim();
      const normalizedName = normalizePartName(name);
      const existing = await this.prisma.partCatalogItem.findFirst({
        where: {
          side: item.side,
          position: item.position,
          OR: [
            { normalizedName },
            { name: { equals: name, mode: 'insensitive' } },
            { slug: { equals: category.slug, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (existing) {
        results.push({
          categoryId: item.categoryId,
          status: 'EXISTING',
          catalogItemId: existing.id,
          message: 'Уже существует',
        });
        continue;
      }

      try {
        const created = await this.partCatalogService.create({
          name,
          slug: category.slug,
          categoryId: item.categoryId,
          side: item.side ?? PartSide.NONE,
          position: item.position ?? PartPosition.NONE,
          isUniversal: false,
          isActive: true,
        });
        results.push({
          categoryId: item.categoryId,
          status: 'CREATED',
          catalogItemId: created.id,
          message: null,
        });
      } catch (error) {
        if (
          error instanceof ConflictException ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002')
        ) {
          results.push({
            categoryId: item.categoryId,
            status: 'EXISTING',
            catalogItemId: null,
            message: 'Уже существует',
          });
          continue;
        }
        results.push({
          categoryId: item.categoryId,
          status: 'SKIPPED',
          catalogItemId: null,
          message:
            error instanceof Error ? error.message : 'Не удалось создать',
        });
      }
    }

    return {
      results,
      summary: {
        requested: dto.items.length,
        created: results.filter((item) => item.status === 'CREATED').length,
        alreadyExisted: results.filter((item) => item.status === 'EXISTING')
          .length,
        skipped: results.filter((item) => item.status === 'SKIPPED').length,
      },
    };
  }

  async autoCreateSafe() {
    throw new ConflictException(
      'Массовое создание отключено: используйте утверждённый taxonomy mapping и отдельный migration workflow',
    );
    /*
    const categories = await this.prisma.partCategory.findMany({
      where: { isActive: true, children: { none: {} } },
      select: {
        id: true,
        name: true,
        slug: true,
        parent: {
          select: {
            name: true,
            parent: { select: { name: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });
    const knownItems = await this.prisma.partCatalogItem.findMany({
      select: {
        id: true,
        normalizedName: true,
        slug: true,
        side: true,
        position: true,
      },
    });

    let created = 0;
    let skippedExisting = 0;
    let skippedUnsafe = 0;
    let failed = 0;
    let safeRecognized = 0;
    let deferred = 0;
    const log: Array<{
      category: string;
      position: string | null;
      status: 'CREATED' | 'EXISTING' | 'UNSAFE' | 'FAILED' | 'DEFERRED';
      reason: string;
    }> = [];

    for (const category of categories) {
      const suggestion = suggestCatalogItem(category.name);
      if (
        isUnsafeAutoCreateCategory(category.name) ||
        !suggestion.canonicalMatched
      ) {
        skippedUnsafe += 1;
        log.push({
          category: category.name,
          position: null,
          status: 'UNSAFE',
          reason: isUnsafeAutoCreateCategory(category.name)
            ? 'Небезопасная или служебная категория'
            : 'Нет подтверждённого правила канонизации',
        });
        continue;
      }
      safeRecognized += 1;

      const normalizedName = normalizePartName(suggestion.suggestedName);
      const existing = knownItems.find(
        (item) =>
          item.side === suggestion.suggestedSide &&
          item.position === suggestion.suggestedPosition &&
          (item.normalizedName === normalizedName ||
            item.slug.toLocaleLowerCase('ru-RU') ===
              category.slug.toLocaleLowerCase('ru-RU')),
      );
      if (existing) {
        skippedExisting += 1;
        log.push({
          category: category.name,
          position: suggestion.suggestedName,
          status: 'EXISTING',
          reason: 'Уже существует',
        });
        continue;
      }
      if (created >= 200) {
        deferred += 1;
        log.push({
          category: category.name,
          position: suggestion.suggestedName,
          status: 'DEFERRED',
          reason: 'Оставлено на следующий запуск из-за лимита 200',
        });
        continue;
      }

      try {
        const part = await this.partCatalogService.create({
          name: suggestion.suggestedName,
          slug: category.slug,
          categoryId: category.id,
          side: suggestion.suggestedSide,
          position: suggestion.suggestedPosition,
          isUniversal: false,
          isActive: true,
        });
        created += 1;
        knownItems.push({
          id: part.id,
          normalizedName,
          slug: category.slug,
          side: suggestion.suggestedSide,
          position: suggestion.suggestedPosition,
        });
        log.push({
          category: category.name,
          position: suggestion.suggestedName,
          status: 'CREATED',
          reason: 'Создано',
        });
      } catch (error) {
        if (
          error instanceof ConflictException ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002')
        ) {
          skippedExisting += 1;
          log.push({
            category: category.name,
            position: suggestion.suggestedName,
            status: 'EXISTING',
            reason: 'Уже существует',
          });
        } else {
          failed += 1;
          log.push({
            category: category.name,
            position: suggestion.suggestedName,
            status: 'FAILED',
            reason: error instanceof Error ? error.message : 'Ошибка создания',
          });
        }
      }
    }

    console.table(
      log.map((entry) => ({
        Категория: entry.category,
        Позиция: entry.position ?? '—',
        Статус: entry.status,
        Причина: entry.reason,
      })),
    );

    return {
      created,
      skippedExisting,
      skippedUnsafe,
      failed,
      categoriesFound: categories.length,
      safeRecognized,
      deferred,
      log,
    }; */
  }
}
