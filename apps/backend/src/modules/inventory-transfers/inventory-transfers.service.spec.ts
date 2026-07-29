import { BadRequestException, ConflictException } from '@nestjs/common';
import { InventoryTransferStatus, UserRole } from '@prisma/client';
import { InventoryTransfersService } from './inventory-transfers.service';
const actor = { id: 'user', role: UserRole.SHOP_ADMIN, shopId: 'shop' };
describe('InventoryTransfersService', () => {
  it('does not transfer to the same warehouse', async () => {
    const service = new InventoryTransfersService({} as never);
    await expect(
      service.create(
        {
          fromWarehouseId: '00000000-0000-0000-0000-000000000001',
          toWarehouseId: '00000000-0000-0000-0000-000000000001',
          items: [
            {
              sourceInventoryItemId: '00000000-0000-0000-0000-000000000002',
              quantity: 1,
            },
          ],
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('does not complete an already completed transfer', async () => {
    const tx = {
      inventoryTransfer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'transfer',
          shopId: 'shop',
          status: InventoryTransferStatus.COMPLETED,
          items: [],
          fromWarehouse: {},
          toWarehouse: {},
          createdBy: {},
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((fn: (arg: typeof tx) => unknown) => fn(tx)),
    };
    const service = new InventoryTransfersService(prisma as never);
    await expect(service.complete('transfer', actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
