import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  InventoryMovementType,
  PartCondition,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildInventoryKey } from '../../common/utils/inventory-key';
import { ShopWarehousesService } from '../shop-warehouses/shop-warehouses.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { ChangeQuantityDto } from './dto/change-quantity.dto';
import { CreateShopInventoryItemDto } from './dto/create-shop-inventory-item.dto';
import { ShopInventoryItemQueryDto } from './dto/shop-inventory-item-query.dto';
import { UpdateShopInventoryItemDto } from './dto/update-shop-inventory-item.dto';
import {
  InventoryImageFile,
  InventoryImageService,
} from './inventory-image.service';

export interface InventoryActor {
  id: string;
  role: UserRole;
  shopId: string | null;
}
const include = {
  shop: { select: { id: true, name: true, isActive: true } },
  warehouse: true,
  partCatalogItem: {
    include: {
      category: { include: { parent: true } },
      compatibilities: {
        include: {
          vehicleGeneration: {
            include: { vehicleModel: { include: { manufacturer: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.ShopInventoryItemInclude;

@Injectable()
export class InventoryItemsService {
  private readonly logger = new Logger(InventoryItemsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly images: InventoryImageService,
    private readonly warehouses: ShopWarehousesService,
  ) {}

  async create(dto: CreateShopInventoryItemDto, actor: InventoryActor) {
    const shopId = this.resolveShopForCreate(dto.shopId, actor);
    const data = this.normalize(dto);
    await this.ensureActiveShop(shopId);
    await this.ensureActivePart(data.partCatalogItemId);
    return this.prisma.$transaction(async (tx) => {
      const warehouse = await this.warehouses.resolve(
        tx,
        shopId,
        data.warehouseId,
      );
      const inventoryKey = buildInventoryKey({
        shopId,
        warehouseId: warehouse.id,
        partCatalogItemId: data.partCatalogItemId,
        brand: data.brand,
        sku: data.sku,
        oemNumber: data.oemNumber,
        condition: data.condition,
      });
      const item = await tx.shopInventoryItem.create({
        data: { ...data, shopId, warehouseId: warehouse.id, inventoryKey },
        include,
      });
      if (item.quantity > 0)
        await tx.inventoryMovement.create({
          data: {
            shopId,
            inventoryItemId: item.id,
            warehouseId: warehouse.id,
            warehouseNameSnapshot: warehouse.name,
            partCatalogItemId: item.partCatalogItemId,
            partCatalogItemNameSnapshot: item.partCatalogItem.name,
            documentType: 'OPENING_BALANCE',
            userId: actor.id,
            type: InventoryMovementType.INITIAL_BALANCE,
            change: item.quantity,
            quantityBefore: 0,
            quantityAfter: item.quantity,
            notes: 'Начальный остаток',
          },
        });
      return item;
    });
  }
  async findAll(query: ShopInventoryItemQueryDto, actor: InventoryActor) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    const shopId = this.isAdmin(actor) ? query.shopId : this.requireShop(actor);
    const categoryIds = query.rootCategoryId
      ? await this.categoryIds(query.rootCategoryId)
      : undefined;
    const where: Prisma.ShopInventoryItemWhereInput = {
      ...(shopId && { shopId }),
      ...(query.warehouseId && { warehouseId: query.warehouseId }),
      ...(query.partCatalogItemId && {
        partCatalogItemId: query.partCatalogItemId,
      }),
      ...(query.categoryId && {
        partCatalogItem: { categoryId: query.categoryId },
      }),
      ...(categoryIds && {
        partCatalogItem: { categoryId: { in: categoryIds } },
      }),
      ...(query.condition && { condition: query.condition }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.brand && {
        brand: { equals: query.brand.trim(), mode: 'insensitive' },
      }),
      ...(query.sku && {
        sku: { equals: query.sku.trim(), mode: 'insensitive' },
      }),
      ...(query.oemNumber && {
        oemNumber: { equals: query.oemNumber.trim(), mode: 'insensitive' },
      }),
      ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
        price: {
          ...(query.minPrice !== undefined && { gte: query.minPrice }),
          ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
        },
      }),
      ...(query.inStock && { quantity: { gt: 0 } }),
      ...(query.hasReservation && { reservedQuantity: { gt: 0 } }),
      ...(query.search?.trim() && {
        OR: [
          { brand: { contains: query.search.trim(), mode: 'insensitive' } },
          { sku: { contains: query.search.trim(), mode: 'insensitive' } },
          { oemNumber: { contains: query.search.trim(), mode: 'insensitive' } },
          {
            shop: {
              name: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            partCatalogItem: {
              name: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
          {
            partCatalogItem: {
              internalCode: {
                contains: query.search.trim(),
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    };
    // Prisma cannot compare two columns in a standard where input; lowStock is applied after DB filtering.
    const lowStock = query.lowStock === true;
    const [items, total] = await Promise.all([
      this.prisma.shopInventoryItem.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        ...(lowStock ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      this.prisma.shopInventoryItem.count({ where }),
    ]);
    const filtered = lowStock
      ? items.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity)
      : items;
    const data = (
      lowStock ? filtered.slice((page - 1) * limit, page * limit) : filtered
    ).map((i) => this.withStatus(i));
    const filteredTotal = lowStock ? filtered.length : total;
    return {
      data,
      meta: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    };
  }
  async findOne(id: string, actor: InventoryActor) {
    return this.withStatus(await this.scopedItem(id, actor));
  }
  async history(id: string, actor: InventoryActor) {
    const item = await this.scopedItem(id, actor);
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { inventoryItemId: id },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    const activeOrders = await this.prisma.customerOrderItem.findMany({
      where: {
        inventoryItemId: id,
        reservationStatus: 'RESERVED',
        order: { status: 'RESERVED' },
      },
      select: {
        quantity: true,
        order: {
          select: {
            id: true,
            number: true,
            customerNameSnapshot: true,
            reservationExpiresAt: true,
          },
        },
      },
    });
    return {
      inventoryItem: {
        id: item.id,
        name: item.partCatalogItem.name,
        warehouse: item.warehouse?.name ?? item.location ?? 'Без склада',
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        availableQuantity: item.quantity - item.reservedQuantity,
      },
      activeOrders,
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantityDelta: movement.change,
        quantityBefore: movement.quantityBefore,
        quantityAfter: movement.quantityAfter,
        documentType: movement.documentType,
        documentId: movement.documentId,
        documentNumber: movement.documentNumber ?? movement.reference,
        reason: movement.notes,
        createdBy: movement.user
          ? [movement.user.firstName, movement.user.lastName]
              .filter(Boolean)
              .join(' ')
          : null,
        createdAt: movement.createdAt,
      })),
    };
  }
  async adjust(id: string, dto: AdjustInventoryDto, actor: InventoryActor) {
    for (let attempt = 0; attempt < 3; attempt++)
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const item = await tx.shopInventoryItem.findUnique({
              where: { id },
              include: { warehouse: true, partCatalogItem: true },
            });
            if (
              !item ||
              (actor.role !== UserRole.SUPER_ADMIN &&
                item.shopId !== actor.shopId)
            )
              throw new NotFoundException('Складская позиция не найдена');
            const after =
              dto.type === 'INCREASE'
                ? item.quantity + dto.quantity
                : dto.type === 'DECREASE'
                  ? item.quantity - dto.quantity
                  : dto.quantity;
            if (after < item.reservedQuantity)
              throw new ConflictException(
                'Нельзя уменьшить физический остаток ниже зарезервированного количества',
              );
            const change = after - item.quantity;
            if (change === 0) return item;
            const updated = await tx.shopInventoryItem.updateMany({
              where: { id, quantity: item.quantity },
              data: { quantity: after },
            });
            if (!updated.count)
              throw new Prisma.PrismaClientKnownRequestError(
                'Concurrent inventory update',
                { code: 'P2034', clientVersion: '6.19.3' },
              );
            await tx.inventoryMovement.create({
              data: {
                shopId: item.shopId,
                inventoryItemId: item.id,
                userId: actor.id,
                warehouseId: item.warehouseId,
                warehouseNameSnapshot: item.warehouse?.name,
                partCatalogItemId: item.partCatalogItemId,
                partCatalogItemNameSnapshot: item.partCatalogItem.name,
                type:
                  change > 0
                    ? InventoryMovementType.ADJUSTMENT_IN
                    : InventoryMovementType.ADJUSTMENT_OUT,
                change,
                quantityBefore: item.quantity,
                quantityAfter: after,
                documentType: 'MANUAL_ADJUSTMENT',
                notes: dto.reason.trim(),
              },
            });
            return { ...item, quantity: after };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if ((error as { code?: string }).code !== 'P2034' || attempt === 2)
          throw error;
      }
    throw new ConflictException('Не удалось безопасно скорректировать остаток');
  }
  async update(
    id: string,
    dto: UpdateShopInventoryItemDto,
    actor: InventoryActor,
  ) {
    const existing = await this.scopedItem(id, actor);
    const data = this.normalize(dto);
    const brand = data.brand ?? existing.brand,
      sku = data.sku ?? existing.sku,
      condition = data.condition ?? existing.condition;
    return this.prisma.$transaction(async (tx) => {
      const warehouse = await this.warehouses.resolve(
        tx,
        existing.shopId,
        data.warehouseId ?? existing.warehouseId,
      );
      const inventoryKey = buildInventoryKey({
        shopId: existing.shopId,
        warehouseId: warehouse.id,
        partCatalogItemId: existing.partCatalogItemId,
        brand,
        sku,
        oemNumber: data.oemNumber ?? existing.oemNumber,
        condition,
      });
      return this.withStatus(
        await tx.shopInventoryItem.update({
          where: { id },
          data: { ...data, warehouseId: warehouse.id, inventoryKey },
          include,
        }),
      );
    });
  }
  async remove(id: string, actor: InventoryActor) {
    await this.scopedItem(id, actor);
    return this.withStatus(
      await this.prisma.shopInventoryItem.update({
        where: { id },
        data: { isActive: false },
        include,
      }),
    );
  }
  async uploadImage(
    id: string,
    file: InventoryImageFile,
    actor: InventoryActor,
  ) {
    const existing = await this.scopedItem(id, actor);
    const uploaded = await this.images.upload(file);
    let updated;
    try {
      updated = await this.prisma.shopInventoryItem.update({
        where: { id },
        data: uploaded,
        include,
      });
    } catch (error) {
      await this.images.remove(uploaded.imagePublicId).catch(() => undefined);
      throw error;
    }
    if (existing.imagePublicId)
      await this.images.remove(existing.imagePublicId).catch(() => {
        this.logger.warn('Не удалось удалить заменённое изображение товара');
      });
    return this.withStatus(updated);
  }

  async deleteImage(id: string, actor: InventoryActor) {
    const existing = await this.scopedItem(id, actor);
    if (existing.imagePublicId)
      await this.images.remove(existing.imagePublicId);
    return this.withStatus(
      await this.prisma.shopInventoryItem.update({
        where: { id },
        data: { imageUrl: null, imagePublicId: null },
        include,
      }),
    );
  }
  async changeQuantity(
    id: string,
    dto: ChangeQuantityDto,
    actor: InventoryActor,
  ) {
    this.validateMovement(dto);
    for (let attempt = 0; attempt < 3; attempt++)
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const item = await tx.shopInventoryItem.findUnique({
              where: { id },
              select: {
                id: true,
                shopId: true,
                quantity: true,
                reservedQuantity: true,
                minQuantity: true,
                isActive: true,
                warehouseId: true,
                warehouse: { select: { name: true } },
                partCatalogItemId: true,
                partCatalogItem: { select: { name: true } },
              },
            });
            if (
              !item ||
              (!this.isAdmin(actor) && item.shopId !== this.requireShop(actor))
            )
              throw new NotFoundException('Складская позиция не найдена');
            if (!item.isActive)
              throw new BadRequestException(
                'Нельзя изменить остаток неактивной складской позиции',
              );
            const changed = await tx.shopInventoryItem.updateMany({
              where: {
                id,
                quantity: {
                  gte: dto.change < 0 ? item.reservedQuantity - dto.change : 0,
                },
              },
              data: { quantity: { increment: dto.change } },
            });
            if (changed.count !== 1)
              throw new ConflictException('Недостаточно товара на складе');
            const quantityAfter = item.quantity + dto.change;
            await tx.inventoryMovement.create({
              data: {
                shopId: item.shopId,
                inventoryItemId: id,
                warehouseId: item.warehouseId,
                warehouseNameSnapshot: item.warehouse?.name ?? null,
                partCatalogItemId: item.partCatalogItemId,
                partCatalogItemNameSnapshot: item.partCatalogItem.name,
                documentType: 'MANUAL_QUANTITY_CHANGE',
                userId: actor.id,
                type: dto.type,
                change: dto.change,
                quantityBefore: item.quantity,
                quantityAfter,
                reference: dto.reference?.trim() || null,
                notes: dto.notes?.trim() || null,
              },
            });
            return {
              id,
              previousQuantity: item.quantity,
              change: dto.change,
              quantity: quantityAfter,
              stockStatus: this.stockStatus(quantityAfter, item.minQuantity),
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        )
          continue;
        throw error;
      }
    throw new ConflictException('Не удалось безопасно изменить остаток');
  }
  private validateMovement(dto: ChangeQuantityDto) {
    const positive: InventoryMovementType[] = [
        InventoryMovementType.STOCK_IN,
        InventoryMovementType.CUSTOMER_RETURN,
      ],
      negative: InventoryMovementType[] = [
        InventoryMovementType.SALE,
        InventoryMovementType.SUPPLIER_RETURN,
        InventoryMovementType.WRITE_OFF,
      ];
    if (dto.change === 0)
      throw new BadRequestException(
        'Изменение количества не может быть равно нулю',
      );
    if (dto.type === InventoryMovementType.INITIAL_BALANCE)
      throw new BadRequestException(
        'Начальный остаток нельзя создавать вручную',
      );
    if (positive.includes(dto.type) && dto.change < 0)
      throw new BadRequestException(
        'Для этого типа движения количество должно увеличиваться',
      );
    if (negative.includes(dto.type) && dto.change > 0)
      throw new BadRequestException(
        'Для этого типа движения количество должно уменьшаться',
      );
  }
  private isAdmin(actor: InventoryActor) {
    return actor.role === UserRole.SUPER_ADMIN;
  }
  private requireShop(actor: InventoryActor) {
    if (!actor.shopId)
      throw new ForbiddenException('Пользователь не привязан к магазину');
    return actor.shopId;
  }
  private resolveShopForCreate(
    requested: string | undefined,
    actor: InventoryActor,
  ) {
    if (this.isAdmin(actor)) {
      if (!requested)
        throw new BadRequestException(
          'Для SUPER_ADMIN необходимо указать shopId',
        );
      return requested;
    }
    const shopId = this.requireShop(actor);
    if (requested && requested !== shopId)
      throw new ForbiddenException(
        'Нельзя создавать позицию для чужого магазина',
      );
    return shopId;
  }
  private async scopedItem(id: string, actor: InventoryActor) {
    const item = await this.prisma.shopInventoryItem.findUnique({
      where: { id },
      include,
    });
    if (
      !item ||
      (!this.isAdmin(actor) && item.shopId !== this.requireShop(actor))
    )
      throw new NotFoundException('Складская позиция не найдена');
    return item;
  }
  private normalize<T extends Partial<CreateShopInventoryItemDto>>(dto: T): T {
    const empty = (v?: string) => v?.trim() || null;
    return {
      ...dto,
      ...(dto.brand !== undefined && { brand: empty(dto.brand) }),
      ...(dto.sku !== undefined && { sku: empty(dto.sku) }),
      ...(dto.oemNumber !== undefined && { oemNumber: empty(dto.oemNumber) }),
      ...(dto.currency !== undefined && {
        currency: dto.currency.trim().toUpperCase(),
      }),
      ...(dto.location !== undefined && { location: empty(dto.location) }),
      ...(dto.notes !== undefined && { notes: empty(dto.notes) }),
      ...(dto.compatibility !== undefined && {
        compatibility: empty(dto.compatibility),
      }),
    };
  }
  private async ensureActiveShop(id: string) {
    const s = await this.prisma.shop.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!s) throw new NotFoundException('Магазин не найден');
    if (!s.isActive)
      throw new BadRequestException(
        'Нельзя добавить позицию в неактивный магазин',
      );
  }
  private async ensureActivePart(id: string) {
    const p = await this.prisma.partCatalogItem.findUnique({
      where: { id },
      select: { isActive: true, category: { select: { isActive: true } } },
    });
    if (!p) throw new NotFoundException('Деталь каталога не найдена');
    if (!p.isActive)
      throw new BadRequestException(
        'Нельзя добавить неактивную деталь каталога',
      );
    if (!p.category.isActive)
      throw new BadRequestException('Категория детали отключена');
  }
  private async ensureNoDuplicate(
    shopId: string,
    partId: string,
    brand: string | null | undefined,
    sku: string | null | undefined,
    condition: PartCondition,
    exclude?: string,
  ) {
    const d = await this.prisma.shopInventoryItem.findFirst({
      where: {
        shopId,
        partCatalogItemId: partId,
        condition,
        brand: brand ? { equals: brand, mode: 'insensitive' } : null,
        sku: sku ? { equals: sku, mode: 'insensitive' } : null,
        ...(exclude && { id: { not: exclude } }),
      },
      select: { id: true },
    });
    if (d)
      throw new ConflictException(
        'Такая складская позиция уже существует в этом магазине',
      );
  }
  private async categoryIds(root: string) {
    const all = await this.prisma.partCategory.findMany({
        select: { id: true, parentId: true },
      }),
      map = new Map<string, string[]>();
    all.forEach(
      (c) =>
        c.parentId &&
        map.set(c.parentId, [...(map.get(c.parentId) ?? []), c.id]),
    );
    const ids: string[] = [];
    const visit = (id: string) => {
      ids.push(id);
      (map.get(id) ?? []).forEach(visit);
    };
    visit(root);
    return ids;
  }
  private stockStatus(quantity: number, min: number) {
    return quantity === 0
      ? 'OUT_OF_STOCK'
      : quantity <= min
        ? 'LOW_STOCK'
        : 'IN_STOCK';
  }
  private withStatus<
    T extends {
      quantity: number;
      minQuantity: number;
      reservedQuantity: number;
    },
  >(item: T) {
    return {
      ...item,
      availableQuantity: item.quantity - item.reservedQuantity,
      stockStatus: this.stockStatus(item.quantity, item.minQuantity),
    };
  }
}
