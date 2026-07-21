import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: {
          id: createCategoryDto.parentId,
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Родительская категория не найдена');
      }

      if (!parentCategory.isActive) {
        throw new BadRequestException(
          'Нельзя добавить подкатегорию в отключённую категорию',
        );
      }
    }

    const categoryWithSameSlug = await this.prisma.category.findUnique({
      where: {
        slug: createCategoryDto.slug,
      },
    });

    if (categoryWithSameSlug) {
      throw new BadRequestException('Категория с таким slug уже существует');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        parent: true,
        children: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }

    return category;
  }
}
