import { OrderCommissionType, Prisma } from '@prisma/client';
import { OrderPricingService } from './order-pricing.service';
describe('OrderPricingService', () => {
  const service = new OrderPricingService({} as never);
  const calculate = (
    commissionType: OrderCommissionType,
    commissionValue: number,
    manualClientUnitPrice?: number,
    allowBelowCost = false,
  ) =>
    service.calculate({
      shopUnitPrice: new Prisma.Decimal(500),
      quantity: 2,
      commissionType,
      commissionValue: new Prisma.Decimal(commissionValue),
      manualClientUnitPrice:
        manualClientUnitPrice === undefined
          ? undefined
          : new Prisma.Decimal(manualClientUnitPrice),
      allowBelowCost,
    });
  it('calculates markup', () =>
    expect(
      calculate(OrderCommissionType.MARKUP, 100).clientUnitPrice.toString(),
    ).toBe('600'));
  it('calculates percentage commission', () =>
    expect(
      calculate(OrderCommissionType.PERCENT, 10).platformRevenue.toString(),
    ).toBe('100'));
  it('calculates fixed commission', () =>
    expect(
      calculate(OrderCommissionType.FIXED, 50).clientUnitPrice.toString(),
    ).toBe('550'));
  it('calculates manual platform revenue', () =>
    expect(
      calculate(OrderCommissionType.MANUAL, 0, 650).platformRevenue.toString(),
    ).toBe('300'));
  it('rejects a sale below shop price', () =>
    expect(() => calculate(OrderCommissionType.MANUAL, 0, 450)).toThrow(
      'Цена клиента',
    ));
  it('allows below cost with explicit permission', () =>
    expect(
      calculate(
        OrderCommissionType.MANUAL,
        0,
        450,
        true,
      ).platformRevenue.toString(),
    ).toBe('-100'));
  it('does not trust a frontend total because it accepts no total field', () =>
    expect(
      Object.keys(calculate(OrderCommissionType.MARKUP, 100)),
    ).not.toContain('frontendTotal'));
});
