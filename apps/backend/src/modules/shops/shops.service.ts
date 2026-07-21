import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  findAll(includeInactive = false) {
    return this.prisma.shop.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('Магазин не найден');
    return shop;
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.findOne(id);
    try {
      return await this.prisma.shop.update({ where: { id }, data: dto });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException('Магазин не найден');
      }
      throw error;
    }
  }

  async deactivate(id: string) {
    const shop = await this.findOne(id);
    if (!shop.isActive) return shop;
    try {
      return await this.prisma.shop.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
        throw new NotFoundException('Магазин не найден');
      }
      throw error;
    }
  }
}
