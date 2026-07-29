import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ShopPayableStatus,
  ShopPayoutStatus,
  UserRole,
} from '@prisma/client';
import { addMoney, money, subtractMoney } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CancelShopPayoutDto,
  CreateShopPayoutDto,
  ShopPayableQueryDto,
} from './dto/shop-settlement.dto';
@Injectable()
export class ShopSettlementsService {
  constructor(private readonly prisma: PrismaService) {}
  private shop(actor: InventoryActor, requested?: string) {
    if (actor.role === UserRole.SUPER_ADMIN) {
      if (!requested) throw new ForbiddenException('Укажите магазин');
      return requested;
    }
    if (!actor.shopId || (requested && requested !== actor.shopId))
      throw new ForbiddenException('Нет доступа к финансам другого магазина');
    return actor.shopId;
  }
  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    for (let i = 0; i < 3; i++)
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (e) {
        if ((e as { code?: string }).code !== 'P2034' || i === 2) throw e;
      }
    throw new ConflictException('Конкурентное изменение выплаты');
  }
  async payables(query: ShopPayableQueryDto, actor: InventoryActor) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    const shopId =
      actor.role === UserRole.SUPER_ADMIN
        ? query.shopId
        : this.shop(actor, query.shopId);
    const where: Prisma.ShopPayableWhereInput = {
      ...(shopId && { shopId }),
      ...(query.status && { status: query.status }),
      ...(query.customerOrderId && { customerOrderId: query.customerOrderId }),
      ...(query.saleId && { saleId: query.saleId }),
      ...(query.onlyOutstanding && {
        status: {
          in: [ShopPayableStatus.PENDING, ShopPayableStatus.PARTIALLY_PAID],
        },
      }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && {
            lte: new Date(`${query.dateTo}T23:59:59.999Z`),
          }),
        },
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.shopPayable.findMany({
        where,
        include: {
          shop: true,
          sale: true,
          customerOrder: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shopPayable.count({ where }),
    ]);
    return {
      data: data.map((x) => ({
        ...x,
        outstandingAmount: subtractMoney(x.payableAmount, x.paidAmount),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async payable(id: string, actor: InventoryActor) {
    const x = await this.prisma.shopPayable.findUnique({
      where: { id },
      include: {
        shop: true,
        sale: true,
        customerOrder: true,
        allocations: { include: { payout: true } },
      },
    });
    if (
      !x ||
      (actor.role !== UserRole.SUPER_ADMIN && x.shopId !== actor.shopId)
    )
      throw new NotFoundException('Обязательство не найдено');
    return {
      ...x,
      outstandingAmount: subtractMoney(x.payableAmount, x.paidAmount),
    };
  }
  async createPayout(dto: CreateShopPayoutDto, actor: InventoryActor) {
    const shopId = this.shop(actor, dto.shopId);
    if (
      new Set(dto.allocations.map((a) => a.payableId)).size !==
      dto.allocations.length
    )
      throw new ConflictException('Обязательство указано дважды');
    return this.serializable(async (tx) => {
      const payables = await tx.shopPayable.findMany({
        where: { id: { in: dto.allocations.map((a) => a.payableId) } },
      });
      if (payables.length !== dto.allocations.length)
        throw new NotFoundException('Обязательство не найдено');
      let amount = money(0);
      for (const allocation of dto.allocations) {
        const payable = payables.find((p) => p.id === allocation.payableId)!;
        if (payable.shopId !== shopId)
          throw new ForbiddenException(
            'Обязательство относится к другому магазину',
          );
        if (
          payable.status === ShopPayableStatus.CANCELLED ||
          payable.status === ShopPayableStatus.PAID
        )
          throw new ConflictException('Обязательство закрыто');
        const value = money(allocation.amount);
        if (value.gt(subtractMoney(payable.payableAmount, payable.paidAmount)))
          throw new ConflictException(
            'Сумма выплаты превышает остаток обязательства',
          );
        amount = addMoney(amount, value);
      }
      const seq = await tx.appSequence.upsert({
        where: { key: 'SHOP_PAYOUT' },
        create: { key: 'SHOP_PAYOUT', value: 1 },
        update: { value: { increment: 1 } },
      });
      return tx.shopPayout.create({
        data: {
          number: `PAY-${String(seq.value).padStart(6, '0')}`,
          shopId,
          amount,
          method: dto.method,
          transactionReference: dto.transactionReference?.trim() || null,
          note: dto.note?.trim() || null,
          createdById: actor.id,
          allocations: {
            create: dto.allocations.map((a) => ({
              payableId: a.payableId,
              amount: money(a.amount),
            })),
          },
        },
        include: { allocations: true, shop: true },
      });
    });
  }
  async payouts(actor: InventoryActor, requestedShopId?: string) {
    const shopId =
      actor.role === UserRole.SUPER_ADMIN
        ? requestedShopId
        : this.shop(actor, requestedShopId);
    return this.prisma.shopPayout.findMany({
      where: { ...(shopId && { shopId }) },
      include: { shop: true, allocations: { include: { payable: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async payout(id: string, actor: InventoryActor) {
    const p = await this.prisma.shopPayout.findUnique({
      where: { id },
      include: { shop: true, allocations: { include: { payable: true } } },
    });
    if (
      !p ||
      (actor.role !== UserRole.SUPER_ADMIN && p.shopId !== actor.shopId)
    )
      throw new NotFoundException('Выплата не найдена');
    return p;
  }
  async completePayout(id: string, actor: InventoryActor) {
    return this.serializable(async (tx) => {
      const payout = await tx.shopPayout.findUnique({
        where: { id },
        include: { allocations: true },
      });
      if (
        !payout ||
        (actor.role !== UserRole.SUPER_ADMIN && payout.shopId !== actor.shopId)
      )
        throw new NotFoundException('Выплата не найдена');
      if (payout.status !== ShopPayoutStatus.DRAFT)
        throw new ConflictException('Завершить можно только черновик выплаты');
      for (const allocation of payout.allocations) {
        const payable = await tx.shopPayable.findUniqueOrThrow({
          where: { id: allocation.payableId },
        });
        const after = addMoney(payable.paidAmount, allocation.amount);
        if (
          payable.shopId !== payout.shopId ||
          after.gt(payable.payableAmount) ||
          payable.status === ShopPayableStatus.CANCELLED
        )
          throw new ConflictException(
            'Обязательство изменилось или сумма превышена',
          );
        await tx.shopPayable.update({
          where: { id: payable.id },
          data: {
            paidAmount: after,
            status: after.eq(payable.payableAmount)
              ? ShopPayableStatus.PAID
              : ShopPayableStatus.PARTIALLY_PAID,
          },
        });
      }
      return tx.shopPayout.update({
        where: { id },
        data: { status: ShopPayoutStatus.COMPLETED, paidAt: new Date() },
        include: { allocations: true },
      });
    });
  }
  async cancelPayout(
    id: string,
    dto: CancelShopPayoutDto,
    actor: InventoryActor,
  ) {
    const payout = await this.payout(id, actor);
    if (payout.status !== ShopPayoutStatus.DRAFT)
      throw new ConflictException(
        'Завершённую выплату нельзя отменить напрямую',
      );
    return this.prisma.shopPayout.update({
      where: { id },
      data: {
        status: ShopPayoutStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: actor.id,
        cancelReason: dto.reason.trim(),
      },
    });
  }
  async balance(shopId: string, actor: InventoryActor) {
    this.shop(actor, shopId);
    const rows = await this.prisma.shopPayable.findMany({
      where: { shopId, status: { not: ShopPayableStatus.CANCELLED } },
    });
    const totalPayableAmount = addMoney(...rows.map((x) => x.payableAmount)),
      totalPaidAmount = addMoney(...rows.map((x) => x.paidAmount));
    return {
      totalSalesAmount: addMoney(...rows.map((x) => x.grossShopAmount)),
      totalPayableAmount,
      totalPaidAmount,
      outstandingAmount: subtractMoney(totalPayableAmount, totalPaidAmount),
      pendingCount: rows.filter((x) => x.status === ShopPayableStatus.PENDING)
        .length,
      partiallyPaidCount: rows.filter(
        (x) => x.status === ShopPayableStatus.PARTIALLY_PAID,
      ).length,
      paidCount: rows.filter((x) => x.status === ShopPayableStatus.PAID).length,
    };
  }
}
