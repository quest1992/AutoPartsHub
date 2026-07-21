import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleGenerationDto } from './dto/create-vehicle-generation.dto';
import { UpdateVehicleGenerationDto } from './dto/update-vehicle-generation.dto';
import { VehicleGenerationQueryDto } from './dto/vehicle-generation-query.dto';

const vehicleModelSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  manufacturer: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },
} satisfies Prisma.VehicleModelSelect;

@Injectable()
export class VehicleGenerationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleGenerationDto: CreateVehicleGenerationDto) {
    this.validateYears(
      createVehicleGenerationDto.startYear,
      createVehicleGenerationDto.endYear,
    );
    await this.ensureActiveVehicleModel(
      createVehicleGenerationDto.vehicleModelId,
    );
    await this.ensureNoDuplicate(
      createVehicleGenerationDto.vehicleModelId,
      createVehicleGenerationDto.name,
      createVehicleGenerationDto.slug,
    );

    return this.withUniqueConstraintHandling(
      this.prisma.vehicleGeneration.create({
        data: createVehicleGenerationDto,
        include: { vehicleModel: { select: vehicleModelSelect } },
      }),
    );
  }

  async findAll(query: VehicleGenerationQueryDto) {
    this.validateYears(query.startYear, query.endYear);

    const where: Prisma.VehicleGenerationWhereInput = {};
    const andFilters: Prisma.VehicleGenerationWhereInput[] = [];

    if (query.vehicleModelId) {
      where.vehicleModelId = query.vehicleModelId;
    }

    if (query.manufacturerId) {
      where.vehicleModel = { manufacturerId: query.manufacturerId };
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startYear !== undefined) {
      andFilters.push({
        OR: [{ endYear: { gte: query.startYear } }, { endYear: null }],
      });
    }

    if (query.endYear !== undefined) {
      andFilters.push({
        OR: [{ startYear: { lte: query.endYear } }, { startYear: null }],
      });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.vehicleGeneration.findMany({
        where,
        include: { vehicleModel: { select: vehicleModelSelect } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vehicleGeneration.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const vehicleGeneration = await this.prisma.vehicleGeneration.findUnique({
      where: { id },
      include: { vehicleModel: { select: vehicleModelSelect } },
    });

    if (!vehicleGeneration) {
      throw new NotFoundException('Поколение автомобиля не найдено');
    }

    return vehicleGeneration;
  }

  async update(
    id: string,
    updateVehicleGenerationDto: UpdateVehicleGenerationDto,
  ) {
    const existingGeneration = await this.findOne(id);
    const vehicleModelId =
      updateVehicleGenerationDto.vehicleModelId ??
      existingGeneration.vehicleModelId;
    const name = updateVehicleGenerationDto.name ?? existingGeneration.name;
    const slug = updateVehicleGenerationDto.slug ?? existingGeneration.slug;
    const startYear =
      updateVehicleGenerationDto.startYear ?? existingGeneration.startYear;
    const endYear =
      updateVehicleGenerationDto.endYear ?? existingGeneration.endYear;

    this.validateYears(startYear, endYear);
    await this.ensureActiveVehicleModel(vehicleModelId);
    await this.ensureNoDuplicate(vehicleModelId, name, slug, id);

    const data: Prisma.VehicleGenerationUncheckedUpdateInput = {
      ...(updateVehicleGenerationDto.name !== undefined && {
        name: updateVehicleGenerationDto.name,
      }),
      ...(updateVehicleGenerationDto.slug !== undefined && {
        slug: updateVehicleGenerationDto.slug,
      }),
      ...(updateVehicleGenerationDto.description !== undefined && {
        description: updateVehicleGenerationDto.description,
      }),
      ...(updateVehicleGenerationDto.vehicleModelId !== undefined && {
        vehicleModelId: updateVehicleGenerationDto.vehicleModelId,
      }),
      ...(updateVehicleGenerationDto.startYear !== undefined && {
        startYear: updateVehicleGenerationDto.startYear,
      }),
      ...(updateVehicleGenerationDto.endYear !== undefined && {
        endYear: updateVehicleGenerationDto.endYear,
      }),
      ...(updateVehicleGenerationDto.isActive !== undefined && {
        isActive: updateVehicleGenerationDto.isActive,
      }),
    };

    return this.withUniqueConstraintHandling(
      this.prisma.vehicleGeneration.update({
        where: { id },
        data,
        include: { vehicleModel: { select: vehicleModelSelect } },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.vehicleGeneration.update({
      where: { id },
      data: { isActive: false },
      include: { vehicleModel: { select: vehicleModelSelect } },
    });
  }

  private validateYears(startYear?: number | null, endYear?: number | null) {
    if (
      startYear !== undefined &&
      startYear !== null &&
      endYear !== undefined &&
      endYear !== null &&
      endYear < startYear
    ) {
      throw new BadRequestException(
        'Год окончания не может быть меньше года начала',
      );
    }
  }

  private async ensureActiveVehicleModel(vehicleModelId: string) {
    const vehicleModel = await this.prisma.vehicleModel.findUnique({
      where: { id: vehicleModelId },
      select: {
        isActive: true,
        manufacturer: {
          select: { isActive: true },
        },
      },
    });

    if (!vehicleModel) {
      throw new NotFoundException('Модель автомобиля не найдена');
    }

    if (!vehicleModel.isActive) {
      throw new BadRequestException(
        'Нельзя добавить поколение к неактивной модели автомобиля',
      );
    }

    if (!vehicleModel.manufacturer.isActive) {
      throw new BadRequestException(
        'Нельзя добавить поколение к модели неактивного производителя',
      );
    }
  }

  private async ensureNoDuplicate(
    vehicleModelId: string,
    name: string,
    slug: string,
    excludedId?: string,
  ) {
    const duplicate = await this.prisma.vehicleGeneration.findFirst({
      where: {
        vehicleModelId,
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: { equals: slug, mode: 'insensitive' } },
        ],
        ...(excludedId && { NOT: { id: excludedId } }),
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Поколение с таким названием или slug уже существует у этой модели',
      );
    }
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
          'Поколение с таким названием или slug уже существует у этой модели',
        );
      }

      throw error;
    }
  }
}
