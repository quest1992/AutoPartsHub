import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
try {
  const totals = await prisma.shopInventoryItem.aggregate({
    _count: { id: true },
    _sum: { quantity: true, reservedQuantity: true },
  });
  const physical = totals._sum.quantity ?? 0;
  const reserved = totals._sum.reservedQuantity ?? 0;
  console.log(JSON.stringify({
    inventoryItems: totals._count.id,
    physical,
    reserved,
    available: physical - reserved,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
}
void main();
