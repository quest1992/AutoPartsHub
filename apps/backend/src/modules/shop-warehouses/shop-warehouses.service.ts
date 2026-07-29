import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CreateShopWarehouseDto,
  UpdateShopWarehouseDto,
} from './dto/shop-warehouse.dto';

@Injectable()
export class ShopWarehousesService {
  constructor(private readonly prisma: PrismaService) {}
  async list(actor: InventoryActor, shopId?: string) {
    const id = this.shop(actor, shopId);
    return this.prisma.shopWarehouse
      .findMany({
        where: { shopId: id },
        include: {
          _count: { select: { inventoryItems: true } },
          inventoryItems: { select: { quantity: true } },
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      })
      .then((rows) =>
        rows.map(({ inventoryItems, ...row }) => ({
          ...row,
          totalQuantity: inventoryItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          ),
        })),
      );
  }
  async one(id: string, actor: InventoryActor) {
    const warehouse = await this.prisma.shopWarehouse.findUnique({
      where: { id },
      include: { _count: { select: { inventoryItems: true } } },
    });
    if (!warehouse || !this.allowed(actor, warehouse.shopId))
      throw new NotFoundException('Склад не найден');
    return warehouse;
  }
  async create(dto: CreateShopWarehouseDto, actor: InventoryActor) {
    const shopId = this.shop(actor, dto.shopId);
    const data = this.clean(dto);
    return this.prisma.$transaction(async (tx) => {
      await this.ensureUnique(tx, shopId, data.name, data.code);
      const count = await tx.shopWarehouse.count({
        where: { shopId, isActive: true },
      });
      const makeDefault = count === 0 || dto.isDefault === true;
      if (makeDefault)
        await tx.shopWarehouse.updateMany({
          where: { shopId, isDefault: true },
          data: { isDefault: false },
        });
      return tx.shopWarehouse.create({
        data: {
          shopId,
          ...data,
          name: dto.name.trim(),
          isDefault: makeDefault,
        },
      });
    });
  }
  async update(id: string, dto: UpdateShopWarehouseDto, actor: InventoryActor) {
    const current = await this.one(id, actor);
    const data = this.clean(dto);
    return this.prisma.$transaction(async (tx) => {
      await this.ensureUnique(tx, current.shopId, data.name, data.code, id);
      if (dto.isDefault)
        await tx.shopWarehouse.updateMany({
          where: { shopId: current.shopId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      return tx.shopWarehouse.update({
        where: { id },
        data: { ...data, ...(dto.isDefault && { isActive: true }) },
      });
    });
  }
  async setDefault(id: string, actor: InventoryActor) {
    const warehouse = await this.one(id, actor);
    return this.prisma.$transaction(async (tx) => {
      await tx.shopWarehouse.updateMany({
        where: { shopId: warehouse.shopId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.shopWarehouse.update({
        where: { id },
        data: { isDefault: true, isActive: true },
      });
    });
  }
  async deactivate(id: string, actor: InventoryActor) {
    const warehouse = await this.one(id, actor);
    const active = await this.prisma.shopWarehouse.count({
      where: { shopId: warehouse.shopId, isActive: true },
    });
    if (warehouse.isActive && active <= 1)
      throw new ConflictException(
        'Нельзя деактивировать единственный активный склад',
      );
    if (warehouse.isDefault)
      throw new ConflictException('Сначала назначьте другой склад основным');
    return this.prisma.shopWarehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
  async activate(id: string, actor: InventoryActor) {
    await this.one(id, actor);
    return this.prisma.shopWarehouse.update({
      where: { id },
      data: { isActive: true },
    });
  }
  async remove(id: string, actor: InventoryActor) {
    const warehouse = await this.one(id, actor);
    if (warehouse._count.inventoryItems)
      throw new ConflictException(
        'Склад с остатками нельзя удалить; его можно деактивировать',
      );
    const active = await this.prisma.shopWarehouse.count({
      where: { shopId: warehouse.shopId, isActive: true },
    });
    if (warehouse.isActive && active <= 1)
      throw new ConflictException('Нельзя удалить единственный активный склад');
    return this.prisma.shopWarehouse.delete({ where: { id } });
  }
  async resolve(
    tx: Prisma.TransactionClient,
    shopId: string,
    warehouseId?: string | null,
  ) {
    const warehouse = warehouseId
      ? await tx.shopWarehouse.findFirst({
          where: { id: warehouseId, shopId, isActive: true },
        })
      : await tx.shopWarehouse.findFirst({
          where: { shopId, isDefault: true, isActive: true },
        });
    if (!warehouse)
      throw new BadRequestException(
        warehouseId
          ? 'Склад не найден или принадлежит другому магазину'
          : 'Основной склад не настроен',
      );
    return warehouse;
  }
  private clean<T extends CreateShopWarehouseDto | UpdateShopWarehouseDto>(
    dto: T,
  ) {
    const clean = (value?: string) => value?.trim() || undefined;
    return {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.code !== undefined && { code: clean(dto.code) }),
      ...(dto.address !== undefined && { address: clean(dto.address) }),
      ...(dto.note !== undefined && { note: clean(dto.note) }),
      ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
    };
  }
  private async ensureUnique(
    tx: Prisma.TransactionClient,
    shopId: string,
    name?: string,
    code?: string,
    exclude?: string,
  ) {
    if (!name && !code) return;
    const duplicate = await tx.shopWarehouse.findFirst({
      where: {
        shopId,
        ...(exclude && { id: { not: exclude } }),
        OR: [
          ...(name
            ? [{ name: { equals: name, mode: 'insensitive' as const } }]
            : []),
          ...(code
            ? [{ code: { equals: code, mode: 'insensitive' as const } }]
            : []),
        ],
      },
    });
    if (duplicate)
      throw new ConflictException(
        'Склад с таким названием или кодом уже существует',
      );
  }
  private allowed(actor: InventoryActor, shopId: string) {
    return actor.role === UserRole.SUPER_ADMIN || actor.shopId === shopId;
  }
  private shop(actor: InventoryActor, requested?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!requested)
        throw new BadRequestException('Для SUPER_ADMIN укажите shopId');
      return requested;
    }
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    if (requested && requested !== actor.shopId)
      throw new ForbiddenException('Нет доступа к складам другого магазина');
    return actor.shopId;
  }
}
