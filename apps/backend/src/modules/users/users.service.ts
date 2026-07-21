import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            phone: createUserDto.phone,
          },
          ...(createUserDto.email
            ? [
                {
                  email: createUserDto.email,
                },
              ]
            : []),
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Пользователь с таким телефоном или email уже существует',
      );
    }

    if (createUserDto.shopId) {
      const shop = await this.prisma.shop.findUnique({
        where: {
          id: createUserDto.shopId,
        },
      });

      if (!shop) {
        throw new NotFoundException('Магазин не найден');
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        email: createUserDto.email,
        passwordHash,
        role: createUserDto.role ?? UserRole.SELLER,
        shopId: createUserDto.shopId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        shopId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        shopId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: {
        phone,
      },
      include: {
        shop: {
          select: {
            isActive: true,
          },
        },
      },
    });
  }

  async findAuthUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        role: true,
        shopId: true,
        isActive: true,
        shop: {
          select: {
            isActive: true,
          },
        },
      },
    });
  }

  async findCurrentUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        shopId: true,
        isActive: true,
        shop: { select: { id: true, name: true, isActive: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        role: true,
        shopId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
