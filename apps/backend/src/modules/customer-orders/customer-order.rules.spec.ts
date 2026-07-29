import {
  availableQuantity,
  calculateOrderTotals,
  canReserve,
} from './customer-order.rules';

describe('customer order rules', () => {
  it('calculates available stock', () =>
    expect(availableQuantity(10, 3)).toBe(7));
  it('does not change physical stock when calculating a reserve', () => {
    const quantity = 5;
    expect(canReserve(quantity, 0, 2)).toBe(true);
    expect(quantity).toBe(5);
  });
  it('allows exactly the available quantity', () =>
    expect(canReserve(1, 0, 1)).toBe(true));
  it('rejects more than available', () =>
    expect(canReserve(1, 0, 2)).toBe(false));
  it('accounts for an existing reserve', () =>
    expect(canReserve(5, 4, 2)).toBe(false));
  it('rejects a non-positive request', () =>
    expect(canReserve(5, 0, 0)).toBe(false));
  it('calculates subtotal on backend', () =>
    expect(
      calculateOrderTotals([
        { quantity: 2, unitPrice: 15 },
      ]).subtotal.toString(),
    ).toBe('30'));
  it('applies discount and delivery', () =>
    expect(
      calculateOrderTotals(
        [{ quantity: 2, unitPrice: 15 }],
        5,
        3,
      ).total.toString(),
    ).toBe('28'));
  it('keeps decimal precision', () =>
    expect(
      calculateOrderTotals([
        { quantity: 3, unitPrice: '0.10' },
      ]).total.toString(),
    ).toBe('0.3'));
});
