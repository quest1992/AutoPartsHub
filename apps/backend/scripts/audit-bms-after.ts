import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CatalogSearchService } from '../src/modules/part-catalog/catalog-search.service';

const prisma = new PrismaClient();

async function main() {
  const models = [
    ['PartCategory', prisma.partCategory],
    ['PartCatalogItem', prisma.partCatalogItem],
    ['PartAlias', prisma.partAlias],
    ['PartNumber', prisma.partNumber],
    ['ShopInventoryItem', prisma.shopInventoryItem],
    ['InventoryMovement', prisma.inventoryMovement],
    ['Purchase', prisma.purchase],
    ['PurchaseItem', prisma.purchaseItem],
    ['Sale', prisma.sale],
    ['SaleItem', prisma.saleItem],
    ['CustomerOrder', prisma.customerOrder],
    ['CustomerOrderItem', prisma.customerOrderItem],
    ['PartCatalogSuggestion', prisma.partCatalogSuggestion],
    ['VehicleFitment', prisma.vehicleFitment],
    ['CustomerOrderPayment', prisma.customerOrderPayment],
    ['ShopPayable', prisma.shopPayable],
    ['ShopPayout', prisma.shopPayout],
    ['TaxonomyMapping', prisma.partCategoryCatalogItemMapping],
  ] as const;
  const counts: Record<string, number> = {};
  for (const [name, model] of models)
    counts[name] = await (model as { count(): Promise<number> }).count();
  counts.activeCategories = await prisma.partCategory.count({
    where: { isActive: true },
  });
  counts.activeItems = await prisma.partCatalogItem.count({
    where: { isActive: true },
  });
  const sums = await prisma.shopInventoryItem.aggregate({
    _sum: { quantity: true, reservedQuantity: true },
  });
  counts.physicalQuantity = sums._sum.quantity ?? 0;
  counts.reservedQuantity = sums._sum.reservedQuantity ?? 0;
  console.log(JSON.stringify({ counts }, null, 2));

  const search = new CatalogSearchService(prisma as never);
  for (const q of [
    'Главные платы BMS',
    'Главная плата BMS',
    'платы BMS',
    'BMS',
    'Блоки управления батареей BMS',
    'Система управления батареей',
  ]) {
    const result = await search.search({ q, isActive: true, limit: 10 });
    console.log(
      JSON.stringify(
        {
          q,
          items: result.data.map((item) => item.name),
          categories: result.categoryMatches,
        },
        null,
        2,
      ),
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
