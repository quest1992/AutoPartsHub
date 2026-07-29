import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateVehicleModificationDto,
  CreateVehicleRegistryItemDto,
  UpdateVehicleModificationDto,
  UpdateVehicleRegistryItemDto,
  VehicleModificationQueryDto,
  VehicleRegistryQueryDto,
} from './dto/vehicle-database.dto';

export const VEHICLE_REGISTRIES = [
  'body-types',
  'fuel-types',
  'drive-types',
  'transmission-types',
  'steering-positions',
  'market-regions',
] as const;
export type VehicleRegistry = (typeof VEHICLE_REGISTRIES)[number];

type RegistryDelegate = {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  findUnique(args: object): Promise<Record<string, unknown> | null>;
  count(args: object): Promise<number>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
};
type DbClient = PrismaService | Prisma.TransactionClient;
type Actor = { id: string };

@Injectable()
export class VehicleDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  async listRegistry(resource: string, query: VehicleRegistryQueryDto) {
    const delegate = this.registry(this.prisma, resource);
    const search = query.search?.trim();
    const where = {
      isActive: query.isActive ?? true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const allowedSort = new Set(['name', 'slug', 'createdAt', 'updatedAt']);
    const sort = allowedSort.has(query.sort) ? query.sort : 'name';
    const order = query.order === 'desc' ? 'desc' : 'asc';
    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      delegate.count({ where }),
    ]);
    return this.page(data, total, query.page, query.limit);
  }

  async getRegistry(resource: string, id: string) {
    const item = await this.registry(this.prisma, resource).findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Запись справочника не найдена');
    return item;
  }

  createRegistry(
    resource: string,
    dto: CreateVehicleRegistryItemDto,
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const item = await this.registry(tx, resource).create({
          data: this.registryData(dto),
        });
        await this.audit(
          tx,
          resource,
          String(item.id),
          'CREATE',
          actor.id,
          {},
          item,
        );
        return item;
      } catch (error) {
        this.unique(error);
      }
    });
  }

  updateRegistry(
    resource: string,
    id: string,
    dto: UpdateVehicleRegistryItemDto,
    actor: Actor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const delegate = this.registry(tx, resource);
      const before = await delegate.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Запись справочника не найдена');
      try {
        const item = await delegate.update({
          where: { id },
          data: this.registryData(dto),
        });
        await this.audit(tx, resource, id, 'UPDATE', actor.id, before, item);
        return item;
      } catch (error) {
        this.unique(error);
      }
    });
  }

  setRegistryActive(
    resource: string,
    id: string,
    isActive: boolean,
    actor: Actor,
  ) {
    return this.updateRegistry(
      resource,
      id,
      { isActive } as UpdateVehicleRegistryItemDto,
      actor,
    );
  }

  history(entityType: string, entityId: string) {
    return this.prisma.vehicleDataChange.findMany({
      where: { entityType, entityId },
      include: {
        changedBy: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        fields: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listModifications(query: VehicleModificationQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.VehicleModificationWhereInput = {
      isActive: query.isActive ?? true,
      generationId: query.generationId,
      engineId: query.engineId,
      bodyTypeId: query.bodyTypeId,
      marketRegionId: query.marketRegionId,
      generation: {
        vehicleModelId: query.modelId,
        vehicleModel: { manufacturerId: query.manufacturerId },
      },
      ...(query.year
        ? {
            AND: [
              {
                OR: [
                  { productionFrom: null },
                  { productionFrom: { lte: query.year } },
                ],
              },
              {
                OR: [
                  { productionTo: null },
                  { productionTo: { gte: query.year } },
                ],
              },
            ],
          }
        : {}),
      ...(search
        ? {
            OR: [
              { engine: { code: { contains: search, mode: 'insensitive' } } },
              { engine: { name: { contains: search, mode: 'insensitive' } } },
              {
                generation: { name: { contains: search, mode: 'insensitive' } },
              },
              {
                generation: {
                  vehicleModel: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vehicleModification.findMany({
        where,
        include: this.modificationInclude(),
        orderBy: [
          { generation: { vehicleModel: { name: 'asc' } } },
          { createdAt: 'desc' },
        ],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.vehicleModification.count({ where }),
    ]);
    return this.page(data, total, query.page, query.limit);
  }

  async getModification(id: string) {
    const item = await this.prisma.vehicleModification.findUnique({
      where: { id },
      include: this.modificationInclude(),
    });
    if (!item) throw new NotFoundException('Модификация не найдена');
    return item;
  }

  createModification(dto: CreateVehicleModificationDto, actor: Actor) {
    this.validateYears(dto.productionFrom, dto.productionTo);
    return this.prisma.$transaction(async (tx) => {
      await this.validateModificationRelations(tx, dto);
      try {
        const item = await tx.vehicleModification.create({
          data: dto,
          include: this.modificationInclude(),
        });
        await this.audit(
          tx,
          'modifications',
          item.id,
          'CREATE',
          actor.id,
          {},
          item,
        );
        return item;
      } catch (error) {
        this.unique(error);
      }
    });
  }

  updateModification(
    id: string,
    dto: UpdateVehicleModificationDto,
    actor: Actor,
  ) {
    this.validateYears(dto.productionFrom, dto.productionTo);
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.vehicleModification.findUnique({ where: { id } });
      if (!before) throw new NotFoundException('Модификация не найдена');
      const merged: CreateVehicleModificationDto = {
        ...before,
        ...dto,
        productionFrom:
          dto.productionFrom ?? before.productionFrom ?? undefined,
        productionTo: dto.productionTo ?? before.productionTo ?? undefined,
        doors: dto.doors ?? before.doors ?? undefined,
        powerKW: dto.powerKW ?? before.powerKW ?? undefined,
        powerHP: dto.powerHP ?? before.powerHP ?? undefined,
        vinFrom: dto.vinFrom ?? before.vinFrom ?? undefined,
        vinTo: dto.vinTo ?? before.vinTo ?? undefined,
        remarks: dto.remarks ?? before.remarks ?? undefined,
      };
      await this.validateModificationRelations(tx, merged);
      try {
        const item = await tx.vehicleModification.update({
          where: { id },
          data: dto,
          include: this.modificationInclude(),
        });
        await this.audit(
          tx,
          'modifications',
          id,
          'UPDATE',
          actor.id,
          before,
          item,
        );
        return item;
      } catch (error) {
        this.unique(error);
      }
    });
  }

  setModificationActive(id: string, isActive: boolean, actor: Actor) {
    return this.updateModification(
      id,
      { isActive } as UpdateVehicleModificationDto,
      actor,
    );
  }

  private registry(client: DbClient, resource: string): RegistryDelegate {
    switch (resource) {
      case 'body-types':
        return client.bodyType;
      case 'fuel-types':
        return client.fuelType;
      case 'drive-types':
        return client.driveType;
      case 'transmission-types':
        return client.transmissionType;
      case 'steering-positions':
        return client.steeringPosition;
      case 'market-regions':
        return client.marketRegion;
      default:
        throw new NotFoundException('Неизвестный справочник автомобилей');
    }
  }

  private registryData(
    dto: CreateVehicleRegistryItemDto | UpdateVehicleRegistryItemDto,
  ) {
    return {
      ...dto,
      name: dto.name?.trim(),
      slug: dto.slug?.trim().toLowerCase(),
      description: dto.description?.trim() || undefined,
    };
  }

  private async validateModificationRelations(
    tx: Prisma.TransactionClient,
    dto: CreateVehicleModificationDto,
  ) {
    const [
      generation,
      engine,
      body,
      transmission,
      drive,
      fuel,
      steering,
      market,
    ] = await Promise.all([
      tx.vehicleGeneration.findUnique({
        where: { id: dto.generationId },
        include: { vehicleModel: true },
      }),
      tx.engine.findUnique({ where: { id: dto.engineId } }),
      tx.bodyType.findUnique({ where: { id: dto.bodyTypeId } }),
      tx.transmissionType.findUnique({ where: { id: dto.transmissionTypeId } }),
      tx.driveType.findUnique({ where: { id: dto.driveTypeId } }),
      tx.fuelType.findUnique({ where: { id: dto.fuelTypeId } }),
      tx.steeringPosition.findUnique({ where: { id: dto.steeringPositionId } }),
      tx.marketRegion.findUnique({ where: { id: dto.marketRegionId } }),
    ]);
    if (
      !generation ||
      !engine ||
      !body ||
      !transmission ||
      !drive ||
      !fuel ||
      !steering ||
      !market
    ) {
      throw new BadRequestException('Одна из связанных записей не найдена');
    }
    if (
      ![
        generation,
        engine,
        body,
        transmission,
        drive,
        fuel,
        steering,
        market,
      ].every((item) => item.isActive)
    ) {
      throw new BadRequestException('Одна из связанных записей отключена');
    }
    if (generation.vehicleModel.manufacturerId !== engine.manufacturerId) {
      throw new BadRequestException(
        'Двигатель и поколение относятся к разным производителям',
      );
    }
    if (engine.fuelTypeId !== dto.fuelTypeId) {
      throw new BadRequestException('Тип топлива не соответствует двигателю');
    }
    this.validateYears(dto.productionFrom, dto.productionTo);
  }

  private modificationInclude() {
    return {
      generation: {
        include: { vehicleModel: { include: { manufacturer: true } } },
      },
      bodyType: true,
      engine: true,
      transmissionType: true,
      driveType: true,
      fuelType: true,
      steeringPosition: true,
      marketRegion: true,
    } as const;
  }

  private async audit(
    tx: Prisma.TransactionClient,
    entityType: string,
    entityId: string,
    action: string,
    changedById: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    const ignored = new Set(['createdAt', 'updatedAt']);
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const fields = [...keys]
      .filter((key) => !ignored.has(key))
      .filter((key) => this.value(before[key]) !== this.value(after[key]))
      .map((key) => ({
        fieldName: key,
        oldValue: this.value(before[key]),
        newValue: this.value(after[key]),
      }));
    await tx.vehicleDataChange.create({
      data: {
        entityType,
        entityId,
        action,
        changedById,
        fields: { create: fields },
      },
    });
  }

  private value(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return null;
    return String(value);
  }

  private validateYears(from?: number | null, to?: number | null) {
    if (from && to && from > to) {
      throw new BadRequestException(
        'productionFrom не может быть больше productionTo',
      );
    }
  }

  private unique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Такая запись уже существует');
    }
    throw error;
  }

  private page<T>(data: T[], total: number, page: number, limit: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
