import {
  OrderPaymentStatus,
  PaymentTransactionStatus,
  Prisma,
  ShopPayableStatus,
} from '@prisma/client';
import {
  orderPaymentStatus,
  payableStatus,
  paymentTotals,
} from './payment.rules';
describe('payment rules', () => {
  const d = (v: number) => new Prisma.Decimal(v);
  it('calculates partial payment', () =>
    expect(orderPaymentStatus(d(500), d(1500), d(0))).toBe(
      OrderPaymentStatus.PARTIALLY_PAID,
    ));
  it('calculates full payment', () =>
    expect(orderPaymentStatus(d(1500), d(1500), d(0))).toBe(
      OrderPaymentStatus.PAID,
    ));
  it('calculates unpaid', () =>
    expect(orderPaymentStatus(d(0), d(1500), d(0))).toBe(
      OrderPaymentStatus.UNPAID,
    ));
  it('calculates refunded', () =>
    expect(orderPaymentStatus(d(0), d(1500), d(500))).toBe(
      OrderPaymentStatus.REFUNDED,
    ));
  it('subtracts refunds from payments', () =>
    expect(
      paymentTotals([
        { amount: d(1000), status: PaymentTransactionStatus.COMPLETED },
        { amount: d(200), status: PaymentTransactionStatus.REFUNDED },
      ]).paid.toString(),
    ).toBe('800'));
  it('ignores cancelled payments', () =>
    expect(
      paymentTotals([
        { amount: d(1000), status: PaymentTransactionStatus.CANCELLED },
      ]).paid.toString(),
    ).toBe('0'));
  it('marks pending payable', () =>
    expect(payableStatus(d(0), d(500))).toBe(ShopPayableStatus.PENDING));
  it('marks partially paid payable', () =>
    expect(payableStatus(d(200), d(500))).toBe(
      ShopPayableStatus.PARTIALLY_PAID,
    ));
  it('marks paid payable', () =>
    expect(payableStatus(d(500), d(500))).toBe(ShopPayableStatus.PAID));
});
