import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryImportJobStatus,
  InventoryMovementType,
  PartCondition,
  PartPosition,
  PartSide,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPartNameSearchTokens,
  getPartNameTokens,
  normalizePartName,
} from '../../common/utils/part-name-normalizer';

import { normalizePartNumber } from '../../common/utils/part-number-normalizer';
import { CreatePartAliasDto } from './dto/create-part-alias.dto';
import { PartCatalogCandidatesQueryDto } from './dto/part-catalog-candidates-query.dto';
import { CreatePartCatalogItemDto } from './dto/create-part-catalog-item.dto';
import { CreatePartCompatibilityDto } from './dto/create-part-compatibility.dto';
import { CreatePartNumberDto } from './dto/create-part-number.dto';
import { PartCatalogItemQueryDto } from './dto/part-catalog-item-query.dto';
import { UpdatePartCatalogItemDto } from './dto/update-part-catalog-item.dto';
import { UpdatePartCompatibilityDto } from './dto/update-part-compatibility.dto';

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  parent: { select: { id: true, name: true, slug: true, isActive: true } },
} satisfies Prisma.PartCategorySelect;

const vehicleGenerationSelect = {
  id: true,
  name: true,
  slug: true,
  startYear: true,
  endYear: true,
  isActive: true,
  vehicleModel: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      manufacturer: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
  },
} satisfies Prisma.VehicleGenerationSelect;

