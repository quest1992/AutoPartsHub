import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import { normalizePartNumber } from '../../common/utils/part-number-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { OemSearchQueryDto } from './dto/oem-search-query.dto';
import {
  AddOemAliasDto,
  AddOemCategoryDto,
  AddOemCrossReferenceDto,
  AddOemFitmentDto,
  CreateOemContributionDto,
  CreateOemPartDto,
  UpdateOemPartDto,
} from './dto/oem-write.dto';

export type OemActor = {
  id: string;
  role: UserRole;
  shopId: string | null;
};

const include = {
  manufacturer: { select: { id: true, name: true, slug: true } },
  source: true,
  aliases: { include: { source: true } },
  categories: {
    include: {
      catalogItem: { include: { category: true } },
      source: true,
    },
  },
  brands: { include: { partBrand: true, source: true } },
  fitments: {
    include: {
      manufacturer: true,
      vehicleModel: true,
      vehicleGeneration: true,
      vehicleSpecification: true,
      source: true,
    },
  },
  outgoingCrossReferences: {
    include: { toOemPart: true, partBrand: true, source: true },
  },
} satisfies Prisma.OemPartInclude;

@Injectable()
export class OemDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeOemNumber(value: string): string {
    return normalizePartNumber(value);
  }

  async list(query: OemSearchQueryDto) {
    return this.query(query, false);
  }

  async search(query: OemSearchQueryDto) {
    return this.query(query, true);
  }

  async get(id: string) {
    const item = await this.prisma.oemPart.findUnique({
      where: { id },
      include,
    });
    if (!item) throw new NotFoundException('OEM part not found');
    return item;
  }

  async create(dto: CreateOemPartDto, actor: OemActor) {
    const normalizedNumber = this.requiredNumber(dto.number);
    await this.assertManufacturerAndSource(dto.manufacturerId, dto.sourceId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.oemPart.create({
          data: {
            number: dto.number.trim(),
            normalizedNumber,
            displayNumber: dto.displayNumber?.trim() || dto.number.trim(),
            description: dto.description?.trim(),
            descriptionNormalized: dto.description
              ? normalizePartName(dto.description)
              : undefined,
            status: dto.status,
            manufacturerId: dto.manufacturerId,
            sourceId: dto.sourceId,
            sourceKey: dto.sourceKey.trim(),
            metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
          },
          include,
        });
        await this.audit(tx, 'OemPart', item.id, 'CREATE', null, item, actor);
        return item;
      });
    } catch (error) {
      this.unique(error);
    }
  }

  async update(id: string, dto: UpdateOemPartDto, actor: OemActor) {
    const before = await this.get(id);
    const manufacturerId = dto.manufacturerId ?? before.manufacturerId;
    const sourceId = dto.sourceId ?? before.sourceId;
    await this.assertManufacturerAndSource(manufacturerId, sourceId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.oemPart.update({
          where: { id },
          data: {
            number: dto.number?.trim(),
            normalizedNumber: dto.number
              ? this.requiredNumber(dto.number)
              : undefined,
            displayNumber: dto.displayNumber?.trim(),
            description: dto.description?.trim(),
            descriptionNormalized:
              dto.description === undefined
                ? undefined
                : normalizePartName(dto.description),
            status: dto.status,
            manufacturerId: dto.manufacturerId,
            sourceId: dto.sourceId,
            sourceKey: dto.sourceKey?.trim(),
            metadata: dto.metadata as Prisma.InputJsonValue | undefined,
          },
          include,
        });
        await this.audit(tx, 'OemPart', id, 'UPDATE', before, item, actor);
        return item;
      });
    } catch (error) {
      this.unique(error);
    }
  }

  async addAlias(id: string, dto: AddOemAliasDto, actor: OemActor) {
    await this.get(id);
    await this.assertSource(dto.sourceId);
    const normalizedAlias = this.requiredNumber(dto.alias);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.oemPartAlias.create({
        data: {
          oemPartId: id,
          alias: dto.alias.trim(),
          normalizedAlias,
          aliasType: dto.aliasType,
          sourceId: dto.sourceId,
        },
      });
      await this.audit(
        tx,
        'OemPartAlias',
        item.id,
        'CREATE',
        null,
        item,
        actor,
      );
      return item;
    });
  }

  async addCategory(id: string, dto: AddOemCategoryDto, actor: OemActor) {
    await this.get(id);
    await this.assertSource(dto.sourceId);
    const catalog = await this.prisma.partCatalogItem.findFirst({
      where: {
        id: dto.catalogItemId,
        isActive: true,
        category: { isActive: true },
      },
      select: { id: true },
    });
    if (!catalog)
      throw new NotFoundException('Active Catalog v2 item not found');
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.oemPartCategory.updateMany({
          where: { oemPartId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      const item = await tx.oemPartCategory.upsert({
        where: {
          oemPartId_catalogItemId: {
            oemPartId: id,
            catalogItemId: dto.catalogItemId,
          },
        },
        create: { oemPartId: id, ...dto },
        update: {
          isPrimary: dto.isPrimary,
          confidence: dto.confidence,
          sourceId: dto.sourceId,
        },
      });
      await this.audit(
        tx,
        'OemPartCategory',
        item.id,
        'UPSERT',
        null,
        item,
        actor,
      );
      return item;
    });
  }

  async addFitment(id: string, dto: AddOemFitmentDto, actor: OemActor) {
    await this.get(id);
    await this.assertSource(dto.sourceId);
    if (dto.yearFrom && dto.yearTo && dto.yearFrom > dto.yearTo) {
      throw new BadRequestException('yearFrom cannot exceed yearTo');
    }
    await this.assertFitment(dto);
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.oemPartFitment.create({
        data: { oemPartId: id, ...dto },
      });
      await this.audit(
        tx,
        'OemPartFitment',
        item.id,
        'CREATE',
        null,
        item,
        actor,
      );
      return item;
    });
  }

  async addCrossReference(
    id: string,
    dto: AddOemCrossReferenceDto,
    actor: OemActor,
  ) {
    await this.get(id);
    await this.assertSource(dto.sourceId);
    if (dto.toOemPartId === id)
      throw new BadRequestException('OEM cannot reference itself');
    const normalizedExternalPartNumber = dto.externalPartNumber
      ? this.requiredNumber(dto.externalPartNumber)
      : null;
    if (
      !dto.toOemPartId &&
      (!dto.partBrandId || !normalizedExternalPartNumber)
    ) {
      throw new BadRequestException('Cross-reference target is incomplete');
    }
    if (dto.toOemPartId) {
      await this.get(dto.toOemPartId);
      if (await this.reaches(dto.toOemPartId, id)) {
        throw new ConflictException('Cross-reference creates a cycle');
      }
    }
    const fingerprint = [
      id,
      dto.toOemPartId ?? '',
      dto.partBrandId ?? '',
      normalizedExternalPartNumber ?? '',
      dto.relationType,
    ].join('|');
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.oemCrossReference.create({
        data: {
          fromOemPartId: id,
          toOemPartId: dto.toOemPartId,
          partBrandId: dto.partBrandId,
          externalPartNumber: dto.externalPartNumber?.trim(),
          normalizedExternalPartNumber,
          relationType: dto.relationType,
          confidence: dto.confidence,
          sourceId: dto.sourceId,
          notes: dto.notes,
          fingerprint,
        },
      });
      await this.audit(
        tx,
        'OemCrossReference',
        item.id,
        'CREATE',
        null,
        item,
        actor,
      );
      return item;
    });
  }

  async contribute(dto: CreateOemContributionDto, actor: OemActor) {
    if (!actor.shopId) throw new BadRequestException('Shop user is required');
    return this.prisma.oemContribution.create({
      data: {
        shopId: actor.shopId,
        submittedById: actor.id,
        type: dto.type,
        payloadJson: dto.payloadJson as Prisma.InputJsonValue,
      },
    });
  }

  private async query(query: OemSearchQueryDto, requireSearch: boolean) {
    const raw = (query.search ?? query.q ?? '').trim();
    if (requireSearch && !raw)
      throw new BadRequestException('Search query is required');
    const normalized = raw ? this.normalizeOemNumber(raw) : '';
    const text = raw ? normalizePartName(raw) : '';
    if (raw && !normalized && !text)
      throw new BadRequestException('Search query is invalid');
    const searchOr: Prisma.OemPartWhereInput[] = [];
    if (normalized) {
      searchOr.push(
        { normalizedNumber: { startsWith: normalized } },
        {
          aliases: { some: { normalizedAlias: { startsWith: normalized } } },
        },
        {
          outgoingCrossReferences: {
            some: {
              normalizedExternalPartNumber: { startsWith: normalized },
            },
          },
        },
      );
    }
    if (text) {
      searchOr.push(
        { descriptionNormalized: { contains: text, mode: 'insensitive' } },
        {
          brands: {
            some: {
              partBrand: {
                officialName: { contains: raw, mode: 'insensitive' },
              },
            },
          },
        },
        {
          fitments: {
            some: {
              vehicleModel: { name: { contains: raw, mode: 'insensitive' } },
            },
          },
        },
      );
    }
    const where: Prisma.OemPartWhereInput = {
      manufacturerId: query.manufacturerId,
      ...(query.vehicleModelId && {
        fitments: { some: { vehicleModelId: query.vehicleModelId } },
      }),
      ...(query.vehicleGenerationId && {
        fitments: { some: { vehicleGenerationId: query.vehicleGenerationId } },
      }),
      ...(query.vehicleSpecificationId && {
        fitments: {
          some: { vehicleSpecificationId: query.vehicleSpecificationId },
        },
      }),
      ...(query.partBrandId && {
        brands: { some: { partBrandId: query.partBrandId } },
      }),
      ...(query.catalogItemId && {
        categories: { some: { catalogItemId: query.catalogItemId } },
      }),
      ...(searchOr.length && { OR: searchOr }),
    };
    const rows = await this.prisma.oemPart.findMany({
      where,
      include,
      take: Math.min(query.limit * 4, 400),
    });
    const ranked = rows
      .map((item) => ({ item, rank: this.rank(item, normalized, text) }))
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          a.item.normalizedNumber.localeCompare(b.item.normalizedNumber),
      );
    const start = (query.page - 1) * query.limit;
    return {
      data: ranked.slice(start, start + query.limit).map(({ item }) => item),
      meta: {
        total: ranked.length,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(ranked.length / query.limit),
      },
    };
  }

  private rank(item: any, normalized: string, text: string) {
    if (!normalized && !text) return 10;
    if (item.normalizedNumber === normalized) return 0;
    if (item.aliases.some((a: any) => a.normalizedAlias === normalized))
      return 1;
    if (
      item.outgoingCrossReferences.some(
        (x: any) => x.normalizedExternalPartNumber === normalized,
      )
    )
      return 2;
    if (item.normalizedNumber.startsWith(normalized)) return 3;
    return 4;
  }

  private requiredNumber(value: string, throwIfEmpty = true) {
    const normalized = normalizePartNumber(value);
    if (!normalized && throwIfEmpty) {
      throw new BadRequestException(
        'Number must contain Latin letters or digits',
      );
    }
    return normalized;
  }

  private async assertManufacturerAndSource(
    manufacturerId: string,
    sourceId: string,
  ) {
    const [manufacturer] = await Promise.all([
      this.prisma.manufacturer.findFirst({
        where: { id: manufacturerId, isActive: true },
      }),
      this.assertSource(sourceId),
    ]);
    if (!manufacturer)
      throw new NotFoundException('Active manufacturer not found');
  }

  private async assertSource(sourceId: string) {
    const source = await this.prisma.oemSource.findFirst({
      where: { id: sourceId, isActive: true },
    });
    if (!source) throw new NotFoundException('Active OEM source not found');
    return source;
  }

  private async assertFitment(dto: AddOemFitmentDto) {
    const manufacturer = await this.prisma.manufacturer.findFirst({
      where: { id: dto.manufacturerId, isActive: true },
    });
    if (!manufacturer)
      throw new NotFoundException('Fitment manufacturer not found');
    if (dto.vehicleModelId) {
      const model = await this.prisma.vehicleModel.findFirst({
        where: {
          id: dto.vehicleModelId,
          manufacturerId: dto.manufacturerId,
          isActive: true,
        },
      });
      if (!model)
        throw new BadRequestException('Model does not belong to manufacturer');
    }
    if (dto.vehicleGenerationId) {
      const generation = await this.prisma.vehicleGeneration.findFirst({
        where: {
          id: dto.vehicleGenerationId,
          isActive: true,
          ...(dto.vehicleModelId && { vehicleModelId: dto.vehicleModelId }),
        },
      });
      if (!generation)
        throw new BadRequestException('Generation is incompatible');
    }
    if (dto.vehicleSpecificationId) {
      const specification = await this.prisma.vehicleSpecification.findFirst({
        where: {
          id: dto.vehicleSpecificationId,
          isActive: true,
          ...(dto.vehicleModelId && { vehicleModelId: dto.vehicleModelId }),
          ...(dto.vehicleGenerationId && {
            generationId: dto.vehicleGenerationId,
          }),
        },
      });
      if (!specification)
        throw new BadRequestException('Specification is incompatible');
    }
  }

  private async reaches(start: string, target: string) {
    const visited = new Set<string>();
    const queue = [start];
    while (queue.length) {
      const current = queue.shift()!;
      if (current === target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const edges = await this.prisma.oemCrossReference.findMany({
        where: { fromOemPartId: current, toOemPartId: { not: null } },
        select: { toOemPartId: true },
      });
      queue.push(...edges.map((edge) => edge.toOemPartId!).filter(Boolean));
    }
    return false;
  }

  private audit(
    tx: Prisma.TransactionClient,
    entityType: string,
    entityId: string,
    action: string,
    before: unknown,
    after: unknown,
    actor: OemActor,
  ) {
    return tx.oemAuditLog.create({
      data: {
        entityType,
        entityId,
        action,
        beforeJson: before as Prisma.InputJsonValue,
        afterJson: after as Prisma.InputJsonValue,
        actorId: actor.id,
        source: 'OEM API',
      },
    });
  }

  private unique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Duplicate OEM record');
    }
    throw error;
  }
}
