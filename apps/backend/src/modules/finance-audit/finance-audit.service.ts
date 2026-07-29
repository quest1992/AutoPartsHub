import { Injectable } from '@nestjs/common';
import { PaymentTransactionStatus, ShopPayoutStatus } from '@prisma/client';
import { addMoney, money, subtractMoney } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class FinanceAuditService {
  constructor(private readonly prisma: PrismaService) {}
  async audit() {
    const [orders, payables] = await Promise.all([
      this.prisma.customerOrder.findMany({
        include: { items: true, payments: true },
      }),
      this.prisma.shopPayable.findMany({
        include: { sale: true, allocations: { include: { payout: true } } },
      }),
    ]);
    const rows: Array<{
      entityType: string;
      entityId: string;
      number?: string;
      expected: string;
      actual: string;
      difference: string;
      message: string;
    }> = [];
    let orderAmountMismatches = 0,
      paymentMismatches = 0,
      payableMismatches = 0,
      payoutMismatches = 0,
      negativePlatformRevenue = 0;
    for (const order of orders) {
      for (const item of order.items) {
        const expected = addMoney(item.shopAmount, item.platformRevenue);
        if (!expected.eq(item.clientAmount)) {
          orderAmountMismatches++;
          rows.push(
            this.row(
              'ORDER_ITEM',
              item.id,
              order.number,
              expected,
              item.clientAmount,
              'Сумма клиента не равна сумме магазину и доходу платформы',
            ),
          );
        }
        if (item.platformRevenue.isNegative()) negativePlatformRevenue++;
      }
      const expectedTotal = addMoney(
        subtractMoney(order.subtotal, order.discount),
        order.deliveryFee,
      );
      if (!expectedTotal.eq(order.total)) {
        orderAmountMismatches++;
        rows.push(
          this.row(
            'ORDER',
            order.id,
            order.number,
            expectedTotal,
            order.total,
            'Итог заказа рассчитан неверно',
          ),
        );
      }
      const completed = addMoney(
        ...order.payments
          .filter((p) => p.status === PaymentTransactionStatus.COMPLETED)
          .map((p) => p.amount),
      );
      const refunds = addMoney(
        ...order.payments
          .filter((p) => p.status === PaymentTransactionStatus.REFUNDED)
          .map((p) => p.amount),
      );
      const paid = subtractMoney(completed, refunds);
      if (!paid.eq(order.paidAmount)) {
        paymentMismatches++;
        rows.push(
          this.row(
            'ORDER_PAYMENT',
            order.id,
            order.number,
            paid,
            order.paidAmount,
            'Оплаченная сумма заказа не совпадает с транзакциями',
          ),
        );
      }
      if (refunds.gt(completed)) {
        paymentMismatches++;
        rows.push(
          this.row(
            'ORDER_REFUND',
            order.id,
            order.number,
            completed,
            refunds,
            'Возвраты превышают оплаты',
          ),
        );
      }
    }
    for (const payable of payables) {
      if (
        !payable.payableAmount.eq(
          payable.grossShopAmount.plus(payable.adjustments),
        )
      ) {
        payableMismatches++;
        rows.push(
          this.row(
            'SHOP_PAYABLE',
            payable.id,
            payable.sale.number,
            payable.grossShopAmount.plus(payable.adjustments),
            payable.payableAmount,
            'Начисление магазину рассчитано неверно',
          ),
        );
      }
      const completedAllocations = addMoney(
        ...payable.allocations
          .filter((a) => a.payout.status === ShopPayoutStatus.COMPLETED)
          .map((a) => a.amount),
      );
      if (!completedAllocations.eq(payable.paidAmount)) {
        payoutMismatches++;
        rows.push(
          this.row(
            'SHOP_PAYOUT',
            payable.id,
            payable.sale.number,
            completedAllocations,
            payable.paidAmount,
            'paidAmount не совпадает с завершёнными выплатами',
          ),
        );
      }
      if (payable.paidAmount.gt(payable.payableAmount)) {
        payoutMismatches++;
        rows.push(
          this.row(
            'SHOP_PAYABLE',
            payable.id,
            payable.sale.number,
            payable.payableAmount,
            payable.paidAmount,
            'Выплачено больше начисленного',
          ),
        );
      }
    }
    return {
      summary: {
        ordersChecked: orders.length,
        orderAmountMismatches,
        paymentMismatches,
        payableMismatches,
        payoutMismatches,
        negativePlatformRevenue,
      },
      rows,
    };
  }
  private row(
    entityType: string,
    entityId: string,
    number: string | undefined,
    expected: unknown,
    actual: unknown,
    message: string,
  ) {
    const e = money(expected as never),
      a = money(actual as never);
    return {
      entityType,
      entityId,
      number,
      expected: e.toString(),
      actual: a.toString(),
      difference: a.minus(e).toString(),
      message,
    };
  }
}
