import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { normalizePhone } from '../../common/utils/phone-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, actor: InventoryActor) {
    const phoneNormalized = normalizePhone(dto.phone);
    const existing = phoneNormalized
      ? await this.prisma.customer.findFirst({ where: { phoneNormalized } })
      : null;
    if (existing)
      throw new ConflictException('Клиент с таким телефоном уже существует');
    return this.prisma.customer.create({
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        phoneNormalized,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
        note: dto.note?.trim() || null,
        shopId: actor.role === UserRole.SUPER_ADMIN ? dto.shopId : actor.shopId,
        createdById: actor.id,
      },
    });
  }

  async all(search: string | undefined, actor: InventoryActor) {
    const term = search?.trim();
    const normalized = normalizePhone(term);
    const where: Prisma.CustomerWhereInput = {
      ...(actor.role === UserRole.SUPER_ADMIN ? {} : { shopId: actor.shopId }),
      ...(term && {
        OR: [
          { fullName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
          ...(normalized
            ? [{ phoneNormalized: { contains: normalized } }]
            : []),
        ],
      }),
    };
    return this.prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async one(id: string, actor: InventoryActor) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { orders: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (
      !customer ||
      (actor.role !== UserRole.SUPER_ADMIN && customer.shopId !== actor.shopId)
    )
      throw new NotFoundException('Клиент не найден');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actor: InventoryActor) {
    await this.one(id, actor);
    const phoneNormalized =
      dto.phone === undefined ? undefined : normalizePhone(dto.phone);
    if (phoneNormalized) {
      const duplicate = await this.prisma.customer.findFirst({
        where: { phoneNormalized, id: { not: id } },
      });
      if (duplicate)
        throw new ConflictException('Клиент с таким телефоном уже существует');
    }
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && {
          phone: dto.phone.trim(),
          phoneNormalized,
        }),
        ...(dto.email !== undefined && { email: dto.email.trim() || null }),
        ...(dto.address !== undefined && {
          address: dto.address.trim() || null,
        }),
        ...(dto.note !== undefined && { note: dto.note.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
