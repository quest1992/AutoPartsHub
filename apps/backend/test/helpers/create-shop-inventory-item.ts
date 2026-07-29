import { Prisma, PrismaClient, ShopInventoryItem } from '@prisma/client';
import { buildInventoryKey } from '../../src/common/utils/inventory-key';

type InventoryClient = Pick<
  PrismaClient,
  'shopInventoryItem' | 'shopWarehouse'
>;
type InventoryData = Omit<
  Prisma.ShopInventoryItemUncheckedCreateInput,
  'inventoryKey'
>;
const defaultWarehouseIds = new Map<string, Promise<string>>();

function withInventoryKey(
  data: InventoryData,
): Prisma.ShopInventoryItemUncheckedCreateInput {
  return {
    ...data,
    inventoryKey: buildInventoryKey({
      shopId: data.shopId,
      warehouseId: data.warehouseId,
      partCatalogItemId: data.partCatalogItemId,
      sku: data.sku,
      oemNumber: data.oemNumber,
      brand: data.brand,
      condition: data.condition,
    }),
  };
}

async function ensureWarehouse(
  prisma: InventoryClient,
  data: InventoryData,
): Promise<InventoryData> {
  if (data.warehouseId) return data;
  let warehouseId = defaultWarehouseIds.get(data.shopId);
  if (!warehouseId) {
    warehouseId = (async () => {
      const existing = await prisma.shopWarehouse.findFirst({
        where: { shopId: data.shopId, isDefault: true },
        select: { id: true },
      });
      if (existing) return existing.id;
      const created = await prisma.shopWarehouse.create({
        data: {
          shopId: data.shopId,
          name: 'Основной склад',
          isDefault: true,
        },
        select: { id: true },
      });
      return created.id;
    })();
    defaultWarehouseIds.set(data.shopId, warehouseId);
  }
  return { ...data, warehouseId: await warehouseId };
}

export async function createShopInventoryItem(
  prisma: InventoryClient,
  data: InventoryData,
): Promise<ShopInventoryItem> {
  return prisma.shopInventoryItem.create({
    data: withInventoryKey(await ensureWarehouse(prisma, data)),
  });
}

export async function createManyShopInventoryItems(
  prisma: InventoryClient,
  data: InventoryData[],
) {
  const prepared = await Promise.all(
    data.map((item) => ensureWarehouse(prisma, item)),
  );
  return prisma.shopInventoryItem.createMany({
    data: prepared.map(withInventoryKey),
  });
}
