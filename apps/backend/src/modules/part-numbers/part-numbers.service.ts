import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartNumberDto } from './dto/create-part-number.dto';
import { PartNumberQueryDto } from './dto/part-number-query.dto';
import { UpdatePartNumberDto } from './dto/update-part-number.dto';
import { NumberNormalizationService } from './number-normalization.service';

const include = {
  manufacturer: { select: { id: true, name: true, isActive: true } },
  partCatalogItem: {
    select: { id: true, internalCode: true, name: true, isActive: true },
  },
} satisfies Prisma.PartNumberInclude;

type DbClient = PrismaService | Prisma.TransactionClient | PrismaClient;

@Injectable()
export class PartNumbersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: NumberNormalizationService,
  ) {}

  async findAll(query: PartNumberQueryDto) {
    const where = this.where(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.partNumber.findMany({
        where,
        include,
        orderBy: [{ isPrimary: 'desc' }, { normalizedNumber: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.partNumber.count({ where }),
    ]);
    return {
      data: items.map((item) => this.present(item)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  search(query: PartNumberQueryDto) {
    return this.findAll(query);
  }

  async create(dto: CreatePartNumberDto) {
    const normalizedNumber = this.requireNormalized(dto.number);
    await this.assertReferences(
      this.prisma,
      dto.catalogItemId,
      dto.manufacturerId,
    );

    try {
      const item = await this.prisma.$transaction(async (tx) => {
        if (dto.isPrimary) {
          await tx.partNumber.updateMany({
            where: { partCatalogItemId: dto.catalogItemId, type: dto.type },
            data: { isPrimary: false },
          });
        }
        return tx.partNumber.create({
          data: {
            partCatalogItemId: dto.catalogItemId,
            manufacturerId: dto.manufacturerId,
            rawNumber: dto.number.trim(),
            normalizedNumber,
            type: dto.type,
            isPrimary: dto.isPrimary ?? false,
          },
          include,
        });
      });
      return this.present(item);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async update(id: string, dto: UpdatePartNumberDto) {
    const current = await this.prisma.partNumber.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Номер детали не найден');

    const catalogItemId = dto.catalogItemId ?? current.partCatalogItemId;
    const manufacturerId = dto.manufacturerId ?? current.manufacturerId;
    if (!manufacturerId) {
      throw new BadRequestException('Выберите производителя');
    }
    await this.assertReferences(this.prisma, catalogItemId, manufacturerId);
    const type = dto.type ?? current.type;

    try {
      const item = await this.prisma.$transaction(async (tx) => {
        if (dto.isPrimary) {
          await tx.partNumber.updateMany({
            where: { partCatalogItemId: catalogItemId, type, id: { not: id } },
            data: { isPrimary: false },
          });
        }
        return tx.partNumber.update({
          where: { id },
          data: {
            partCatalogItemId: dto.catalogItemId,
            manufacturerId: dto.manufacturerId,
            rawNumber: dto.number?.trim(),
            normalizedNumber:
              dto.number === undefined
                ? undefined
                : this.requireNormalized(dto.number),
            type: dto.type,
            isPrimary: dto.isPrimary,
          },
          include,
        });
      });
      return this.present(item);
    } catch (error) {
      this.handleUnique(error);
    }
  }

  async remove(id: string) {
    const item = await this.prisma.partNumber.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Номер детали не найден');
    await this.prisma.partNumber.delete({ where: { id } });
    return { id };
  }

  private where(query: PartNumberQueryDto): Prisma.PartNumberWhereInput {
    const normalized = query.search
      ? this.normalization.normalize(query.search)
      : '';
    return {
      manufacturerId: query.manufacturerId,
      partCatalogItemId: query.catalogItemId,
      type: query.type,
      ...(normalized
        ? { normalizedNumber: { contains: normalized, mode: 'insensitive' } }
        : {}),
    };
  }

  private async assertReferences(
    db: DbClient,
    catalogItemId: string,
    manufacturerId: string,
  ) {
    const [catalogItem, manufacturer] = await Promise.all([
      db.partCatalogItem.findUnique({
        where: { id: catalogItemId },
        select: { id: true },
      }),
      db.partNumberManufacturer.findUnique({
        where: { id: manufacturerId },
        select: { id: true, isActive: true },
      }),
    ]);
    if (!catalogItem) throw new NotFoundException('Деталь каталога не найдена');
    if (!manufacturer || !manufacturer.isActive) {
      throw new NotFoundException('Активный производитель не найден');
    }
  }

  private requireNormalized(number: string) {
    const normalized = this.normalization.normalize(number);
    if (!normalized) {
      throw new BadRequestException('Номер должен содержать буквы или цифры');
    }
    return normalized;
  }

  private handleUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Такой номер уже существует у выбранного производителя',
      );
    }
    throw error;
  }

  private present(item: any) {
    return {
      id: item.id,
      catalogItemId: item.partCatalogItemId,
      manufacturer: item.manufacturer,
      number: item.rawNumber,
      normalizedNumber: item.normalizedNumber,
      type: item.type,
      isPrimary: item.isPrimary,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      catalogItem: item.partCatalogItem,
    };
  }
}
