import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { FindVehicleModelsDto } from './dto/find-vehicle-models.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';

const manufacturerSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
} satisfies Prisma.ManufacturerSelect;

@Injectable()
export class VehicleModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleModelDto: CreateVehicleModelDto) {
    await this.ensureActiveManufacturer(createVehicleModelDto.manufacturerId);
    await this.ensureNoDuplicate(
      createVehicleModelDto.manufacturerId,
      createVehicleModelDto.name,
      createVehicleModelDto.slug,
    );

    return this.withUniqueConstraintHandling(
      this.prisma.vehicleModel.create({
        data: createVehicleModelDto,
        include: {
          manufacturer: { select: manufacturerSelect },
        },
      }),
    );
  }

  async findAll(filters: FindVehicleModelsDto) {
    const where: Prisma.VehicleModelWhereInput = {};

    if (filters.manufacturerId) {
      where.manufacturerId = filters.manufacturerId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.vehicleModel.findMany({
      where,
      include: {
        manufacturer: { select: manufacturerSelect },
      },
      orderBy: [{ manufacturer: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const vehicleModel = await this.prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        manufacturer: { select: manufacturerSelect },
      },
    });

    if (!vehicleModel) {
      throw new NotFoundException('Модель автомобиля не найдена');
    }

    return vehicleModel;
  }

  async update(id: string, updateVehicleModelDto: UpdateVehicleModelDto) {
    const existingVehicleModel = await this.findOne(id);
    const manufacturerId =
      updateVehicleModelDto.manufacturerId ??
      existingVehicleModel.manufacturerId;
    const name = updateVehicleModelDto.name ?? existingVehicleModel.name;
    const slug = updateVehicleModelDto.slug ?? existingVehicleModel.slug;

    if (updateVehicleModelDto.manufacturerId !== undefined) {
      await this.ensureActiveManufacturer(updateVehicleModelDto.manufacturerId);
    }

    await this.ensureNoDuplicate(manufacturerId, name, slug, id);

    const data: Prisma.VehicleModelUncheckedUpdateInput = {
      ...(updateVehicleModelDto.name !== undefined && {
        name: updateVehicleModelDto.name,
      }),
      ...(updateVehicleModelDto.slug !== undefined && {
        slug: updateVehicleModelDto.slug,
      }),
      ...(updateVehicleModelDto.description !== undefined && {
        description: updateVehicleModelDto.description,
      }),
      ...(updateVehicleModelDto.manufacturerId !== undefined && {
        manufacturerId: updateVehicleModelDto.manufacturerId,
      }),
      ...(updateVehicleModelDto.isActive !== undefined && {
        isActive: updateVehicleModelDto.isActive,
      }),
    };

    return this.withUniqueConstraintHandling(
      this.prisma.vehicleModel.update({
        where: { id },
        data,
        include: {
          manufacturer: { select: manufacturerSelect },
        },
      }),
    );
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.vehicleModel.update({
      where: { id },
      data: { isActive: false },
      include: {
        manufacturer: { select: manufacturerSelect },
      },
    });
  }

  private async ensureActiveManufacturer(manufacturerId: string) {
    const manufacturer = await this.prisma.manufacturer.findUnique({
      where: { id: manufacturerId },
      select: { isActive: true },
    });

    if (!manufacturer) {
      throw new NotFoundException('Производитель автомобиля не найден');
    }

    if (!manufacturer.isActive) {
      throw new BadRequestException(
        'Нельзя создать или перенести модель в отключённого производителя',
      );
    }
  }

  private async ensureNoDuplicate(
    manufacturerId: string,
    name: string,
    slug: string,
    excludedId?: string,
  ) {
    const duplicate = await this.prisma.vehicleModel.findFirst({
      where: {
        manufacturerId,
        OR: [
          {
            name: {
              equals: name,
              mode: 'insensitive',
            },
          },
          {
            slug: {
              equals: slug,
              mode: 'insensitive',
            },
          },
        ],
        ...(excludedId && { NOT: { id: excludedId } }),
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'Модель с таким названием или slug уже существует у этого производителя',
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
          'Модель с таким названием или slug уже существует у этого производителя',
        );
      }

      throw error;
    }
  }
}
