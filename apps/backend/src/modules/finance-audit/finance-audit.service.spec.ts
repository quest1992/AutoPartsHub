import { Prisma } from '@prisma/client';
import { FinanceAuditService } from './finance-audit.service';
describe('FinanceAuditService', () => {
  function setup(
    clientAmount = '100',
    shopAmount = '80',
    platformRevenue = '20',
  ) {
    const prisma = {
      customerOrder: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'o',
            number: 'ORD-1',
            subtotal: new Prisma.Decimal(100),
            discount: new Prisma.Decimal(0),
            deliveryFee: new Prisma.Decimal(0),
            total: new Prisma.Decimal(100),
            paidAmount: new Prisma.Decimal(0),
            items: [
              {
                id: 'i',
                clientAmount: new Prisma.Decimal(clientAmount),
                shopAmount: new Prisma.Decimal(shopAmount),
                platformRevenue: new Prisma.Decimal(platformRevenue),
              },
            ],
            payments: [],
          },
        ]),
      },
      shopPayable: { findMany: jest.fn().mockResolvedValue([]) },
    };
    return { service: new FinanceAuditService(prisma as never), prisma };
  }
  it('accepts consistent finance', async () =>
    expect((await setup().service.audit()).summary.orderAmountMismatches).toBe(
      0,
    ));
  it('detects item allocation mismatch', async () =>
    expect(
      (await setup('100', '80', '10').service.audit()).summary
        .orderAmountMismatches,
    ).toBe(1));
  it('is read-only', async () => {
    const { service, prisma } = setup();
    await service.audit();
    expect(Object.keys(prisma.customerOrder)).not.toContain('update');
  });
});