const partNumberSelect = {
  id: true,
  rawNumber: true,
  normalizedNumber: true,
  type: true,
  brand: true,
  isPrimary: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartNumberSelect;

const partAliasSelect = {
  id: true,
  alias: true,
  normalizedAlias: true,
  source: true,
  usageCount: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartAliasSelect;

@Injectable()
export class PartCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartCatalogItemDto) {
    const data = this.normalizePart(dto);
    const side = data.side ?? PartSide.NONE;
    const position = data.position ?? PartPosition.NONE;
    const normalizedName = normalizePartName(data.name);
    const searchTokens = getPartNameSearchTokens(data.name);
    await this.ensureLeafActiveCategory(data.categoryId);
    await this.ensureNoPartDuplicate(
      data.categoryId,
      data.name,
      data.slug,
      side,
      position,
      normalizedName,
    );

    return this.withUniqueConstraintHandling(
      this.prisma.$transaction(async (tx) => {
        const sequence = await tx.appSequence.upsert({
          where: { key: 'PART_CATALOG' },
          create: { key: 'PART_CATALOG', value: 1 },
          update: { value: { increment: 1 } },
        });
        return tx.partCatalogItem.create({
          data: {
            ...data,
            normalizedName,
            searchTokens,
            side,
            position,
            internalCode: `AUT-${String(sequence.value).padStart(6, '0')}`,
          },
          include: {
            category: { select: categorySelect },
            _count: { select: { compatibilities: true } },
          },
        });
      }),
    );
  }

  async findAll(query: PartCatalogItemQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const categoryIds = query.rootCategoryId
      ? await this.getCategorySubtreeIds(query.rootCategoryId)
      : undefined;
    const search = query.search?.trim();
    const normalizedSearch = search ? normalizePartName(search) : '';
    const where: Prisma.PartCatalogItemWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.side && { side: query.side }),
      ...(query.position && { position: query.position }),
      ...(query.isUniversal !== undefined && {
        isUniversal: query.isUniversal,
      }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.internalCode && {
        internalCode: { equals: query.internalCode, mode: 'insensitive' },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { normalizedName: { contains: normalizedSearch } },
          { searchTokens: { contains: getPartNameSearchTokens(search) } },
          {
            aliases: {
              some: {
                isApproved: true,
                normalizedAlias: { contains: normalizedSearch },
              },
            },
          },
          { slug: { contains: search, mode: 'insensitive' } },
          {
            internalCode: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const compatibilityFilter: Prisma.PartCompatibilityWhereInput = {
      ...(query.vehicleGenerationId && {
        vehicleGenerationId: query.vehicleGenerationId,
      }),
      ...(query.vehicleModelId && {
        vehicleGeneration: { vehicleModelId: query.vehicleModelId },
      }),
      ...(query.manufacturerId && {
        vehicleGeneration: {
          vehicleModel: { manufacturerId: query.manufacturerId },
        },
      }),
    };
    if (Object.keys(compatibilityFilter).length > 0)
      where.compatibilities = { some: compatibilityFilter };

    const [data, total] = await Promise.all([
      this.prisma.partCatalogItem.findMany({
        where,
        include: {
          category: { select: categorySelect },
          compatibilities: {
            include: { vehicleGeneration: { select: vehicleGenerationSelect } },
            take: 1,
          },
          _count: { select: { compatibilities: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.partCatalogItem.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.partCatalogItem.findUnique({
      where: { id },
      include: {
        category: { select: categorySelect },
        compatibilities: {
          include: { vehicleGeneration: { select: vehicleGenerationSelect } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { compatibilities: true } },
      },
    });
    if (!item) throw new NotFoundException('Деталь каталога не найдена');
    return item;
  }

  async findCandidates(query: PartCatalogCandidatesQueryDto) {
    const normalizedQuery = normalizePartName(query.q);
    const queryTokens = getPartNameTokens(query.q);
    const querySearchTokens = queryTokens.join(' ');
    const tokenSearches = queryTokens
      .slice(0, 6)
      .flatMap((token) => [
        { normalizedName: { contains: token } },
        { searchTokens: { contains: token } },
      ]);
    const candidates = await this.prisma.partCatalogItem.findMany({
      where: {
        isActive: true,
        ...(query.categoryId && { categoryId: query.categoryId }),
        ...(query.side && { side: query.side }),
        ...(query.position && { position: query.position }),
        OR: [
          { normalizedName: { contains: normalizedQuery } },
          { normalizedName: { equals: normalizedQuery } },
          { searchTokens: { contains: querySearchTokens } },
          ...tokenSearches,
        ],
      },
      select: {
        id: true,
        internalCode: true,
        name: true,
        slug: true,
        categoryId: true,
        side: true,
        position: true,
        normalizedName: true,
        searchTokens: true,
        category: { select: { id: true, name: true } },
      },
      take: 100,
    });

    const ranked = candidates.map((candidate) => {
      const candidateTokens = candidate.searchTokens.split(' ').filter(Boolean);
      const matchedTokens = queryTokens.filter((token) =>
        candidateTokens.includes(token),
      );
      const matchType =
        candidate.normalizedName === normalizedQuery
          ? 'EXACT_NORMALIZED_NAME'
          : candidate.searchTokens === querySearchTokens
            ? 'SAME_TOKENS'
            : matchedTokens.length > 0
              ? 'PARTIAL_TOKENS'
              : 'NAME_CONTAINS';
      const rank =
        matchType === 'EXACT_NORMALIZED_NAME'
          ? 0
          : matchType === 'SAME_TOKENS'
            ? 1
            : matchType === 'PARTIAL_TOKENS'
              ? 2
              : 3;

      return { ...candidate, matchType, matchedTokens, rank };
    });

    return {
      items: ranked
        .sort(
          (left, right) =>
            left.rank - right.rank ||
            right.matchedTokens.length - left.matchedTokens.length ||
            left.name.localeCompare(right.name, 'ru'),
        )
        .slice(0, query.limit ?? 10)
        .map(
          ({ searchTokens: _searchTokens, rank: _rank, ...candidate }) =>
            candidate,
        ),
    };
  }

  async update(id: string, dto: UpdatePartCatalogItemDto) {
    const existing = await this.findOne(id);
    const data = this.normalizePart(dto);
    const categoryId = data.categoryId ?? existing.categoryId;
    const name = data.name ?? existing.name;
    const slug = data.slug ?? existing.slug;
    const side = data.side ?? existing.side;
    const position = data.position ?? existing.position;
    const normalizedName =
      data.name !== undefined
        ? normalizePartName(data.name)
        : existing.normalizedName;

    if (data.categoryId !== undefined || data.isActive === true)
      await this.ensureLeafActiveCategory(categoryId);
    if (data.isUniversal === true && existing._count.compatibilities > 0) {
      throw new BadRequestException(
        'Нельзя сделать деталь универсальной, пока существуют привязки к автомобилям',
      );
    }
    await this.ensureNoPartDuplicate(
      categoryId,
      name,
      slug,
      side,
      position,
      normalizedName,
      id,
    );

    return this.withUniqueConstraintHandling(
      this.prisma.partCatalogItem.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.name !== undefined && {
            normalizedName,
            searchTokens: getPartNameSearchTokens(data.name),
          }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.side !== undefined && { side: data.side }),
          ...(data.position !== undefined && { position: data.position }),
          ...(data.isUniversal !== undefined && {
            isUniversal: data.isUniversal,
          }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
        include: {
          category: { select: categorySelect },
          _count: { select: { compatibilities: true } },
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.partCatalogItem.update({
      where: { id },
      data: { isActive: false },
      include: {
        category: { select: categorySelect },
        _count: { select: { compatibilities: true } },
      },
    });
  }

  async deletePermanently(id: string) {
    await this.findOne(id);
    const [inventoryItems, saleItems, purchaseItems, compatibilities] =
      await this.prisma.$transaction([
        this.prisma.shopInventoryItem.count({
          where: { partCatalogItemId: id },
        }),
        this.prisma.saleItem.count({ where: { partCatalogItemId: id } }),
        this.prisma.purchaseItem.count({ where: { partCatalogItemId: id } }),
        this.prisma.partCompatibility.count({
          where: { partCatalogItemId: id },
        }),
      ]);

    if (
      inventoryItems > 0 ||
      saleItems > 0 ||
      purchaseItems > 0 ||
      compatibilities > 0
    ) {
      throw new ConflictException(
        'Нельзя удалить деталь каталога, пока на неё ссылаются остатки, документы или совместимости',
      );
    }

    return this.prisma.partCatalogItem.delete({ where: { id } });
  }

  async addPartNumber(partCatalogItemId: string, dto: CreatePartNumberDto) {
    await this.ensurePartCatalogItemExists(partCatalogItemId);
    const rawNumber = dto.rawNumber.trim();
    const normalizedNumber = normalizePartNumber(rawNumber);
    if (!normalizedNumber) {
      throw new BadRequestException('Номер запчасти не должен быть пустым');
    }

    return this.withPartNumberUniqueHandling(
      this.prisma.$transaction(async (tx) => {
        const manufacturerName = dto.brand?.trim() || 'Unknown';
        const normalizedManufacturerName =
          manufacturerName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() ||
          'UNKNOWN';
        const manufacturer = await tx.partNumberManufacturer.upsert({
          where: { normalizedName: normalizedManufacturerName },
          update: { isActive: true },
          create: {
            name: manufacturerName,
            normalizedName: normalizedManufacturerName,
            isActive: true,
          },
          select: { id: true },
        });

        if (dto.isPrimary === true) {
          await tx.partNumber.updateMany({
            where: { partCatalogItemId, type: dto.type, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        return tx.partNumber.create({
          data: {
            partCatalogItemId,
            rawNumber,
            normalizedNumber,
            type: dto.type,
            manufacturerId: manufacturer.id,
            ...(dto.brand !== undefined && { brand: dto.brand.trim() }),
            isPrimary: dto.isPrimary ?? false,
          },
          select: partNumberSelect,
        });
      }),
    );
  }

  async getPartNumbers(partCatalogItemId: string) {
    await this.ensurePartCatalogItemExists(partCatalogItemId);
    return this.prisma.partNumber.findMany({
      where: { partCatalogItemId },
      select: partNumberSelect,
      orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }, { rawNumber: 'asc' }],
    });
  }

  async deletePartNumber(partCatalogItemId: string, partNumberId: string) {
    const partNumber = await this.prisma.partNumber.findFirst({
      where: { id: partNumberId, partCatalogItemId },
      select: { id: true },
    });
    if (!partNumber) {
      throw new NotFoundException('Номер не найден для указанной запчасти');
    }

    return this.prisma.partNumber.delete({
      where: { id: partNumber.id },
      select: partNumberSelect,
    });
  }

  async addPartAlias(partCatalogItemId: string, dto: CreatePartAliasDto) {
    await this.ensurePartCatalogItemExists(partCatalogItemId);
    const alias = dto.alias.trim();
    const normalizedAlias = normalizePartName(alias);
    if (!normalizedAlias) {
      throw new BadRequestException('Вариант названия не должен быть пустым');
    }

    if (dto.isApproved ?? true) {
      const conflictingPart = await this.prisma.partCatalogItem.findFirst({
        where: {
          id: { not: partCatalogItemId },
          isActive: true,
          OR: [
            { normalizedName: normalizedAlias },
            {
              aliases: {
                some: { normalizedAlias, isApproved: true },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (conflictingPart) {
        throw new ConflictException(
          'Этот синоним уже относится к другой детали каталога',
        );
      }
    }

    return this.withPartAliasUniqueHandling(
      this.prisma.partAlias.create({
        data: {
          partCatalogItemId,
          alias,
          normalizedAlias,
          ...(dto.source !== undefined && { source: dto.source.trim() }),
          isApproved: dto.isApproved ?? true,
        },
        select: partAliasSelect,
      }),
    );
  }

  async getPartAliases(partCatalogItemId: string) {
    await this.ensurePartCatalogItemExists(partCatalogItemId);
    return this.prisma.partAlias.findMany({
      where: { partCatalogItemId },
      select: partAliasSelect,
      orderBy: [{ isApproved: 'desc' }, { alias: 'asc' }],
    });
  }

  async deletePartAlias(partCatalogItemId: string, partAliasId: string) {
    const partAlias = await this.prisma.partAlias.findFirst({
      where: { id: partAliasId, partCatalogItemId },
      select: { id: true },
    });
    if (!partAlias) {
      throw new NotFoundException(
        'Вариант названия не найден для указанной запчасти',
      );
    }

    return this.prisma.partAlias.delete({
      where: { id: partAlias.id },
      select: partAliasSelect,
    });
  }

  async createCompatibility(partId: string, dto: CreatePartCompatibilityDto) {
    this.validateCompatibilityYears(dto.yearFrom, dto.yearTo);
    const part = await this.ensureActiveCompatiblePart(partId);
    await this.ensureActiveVehicleGeneration(dto.vehicleGenerationId);
    await this.ensureCompatibilityRange(
      dto.vehicleGenerationId,
      dto.yearFrom,
      dto.yearTo,
    );
    await this.ensureNoCompatibilityDuplicate(partId, dto.vehicleGenerationId);

    return this.withCompatibilityUniqueHandling(
      this.prisma.partCompatibility.create({
        data: { ...dto, partCatalogItemId: part.id },
        include: { vehicleGeneration: { select: vehicleGenerationSelect } },
      }),
    );
  }

  async findCompatibilities(partId: string) {
    await this.findOne(partId);
    return this.prisma.partCompatibility.findMany({
      where: { partCatalogItemId: partId },
      include: { vehicleGeneration: { select: vehicleGenerationSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCompatibility(partId: string, compatibilityId: string) {
    const compatibility = await this.prisma.partCompatibility.findFirst({
      where: { id: compatibilityId, partCatalogItemId: partId },
      include: { vehicleGeneration: { select: vehicleGenerationSelect } },
    });
    if (!compatibility)
      throw new NotFoundException(
        'Совместимость не найдена для указанной детали',
      );
    return compatibility;
  }

  async updateCompatibility(
    partId: string,
    compatibilityId: string,
    dto: UpdatePartCompatibilityDto,
  ) {
    const existing = await this.findCompatibility(partId, compatibilityId);
    const part = await this.ensureActiveCompatiblePart(partId);
    const vehicleGenerationId =
      dto.vehicleGenerationId ?? existing.vehicleGenerationId;
    const yearFrom = dto.yearFrom ?? existing.yearFrom;
    const yearTo = dto.yearTo ?? existing.yearTo;
    this.validateCompatibilityYears(yearFrom, yearTo);
    await this.ensureActiveVehicleGeneration(vehicleGenerationId);
    await this.ensureCompatibilityRange(vehicleGenerationId, yearFrom, yearTo);
    await this.ensureNoCompatibilityDuplicate(
      part.id,
      vehicleGenerationId,
      compatibilityId,
    );

    return this.withCompatibilityUniqueHandling(
      this.prisma.partCompatibility.update({
        where: { id: compatibilityId },
        data: {
          ...(dto.vehicleGenerationId !== undefined && {
            vehicleGenerationId: dto.vehicleGenerationId,
          }),
          ...(dto.yearFrom !== undefined && { yearFrom: dto.yearFrom }),
          ...(dto.yearTo !== undefined && { yearTo: dto.yearTo }),
          ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
        },
        include: { vehicleGeneration: { select: vehicleGenerationSelect } },
      }),
    );
  }

  async removeCompatibility(partId: string, compatibilityId: string) {
    await this.findCompatibility(partId, compatibilityId);
    return this.prisma.partCompatibility.delete({
      where: { id: compatibilityId },
    });
  }

  private normalizePart<T extends Partial<CreatePartCatalogItemDto>>(
    dto: T,
  ): T {
    return {
      ...dto,
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.slug !== undefined && { slug: dto.slug.trim().toLowerCase() }),
      ...(dto.description !== undefined && {
        description: dto.description.trim(),
      }),
    };
  }

  private async ensureLeafActiveCategory(categoryId: string) {
    const category = await this.prisma.partCategory.findUnique({
      where: { id: categoryId },
      select: { isActive: true },
    });
    if (!category)
      throw new NotFoundException('Категория запчастей не найдена');
    if (!category.isActive)
      throw new BadRequestException(
        'Нельзя добавить деталь в неактивную категорию',
      );
    const activeChildren = await this.prisma.partCategory.count({
      where: { parentId: categoryId, isActive: true },
    });
    if (activeChildren > 0)
      throw new BadRequestException(
        'Деталь можно привязать только к конечной категории',
      );
  }

  private async ensureNoPartDuplicate(
    categoryId: string,
    name: string,
    slug: string,
    side: PartSide,
    position: PartPosition,
    normalizedName: string,
    excludedId?: string,
  ) {
    const duplicate = await this.prisma.partCatalogItem.findFirst({
      where: {
        categoryId,
        side,
        position,
        ...(excludedId && { id: { not: excludedId } }),
        OR: [
          { normalizedName },
          { name: { equals: name, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException(
        'Деталь с таким названием или slug, стороной и позицией уже существует в этой категории',
      );
  }

  private async getCategorySubtreeIds(rootCategoryId: string) {
    const categories = await this.prisma.partCategory.findMany({
      select: { id: true, parentId: true },
    });
    const children = new Map<string, string[]>();
    for (const category of categories)
      if (category.parentId)
        children.set(category.parentId, [
          ...(children.get(category.parentId) ?? []),
          category.id,
        ]);
    const result: string[] = [];
    const visit = (id: string) => {
      result.push(id);
      for (const childId of children.get(id) ?? []) visit(childId);
    };
    visit(rootCategoryId);
    return result;
  }

  private async ensureActiveCompatiblePart(partId: string) {
    const part = await this.prisma.partCatalogItem.findUnique({
      where: { id: partId },
      select: { id: true, isActive: true, isUniversal: true },
    });
    if (!part) throw new NotFoundException('Деталь каталога не найдена');
    if (!part.isActive)
      throw new BadRequestException('Деталь каталога отключена');
    if (part.isUniversal)
      throw new BadRequestException(
        'Универсальная деталь не может иметь привязку к конкретному автомобилю',
      );
    return part;
  }

  private async ensurePartCatalogItemExists(partCatalogItemId: string) {
    const part = await this.prisma.partCatalogItem.findUnique({
      where: { id: partCatalogItemId },
      select: { id: true },
    });
    if (!part) {
      throw new NotFoundException('Деталь каталога не найдена');
    }
  }

  private async ensureActiveVehicleGeneration(vehicleGenerationId: string) {
    const generation = await this.prisma.vehicleGeneration.findUnique({
      where: { id: vehicleGenerationId },
      select: {
        isActive: true,
        vehicleModel: {
          select: {
            isActive: true,
            manufacturer: { select: { isActive: true } },
          },
        },
      },
    });
    if (!generation)
      throw new NotFoundException('Поколение автомобиля не найдено');
    if (!generation.isActive)
      throw new BadRequestException(
        'Нельзя привязать деталь к неактивному поколению автомобиля',
      );
    if (!generation.vehicleModel.isActive)
      throw new BadRequestException(
        'Нельзя привязать деталь к неактивной модели автомобиля',
      );
    if (!generation.vehicleModel.manufacturer.isActive)
      throw new BadRequestException(
        'Нельзя привязать деталь к модели неактивного производителя',
      );
  }

  private async ensureCompatibilityRange(
    vehicleGenerationId: string,
    yearFrom?: number | null,
    yearTo?: number | null,
  ) {
    const generation = await this.prisma.vehicleGeneration.findUnique({
      where: { id: vehicleGenerationId },
      select: { startYear: true, endYear: true },
    });
    if (!generation)
      throw new NotFoundException('Поколение автомобиля не найдено');
    if (
      (generation.startYear !== null &&
        yearTo !== undefined &&
        yearTo !== null &&
        yearTo < generation.startYear) ||
      (generation.endYear !== null &&
        yearFrom !== undefined &&
        yearFrom !== null &&
        yearFrom > generation.endYear)
    ) {
      throw new BadRequestException(
        'Диапазон совместимости не пересекается с периодом выпуска поколения',
      );
    }
  }

  private validateCompatibilityYears(
    yearFrom?: number | null,
    yearTo?: number | null,
  ) {
    if (
      yearFrom !== undefined &&
      yearFrom !== null &&
      yearTo !== undefined &&
      yearTo !== null &&
      yearTo < yearFrom
    ) {
      throw new BadRequestException(
        'Год окончания не может быть меньше года начала',
      );
    }
  }

  private async ensureNoCompatibilityDuplicate(
    partId: string,
    vehicleGenerationId: string,
    excludedId?: string,
  ) {
    const duplicate = await this.prisma.partCompatibility.findFirst({
      where: {
        partCatalogItemId: partId,
        vehicleGenerationId,
        ...(excludedId && { id: { not: excludedId } }),
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException(
        'Совместимость с этим поколением уже добавлена',
      );
  }

  private async withUniqueConstraintHandling<T>(operation: Promise<T>) {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Деталь с таким названием или slug, стороной и позицией уже существует в этой категории',
        );
      }
      throw error;
    }
  }

  private async withCompatibilityUniqueHandling<T>(operation: Promise<T>) {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Совместимость с этим поколением уже добавлена',
        );
      }
      throw error;
    }
  }

  private async withPartNumberUniqueHandling<T>(operation: Promise<T>) {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Такой номер уже добавлен к этой запчасти');
      }
      throw error;
    }
  }

  private async withPartAliasUniqueHandling<T>(operation: Promise<T>) {
    try {
      return await operation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Такой вариант названия уже добавлен к этой запчасти',
        );
      }
      throw error;
    }
  }
}
