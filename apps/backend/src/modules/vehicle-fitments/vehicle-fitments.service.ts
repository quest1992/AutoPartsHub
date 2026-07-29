import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEngineDto } from './dto/create-engine.dto';
import { CreateVehicleFitmentDto } from './dto/create-vehicle-fitment.dto';
import { VehicleFitmentQueryDto } from './dto/vehicle-fitment-query.dto';

const fitmentInclude = {
  catalogItem: {
    select: { id: true, internalCode: true, name: true, isActive: true },
  },
  engine: {
    include: {
      generation: {
        include: {
          vehicleModel: { include: { manufacturer: true } },
        },
      },
    },
  },
} satisfies Prisma.VehicleFitmentInclude;

@Injectable()
export class VehicleFitmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findBrands() {
    return this.prisma.manufacturer.findMany({
      where: { isActive: true },
      select: { id: true, name: true, country: true, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findTree() {
    return this.prisma.manufacturer.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        country: true,
        isActive: true,
        vehicleModels: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            isActive: true,
            generations: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true,
                startYear: true,
                endYear: true,
                isActive: true,
                engines: {
                  where: { isActive: true },
                  orderBy: { name: 'asc' },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findEngines(generationId?: string) {
    return this.prisma.engine.findMany({
      where: { generationId, isActive: true },
      include: {
        generation: {
          include: { vehicleModel: { include: { manufacturer: true } } },
        },
      },
      orderBy: [{ code: 'asc' }],
    });
  }

  async createEngine(dto: CreateEngineDto) {
    const generation = await this.prisma.vehicleGeneration.findUnique({
      where: { id: dto.generationId },
      select: {
        isActive: true,
        vehicleModel: {
          select: {
            isActive: true,
            manufacturer: { select: { id: true, isActive: true } },
          },
        },
      },
    });
    if (!generation) throw new NotFoundException('Поколение не найдено');
    if (
      !generation.isActive ||
      !generation.vehicleModel.isActive ||
      !generation.vehicleModel.manufacturer.isActive
    ) {
      throw new BadRequestException('Иерархия автомобиля отключена');
    }
    const normalizedFuel = dto.fuel.trim().toUpperCase();
    const fuelType = await this.prisma.fuelType.findFirst({
      where: {
        name: { equals: normalizedFuel, mode: 'insensitive' },
        isActive: true,
      },
      select: { id: true },
    });
    if (!fuelType) {
      throw new BadRequestException('Тип топлива не найден в справочнике');
    }
    try {
      return await this.prisma.engine.create({
        data: {
          ...dto,
          code: dto.code.trim().toUpperCase(),
          fuel: normalizedFuel,
          manufacturerId: generation.vehicleModel.manufacturer.id,
          fuelTypeId: fuelType.id,
          displacementCC: dto.volume
            ? Math.round(dto.volume * 1000)
            : undefined,
          horsepower: dto.power,
        },
      });
    } catch (error) {
      this.handleUnique(error, 'Такой код двигателя уже есть в поколении');
    }
  }

  async create(dto: CreateVehicleFitmentDto) {
    this.validateYears(dto.yearFrom, dto.yearTo);
    const [catalogItem, engine] = await Promise.all([
      this.prisma.partCatalogItem.findUnique({
        where: { id: dto.catalogItemId },
        select: { id: true, isActive: true, isUniversal: true },
      }),
      this.prisma.engine.findUnique({
        where: { id: dto.engineId },
        include: {
          generation: {
            include: {
              vehicleModel: { include: { manufacturer: true } },
            },
          },
        },
      }),
    ]);
    if (!catalogItem) throw new NotFoundException('Деталь каталога не найдена');
    if (!engine) throw new NotFoundException('Двигатель не найден');
    if (!engine.generation) {
      throw new BadRequestException('Двигатель не привязан к поколению');
    }
    if (!catalogItem.isActive)
      throw new BadRequestException('Деталь отключена');
    if (catalogItem.isUniversal) {
      throw new BadRequestException(
        'Универсальной детали применяемость не требуется',
      );
    }
    if (
      !engine.isActive ||
      !engine.generation.isActive ||
      !engine.generation.vehicleModel.isActive ||
      !engine.generation.vehicleModel.manufacturer.isActive
    ) {
      throw new BadRequestException('Иерархия автомобиля отключена');
    }
    this.validateGenerationRange(
      dto.yearFrom,
      dto.yearTo,
      engine.generation.startYear,
      engine.generation.endYear,
    );
    const duplicate = await this.prisma.vehicleFitment.findFirst({
      where: {
        catalogItemId: dto.catalogItemId,
        engineId: dto.engineId,
        yearFrom: dto.yearFrom ?? null,
        yearTo: dto.yearTo ?? null,
      },
      select: { id: true },
    });
    if (duplicate)
      throw new ConflictException('Такая применяемость уже существует');
    try {
      return await this.prisma.vehicleFitment.create({
        data: dto,
        include: fitmentInclude,
      });
    } catch (error) {
      this.handleUnique(error, 'Такая применяемость уже существует');
    }
  }

  async findAll(query: VehicleFitmentQueryDto) {
    const where = this.buildWhere(query);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vehicleFitment.findMany({
        where,
        include: fitmentInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.vehicleFitment.count({ where }),
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

  search(query: VehicleFitmentQueryDto) {
    return this.findAll(query);
  }

  async remove(id: string) {
    const found = await this.prisma.vehicleFitment.findUnique({
      where: { id },
    });
    if (!found) throw new NotFoundException('Применяемость не найдена');
    await this.prisma.vehicleFitment.delete({ where: { id } });
    return { id };
  }

  private buildWhere(
    query: VehicleFitmentQueryDto,
  ): Prisma.VehicleFitmentWhereInput {
    const search = query.search?.trim();
    return {
      catalogItemId: query.catalogItemId,
      engineId: query.engineId,
      engine: {
        generationId: query.generationId,
        generation: {
          vehicleModelId: query.modelId,
          vehicleModel: {
            manufacturerId: query.brandId,
          },
        },
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                {
                  generation: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  generation: {
                    vehicleModel: {
                      name: { contains: search, mode: 'insensitive' },
                    },
                  },
                },
                {
                  generation: {
                    vehicleModel: {
                      manufacturer: {
                        name: { contains: search, mode: 'insensitive' },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
    };
  }

  private validateYears(yearFrom?: number, yearTo?: number) {
    if (yearFrom && yearTo && yearFrom > yearTo) {
      throw new BadRequestException('yearFrom не может быть больше yearTo');
    }
  }

  private validateGenerationRange(
    yearFrom: number | undefined,
    yearTo: number | undefined,
    generationFrom: number | null,
    generationTo: number | null,
  ) {
    if (yearFrom && generationFrom && yearFrom < generationFrom) {
      throw new BadRequestException('yearFrom раньше начала поколения');
    }
    if (yearTo && generationTo && yearTo > generationTo) {
      throw new BadRequestException('yearTo позже окончания поколения');
    }
  }

  private handleUnique(error: unknown, message: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(message);
    }
    throw error;
  }
}
