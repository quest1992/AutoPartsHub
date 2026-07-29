import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerOrderStatus,
  OrderPaymentStatus,
  PaymentMethod,
  PaymentTransactionStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { addMoney, money, subtractMoney } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CancelOrderPaymentDto,
  CreateOrderPaymentDto,
  RefundOrderPaymentDto,
} from './dto/order-payment.dto';

@Injectable()
export class OrderPaymentsService {
  constructor(private readonly prisma: PrismaService) {}
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
    throw new ConflictException('Конкурентное изменение оплаты');
  }
  private async order(
    tx: Prisma.TransactionClient | PrismaService,
    id: string,
    actor: InventoryActor,
  ) {
    const order = await tx.customerOrder.findUnique({
      where: { id },
      include: { items: { select: { shopId: true } }, payments: true },
    });
    if (
      !order ||
      (actor.role !== UserRole.SUPER_ADMIN &&
        !order.items.some((item) => item.shopId === actor.shopId))
    )
      throw new NotFoundException('Заказ не найден');
    return order;
  }
  private totals(
    payments: Array<{
      amount: Prisma.Decimal;
      status: PaymentTransactionStatus;
    }>,
  ) {
    const completed = addMoney(
      ...payments
        .filter((p) => p.status === PaymentTransactionStatus.COMPLETED)
        .map((p) => p.amount),
    );
    const refunded = addMoney(
      ...payments
        .filter((p) => p.status === PaymentTransactionStatus.REFUNDED)
        .map((p) => p.amount),
    );
    return { completed, refunded, paid: subtractMoney(completed, refunded) };
  }
  private status(
    paid: Prisma.Decimal,
    total: Prisma.Decimal,
    refunded: Prisma.Decimal,
  ) {
    if (paid.eq(total)) return OrderPaymentStatus.PAID;
    if (paid.gt(0)) return OrderPaymentStatus.PARTIALLY_PAID;
    return refunded.gt(0)
      ? OrderPaymentStatus.REFUNDED
      : OrderPaymentStatus.UNPAID;
  }
  async list(orderId: string, actor: InventoryActor) {
    const order = await this.order(this.prisma, orderId, actor);
    return order.payments;
  }
  async create(
    orderId: string,
    dto: CreateOrderPaymentDto,
    actor: InventoryActor,
  ) {
    return this.serializable(async (tx) => {
      const order = await this.order(tx, orderId, actor);
      if (
        [CustomerOrderStatus.CANCELLED, CustomerOrderStatus.EXPIRED].includes(
          order.status as never,
        )
      )
        throw new ConflictException(
          'Нельзя принять оплату для отменённого или истёкшего заказа',
        );
      const current = this.totals(order.payments);
      const amount = money(dto.amount);
      const due = subtractMoney(order.total, current.paid);
      if (amount.gt(due))
        throw new ConflictException(
          'Сумма оплаты превышает задолженность по заказу',
        );
      const payment = await tx.customerOrderPayment.create({
        data: {
          orderId,
          amount,
          method: dto.method,
          transactionReference: dto.transactionReference?.trim() || null,
          note: dto.note?.trim() || null,
          receivedById: actor.id,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        },
      });
      const paid = addMoney(current.paid, amount);
      await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          paidAmount: paid,
          paymentStatus: this.status(paid, order.total, current.refunded),
        },
      });
      return payment;
    });
  }
  async cancel(
    orderId: string,
    paymentId: string,
    dto: CancelOrderPaymentDto,
    actor: InventoryActor,
  ) {
    return this.serializable(async (tx) => {
      const order = await this.order(tx, orderId, actor);
      const payment = order.payments.find((p) => p.id === paymentId);
      if (!payment) throw new NotFoundException('Оплата не найдена');
      if (payment.status !== PaymentTransactionStatus.COMPLETED)
        throw new ConflictException('Оплата уже отменена или возвращена');
      await tx.customerOrderPayment.update({
        where: { id: paymentId },
        data: {
          status: PaymentTransactionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: actor.id,
          cancelReason: dto.reason.trim(),
        },
      });
      const remaining = order.payments.map((p) =>
        p.id === paymentId
          ? { ...p, status: PaymentTransactionStatus.CANCELLED }
          : p,
      );
      const totals = this.totals(remaining);
      await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          paidAmount: totals.paid,
          paymentStatus: this.status(totals.paid, order.total, totals.refunded),
        },
      });
      return tx.customerOrderPayment.findUniqueOrThrow({
        where: { id: paymentId },
      });
    });
  }
  async refund(
    orderId: string,
    dto: RefundOrderPaymentDto,
    actor: InventoryActor,
  ) {
    return this.serializable(async (tx) => {
      const order = await this.order(tx, orderId, actor);
      const current = this.totals(order.payments);
      const amount = money(dto.amount);
      if (amount.gt(current.paid))
        throw new ConflictException(
          'Сумма возврата превышает реально оплаченную сумму',
        );
      if (
        dto.originalPaymentId &&
        !order.payments.some(
          (p) =>
            p.id === dto.originalPaymentId &&
            p.status === PaymentTransactionStatus.COMPLETED,
        )
      )
        throw new NotFoundException('Исходная оплата не найдена');
      const refund = await tx.customerOrderPayment.create({
        data: {
          orderId,
          amount,
          method: dto.method ?? PaymentMethod.CASH,
          status: PaymentTransactionStatus.REFUNDED,
          originalPaymentId: dto.originalPaymentId,
          receivedById: actor.id,
          receivedAt: new Date(),
          note: dto.reason.trim(),
        },
      });
      const paid = subtractMoney(current.paid, amount),
        refunded = addMoney(current.refunded, amount);
      await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          paidAmount: paid,
          paymentStatus: this.status(paid, order.total, refunded),
        },
      });
      return refund;
    });
  }
}
