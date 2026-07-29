import { ConflictException, NotFoundException } from '@nestjs/common';
import { StocktakeStatus, UserRole } from '@prisma/client';
import { StocktakesService } from './stocktakes.service';
const actor = { id: 'user', role: UserRole.SHOP_ADMIN, shopId: 'shop' };
describe('StocktakesService', () => {
  it('rejects repeated completion', async () => {
    const tx = {
      stocktake: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's',
          shopId: 'shop',
          status: StocktakeStatus.COMPLETED,
          items: [],
          warehouse: {},
          createdBy: {},
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
    };
    await expect(
      new StocktakesService(prisma as never).complete('s', actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('hides another shop stocktake', async () => {
    const prisma = {
      stocktake: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's',
          shopId: 'other',
          items: [],
          warehouse: {},
          createdBy: {},
        }),
      },
    };
    await expect(
      new StocktakesService(prisma as never).one('s', actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('calculates saved shortage against expected quantity', async () => {
    const tx = {
      stocktakeItem: { update: jest.fn() },
      stocktake: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's',
          shopId: 'shop',
          status: StocktakeStatus.DRAFT,
          items: [{ inventoryItemId: 'item', expectedQuantity: 10 }],
          warehouse: {},
          createdBy: {},
        }),
      },
    };
    const prisma = {
      stocktake: tx.stocktake,
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
        fn(tx),
      ),
    };
    const service = new StocktakesService(prisma as never);
    await service.updateItems(
      's',
      { items: [{ inventoryItemId: 'item', actualQuantity: 7 }] },
      actor,
    );
    expect(tx.stocktakeItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { actualQuantity: 7, difference: -3 } }),
    );
  });
});
