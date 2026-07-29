import { Prisma } from '@prisma/client';

export function availableQuantity(quantity: number, reservedQuantity: number) {
  return quantity - reservedQuantity;
}

export function calculateOrderTotals(
  items: Array<{
    quantity: number;
    unitPrice: number | string | Prisma.Decimal;
  }>,
  discount: number | string | Prisma.Decimal = 0,
  deliveryFee: number | string | Prisma.Decimal = 0,
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum.plus(new Prisma.Decimal(item.unitPrice).mul(item.quantity)),
    new Prisma.Decimal(0),
  );
  const normalizedDiscount = new Prisma.Decimal(discount);
  const normalizedDeliveryFee = new Prisma.Decimal(deliveryFee);
  return {
    subtotal,
    discount: normalizedDiscount,
    deliveryFee: normalizedDeliveryFee,
    total: subtotal.minus(normalizedDiscount).plus(normalizedDeliveryFee),
  };
}

export function canReserve(
  quantity: number,
  reservedQuantity: number,
  requested: number,
) {
  return (
    requested > 0 && availableQuantity(quantity, reservedQuantity) >= requested
  );
}
