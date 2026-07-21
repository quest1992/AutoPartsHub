import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';

@Injectable()
export class ManufacturersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createManufacturerDto: CreateManufacturerDto) {
    const existingManufacturer = await this.prisma.manufacturer.findFirst({
      where: {
        OR: [
          {
            name: {
              equals: createManufacturerDto.name,
              mode: 'insensitive',
            },
          },
          {
            slug: createManufacturerDto.slug,
          },
        ],
      },
    });

    if (existingManufacturer) {
      throw new BadRequestException(
        'Производитель с таким названием или slug уже существует',
      );
    }

    return this.prisma.manufacturer.create({
      data: createManufacturerDto,
    });
  }

  async findAll() {
    return this.prisma.manufacturer.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const manufacturer = await this.prisma.manufacturer.findUnique({
      where: {
        id,
      },
    });

    if (!manufacturer) {
      throw new NotFoundException('Производитель не найден');
    }

    return manufacturer;
  }
}
