import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogSuggestionStatus,
  PartPosition,
  PartSide,
  Prisma,
  UserRole,
} from '@prisma/client';
import {
  normalizePartName,
  getPartNameSearchTokens,
} from '../../common/utils/part-name-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { CatalogSearchService } from '../part-catalog/catalog-search.service';
import { ApprovePartCatalogSuggestionDto } from './dto/approve-part-catalog-suggestion.dto';
import { CreatePartCatalogSuggestionDto } from './dto/create-part-catalog-suggestion.dto';
import { QueryPartCatalogSuggestionDto } from './dto/query-part-catalog-suggestion.dto';

export type SuggestionActor = {
  id: string;
  role: UserRole;
  shopId: string | null;
};

const include = {
  shop: { select: { id: true, name: true } },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  suggestedCategory: { select: { id: true, name: true } },
  resolvedBy: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  mergedInto: {
    select: { id: true, internalCode: true, name: true, slug: true },
  },
} satisfies Prisma.PartCatalogSuggestionInclude;

@Injectable()
export class PartCatalogSuggestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogSearch: CatalogSearchService,
  ) {}

  async create(actor: SuggestionActor, dto: CreatePartCatalogSuggestionDto) {
    const shopId = this.requireShop(actor);
    if (dto.suggestedCategoryId)
      await this.requireCategory(dto.suggestedCategoryId);
    const normalizedName = normalizePartName(dto.name);
    const existingCatalogItems = await this.catalogSearch.findMatches({
      search: dto.name,
      isActive: true,
      limit: 1,
    });
    if (existingCatalogItems.length)
      throw new ConflictException(
        'Позиция уже существует в центральном каталоге',
      );
    const duplicate = await this.prisma.partCatalogSuggestion.findFirst({
      where: {
        shopId,
        normalizedName,
        status: CatalogSuggestionStatus.PENDING,
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Такое предложение уже ожидает проверки');
    return this.prisma.partCatalogSuggestion.create({
      data: {
        shopId,
        createdById: actor.id,
        name: dto.name.trim(),
        normalizedName,
        description: dto.description?.trim() || null,
        oemNumber: dto.oemNumber?.trim() || null,
        suggestedCategoryId: dto.suggestedCategoryId,
      },
      include,
    });
  }

  async findAll(actor: SuggestionActor, query: QueryPartCatalogSuggestionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const isAdmin = actor.role === UserRole.SUPER_ADMIN;
    const shopId = isAdmin ? query.shopId : this.requireShop(actor);
    const normalizedSearch = query.search
      ? normalizePartName(query.search)
      : '';
    const where: Prisma.PartCatalogSuggestionWhereInput = {
      ...(shopId && { shopId }),
      ...(query.status && { status: query.status }),
      ...(query.categoryId && { suggestedCategoryId: query.categoryId }),
      ...(normalizedSearch && {
        OR: [
          { normalizedName: { contains: normalizedSearch } },
          { name: { contains: query.search, mode: 'insensitive' } },
          { oemNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.partCatalogSuggestion.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.partCatalogSuggestion.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(actor: SuggestionActor, id: string) {
    const suggestion = await this.prisma.partCatalogSuggestion.findUnique({
      where: { id },
      include,
    });
    if (!suggestion) throw new NotFoundException('Предложение не найдено');
    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      suggestion.shopId !== this.requireShop(actor)
    )
      throw new NotFoundException('Предложение не найдено');
    return suggestion;
  }

  async approve(
    actor: SuggestionActor,
    id: string,
    dto: ApprovePartCatalogSuggestionDto,
  ) {
    const suggestion = await this.requirePending(id);
    await this.requireCategory(dto.categoryId, true);
    const name = dto.name?.trim() || suggestion.name;
    const normalizedName = normalizePartName(name);
    const side = dto.side ?? PartSide.NONE;
    const position = dto.position ?? PartPosition.NONE;
    const slugBase = this.slugify(name) || `part-${Date.now()}`;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const duplicate = await tx.partCatalogItem.findFirst({
          where: { categoryId: dto.categoryId, side, position, normalizedName },
          select: { id: true },
        });
        if (duplicate)
          throw new ConflictException('Такая позиция каталога уже существует');
        const sequence = await tx.appSequence.upsert({
          where: { key: 'PART_CATALOG' },
          create: { key: 'PART_CATALOG', value: 1 },
          update: { value: { increment: 1 } },
        });
        const part = await tx.partCatalogItem.create({
          data: {
            internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
            name,
            normalizedName,
            searchTokens: getPartNameSearchTokens(name),
            slug: `${slugBase}-${sequence.value}`,
            description: dto.description?.trim() || suggestion.description,
            categoryId: dto.categoryId,
            side,
            position,
            isUniversal: dto.isUniversal ?? false,
          },
        });
        return tx.partCatalogSuggestion.update({
          where: { id, status: CatalogSuggestionStatus.PENDING },
          data: {
            status: CatalogSuggestionStatus.APPROVED,
            resolvedById: actor.id,
            resolvedAt: new Date(),
            mergedIntoId: part.id,
          },
          include,
        });
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'Не удалось создать позицию: конфликт уникальности',
        );
      throw error;
    }
  }

  async merge(actor: SuggestionActor, id: string, partCatalogItemId: string) {
    await this.requirePending(id);
    const part = await this.prisma.partCatalogItem.findUnique({
      where: { id: partCatalogItemId },
      select: { id: true },
    });
    if (!part) throw new NotFoundException('Позиция каталога не найдена');
    return this.resolve(id, actor.id, CatalogSuggestionStatus.MERGED, {
      mergedInto: { connect: { id: part.id } },
    });
  }

  async reject(actor: SuggestionActor, id: string, reason: string) {
    await this.requirePending(id);
    return this.resolve(id, actor.id, CatalogSuggestionStatus.REJECTED, {
      rejectionReason: reason.trim(),
    });
  }

  private async resolve(
    id: string,
    userId: string,
    status: CatalogSuggestionStatus,
    data: Prisma.PartCatalogSuggestionUpdateInput,
  ) {
    return this.prisma.$transaction(async (tx) =>
      tx.partCatalogSuggestion.update({
        where: { id, status: CatalogSuggestionStatus.PENDING },
        data: {
          ...data,
          status,
          resolvedBy: { connect: { id: userId } },
          resolvedAt: new Date(),
        },
        include,
      }),
    );
  }

  private async requirePending(id: string) {
    const suggestion = await this.prisma.partCatalogSuggestion.findUnique({
      where: { id },
    });
    if (!suggestion) throw new NotFoundException('Предложение не найдено');
    if (suggestion.status !== CatalogSuggestionStatus.PENDING)
      throw new ConflictException('Предложение уже обработано');
    return suggestion;
  }

  private async requireCategory(id: string, leaf = false) {
    const category = await this.prisma.partCategory.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!category) throw new NotFoundException('Категория не найдена');
    if (!category.isActive)
      throw new BadRequestException('Категория отключена');
    if (
      leaf &&
      (await this.prisma.partCategory.count({
        where: { parentId: id, isActive: true },
      }))
    )
      throw new BadRequestException('Выберите конечную категорию');
  }

  private requireShop(actor: SuggestionActor) {
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    return actor.shopId;
  }

  private slugify(value: string) {
    return normalizePartName(value)
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }
}
