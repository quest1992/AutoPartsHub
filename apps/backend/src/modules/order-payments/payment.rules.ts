import {
  OrderPaymentStatus,
  PaymentTransactionStatus,
  Prisma,
  ShopPayableStatus,
} from '@prisma/client';
import { addMoney, subtractMoney } from '../../common/utils/money';
export function paymentTotals(
  payments: Array<{ amount: Prisma.Decimal; status: PaymentTransactionStatus }>,
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
export function orderPaymentStatus(
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
export function payableStatus(paid: Prisma.Decimal, total: Prisma.Decimal) {
  return paid.eq(total)
    ? ShopPayableStatus.PAID
    : paid.gt(0)
      ? ShopPayableStatus.PARTIALLY_PAID
      : ShopPayableStatus.PENDING;
}
