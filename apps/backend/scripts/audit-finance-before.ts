import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const [orders, orderItems, linkedSales, inventory] = await Promise.all([
    prisma.customerOrder.count(),
    prisma.customerOrderItem.count(),
    prisma.sale.count({ where: { customerOrderId: { not: null } } }),
    prisma.shopInventoryItem.aggregate({ _sum: { quantity: true, reservedQuantity: true } }),
  ]);
  console.log(JSON.stringify({
    orders,
    orderItems,
    linkedSales,
    physicalQuantity: inventory._sum.quantity ?? 0,
    reservedQuantity: inventory._sum.reservedQuantity ?? 0,
  }, null, 2));
}
main().finally(() => prisma.$disconnect());
